import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { api, db } from './helpers.mjs';
import { unsubscribeToken } from '../../src/lib/newsletter-token.ts';
test('unsubscribe requires a signature bound to the email', async t => {
  const email = `audit-${randomUUID()}@example.test`;
  assert.ifError((await db.from('newsletter_subscribers').insert({ email })).error);
  t.after(() => db.from('newsletter_subscribers').delete().eq('email', email));
  assert.equal((await api('/api/newsletter/unsubscribe', { body: { email } })).status, 403);
  assert.equal((await api('/api/newsletter/unsubscribe', { body: { email, token: unsubscribeToken('someone-else@example.test') } })).status, 403);
  assert.equal((await api('/api/newsletter/unsubscribe', { body: { email, token: unsubscribeToken(email) } })).status, 200);
  const { data } = await db.from('newsletter_subscribers').select('status').eq('email', email).single(); assert.equal(data.status, 'unsubscribed');
});

test('newsletter subscriber reads include records beyond the REST row limit', async t => {
  const { loadNewsletterSubscribers } = await import('../../src/lib/newsletter-server.ts');
  const tag = randomUUID();
  const rows = Array.from({ length: 1001 }, (_, i) => ({ email: `audit-${tag}-${i}@example.test` }));
  t.after(() => db.from('newsletter_subscribers').delete().like('email', `audit-${tag}-%`));
  assert.ifError((await db.from('newsletter_subscribers').insert(rows)).error);
  const result = await loadNewsletterSubscribers(db);
  assert.ifError(result.error); assert.equal(result.data.filter(row => row.email.startsWith(`audit-${tag}-`)).length,1001);
});
