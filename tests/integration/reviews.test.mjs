import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db, api, fixtureSupplier, fixtureUser, login, cleanupUsers } from './helpers.mjs';

test('submitted client reviews stay private until an administrator approves them', async t => {
  const supplier = await fixtureSupplier(), client = await fixtureUser(), admin = await fixtureUser('admin');
  t.after(() => cleanupUsers([supplier, client, admin]));
  const clientCookie = await login(client);
  const response = await api('/api/reviews', { cookie: clientCookie, body: {
    supplier_id: supplier.supplierId, client_name: 'Local review test', client_email: client.email,
    rating: 4, title: 'Synthetic local review', body: 'Test data only',
  } });
  assert.equal(response.status, 200);
  const { data: review, error } = await db.from('reviews').select('id,verified,client_email').eq('supplier_id', supplier.supplierId).single();
  assert.ifError(error); assert.equal(review.verified, false); assert.equal(review.client_email, client.email);
  assert.equal((await (await api(`/api/reviews?supplier_id=${supplier.supplierId}`)).json()).stats.count, 0);
  assert.equal((await api('/api/admin/reviews', { cookie: clientCookie, method: 'PATCH', body: { reviewId: review.id, action: 'approve' } })).status, 403);
  assert.equal((await api('/api/admin/reviews', { cookie: await login(admin), method: 'PATCH', body: { reviewId: review.id, action: 'approve' } })).status, 200);
  const visible = await (await api(`/api/reviews?supplier_id=${supplier.supplierId}`)).json();
  assert.equal(visible.stats.count, 1); assert.equal(visible.stats.avgRating, 4); assert.equal(visible.reviews[0].id, review.id);
});
