import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db, api, fixtureSupplier, fixtureProduct, cleanupUsers } from './helpers.mjs';

const hour = 3600000;
function promotion(supplier, product, type, starts, hours, extras = {}) {
  return { supplier_id: supplier.supplierId, product_id: product.id, title: 'Audit promotion', price_eur: 250, type,
    status: 'active', starts_at: new Date(starts).toISOString(), ends_at: new Date(starts + hours * hour).toISOString(), ...extras };
}

test('paid promotions enforce exactly 24 hours, 7 days or 12 hours for Super price', async t => {
  const supplier = await fixtureSupplier(); t.after(() => cleanupUsers([supplier]));
  const product = await fixtureProduct(supplier.supplierId);
  for (const [type, duration] of [['oferta_zilei', 25], ['anunturile_zilei', 24], ['super_pret', 24]]) {
    const { error } = await db.from('promotions').insert(promotion(supplier, product, type, Date.now(), duration));
    assert.equal(error?.code, '23514', 'Wrong paid duration must be rejected');
  }
  const { error } = await db.from('promotions').insert(promotion(supplier, product, 'anunturile_zilei', Date.now(), 168));
  assert.ifError(error);
});

test('Super price publishes new and used products for 12 hours separately from weekly offers', async t => {
  const supplier = await fixtureSupplier(); t.after(() => cleanupUsers([supplier]));
  const products = await Promise.all(['new','used'].map(condition => fixtureProduct(supplier.supplierId, { condition })));
  const start = Date.now() - hour;
  const { error } = await db.from('promotions').insert([
    ...products.map(p => promotion(supplier,p,'super_pret',start,12)),
    promotion(supplier,products[0],'super_pret',Date.now()-13*hour,12,{title:'Expired Super price'}),
    promotion(supplier,products[0],'super_pret',Date.now()+hour,12,{title:'Future Super price'}),
    promotion(supplier,products[0],'super_pret',start,12,{status:'pending',title:'Unpaid Super price'}),
  ]);
  assert.ifError(error);
  const response = await api('/api/promotions'); assert.equal(response.status,200);
  const body = await response.json();
  const mine = body.superPret.filter(p => p.supplier_id === supplier.supplierId);
  assert.equal(mine.length,2);
  assert.deepEqual(mine.map(p=>p.product.condition).sort(),['new','used']);
  assert.ok(mine.every(p=>Date.parse(p.ends_at)-Date.parse(p.starts_at)===12*hour));
  assert.ok(!body.oferteleSaptamanii.some(p=>p.supplier_id===supplier.supplierId));
  assert.ok(!JSON.stringify(body).includes('Unpaid Super price'));
  const noProduct = await db.from('promotions').insert(promotion(supplier,products[0],'super_pret',start,12,{product_id:null}));
  assert.equal(noProduct.error?.code,'23514');
});

test('only one daily promotion can reserve an overlapping time, including concurrent reservations', async t => {
  const supplier = await fixtureSupplier(); t.after(() => cleanupUsers([supplier]));
  const product = await fixtureProduct(supplier.supplierId);
  const starts = Date.now() + 365 * 24 * hour;
  const attempts = await Promise.all([0, 1].map(() => db.from('promotions').insert(promotion(supplier, product, 'oferta_zilei', starts, 24, { status: 'pending' }))));
  assert.equal(attempts.filter(result => !result.error).length, 1);
  // Concurrent exclusion checks may reject the loser as a deadlock victim.
  assert.ok(['23P01', '40P01'].includes(attempts.find(result => result.error)?.error.code));
  const adjacent = await db.from('promotions').insert(promotion(supplier, product, 'oferta_zilei', starts + 24 * hour, 24));
  assert.ifError(adjacent.error, 'The next daily slot starts exactly when the first expires');
});

test('Super price preserves price on request without inventing a zero equipment price', async t => {
  const supplier = await fixtureSupplier(); t.after(() => cleanupUsers([supplier]));
  const product = await fixtureProduct(supplier.supplierId, { price_eur: null, source_url: `https://example.test/equipment/${supplier.id}` });
  const { data, error } = await db.from('promotions').insert(promotion(supplier, product, 'super_pret', Date.now()-hour, 12, { price_eur: null })).select('id').single();
  assert.ifError(error);
  const response = await api('/api/promotions'); assert.equal(response.status, 200);
  const body = await response.json();
  const offer = body.superPret.find(p => p.id === data.id);
  assert.ok(offer, 'A catalog product priced on request can be promoted');
  assert.equal(offer.price_eur, null);
});

test('public weekly offers include all active placements, product links and supplier information', async t => {
  const supplier = await fixtureSupplier(); t.after(() => cleanupUsers([supplier]));
  const product = await fixtureProduct(supplier.supplierId);
  const starts = Date.now() - hour;
  const { error } = await db.from('promotions').insert(Array.from({length:7}, (_, index) => promotion(supplier, product, 'anunturile_zilei', starts, 168, {title:`Weekly audit ${index}`})));
  assert.ifError(error);
  const expired = await db.from('promotions').insert(promotion(supplier, product, 'anunturile_zilei', Date.now() - 169 * hour, 168, { title: 'Expired audit' }));
  assert.ifError(expired.error);
  const scheduled = await db.from('promotions').insert(promotion(supplier, product, 'anunturile_zilei', Date.now() + hour, 168, { title: 'Future audit' }));
  assert.ifError(scheduled.error);
  const response = await api('/api/promotions'); assert.equal(response.status, 200);
  const body = await response.json();
  const mine = body.oferteleSaptamanii.filter(offer => offer.supplier_id === supplier.supplierId);
  assert.equal(mine.length, 7, 'The carousel must not silently discard paid offers after five');
  assert.equal(mine[0].product.id, product.id);
  assert.equal(mine[0].supplier.company_name, 'Audit Supplier');
  assert.ok(mine.every(offer => !['Expired audit','Future audit'].includes(offer.title)));
});

test('a pending daily reservation occupies the slot without publishing its private announcement', async t => {
  const supplier = await fixtureSupplier(); t.after(() => cleanupUsers([supplier]));
  const product = await fixtureProduct(supplier.supplierId);
  const { error } = await db.from('promotions').insert(promotion(supplier, product, 'oferta_zilei', Date.now() - hour, 24, { status: 'pending', title: 'Private unpaid reservation' }));
  assert.ifError(error);
  const response = await api('/api/promotions'); assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ofertaZilei, null);
  assert.deepEqual(body.slots.ofertaZilei, { total: 1, occupied: 1, available: 0 });
  assert.ok(!JSON.stringify(body).includes('Private unpaid reservation'));
});

test('weekly placements beyond the first database page are included once each', async t => {
  const supplier = await fixtureSupplier(); t.after(() => cleanupUsers([supplier]));
  const product = await fixtureProduct(supplier.supplierId);
  const starts = Date.now() - hour;
  const { error } = await db.from('promotions').insert(Array.from({ length: 501 }, (_, index) => promotion(supplier, product, 'anunturile_zilei', starts, 168, { title: `Paged weekly ${index}` })));
  assert.ifError(error);
  const response = await api('/api/promotions'); assert.equal(response.status, 200);
  const body = await response.json();
  const mine = body.oferteleSaptamanii.filter(offer => offer.supplier_id === supplier.supplierId);
  assert.equal(mine.length, 501);
  assert.equal(new Set(mine.map(offer => offer.id)).size, 501);
});
