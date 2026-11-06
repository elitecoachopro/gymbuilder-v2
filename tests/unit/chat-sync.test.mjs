import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeChatMessages } from '../../src/lib/chat-sync.ts';

const message = (id, second) => ({ id, sender_type: 'client', sender_name: 'Test', content: id, created_at: `2026-11-05T12:00:0${second}.000Z` });
test('an older poll cannot erase a successful send and the next poll cannot duplicate it', () => {
  const first = message('first', 1), sent = message('sent', 3), received = message('received', 2);
  const afterSend = mergeChatMessages([first], [sent]);
  assert.deepEqual(mergeChatMessages(afterSend, [first]), [first, sent]);
  assert.deepEqual(mergeChatMessages(afterSend, [sent, first, received]), [first, received, sent]);
});
