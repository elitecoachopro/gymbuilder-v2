import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { api, db, origin, fixtureUser, fixtureSupplier, fixtureProduct, cleanupUsers, login } from './helpers.mjs';

const event = (path, session, extra = {}, cookie) => fetch(`${origin}/api/analytics/events`, {
  method: 'POST', headers: { origin, 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
  body: JSON.stringify({ path, session_id: session, kind: 'view', source: 'instagram', event_id: randomUUID(), consent: 'all', ...extra }),
});

test('navigation retries are idempotent while revisits count and legacy product history stays unique', async t => {
  const supplier = await fixtureSupplier(); t.after(() => cleanupUsers([supplier]));
  const product = await fixtureProduct(supplier.supplierId), path = `/products/${product.id}`, session = randomUUID(), event_id = randomUUID();
  for (const result of await Promise.all(Array.from({ length: 4 }, () => event(path, session, { event_id })))) assert.equal(result.status, 200);
  assert.equal((await (await event(path, session)).json()).recorded, true);
  const { summary } = await (await api('/api/analytics/report', { cookie: await login(supplier) })).json();
  assert.equal(summary.totals.views, 2); assert.equal(summary.totals.sessions, 1);
  assert.equal(summary.sources[0].source, 'instagram'); assert.equal(summary.hourly.reduce((n,h) => n+h.views,0), 2);
  const { analytics } = await (await api('/api/supplier/analytics', { cookie: await login(supplier) })).json();
  assert.equal(analytics[0].views_total, 1);
});

test('reports isolate supplier actions and count enquiries as records rather than clicks', async t => {
  const supplier = await fixtureSupplier(), other = await fixtureSupplier(); t.after(() => cleanupUsers([supplier, other]));
  const path = `/suppliers/${supplier.supplierId}`, session = randomUUID();
  await event(path, session, { kind: 'phone' }); await event(path, session, { kind: 'whatsapp' });
  await event(`/suppliers/${other.supplierId}`, session, { kind: 'phone' });
  const inserted = await db.from('contact_requests').insert({ supplier_id: supplier.supplierId, client_name: 'Local analytics test', client_email: 'test@example.test', message: 'Real stored request' });
  assert.equal(inserted.error, null);
  const response = await api(`/api/analytics/report?days=7&supplier_id=${other.supplierId}`, { cookie: await login(supplier) });
  assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/);
  const { summary } = await response.json();
  assert.deepEqual(summary.actions, { phone: 1, whatsapp: 1 }); assert.equal(summary.business.requests, 1);
  assert.equal(summary.business.projects_created, null); assert.equal(summary.business.messages, null);
  assert.ok(summary.recent.every(r => r.path === path)); assert.equal(summary.recent.length, 2);
  assert.equal(summary.totals.views, 0); assert.equal(summary.daily.length, 7); assert.equal(summary.hourly.length, 24);
  assert.ok(summary.recent.every(r => !('session_hash' in r) && !('email' in r)));
});

test('private reports and event collection enforce role, consent, publication and source boundaries', async t => {
  const supplier = await fixtureSupplier(), client = await fixtureUser(); t.after(() => cleanupUsers([supplier,client]));
  const cookie = await login(supplier), path = `/suppliers/${supplier.supplierId}`, session = randomUUID();
  assert.equal((await api('/api/analytics/report')).status, 401);
  assert.equal((await api('/api/analytics/report', { cookie: await login(client) })).status, 403);
  assert.equal((await (await event(path, session, { consent: 'essential' })).json()).recorded, false);
  assert.equal((await event(path, session, { source: 'private@example.test' })).status, 400);
  assert.equal((await event('/reset-password?token=secret', session)).status, 400);
  assert.equal((await (await event(path,session,{},cookie)).json()).recorded, false);
  assert.equal((await api('/api/analytics/report?days=999', { cookie })).status, 400);
  assert.equal((await api('/api/analytics/report?days=7&day=2026-02-31', { cookie })).status, 400);
  const anonymous = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  assert.ok((await anonymous.rpc('gymbuilder_detailed_report', { p_user_id: supplier.id })).error);
  assert.ok((await anonymous.from('gym_traffic_events').select('*')).error);
  const pending = await fixtureSupplier('pending'); t.after(() => cleanupUsers([pending]));
  assert.equal((await (await event(`/suppliers/${pending.supplierId}`,session)).json()).recorded, false);
});

