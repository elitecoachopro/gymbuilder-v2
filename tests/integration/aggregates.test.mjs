import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, db, fixtureSupplier, fixtureProduct, cleanupUsers, login } from './helpers.mjs';

test('review average covers all verified reviews even when only one is displayed', async t => {
  const supplier = await fixtureSupplier(); t.after(() => cleanupUsers([supplier]));
  await db.from('reviews').insert([
    { supplier_id: supplier.supplierId, client_name: 'Audit', client_email: 'audit@example.test', rating: 1, title: 'Older', verified: true, created_at: '2026-01-01T00:00:00Z' },
    { supplier_id: supplier.supplierId, client_name: 'Audit', client_email: 'audit@example.test', rating: 5, title: 'Newer', verified: true, created_at: '2026-02-01T00:00:00Z' },
  ]);
  const response = await api(`/api/reviews?supplier_id=${supplier.supplierId}&limit=1`);
  const result = await response.json();
  assert.equal(result.reviews.length, 1);
  assert.equal(result.stats.count, 2);
  assert.equal(result.stats.avgRating, 3);
});

test('supplier analytics counts views past the REST 1000-row ceiling', async t => {
  const supplier = await fixtureSupplier(); t.after(() => cleanupUsers([supplier]));
  const product = await fixtureProduct(supplier.supplierId);
  const rows = Array.from({ length: 1001 }, (_, index) => ({ product_id: product.id, session_id: `audit-${index}` }));
  const { error } = await db.from('product_views').insert(rows); assert.equal(error, null);
  const response = await api('/api/supplier/analytics', { cookie: await login(supplier) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).analytics[0].views_total, 1001);
});

test('variant limit cannot be bypassed by concurrent inserts', async t => {
  const supplier = await fixtureSupplier(); t.after(() => cleanupUsers([supplier]));
  const product = await fixtureProduct(supplier.supplierId);
  await db.from('product_variants').insert(Array.from({ length: 9 }, (_, i) => ({ product_id: product.id, label: `Audit ${i}` })));
  await Promise.all(Array.from({ length: 3 }, (_, i) => db.from('product_variants').insert({ product_id: product.id, label: `Concurrent ${i}` })));
  const { count } = await db.from('product_variants').select('id', { count: 'exact', head: true }).eq('product_id', product.id);
  assert.equal(count, 10);
});
