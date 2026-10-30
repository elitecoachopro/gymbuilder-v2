import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { api, db, fixtureSupplier, fixtureProduct, cleanupUsers } from './helpers.mjs';
import { supplierCountries } from '../../src/lib/supplier-countries.ts';
import { createClient } from '@supabase/supabase-js';

test('market classification supports the international registration country names and Romanian aliases', async () => {
  const asianCodes = 'AE AF AM AZ BD BH BN BT CN CY GE HK ID IL IN IQ IR JO JP KG KH KP KR KW KZ LA LB LK MM MN MO MV MY NP OM PH PK PS QA SA SG SY TH TJ TL TM TR TW UZ VN YE'.split(' ');
  for (const country of supplierCountries('ro').filter(country => asianCodes.includes(country.code) || country.code === 'RO')) {
    const result = await db.rpc('catalog_market', { country: country.value });
    assert.ifError(result.error);
    assert.equal(result.data, country.code === 'RO' ? 'romania' : 'asia', country.value);
  }
  for (const [country, expected] of [['ROMÂNIA', 'romania'], ['RO', 'romania'], ['Japonia', 'asia'], ['Coreea de Sud', 'asia'], ['US', 'rest-of-world'], ['Germany', 'rest-of-world'], ['', null]]) {
    const result = await db.rpc('catalog_market', { country });
    assert.ifError(result.error); assert.equal(result.data, expected, country);
  }
});

test('catalog views remain inaccessible through the public database key', async () => {
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  for (const view of ['public_catalog_products', 'public_supplier_directory']) {
    const { error } = await anon.from(view).select('*').limit(1);
    assert.ok(error, view);
  }
});

test('regional catalogs filter suppliers before counting and paginating, independently of brand origin', async t => {
  const suppliers = [];
  const marker = `Markets-${randomUUID()}`;
  const { data: brand, error } = await db.from('brands').insert({ name: marker, country: 'China' }).select('id').single();
  assert.ifError(error);
  t.after(async () => { await cleanupUsers(suppliers); await db.from('brands').delete().eq('id', brand.id); });
  for (const [country, market] of [['România', 'romania'], ['China', 'asia'], ['Japan', 'asia'], ['Germany', 'rest-of-world']]) {
    const supplier = await fixtureSupplier(); suppliers.push(supplier);
    assert.ifError((await db.from('supplier_profiles').update({ country, company_name: marker, phone: '+40 700 123 456', website: 'https://example.com' }).eq('id', supplier.supplierId)).error);
    await fixtureProduct(supplier.supplierId, { name: marker, brand_id: brand.id });
    supplier.market = market;
  }
  for (const [market, expected] of [['romania', 1], ['asia', 2], ['rest-of-world', 1]]) {
    const response = await api(`/api/products?market=${market}&search=${marker}&limit=1`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.count, expected); assert.equal(data.pages, expected);
    assert.equal(data.products.length, 1);
    const product = data.products[0];
    assert.ok(suppliers.some(s => s.supplierId === product.supplier_id && s.market === market));
    assert.equal(product.brand.country, 'China');
    assert.equal(product.supplier.phone, '+40 700 123 456');
    assert.equal(product.supplier.website, 'https://example.com');
    const directory = await (await api(`/api/suppliers?market=${market}&search=${marker}&limit=1`)).json();
    assert.equal(directory.count, expected); assert.equal(directory.suppliers.length, 1);
    if (expected > 1) {
      const second = await (await api(`/api/products?market=${market}&search=${marker}&limit=1&page=2`)).json();
      assert.notEqual(second.products[0].id, product.id);
    }
  }
  const detail = await (await api(`/api/products?market=romania&search=${marker}`)).json();
  const product = await (await api(`/api/products/${detail.products[0].id}`)).json();
  assert.equal(product.product.supplier.phone, '+40 700 123 456');
  assert.equal(product.product.brand_country, 'China');
  for (const path of ['/api/products?market=invalid', '/api/suppliers?market=invalid']) {
    assert.equal((await api(path)).status, 400);
  }
});

test('regional directories exclude pending suppliers and their equipment', async t => {
  const supplier = await fixtureSupplier('pending'); t.after(() => cleanupUsers([supplier]));
  const marker = `Hidden-market-${randomUUID()}`;
  assert.ifError((await db.from('supplier_profiles').update({ country: 'China', company_name: marker }).eq('id', supplier.supplierId)).error);
  await fixtureProduct(supplier.supplierId, { name: marker });
  for (const endpoint of ['products', 'suppliers']) {
    const response = await api(`/api/${endpoint}?market=asia&search=${marker}`);
    assert.equal(response.status, 200); assert.equal((await response.json()).count, 0);
  }
});
