import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createContactSender } from '../../src/lib/contact-sender.ts';
test('contact retry reuses its key after a lost acknowledgement', async () => {
  const keys = [];
  const sender = createContactSender('/api/contact', async (_url, options) => {
    keys.push(JSON.parse(options.body).idempotencyKey);
    if (keys.length === 1) throw new Error('Lost response');
    return new Response('{}', { status: 200 });
  });
  const body = { name: 'Customer', message: 'Request' };
  await assert.rejects(sender(body));
  await sender(body);
  assert.equal(keys[0], keys[1]);
  await sender(body);
  assert.notEqual(keys[1], keys[2]);
});
