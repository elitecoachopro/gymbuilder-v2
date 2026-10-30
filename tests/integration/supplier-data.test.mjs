import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db, api, fixtureUser, fixtureSupplier, fixtureProduct, login, cleanupUsers } from './helpers.mjs';

test('product form receives the current supplier approval status before publication', async t => {
  const supplier = await fixtureSupplier('pending'); t.after(() => cleanupUsers([supplier]));
  const cookie = await login(supplier);
  const pending = await api('/api/supplier/products', { cookie });
  assert.equal(pending.status, 200);
  assert.equal((await pending.json()).supplierStatus, 'pending');
  assert.equal((await api('/api/supplier/products', { cookie, body: { name: 'Not publishable yet' } })).status, 403);
  await db.from('supplier_profiles').update({ status: 'approved' }).eq('id', supplier.supplierId);
  assert.equal((await (await api('/api/supplier/products', { cookie })).json()).supplierStatus, 'approved');
});

test('supplier dashboard includes verified review count and rating', async t => {
  const supplier = await fixtureSupplier(); t.after(() => cleanupUsers([supplier]));
  await db.from('reviews').insert({ supplier_id: supplier.supplierId, client_name: 'Audit', client_email: 'audit@example.test', rating: 5, title: 'Verified review', verified: true });
  const response = await api('/api/supplier/dashboard', { cookie: await login(supplier) });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.stats.reviewCount, 1);
  assert.equal(Number(result.stats.avgRating), 5);
});

test('a favorite price drop produces an in-app notification before the request completes', async t => {
  const supplier = await fixtureSupplier(), client = await fixtureUser(); t.after(() => cleanupUsers([supplier, client]));
  const product = await fixtureProduct(supplier.supplierId);
  await db.from('favorites').insert({ user_id: client.id, product_id: product.id });
  const response = await api('/api/supplier/products', { method: 'PATCH', cookie: await login(supplier), body: { productId: product.id, price_eur: 90 } });
  assert.equal(response.status, 200);
  const { data, error } = await db.from('notifications').select('type').eq('user_id', client.id).eq('type', 'price_drop');
  assert.equal(error, null);
  assert.equal(data.length, 1);
});

test('suppliers can opt in, change and remove only their own public email', async t => {
  const supplier = await fixtureSupplier(), other = await fixtureSupplier(), client = await fixtureUser();
  t.after(() => cleanupUsers([supplier, other, client]));
  const product = await fixtureProduct(supplier.supplierId);
  assert.equal((await api('/api/supplier/dashboard', { method: 'PATCH', body: { contactEmail: 'sales@example.test' } })).status, 401);
  assert.equal((await api('/api/supplier/dashboard', { method: 'PATCH', cookie: await login(client), body: { contactEmail: 'sales@example.test' } })).status, 403);
  const cookie = await login(supplier);
  for (const invalid of ['bad address', 123, 'a@example.test?bcc=other@example.test']) {
    assert.equal((await api('/api/supplier/dashboard', { method: 'PATCH', cookie, body: { contactEmail: invalid } })).status, 400);
  }
  assert.equal((await api('/api/supplier/dashboard', { method: 'PATCH', cookie, body: {} })).status, 400);
  const response = await api('/api/supplier/dashboard', { method: 'PATCH', cookie, body: { supplierId: other.supplierId, contactEmail: ' SALES+PUBLIC@Example.TEST ' } });
  assert.equal(response.status, 200); assert.equal((await response.json()).contactEmail, 'sales+public@example.test');
  const own = await (await api('/api/supplier/dashboard', { cookie })).json();
  assert.equal(own.supplier.contactEmail, 'sales+public@example.test');
  const { data: untouched } = await db.from('supplier_profiles').select('contact_email').eq('id', other.supplierId).single();
  assert.equal(untouched.contact_email, null);
  const publicProduct = await (await api(`/api/products/${product.id}`)).json();
  assert.equal(publicProduct.product.supplier.contact_email, 'sales+public@example.test');
  const publicProfile = await (await api(`/api/suppliers/${supplier.supplierId}`)).json();
  assert.equal(publicProfile.supplier.contact_email, 'sales+public@example.test');
  const { data: loginUser } = await db.from('users').select('email').eq('id', supplier.id).single();
  assert.equal(loginUser.email, supplier.email);
  assert.equal((await api('/api/supplier/dashboard', { method: 'PATCH', cookie, body: { contactEmail: '' } })).status, 200);
  const cleared = await (await api(`/api/products/${product.id}`)).json();
  assert.equal(cleared.product.supplier.contact_email, null);
});
