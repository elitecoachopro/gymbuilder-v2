import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { api, db, fixtureSupplier, fixtureUser, fixtureProduct, cleanupUsers, login } from './helpers.mjs';

test('catalog searches and sorts the whole result set with stable pagination', async t => {
  const supplier = await fixtureSupplier('approved', 'enterprise'); t.after(() => cleanupUsers([supplier]));
  const name = `Catalog-${randomUUID()}`;
  const rows = Array.from({ length: 61 }, (_, i) => ({ supplier_id: supplier.supplierId, name: `${name}-${i}`, category: 'strength', price_eur: i + 1, condition: 'new', status: 'active' }));
  assert.ifError((await db.from('products').insert(rows)).error);
  const response = await api(`/api/products?search=${name}&sort=price_asc&limit=24`, { method: 'GET' });
  assert.equal(response.status, 200);
  const data = await response.json(); assert.equal(data.count, 61); assert.equal(data.pages, 3); assert.equal(data.products[0].price_eur, 1);
  const last = await (await api(`/api/products?search=${name}&sort=price_asc&limit=24&page=3`, { method: 'GET' })).json();
  assert.equal(last.products.length, 13); assert.equal(last.products[12].price_eur, 61);
});

test('pending suppliers cannot expose products in catalog, detail or autocomplete', async t => {
  const supplier = await fixtureSupplier('pending'); t.after(() => cleanupUsers([supplier]));
  const product = await fixtureProduct(supplier.supplierId, { name: `Private-${randomUUID()}` });
  const list = await (await api(`/api/products?search=${product.name}`, { method: 'GET' })).json();
  assert.equal(list.count, 0);
  assert.equal((await api(`/api/products/${product.id}`, { method: 'GET' })).status, 404);
  const search = await (await api(`/api/search/autocomplete?q=${product.name}`, { method: 'GET' })).json();
  assert.equal(search.suggestions.some(item => item.id === product.id), false);
});

test('favorites persist after a fresh read and removal', async t => {
  const supplier = await fixtureSupplier(), client = await fixtureUser(); t.after(() => cleanupUsers([supplier, client]));
  const product = await fixtureProduct(supplier.supplierId), cookie = await login(client);
  const response = await api('/api/client/favorites', { cookie, body: { product_id: product.id } });
  assert.equal(response.status, 200); assert.equal((await response.json()).favorited, true);
  const saved = await (await api('/api/client/favorites', { cookie, method: 'GET' })).json(); assert.ok(saved.ids.includes(product.id));
  assert.equal((await (await api('/api/client/favorites', { cookie, body: { product_id: product.id } })).json()).favorited, false);
});

test('retries with the same enquiry key save exactly one request', async t => {
  const supplier = await fixtureSupplier(); t.after(() => cleanupUsers([supplier]));
  const idempotencyKey = randomUUID();
  const body = { name: 'Audit Client', email: 'audit@example.test', supplierId: supplier.supplierId, message: 'A local enquiry', idempotencyKey };
  const responses = await Promise.all([api('/api/contact/supplier', { body }), api('/api/contact/supplier', { body })]);
  assert.ok(responses.every(response => response.status === 200));
  assert.equal((await responses[0].json()).requestId, (await responses[1].json()).requestId);
  const { count } = await db.from('contact_requests').select('id', { head: true, count: 'exact' }).eq('idempotency_key', idempotencyKey);
  assert.equal(count, 1);
});

test('four suppliers in one basket do not exceed each others contact quota', async t => {
  const suppliers = [];
  t.after(() => cleanupUsers(suppliers));
  for (let i = 0; i < 4; i++) suppliers.push(await fixtureSupplier());
  const { origin } = await import('./helpers.mjs');
  for (const supplier of suppliers) {
    const response = await fetch(`${origin}/api/contact/supplier`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.44.33.22' }, body: JSON.stringify({ name: 'Audit Basket', email: 'audit-basket@example.test', message: 'Multi-supplier local regression', supplierId: supplier.supplierId }) });
    assert.equal(response.status, 200);
  }
});

test('catalog search includes the product brand', async t => {
  const supplier = await fixtureSupplier();
  const name=`AuditBrand-${randomUUID()}`;
  const {data:brand,error}=await db.from('brands').insert({name}).select('id').single();assert.ifError(error);
  t.after(async()=>{await cleanupUsers([supplier]);await db.from('brands').delete().eq('id',brand.id);});
  const product=await fixtureProduct(supplier.supplierId,{brand_id:brand.id,name:'Plain equipment name'});
  const response=await api(`/api/products?search=${name}`,{method:'GET'});assert.equal(response.status,200);
  assert.ok((await response.json()).products.some(row=>row.id===product.id));
});
