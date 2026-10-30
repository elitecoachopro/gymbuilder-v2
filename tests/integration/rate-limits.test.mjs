import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { db } from './helpers.mjs';
test('quota is shared and atomic under concurrent requests', async t => {
  const hash = createHash('sha256').update(randomUUID()).digest('hex');
  t.after(() => db.from('request_rate_limits').delete().eq('key_hash',hash));
  const results = await Promise.all(Array.from({ length: 8 }, () => db.rpc('consume_request_quota', { p_key_hash: hash, p_limit: 3, p_window_ms: 60000 })));
  assert.ok(results.every(result => !result.error));
  assert.equal(results.filter(result => result.data.allowed).length, 3);
});
