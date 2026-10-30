import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, db, fixtureUser, login, cleanupUsers } from './helpers.mjs';

test('deletion requests reject invalid reason objects instead of claiming success', async t => {
  const user = await fixtureUser(); t.after(() => cleanupUsers([user]));
  const response = await api('/api/account/delete-request', { cookie: await login(user), body: { reason: { invalid: true } } });
  assert.equal(response.status, 400);
});

test('deletion request records the actual authenticated identity', async t => {
  const user = await fixtureUser(); t.after(() => cleanupUsers([user]));
  const response = await api('/api/account/delete-request', { cookie: await login(user), body: { reason: 'Audit request only' } });
  assert.equal(response.status, 200);
  const { data } = await db.from('account_deletion_requests').select('user_email,user_role').eq('user_id', user.id).single();
  assert.equal(data.user_email, user.email);
  assert.equal(data.user_role, 'client');
});