test('hourly reporting uses Bucharest calendar days including the daylight-saving day', async t => {
  const today = new Date(); today.setUTCHours(0,0,0,0);
  const transitionFor = year => { const d = new Date(Date.UTC(year,9,31)); d.setUTCDate(d.getUTCDate()-d.getUTCDay()); return d; };
  let transition = transitionFor(today.getUTCFullYear());
  if (transition > today) transition = transitionFor(today.getUTCFullYear()-1);
  if ((today-transition)/86400000 > 89) return t.skip('Autumn DST day is outside the bounded 90-day reporting window');
  const transitionDay = transition.toISOString().slice(0,10);
  const supplier = await fixtureSupplier(); t.after(() => cleanupUsers([supplier]));
  const cookie = await login(supplier), session = randomUUID(), path = `/suppliers/${supplier.supplierId}`;
  await event(path,session);
  const hash = createHmac('sha256',process.env.SUPABASE_SERVICE_ROLE_KEY).update(`analytics:${session}`).digest('hex');
  const updated = await db.from('gym_traffic_events').update({ occurred_at: `${transitionDay}T00:20:00Z` }).eq('session_hash',hash);
  assert.equal(updated.error,null);
  const second = await db.from('gym_traffic_events').insert({ event_id:randomUUID(), path,kind:'view',source:'instagram',session_hash:hash,scope:'supplier',supplier_id:supplier.supplierId,occurred_at:`${transitionDay}T01:20:00Z` });
  assert.equal(second.error,null);
  const { summary } = await (await api(`/api/analytics/report?days=90&day=${transitionDay}`,{cookie})).json();
  assert.equal(summary.timezone,'Europe/Bucharest'); assert.equal(summary.hourly.find(h=>h.hour===3).views,2);
  assert.equal(summary.daily.find(d=>d.day===transitionDay).views,2);
  assert.equal(summary.hourly.reduce((n,h)=>n+h.views,0),2);
});

test('admin project results come from persisted projects with an explicit completion status', async t => {
  const admin = await fixtureUser('admin'), client = await fixtureUser(); t.after(()=>cleanupUsers([admin,client]));
  const cookie = await login(admin);
  const before = (await (await api('/api/analytics/report',{cookie})).json()).summary.business;
  const inserted = await db.from('gym_projects').insert(['draft','completed'].map(status=>({ client_id:client.id,variant:'from_scratch',total_area:300,length_m:20,width_m:15,zones:[],status })));
  assert.equal(inserted.error,null);
  const after = (await (await api('/api/analytics/report',{cookie})).json()).summary.business;
  assert.equal(after.projects_created,before.projects_created+2); assert.equal(after.projects_completed,before.projects_completed+1);
});

test('Bucharest midnight and closed-open period boundaries are correct for every report range', async t => {
  const zone = 'Europe/Bucharest';
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const shifted = n => new Date(Date.parse(`${today}T00:00:00Z`) + n*86400000).toISOString().slice(0,10);
  const midnight = day => {
    const parts = new Intl.DateTimeFormat('en', { timeZone: zone, timeZoneName: 'longOffset' }).formatToParts(new Date(`${day}T00:00:00Z`));
    return new Date(`${day}T00:00:00${parts.find(p=>p.type==='timeZoneName').value.replace('GMT','')}`).getTime();
  };
  for (const days of [1,7,30,90]) {
    const supplier = await fixtureSupplier(); t.after(()=>cleanupUsers([supplier]));
    const cookie = await login(supplier), session = randomUUID(), path = `/suppliers/${supplier.supplierId}`;
    const startDay = shifted(-(days-1)), start = midnight(startDay), end = midnight(shifted(1));
    await event(path,session);
    const hash = createHmac('sha256',process.env.SUPABASE_SERVICE_ROLE_KEY).update(`analytics:${session}`).digest('hex');
    assert.equal((await db.from('gym_traffic_events').update({occurred_at:new Date(start).toISOString()}).eq('session_hash',hash)).error,null);
    assert.equal((await db.from('gym_traffic_events').insert([start-1,end].map(time=>({event_id:randomUUID(),path,kind:'view',source:'instagram',session_hash:hash,scope:'supplier',supplier_id:supplier.supplierId,occurred_at:new Date(time).toISOString()})))).error,null);
    const response = await api(`/api/analytics/report?days=${days}&day=${startDay}`,{cookie});
    assert.equal(response.status,200);
    const {summary}=await response.json();
    assert.equal(summary.totals.views,1); assert.equal(summary.daily[0].views,1); assert.equal(summary.hourly[0].views,1);
  }
});
