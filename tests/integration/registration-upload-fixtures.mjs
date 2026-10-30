import assert from 'node:assert/strict';
import { origin } from './helpers.mjs';
export async function registrationUploads(t, count = 3) {
  const { api, db } = await import('./helpers.mjs');
  const response = await api('/api/upload/registration/session', { body: {} });
  assert.equal(response.status, 201);
  const cookie = response.headers.get('set-cookie').split(';')[0];
  const paths = [];
  t.after(async () => {
    if (paths.length) {
      await db.storage.from('registration-verifications').remove(paths);
      await db.from('registration_upload_sessions').delete().eq('id', paths[0].split('/')[0]);
    }
  });
  for (let i = 0; i < count; i++) {
    const form = new FormData();
    form.append('file', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'audit.png');
    const upload = await fetch(`${origin}/api/upload/registration`, { method: 'POST', headers: { cookie }, body: form });
    assert.equal(upload.status, 200);
    paths.push((await upload.json()).path);
  }
  return { cookie, paths };
}

