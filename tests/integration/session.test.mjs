import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { fixtureUser, login, signedCookie, cleanupUsers, origin } from './helpers.mjs';

let admin, client, adminCookie, clientCookie;
before(async () => {
  admin = await fixtureUser('admin');
  client = await fixtureUser();
  adminCookie = await login(admin);
  clientCookie = await login(client);
});
after(async () => { if (admin && client) await cleanupUsers([admin, client]); });

test('admin review moderation rejects an unsigned role claim', async () => {
  const token = Buffer.from(JSON.stringify({ userId: admin.id, role: 'admin', exp: Date.now() + 60000 })).toString('base64');
  const response = await fetch(`${origin}/api/admin/reviews`, { headers: { cookie: `session_token=${token}.forged` } });
  assert.equal(response.status, 403);
});

test('a legitimate admin login can list reviews', async () => {
  const response = await fetch(`${origin}/api/admin/reviews`, { headers: { cookie: adminCookie } });
  assert.equal(response.status, 200);
});

test('admin moderation rejects expired signed cookies', async () => {
  const cookie = signedCookie({ userId: admin.id, role: 'admin', exp: Date.now() - 1000 });
  const response = await fetch(`${origin}/api/admin/reviews`, { headers: { cookie } });
  assert.equal(response.status, 403);
});

test('budget API recognizes the session created by login', async () => {
  const response = await fetch(`${origin}/api/budget-estimates`, { headers: { cookie: clientCookie } });
  assert.notEqual(response.status, 401, 'valid session must pass authentication even while schema fixes are pending');
});

test('protected data rejects a deleted account even with unexpired cookie', async () => {
  const user = await fixtureUser();
  const cookie = await login(user);
  await cleanupUsers([user]);
  const response = await fetch(`${origin}/api/notifications`, { headers: { cookie } });
  assert.equal(response.status, 401);
});

test('privileged schema migration is not exposed as an HTTP endpoint', async () => {
  const response = await fetch(`${origin}/api/admin/migrate-contact-messages`, { method: 'POST' });
  assert.equal(response.status, 404);
});
