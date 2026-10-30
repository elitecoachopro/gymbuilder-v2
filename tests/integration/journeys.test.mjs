import test from 'node:test';
import assert from 'node:assert/strict';
import { api, db, fixtureSupplier, fixtureUser, fixtureProduct, login, cleanupUsers, origin } from './helpers.mjs';

test('client and administrator can reach history beyond the first page, with real totals', async t => {
  const client = await fixtureUser(), admin = await fixtureUser('admin'), supplier = await fixtureSupplier();
  t.after(() => cleanupUsers([client, admin, supplier]));
  const rows = Array.from({ length: 101 }, (_, i) => ({ client_id: client.id, client_name: 'Audit history', client_email: client.email, supplier_id: supplier.supplierId, message: `History request ${i}`, status: 'sent' }));
  assert.equal((await db.from('contact_requests').insert(rows)).error, null);
  const cookie = await login(client);
  const first = await (await api('/api/client/dashboard?page=1', { cookie })).json();
  const second = await (await api('/api/client/dashboard?page=2', { cookie })).json();
  assert.equal(first.totals.contactRequests, 101); assert.equal(first.contactRequests.length, 20); assert.equal(first.pagination.hasNext, true);
  assert.equal(second.contactRequests.length, 20); assert.ok(second.contactRequests.every(r => !first.contactRequests.some(p => p.id === r.id)));
  const adminCookie = await login(admin);
  const a = await (await api('/api/admin/contact-requests?page=2', { cookie: adminCookie })).json();
  assert.ok(a.total >= 101); assert.ok(a.requests.length >= 1); assert.equal(a.pagination.page, 2);
  assert.equal((await api('/api/admin/contact-requests', { cookie })).status, 401);
});

test('a recorded request does not claim email delivery without an email provider', async t => {
  const supplier = await fixtureSupplier(); t.after(() => cleanupUsers([supplier]));
  const response = await api('/api/contact/supplier', { body: { supplierId: supplier.supplierId, name: 'Audit delivery', email: 'audit-delivery@example.test', message: 'Please quote this equipment' } });
  assert.equal(response.status, 200);
  const value = await response.json(); assert.equal(value.recorded, true); assert.equal(value.supplierEmailSent, false); assert.equal(value.confirmationEmailSent, false);
  assert.ok((await db.from('contact_requests').select('id').eq('id', value.requestId).single()).data);
});

test('a supplier reaching product capacity receives a useful conflict instead of generic 500', async t => {
  const supplier = await fixtureSupplier(); t.after(async () => { await cleanupUsers([supplier]); await db.from('brands').delete().eq('name', 'Audit quota brand'); });
  for (let n = 0; n < 3; n++) await fixtureProduct(supplier.supplierId);
  const response = await api('/api/supplier/products', { cookie: await login(supplier), body: { name: 'Audit over capacity', brand: 'Audit quota brand', category: 'strength', condition: 'new', price_eur: 100, images: [] } });
  assert.equal(response.status, 409); assert.match((await response.json()).error, /limita/);
});

test('the admin page gates anonymous visitors before mounting management controls', async () => {
  const response = await fetch(`${origin}/admin`, { redirect: 'manual' });
  assert.equal(response.status, 307); assert.match(response.headers.get('location'), /login.*redirect/);
});
