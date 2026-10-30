import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixtureSupplier, fixtureProduct, cleanupUsers, api, db } from './helpers.mjs';

const enquiry = supplierId => ({ supplierId, name: 'Audit Customer', email: 'customer@example.test', message: 'Equipment quotation request' });

test('enquiries cannot reference a product from another supplier', async t => {
  const first = await fixtureSupplier(), second = await fixtureSupplier();
  t.after(() => cleanupUsers([first, second]));
  const product = await fixtureProduct(second.supplierId);
  const response = await api('/api/contact/supplier', { body: { ...enquiry(first.supplierId), productId: product.id } });
  assert.equal(response.status, 400);
});

test('enquiries cannot target unapproved suppliers', async t => {
  const supplier = await fixtureSupplier('pending');
  t.after(() => cleanupUsers([supplier]));
  const response = await api('/api/contact/supplier', { body: enquiry(supplier.supplierId) });
  assert.equal(response.status, 404);
});

test('invalid product IDs never produce a successful enquiry response', async t => {
  const supplier = await fixtureSupplier();
  t.after(() => cleanupUsers([supplier]));
  const response = await api('/api/contact/supplier', { body: { ...enquiry(supplier.supplierId), productId: 'not-a-product' } });
  assert.equal(response.status, 400);
});

test('successful enquiry response corresponds to a durable database record', async t => {
  const supplier = await fixtureSupplier();
  t.after(() => cleanupUsers([supplier]));
  const response = await api('/api/contact/supplier', { body: enquiry(supplier.supplierId) });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.ok(result.requestId);
  const { data } = await db.from('contact_requests').select('message').eq('id', result.requestId).single();
  assert.equal(data?.message, enquiry(supplier.supplierId).message);
});

test('general contact persists without email delivery and retries do not duplicate', async t => {
  const email = `audit-${crypto.randomUUID()}@example.test`;
  t.after(() => db.from('contact_messages').delete().eq('email', email));
  const body = { name: 'Audit Customer', email, subject: 'Local regression', message: 'Persist before sending optional mail', idempotencyKey: crypto.randomUUID() };
  const first = await api('/api/contact', { body });
  assert.equal(first.status, 200);
  const saved = await first.json();
  assert.ok(saved.requestId);
  const second = await api('/api/contact', { body });
  assert.equal(second.status, 200);
  assert.equal((await second.json()).requestId, saved.requestId);
  const { count, error } = await db.from('contact_messages').select('id', { count: 'exact', head: true }).eq('email', email);
  assert.ifError(error); assert.equal(count, 1);
});
