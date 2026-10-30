import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { db, origin, fixtureUser, cleanupUsers, password, api } from './helpers.mjs';

test('expired email verification links cannot activate accounts', async t => {
  const user = await fixtureUser();
  t.after(() => cleanupUsers([user]));
  const token = randomBytes(32).toString('hex');
  await db.from('users').update({ email_verified: false, verification_token: token, verification_token_expires_at: new Date(Date.now() - 60000).toISOString() }).eq('id', user.id);
  await fetch(`${origin}/api/auth/verify-email?token=${token}`, { redirect: 'manual' });
  const { data } = await db.from('users').select('email_verified').eq('id', user.id).single();
  assert.equal(data.email_verified, false);
});

test('registration records expiring verification and reports unavailable email truthfully', async t => {
  const email = `audit-${randomUUID()}@example.test`;
  t.after(async () => { await db.from('users').delete().eq('email', email); });
  const response = await api('/api/auth/register/client', { body: { email, password, firstName: 'Audit', lastName: 'Client' } });
  assert.equal(response.status, 200);
  const result = await response.json();
  if (!process.env.RESEND_API_KEY) assert.equal(result.emailSent, false);
  const { data } = await db.from('users').select('verification_token_expires_at').eq('email', email).single();
  assert.ok(new Date(data.verification_token_expires_at).getTime() > Date.now());
});

test('verification email can be requested again with explicit delivery configuration status', async () => {
  const response = await api('/api/auth/resend-verification', { body: { email: `audit-absent-${randomUUID()}@example.test` } });
  assert.equal(response.status, process.env.RESEND_API_KEY ? 200 : 503);
});
