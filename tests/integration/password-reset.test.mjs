import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { db, origin, fixtureUser, cleanupUsers, login } from './helpers.mjs';

async function resetFixture(t, expiry = new Date(Date.now() + 60000).toISOString()) {
  const user = await fixtureUser();
  t.after(() => cleanupUsers([user]));
  const token = randomBytes(32).toString('hex');
  await db.from('users').update({ reset_token: token, reset_token_expires_at: expiry }).eq('id', user.id);
  return { user, token };
}
const reset = (token, password) => fetch(`${origin}/api/auth/reset-password`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, password }),
});

test('reset cannot create a password that login rejects as too long', async t => {
  const { token } = await resetFixture(t);
  assert.equal((await reset(token, `A1${'a'.repeat(127)}`)).status, 400);
});

test('password reset invalidates existing sessions', async t => {
  const { user, token } = await resetFixture(t);
  const cookie = await login(user);
  assert.equal((await reset(token, 'ChangedAudit123!')).status, 200);
  const response = await fetch(`${origin}/api/auth/me`, { headers: { cookie } });
  assert.equal((await response.json()).user, null);
});

test('reset tokens without an expiry are rejected', async t => {
  const { token } = await resetFixture(t, null);
  assert.equal((await reset(token, 'ChangedAudit123!')).status, 400);
});

test('only one concurrent request can consume a reset token', async t => {
  const { token } = await resetFixture(t);
  const responses = await Promise.all([reset(token, 'ChangedAudit123!'), reset(token, 'OtherAudit123!')]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 400]);
});
