import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyticsTarget, parseViewInput, analyticsPeriod } from '../../src/lib/analytics/input.ts';

test('tracking only accepts public paths and never captures queries or private identifiers', () => {
  assert.deepEqual(analyticsTarget('/products/4c32890b-3f45-4ff9-a00f-52d17bc20524'), { path: '/products/4c32890b-3f45-4ff9-a00f-52d17bc20524', kind: 'product', targetId: '4c32890b-3f45-4ff9-a00f-52d17bc20524' });
  assert.equal(analyticsTarget('/admin'), null);
  assert.equal(analyticsTarget('/login?email=private@example.com'), null);
  assert.equal(analyticsTarget('/products?email=private@example.com'), null);
  assert.equal(analyticsTarget('/supplier/dashboard'), null);
  assert.equal(analyticsTarget('/products/not-a-uuid'), null);
  assert.deepEqual(analyticsTarget('/'), { path: '/', kind: 'application', targetId: null });
});

test('recording requires consent and UUID event and session identifiers', () => {
  const input = { path: '/products', eventId: '9db43d7f-0c18-451e-8e6a-262ff7ff1170', sessionId: '6b110275-0e5d-40db-943b-73084dd9872c', consent: true };
  assert.equal(parseViewInput(input)?.path, '/products');
  assert.equal(parseViewInput({ ...input, consent: false }), null);
  assert.equal(parseViewInput({ ...input, sessionId: 'email@example.com' }), null);
  assert.equal(parseViewInput({ ...input, eventId: null }), null);
  assert.equal(parseViewInput(null), null);
});

test('statistics periods are explicitly bounded', () => {
  assert.equal(analyticsPeriod(null), 30);
  for (const period of ['7', '30', '90']) assert.equal(analyticsPeriod(period), Number(period));
  for (const period of ['0', '365', '-1', '7;delete']) assert.equal(analyticsPeriod(period), null);
});
