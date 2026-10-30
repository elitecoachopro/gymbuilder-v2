import { registrationUploads } from './registration-upload-fixtures.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { origin } from './helpers.mjs';

test('arbitrary client-generated strings cannot authorize anonymous storage uploads', async () => {
  const form = new FormData();
  const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
  form.append('file', new Blob([bytes], { type: 'image/png' }), 'audit.png');
  form.append('token', 'arbitrary-untrusted-client-token');
  const response = await fetch(`${origin}/api/upload/registration`, { method: 'POST', body: form });
  // Baseline created a public file, so capture its path only for fixture cleanup.
  if (response.ok) {
    const { db } = await import('./helpers.mjs'); const data = await response.json();
    if (data.path) await db.storage.from('uploads').remove([data.path]);
  }
  assert.equal(response.status, 401);
});

test('registration images stay private and a session cannot upload more than ten', async t => {
  const { db } = await import('./helpers.mjs');
  const { cookie, paths } = await registrationUploads(t, 10);
  const { data: bucket } = await db.storage.getBucket('registration-verifications');
  assert.equal(bucket.public, false);
  const form = new FormData();
  form.append('file', new Blob([Buffer.from('89504e470d0a1a0a', 'hex')], { type: 'image/png' }), 'audit.png');
  const response = await fetch(`${origin}/api/upload/registration`, { method: 'POST', headers: { cookie }, body: form });
  assert.equal(response.status, 429);
  const { data } = db.storage.from('registration-verifications').getPublicUrl(paths[0]);
  assert.equal((await fetch(data.publicUrl)).ok, false);
});

test('registration previews recover only the current unexpired browser session', async t => {
  const { api, db } = await import('./helpers.mjs');
  const first = await registrationUploads(t, 2);
  const second = await registrationUploads(t, 1);
  assert.deepEqual((await (await api('/api/upload/registration/session')).json()).photos, []);
  const response = await api('/api/upload/registration/session', { cookie: first.cookie });
  assert.match(response.headers.get('cache-control'), /private.*no-store/);
  const { photos } = await response.json();
  assert.deepEqual(photos.map(photo => photo.path).sort(), [...first.paths].sort());
  assert.ok(photos.every(photo => photo.url.includes('/object/sign/registration-verifications/')));
  const other = await (await api('/api/upload/registration/session', { cookie: second.cookie })).json();
  assert.deepEqual(other.photos.map(photo => photo.path), second.paths);
  const { error } = await db.from('registration_upload_sessions').update({ expires_at: new Date(Date.now() - 60000).toISOString() }).eq('id', first.paths[0].split('/')[0]);
  assert.ifError(error);
  assert.deepEqual((await (await api('/api/upload/registration/session', { cookie: first.cookie })).json()).photos, []);
});
