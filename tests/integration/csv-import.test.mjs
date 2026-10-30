import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db, api, fixtureSupplier, login, cleanupUsers } from './helpers.mjs';

const csvContent = 'name,price,category,condition\nAudit CSV Product,99,strength,new';

test('CSV preview and confirmed import use a valid published product status', async t => {
  const supplier = await fixtureSupplier(); t.after(() => cleanupUsers([supplier]));
  const cookie = await login(supplier);
  const preview = await api('/api/supplier/products/import', { cookie, body: { csvContent } });
  assert.equal(preview.status, 200);
  assert.equal((await preview.json()).validRows[0].data.status, 'active');
  const imported = await api('/api/supplier/products/import', { cookie, body: { csvContent, confirm: true } });
  assert.equal(imported.status, 200);
  const { data } = await db.from('products').select('name,status').eq('supplier_id', supplier.supplierId).single();
  assert.equal(data.name, 'Audit CSV Product');
  assert.equal(data.status, 'active');
});

test('unapproved supplier cannot import published products', async t => {
  const supplier = await fixtureSupplier('pending'); t.after(() => cleanupUsers([supplier]));
  const response = await api('/api/supplier/products/import', { cookie: await login(supplier), body: { csvContent } });
  assert.equal(response.status, 403);
});
