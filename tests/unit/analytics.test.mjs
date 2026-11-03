import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyticsPath, analyticsDays } from '../../src/lib/analytics.ts';

test('analytics only accepts canonical public paths without private query strings', () => {
  assert.equal(analyticsPath('/'), '/');
  assert.equal(analyticsPath('/configurator/studio'), '/configurator/studio');
  assert.equal(analyticsPath('/products/12345678-1234-4234-8234-123456789abc'), '/products/12345678-1234-4234-8234-123456789abc');
  for (const path of ['/admin', '/client/dashboard', '/supplier/dashboard', '/reset-password?token=secret', '/products?search=email@example.com', '//evil.test', '/missing', '/products/not-an-id', '/api/health']) assert.equal(analyticsPath(path), null);
});

test('analytics reporting periods are bounded and default to 30 days', () => {
  assert.equal(analyticsDays(null), 30);
  for (const days of ['7', '30', '90']) assert.equal(analyticsDays(days), Number(days));
  for (const days of ['0', '9999999', '7.5', '', 'foo']) assert.equal(analyticsDays(days), null);
});
