import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, fixtureUser, fixtureSupplier, fixtureProduct, cleanupUsers, login } from './helpers.mjs';

test('product editing rejects negative prices before writing', async t => {
  const supplier = await fixtureSupplier(); t.after(() => cleanupUsers([supplier]));
  const product = await fixtureProduct(supplier.supplierId);
  const response = await api('/api/supplier/products', { method: 'PATCH', cookie: await login(supplier), body: { productId: product.id, price_eur: -10 } });
  assert.equal(response.status, 400);
});

test('variant zero override is retained and negative override is rejected', async t => {
  const supplier = await fixtureSupplier(); t.after(() => cleanupUsers([supplier]));
  const product = await fixtureProduct(supplier.supplierId), cookie = await login(supplier);
  const response = await api('/api/supplier/products/variants', { cookie, body: { product_id: product.id, label: 'No additional cost', price_override: 0 } });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).variant.price_override, 0);
  const invalid = await api('/api/supplier/products/variants', { cookie, body: { product_id: product.id, label: 'Invalid', price_override: -10 } });
  assert.equal(invalid.status, 400);
});

test('gym projects reject negative dimensions with a validation error', async t => {
  const user = await fixtureUser(); t.after(() => cleanupUsers([user]));
  const response = await api('/api/gym-projects', { cookie: await login(user), body: { name: 'Invalid', variant: 'from_scratch', total_area: -10, length_m: -5, width_m: 2, zones: [] } });
  assert.equal(response.status, 400);
});

test('budget estimate rejects inconsistent totals as invalid input', async t => {
  const user = await fixtureUser(); t.after(() => cleanupUsers([user]));
  const response = await api('/api/budget-estimates', { cookie: await login(user), body: { area: 100, gymType: 'commercial', selectedZones: ['cardio'], totalMin: 200, totalMax: 100, breakdown: [] } });
  assert.equal(response.status, 400);
});

test('projects reject inconsistent geometry and can be reopened only by their owner', async t => {
  const user = await fixtureUser(), other = await fixtureUser(); t.after(() => cleanupUsers([user, other]));
  const cookie = await login(user);
  const project = { name: 'Saved room', variant: 'from_scratch', total_area: 100, length_m: 10, width_m: 10, zones: [{ id: 'zone', name: 'Zone', color: '#000', x: 0, y: 0, w: 100, h: 100, area_m2: 100 }] };
  assert.equal((await api('/api/gym-projects', { cookie, body: { ...project, total_area: 200 } })).status, 400);
  assert.equal((await api('/api/gym-projects', { cookie, body: { ...project, zones: [{ ...project.zones[0], area_m2: 50 }] } })).status, 400);
  const response = await api('/api/gym-projects', { cookie, body: project }); assert.equal(response.status, 201);
  const saved = (await response.json()).project;
  const reopened = await (await api('/api/gym-projects', { cookie, method: 'GET' })).json(); assert.ok(reopened.projects.some(row => row.id === saved.id));
  const foreign = await (await api('/api/gym-projects', { cookie: await login(other), method: 'GET' })).json(); assert.equal(foreign.projects.some(row => row.id === saved.id), false);
});

test('invalid product image data cannot be silently dropped during publication', async t => {
  const supplier=await fixtureSupplier();t.after(()=>cleanupUsers([supplier]));
  const response=await api('/api/supplier/products',{cookie:await login(supplier),body:{name:'Invalid image',category:'strength',brand:'Audit',condition:'new',price_eur:100,images:['data:image/png;base64,not-an-image']}});
  assert.equal(response.status,400);
});
