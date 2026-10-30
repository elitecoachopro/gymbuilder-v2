import test from 'node:test';
import assert from 'node:assert/strict';
import { safeReturnPath, loginHref, requestedPlan } from '../../src/lib/journeys.ts';

test('authentication returns to the exact internal project, never to an external URL', () => {
  assert.equal(safeReturnPath('/configurator?id=project-1'), '/configurator?id=project-1');
  assert.equal(safeReturnPath('/supplier/dashboard#promotions'), '/supplier/dashboard#promotions');
  for (const url of ['https://evil.test', '//evil.test', '/\\evil.test', '/api/auth/logout', '/login', '/configurator\n']) assert.equal(safeReturnPath(url), null);
  assert.equal(loginHref('/configurator?id=one'), '/login?redirect=%2Fconfigurator%3Fid%3Done');
});
test('a selected plan is an explicit supported request, never an activated entitlement', () => {
  assert.equal(requestedPlan('starter'), 'starter');
  assert.equal(requestedPlan('professional'), 'professional');
  assert.equal(requestedPlan('enterprise'), 'enterprise');
  assert.equal(requestedPlan('custom'), 'free');
  assert.equal(requestedPlan(null), 'free');
});

test('explicit login handoff preserves guest work but never transfers a different account project', async () => {
  const { canResumeDraft } = await import('../../src/lib/journeys.ts');
  assert.equal(canResumeDraft('guest', 'client-a', 'once', 'once'), true);
  assert.equal(canResumeDraft('client-a', 'client-a', 'once', 'once'), true);
  assert.equal(canResumeDraft('client-a', 'client-b', 'once', 'once'), false);
  assert.equal(canResumeDraft('guest', null, 'once', 'once'), false);
  assert.equal(canResumeDraft('guest', 'client-a', 'once', 'other'), false);
});
