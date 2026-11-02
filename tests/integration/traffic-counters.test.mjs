import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { api, db, origin, fixtureUser, fixtureSupplier, fixtureProduct, cleanupUsers, login } from './helpers.mjs';

let admin, client, supplier, other, product, adminCookie, supplierCookie, clientCookie;
const sessions = [];
const session = () => { const id = randomUUID(); sessions.push(id); return id; };
function record(path, id, cookie, extra = {}) {
  return fetch(`${origin}/api/analytics/views`, {
    method: 'POST', headers: { origin, 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify({ path, session_id: id, consent: 'all', ...extra }),
  });
}
before(async () => {
  admin = await fixtureUser('admin'); client = await fixtureUser();
  supplier = await fixtureSupplier(); other = await fixtureSupplier();
  product = await fixtureProduct(supplier.supplierId);
  adminCookie = await login(admin); supplierCookie = await login(supplier); clientCookie = await login(client);
});
after(async () => {
  const hashes = sessions.map(id => createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY).update(`analytics:${id}`).digest('hex'));
  if (hashes.length) await db.from('page_views').delete().in('session_hash', hashes);
  await cleanupUsers([admin, client, supplier, other].filter(Boolean));
});

test('traffic reports require an authenticated administrator or supplier', async () => {
  assert.equal((await api('/api/analytics/summary')).status, 401);
  assert.equal((await api('/api/analytics/summary', { cookie: clientCookie })).status, 403);
});

test('consent, public paths and same-origin are enforced before recording', async () => {
  const id = session();
  assert.equal((await (await record('/', id, undefined, { consent: 'essential' })).json()).recorded, false);
  assert.equal((await record('/reset-password?token=secret', id)).status, 400);
  const cross = await fetch(`${origin}/api/analytics/views`, { method: 'POST', headers: { origin: 'https://other.example', 'content-type': 'application/json' }, body: JSON.stringify({ path: '/', session_id: id, consent: 'all' }) });
  assert.equal(cross.status, 403);
});

test('concurrent reloads count one product view and preserve legacy product statistics', async () => {
  const id = session();
  const legacy = await db.from('product_views').insert({ product_id: product.id, session_id: `legacy-${id}`, viewed_at: '2026-01-01T00:00:00Z' });
  assert.equal(legacy.error, null);
  const responses = await Promise.all(Array.from({ length: 8 }, () => record(`/products/${product.id}`, id)));
  for (const r of responses) assert.equal(r.status, 200);
  const { data, error } = await db.from('page_views').select('id').eq('product_id', product.id);
  assert.equal(error, null); assert.equal(data.length, 1);
  const result = await (await api('/api/supplier/analytics', { cookie: supplierCookie })).json();
  assert.equal(result.analytics.find(p => p.product_id === product.id).views_total, 2);
});

test('supplier counters are isolated and include profiles, products and daily zero buckets', async t => {
  const scopedSupplier = await fixtureSupplier(); t.after(() => cleanupUsers([scopedSupplier]));
  const scopedProduct = await fixtureProduct(scopedSupplier.supplierId);
  const scopedCookie = await login(scopedSupplier);
  const id = session();
  assert.equal((await (await record(`/products/${scopedProduct.id}`, session())).json()).recorded, true);
  assert.equal((await (await record(`/suppliers/${scopedSupplier.supplierId}`, id)).json()).recorded, true);
  assert.equal((await (await record(`/suppliers/${other.supplierId}`, id)).json()).recorded, true);
  const response = await api(`/api/analytics/summary?days=7&supplier_id=${other.supplierId}`, { cookie: scopedCookie });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /no-store/);
  const { summary } = await response.json();
  assert.equal(summary.totals.views, 2); assert.equal(summary.totals.profile_views, 1); assert.equal(summary.totals.product_views, 1);
  assert.equal(summary.totals.sessions, 2); assert.equal(summary.daily.length, 7);
  assert.ok(summary.pages.every(p => !p.path.includes(other.supplierId)));
  assert.equal(summary.daily.reduce((s, d) => s + d.views, 0), 2);
  assert.ok(summary.daily.some(d => d.views === 0));
});

test('self visits, administrators and unpublished products do not inflate counters', async () => {
  const own = await record(`/suppliers/${supplier.supplierId}`, session(), supplierCookie);
  assert.equal((await own.json()).recorded, false);
  assert.equal((await (await record('/', session(), adminCookie)).json()).recorded, false);
  const draft = await fixtureProduct(supplier.supplierId, { status: 'inactive' });
  assert.equal((await (await record(`/products/${draft.id}`, session())).json()).recorded, false);
});

test('admin totals include public traffic while unsupported periods are rejected', async () => {
  const before = await (await api('/api/analytics/summary?days=30', { cookie: adminCookie })).json();
  assert.equal((await record('/', session())).status, 200);
  const response = await api('/api/analytics/summary?days=30', { cookie: adminCookie });
  assert.equal(response.status, 200);
  const { summary } = await response.json();
  assert.equal(summary.totals.views, before.summary.totals.views + 1); assert.equal(summary.daily.length, 30);
  assert.equal((await api('/api/analytics/summary?days=999999', { cookie: adminCookie })).status, 400);
});

test('UTC daily deduplication and inclusive reporting boundaries hold across 7, 30 and 90 days', async t => {
  const scoped = await fixtureSupplier(); t.after(() => cleanupUsers([scoped]));
  const cookie = await login(scoped), id = session(), path = `/suppliers/${scoped.supplierId}`;
  const hash = createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY).update(`analytics:${id}`).digest('hex');
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const day = n => new Date(today.getTime() - n * 86400000).toISOString();
  assert.equal((await (await record(path, id)).json()).recorded, true);
  const moved = await db.from('page_views').update({ viewed_on: day(1).slice(0, 10), viewed_at: day(1) }).eq('session_hash', hash);
  assert.equal(moved.error, null);
  assert.equal((await (await record(path, id)).json()).recorded, true);
  assert.equal((await (await record(path, id)).json()).recorded, false);
  const seeded = await db.from('page_views').insert([6, 7, 29, 30, 89, 90].map(n => ({ path, session_hash: hash, scope: 'supplier', supplier_id: scoped.supplierId, viewed_on: day(n).slice(0, 10), viewed_at: day(n) })));
  assert.equal(seeded.error, null);
  for (const [days, expected] of [[7, 3], [30, 5], [90, 7]]) {
    const { summary } = await (await api(`/api/analytics/summary?days=${days}`, { cookie })).json();
    assert.equal(summary.totals.views, expected); assert.equal(summary.totals.sessions, 1);
    assert.equal(summary.daily.length, days);
  }
});

test('anonymous database clients cannot read visitor records or call private report functions', async () => {
  const anonymous = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const rows = await anonymous.from('page_views').select('*');
  assert.ok(rows.error || rows.data.length === 0);
  const report = await anonymous.rpc('gymbuilder_traffic_summary', { p_user_id: admin.id, p_days: 7 });
  assert.ok(report.error);
  const write = await anonymous.rpc('record_public_page_view', { p_path: '/', p_session_hash: 'a'.repeat(64) });
  assert.ok(write.error);
});
