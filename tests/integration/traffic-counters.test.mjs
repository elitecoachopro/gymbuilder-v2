import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { api, db, fixtureUser, fixtureSupplier, fixtureProduct, cleanupUsers, login } from './helpers.mjs';

async function record({ path, sessionId = randomUUID(), eventId = randomUUID(), environment = 'development', actor = null }) {
  const { data, error } = await db.rpc('record_traffic_view', { p_event_id: eventId, p_session_id: sessionId, p_path: path, p_environment: environment, p_actor_id: actor });
  assert.equal(error, null);
  return data;
}
async function summary(supplierId, environment = 'development', days = 7) {
  const { data, error } = await db.rpc('traffic_summary', { p_days: days, p_environment: environment, p_supplier_id: supplierId });
  assert.equal(error, null);
  return data;
}

test('traffic deduplicates concurrent events, counts distinct sessions, and isolates preview from production', async t => {
  const supplier = await fixtureSupplier(); t.after(() => cleanupUsers([supplier]));
  const product = await fixtureProduct(supplier.supplierId);
  const sessionId = randomUUID(); const eventId = randomUUID();
  const input = { path: `/products/${product.id}`, sessionId, eventId, environment: 'preview' };
  const inserted = await Promise.all(Array.from({ length: 4 }, () => record(input)));
  assert.equal(inserted.filter(Boolean).length, 1);
  await record({ path: `/suppliers/${supplier.supplierId}`, sessionId, environment: 'preview' });
  await record({ path: `/products/${product.id}`, environment: 'preview' });
  const preview = await summary(supplier.supplierId, 'preview');
  assert.equal(preview.views, 3); assert.equal(preview.sessions, 2);
  assert.equal(preview.profileViews, 1); assert.equal(preview.productViews, 2);
  assert.equal(preview.requests, null);
  assert.equal((await summary(supplier.supplierId, 'production')).views, 0);
  const before = await db.from('product_views').select('id', { count: 'exact', head: true }).eq('product_id', product.id);
  assert.equal(before.count, 0, 'preview must never increment legacy live counters');
  await record({ ...input, environment: 'production' });
  await record({ ...input, eventId: randomUUID(), environment: 'production' });
  assert.equal((await summary(supplier.supplierId, 'production')).views, 2);
  const after = await db.from('product_views').select('id', { count: 'exact', head: true }).eq('product_id', product.id);
  assert.equal(after.count, 1, 'legacy product counts remain one per session');
});

test('owner visits and unpublished suppliers/products do not count', async t => {
  const supplier = await fixtureSupplier(); const pending = await fixtureSupplier('pending');
  t.after(() => cleanupUsers([supplier, pending]));
  const product = await fixtureProduct(supplier.supplierId);
  const draft = await fixtureProduct(supplier.supplierId, { status: 'inactive' });
  assert.equal(await record({ path: `/suppliers/${supplier.supplierId}`, actor: supplier.id }), false);
  assert.equal(await record({ path: `/products/${product.id}`, actor: supplier.id }), false);
  assert.equal(await record({ path: `/suppliers/${pending.supplierId}` }), false);
  assert.equal(await record({ path: `/products/${draft.id}` }), false);
  assert.equal((await summary(supplier.supplierId)).views, 0);
});

test('analytics raw data and RPCs cannot be accessed with the public key', async () => {
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  assert.ok((await anon.from('traffic_views').select('*')).error);
  assert.ok((await anon.rpc('traffic_summary', { p_days: 7, p_environment: 'production' })).error);
  assert.ok((await anon.rpc('record_traffic_view', { p_event_id: randomUUID(), p_session_id: randomUUID(), p_path: '/', p_environment: 'production' })).error);
});

test('monitoring API isolates supplier scope, denies clients, and never trusts environment query parameters', async t => {
  const first = await fixtureSupplier(); const second = await fixtureSupplier(); const client = await fixtureUser();
  t.after(() => cleanupUsers([first, second, client]));
  await record({ path: `/suppliers/${first.supplierId}` });
  assert.equal((await api('/api/analytics')).status, 401);
  assert.equal((await api('/api/analytics', { cookie: await login(client) })).status, 403);
  const secondCookie = await login(second);
  const response = await api(`/api/analytics?days=7&supplier_id=${first.supplierId}&environment=production`, { cookie: secondCookie });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.environment, 'development'); assert.equal(body.stats.views, 0);
  const firstResponse = await api('/api/analytics?days=7', { cookie: await login(first) });
  assert.equal((await firstResponse.json()).stats.profileViews, 1);
  assert.equal((await api('/api/analytics?days=365', { cookie: secondCookie })).status, 400);
});
