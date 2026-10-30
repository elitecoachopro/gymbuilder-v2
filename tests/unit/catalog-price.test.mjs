import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatCatalogPrice } from '../../src/lib/catalog-price.ts';

test('unknown catalog prices are described as on request, never as free equipment', () => {
  assert.equal(formatCatalogPrice(null, 'ro'), 'Preț la cerere');
  assert.equal(formatCatalogPrice(undefined, 'en'), 'Price on request');
  assert.match(formatCatalogPrice(1250, 'en'), /1,250/);
  assert.match(formatCatalogPrice(1250, 'ro'), /1\.250/);
});

test('seller prices retain their published currency without pretending they are euros', () => {
  const published = { listed_price_amount: 800, listed_price_currency: 'SGD' };
  assert.match(formatCatalogPrice(null, 'en', published), /800/);
  assert.match(formatCatalogPrice(null, 'en', published), /SGD/);
  assert.doesNotMatch(formatCatalogPrice(null, 'en', published), /€/);
  assert.match(formatCatalogPrice(2650, 'ro', { listed_price_amount: 2650, listed_price_currency: 'EUR' }), /2\.650/);
});
