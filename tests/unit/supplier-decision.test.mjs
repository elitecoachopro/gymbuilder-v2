import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sendSupplierEmail, supplierDecisionResult } from '../../src/lib/supplier-decision.ts';
import { translateUi } from '../../src/i18n/translate.ts';

test('supplier decisions report notification acceptance truthfully in Romanian and English', () => {
  for (const action of ['approve','reject']) for (const emailSent of [false,true]) {
    const result = supplierDecisionResult('Test Gym', action, emailSent);
    assert.equal(result.success, true); assert.equal(result.emailSent, emailSent);
    assert.ok(result.message.includes(action === 'approve' ? 'aprobat' : 'respins'));
    assert.ok(result.message.includes(emailSent ? 'acceptată pentru trimitere' : 'nu a putut fi trimisă'));
    const english = translateUi(result.message,'en',{});
    assert.ok(english.includes(action === 'approve' ? 'approved' : 'rejected'));
    assert.ok(english.includes(emailSent ? 'accepted for sending' : 'could not be sent'));
    assert.ok(english.includes('Test Gym'));
  }
});
test('missing configuration, provider failure and network failure never report email acceptance', async t => {
  const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; });
  let requestsWithoutKey = 0;
  globalThis.fetch = async () => { requestsWithoutKey++; throw Error('must not fetch without key'); };
  assert.equal(await sendSupplierEmail('fixture@example.test','Approval','<p>Test</p>',undefined),false);
  assert.equal(requestsWithoutKey,0);
  globalThis.fetch = async () => new Response('{}',{status:422});
  assert.equal(await sendSupplierEmail('fixture@example.test','Approval','<p>Test</p>','fixture-key'),false);
  globalThis.fetch = async () => { throw new TypeError('network unavailable'); };
  assert.equal(await sendSupplierEmail('fixture@example.test','Approval','<p>Test</p>','fixture-key'),false);
  globalThis.fetch = async (url, options) => { assert.equal(url,'https://api.resend.com/emails'); assert.equal(JSON.parse(options.body).to[0],'fixture@example.test'); return new Response('{"id":"fixture-message"}',{status:200}); };
  assert.equal(await sendSupplierEmail('fixture@example.test','Approval','<p>Test</p>','fixture-key'),true);
});
