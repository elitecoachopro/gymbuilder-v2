import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sendSupplierEmail } from '../../src/lib/supplier-decision.ts';
import { sendVerificationEmail, sendPasswordResetEmail, sendSupplierWelcomeEmail } from '../../src/lib/email.ts';

function captureEmailRequests(t) {
  const original=globalThis.fetch;
  const messages=[];
  t.after(()=>{globalThis.fetch=original;});
  globalThis.fetch=async (_url,options)=>{messages.push(JSON.parse(options.body));return Response.json({id:'fixture-message'});};
  return messages;
}

test('supplier decisions use a monitored sender address', async t => {
  const messages=captureEmailRequests(t);
  assert.equal(await sendSupplierEmail('fixture@example.test','Approval','<p>Approved</p>','fixture-key'),true);
  assert.equal(messages.length,1);
  assert.equal(messages[0].from,'Gym Builder <contact@gymbuilder.app>');
  assert.deepEqual(messages[0].to,['fixture@example.test']);
});

test('verification, password reset and supplier welcome keep the monitored sender and their intended links', async t => {
  const messages=captureEmailRequests(t);
  const previous=process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY='re_test_fixture';
  t.after(()=>{if(previous===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=previous;});
  await sendVerificationEmail('fixture@example.test','fixture-token','Fixture');
  await sendPasswordResetEmail('fixture@example.test','fixture-token','Fixture');
  await sendSupplierWelcomeEmail('fixture@example.test','Fixture','Test Supplier');
  assert.equal(messages.length,3);
  for(const message of messages) assert.equal(message.from,'Gym Builder <contact@gymbuilder.app>');
  assert.ok(messages[0].html.includes('/api/auth/verify-email?token=fixture-token'));
  assert.ok(messages[1].html.includes('/reset-password?token=fixture-token'));
});
