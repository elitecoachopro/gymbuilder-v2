import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { db, api } from './helpers.mjs';

test('a public-source supplier has direct contacts and genuine unknown prices without an account', async t => {
  const marker = `Directory-${randomUUID()}`;
  const source = `https://example.test/${marker}`;
  const { data: supplier, error } = await db.from('supplier_profiles').insert({
    company_name: marker, country: 'China', city: 'Qingdao', user_id: null,
    status: 'approved', verified: false, listing_source_url: source,
    contact_email: 'sales@example.test', catalog_url: `${source}/catalog`,
    listing_checked_at: '2026-10-21T00:00:00Z', phone: '+86 532 12345678', website: source,
  }).select('id').single();
  assert.ifError(error);
  t.after(() => db.from('supplier_profiles').delete().eq('id', supplier.id));
  const { data: product, error: productError } = await db.from('products').insert({
    supplier_id: supplier.id, name: marker, category: 'strength', condition: 'new',
    price_eur: null, source_url: `${source}/product`, images: ['/equipment/asia/example.jpg'],
  }).select('id').single();
  assert.ifError(productError);
  const response = await api(`/api/products?market=asia&search=${marker}`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.count, 1);
  assert.equal(data.products[0].price_eur, null);
  assert.equal(data.products[0].supplier.contact_email, 'sales@example.test');
  assert.equal(data.products[0].source_url, `${source}/product`);
  const detail = await (await api(`/api/suppliers/${supplier.id}`)).json();
  assert.equal(detail.supplier.listing_source_url, source);
  assert.equal(detail.supplier.catalog_url, `${source}/catalog`);
  assert.equal(detail.supplier.verified, false);
  assert.equal(detail.products[0].price_eur, null);
  const productDetail = await (await api(`/api/products/${product.id}`)).json();
  assert.equal(productDetail.product.supplier.contact_email, 'sales@example.test');
  assert.equal(productDetail.product.supplier.listing_source_url, source);
  const filtered = await (await api(`/api/products?search=${marker}&price_min=1`)).json();
  assert.equal(filtered.count, 0);
  const contact = await api('/api/contact/supplier', { body: { name: 'Test Client', email: 'client@example.test', message: 'Test only', supplierId: supplier.id } });
  assert.equal(contact.status, 400);
  const { count } = await db.from('contact_requests').select('id', { head: true, count: 'exact' }).eq('supplier_id', supplier.id);
  assert.equal(count, 0);
});

test('directory suppliers cannot carry a verified badge without an account', async () => {
  const { error } = await db.from('supplier_profiles').insert({ company_name: 'Invalid directory test', country: 'China', city: 'Beijing', user_id: null, status: 'approved', verified: true, listing_source_url: `https://example.test/${randomUUID()}` });
  assert.equal(error?.code, '23514');
});

test('editorial catalogs can grow beyond free quotas while account-owned catalogs keep their limits', async t => {
  const { fixtureSupplier, cleanupUsers } = await import('./helpers.mjs');
  const source = `https://example.test/expanded-${randomUUID()}`;
  const { data: editorial, error } = await db.from('supplier_profiles').insert({
    company_name: 'Expanded editorial fixture', country: 'Romania', city: 'Deva',
    user_id: null, status: 'approved', listing_source_url: source,
  }).select('id').single();
  assert.ifError(error);
  t.after(() => db.from('supplier_profiles').delete().eq('id', editorial.id));
  const account = await fixtureSupplier('approved', 'free');
  t.after(() => cleanupUsers([account]));
  const { error: profileError } = await db.from('supplier_profiles').update({ listing_source_url: `${source}/account` }).eq('id', account.supplierId);
  assert.ifError(profileError);
  const row = (supplierId, index) => ({ supplier_id: supplierId, name: `Expanded fixture ${index}`, category: 'strength', condition: 'new', price_eur: 100, source_url: `${source}/${supplierId}/${index}` });
  for (const supplierId of [editorial.id, account.supplierId]) {
    const first = await db.from('products').insert([0, 1, 2].map(i => row(supplierId, i)));
    assert.ifError(first.error);
  }
  const fourthEditorial = await db.from('products').insert(row(editorial.id, 3));
  assert.ifError(fourthEditorial.error);
  const fourthAccount = await db.from('products').insert(row(account.supplierId, 3));
  assert.equal(fourthAccount.error?.code, '23514');
  const unsourced = await db.from('products').insert({ ...row(editorial.id, 4), source_url: null });
  assert.equal(unsourced.error?.code, '23514');
});

test('used listings preserve seller currency, contacts and condition across public APIs', async t => {
  const source = `https://example.test/used-${randomUUID()}`;
  const { data: supplier, error } = await db.from('supplier_profiles').insert({
    company_name: 'Used price fixture', country: 'Singapore', city: 'Singapore',
    user_id: null, status: 'approved', listing_source_url: source, contact_email: 'sales@example.test',
  }).select('id').single();
  assert.ifError(error);
  t.after(() => db.from('supplier_profiles').delete().eq('id', supplier.id));
  const { data: product, error: productError } = await db.from('products').insert({
    supplier_id: supplier.id, name: 'Used SGD fixture', category: 'cardio', condition: 'used',
    price_eur: null, listed_price_amount: 800, listed_price_currency: 'SGD', source_url: `${source}/product`,
    images: ['/equipment/asia/example.jpg'], specs: { Model: 'T200' },
  }).select('id').single();
  assert.ifError(productError);
  const catalog = await (await api(`/api/products?market=asia&condition=used&supplier=${supplier.id}`)).json();
  assert.equal(catalog.count, 1);
  const detail = await (await api(`/api/products/${product.id}`)).json();
  const directory = await (await api(`/api/suppliers/${supplier.id}`)).json();
  for (const result of [catalog.products[0], detail.product, directory.products[0]]) {
    assert.equal(result.listed_price_amount, 800);
    assert.equal(result.listed_price_currency, 'SGD');
    assert.equal(result.price_eur, null);
    assert.equal(result.condition, 'used');
  }
  assert.equal(detail.product.supplier.contact_email, 'sales@example.test');
  const newCatalog = await (await api(`/api/products?condition=new&supplier=${supplier.id}`)).json();
  assert.equal(newCatalog.count, 0);
  const invalid = await db.from('products').insert({ supplier_id: supplier.id, name: 'Invalid price pair', category: 'cardio', condition: 'used', price_eur: 100, source_url: `${source}/invalid`, listed_price_amount: 800 });
  assert.equal(invalid.error?.code, '23514');
});
