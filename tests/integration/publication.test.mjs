import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, fixtureSupplier, fixtureProduct, cleanupUsers, login } from './helpers.mjs';

test('public gallery does not expose unapproved supplier material', async t => {
  const supplier = await fixtureSupplier('pending'); t.after(() => cleanupUsers([supplier]));
  const response = await api(`/api/supplier/gallery?supplier_id=${supplier.supplierId}`);
  assert.equal(response.status, 404);
  const owner = await api(`/api/supplier/gallery?supplier_id=${supplier.supplierId}`, { cookie: await login(supplier) });
  assert.equal(owner.status, 200);
});

test('public variants respect inactive product visibility', async t => {
  const supplier = await fixtureSupplier(); t.after(() => cleanupUsers([supplier]));
  const product = await fixtureProduct(supplier.supplierId, { status: 'inactive' });
  assert.equal((await api(`/api/supplier/products/variants?product_id=${product.id}`)).status, 404);
  assert.equal((await api(`/api/supplier/products/variants?product_id=${product.id}`, { cookie: await login(supplier) })).status, 200);
});

test('active variants from an unapproved supplier are not public', async t => {
  const supplier = await fixtureSupplier('pending'); t.after(() => cleanupUsers([supplier]));
  const product = await fixtureProduct(supplier.supplierId);
  assert.equal((await api(`/api/supplier/products/variants?product_id=${product.id}`)).status, 404);
});

test('promotions and views respect the supplier and product publication boundary', async t => {
  const supplier = await fixtureSupplier('pending'); t.after(() => cleanupUsers([supplier]));
  const product = await fixtureProduct(supplier.supplierId);
  const { db, api } = await import('./helpers.mjs');
  const promotionStart = Date.now() - 1000;
  const { data: promotion, error } = await db.from('promotions').insert({ supplier_id: supplier.supplierId, product_id: product.id, title: 'Private promotion', price_eur: 90, type: 'oferta_zilei', status: 'active', starts_at: new Date(promotionStart).toISOString(), ends_at: new Date(promotionStart+86400000).toISOString() }).select('id').single();
  assert.ifError(error);
  const { data: visible } = await db.from('public_promotions').select('id').eq('id',promotion.id); assert.equal(visible.length,0);
  const view = await api('/api/products/views',{body:{product_id:product.id,session_id:'audit-private-view'}});assert.equal(view.status,404);
});
