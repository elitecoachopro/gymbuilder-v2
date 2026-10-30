import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readDirectory = () => JSON.parse(readFileSync(new URL('../../src/data/build-directory.json', import.meta.url), 'utf8'));

test('every gym fitout category opens a sourced product or service with a supplier contact', () => {
  const directory = readDirectory();
  const required = ['proiectare', 'pardoseli', 'finisaje', 'climatizare', 'electricitate', 'sanitare', 'vestiare', 'receptie', 'cardio', 'forta', 'greutati-libere', 'functional', 'studio', 'stretching', 'wellness', 'lounge', 'intretinere', 'siguranta', 'montaj'];
  assert.deepEqual(directory.categories.map(category => category.slug).sort(), required.sort());
  assert.equal(new Set(directory.products.map(product => product.id)).size, directory.products.length);
  for (const category of directory.categories) {
    assert.ok(category.name.ro && category.name.en);
    const products = directory.products.filter(product => product.categories.includes(category.slug));
    assert.ok(products.length > 0, `Empty category: ${category.slug}`);
    for (const product of products) {
      const supplier = directory.suppliers.find(supplier => supplier.id === product.supplierId);
      assert.ok(supplier, `Missing supplier: ${product.id}`);
      for (const url of [product.sourceUrl, product.imageUrl, supplier.contactUrl]) assert.equal(new URL(url).protocol, 'https:');
      assert.ok(supplier.phone || supplier.email, `Missing direct contact: ${supplier.id}`);
      assert.ok(product.checkedAt && product.name);
      for (const slug of product.categories) assert.ok(required.includes(slug));
    }
  }
});

test('published prices keep their original currency and distinguish quote-only services and variants', () => {
  for (const product of readDirectory().products) {
    if (product.price === null) {
      assert.ok(product.priceNote.ro && product.priceNote.en, `Explain quote-only price: ${product.id}`);
      assert.equal(product.priceMax ?? null, null);
    } else {
      assert.ok(Number.isFinite(product.price) && product.price > 0, `Invalid price: ${product.id}`);
      assert.match(product.currency, /^[A-Z]{3}$/);
      if (product.priceMax != null) assert.ok(product.priceMax >= product.price);
    }
    assert.ok(product.priceNote.ro && product.priceNote.en, `Missing price basis: ${product.id}`);
  }
});
