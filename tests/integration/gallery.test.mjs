import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db, origin, api, fixtureSupplier, login, cleanupUsers } from './helpers.mjs';

test('deleting a gallery image removes both the record and its stored object', async t => {
  const supplier = await fixtureSupplier();
  const cookie = await login(supplier);
  let storagePath;
  t.after(async () => {
    if (storagePath) await db.storage.from('supplier-assets').remove([storagePath]);
    await cleanupUsers([supplier]);
  });
  const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
  const form = new FormData(); form.append('file', new Blob([bytes], { type: 'image/png' }), 'audit.png');
  const upload = await fetch(`${origin}/api/supplier/gallery`, { method: 'POST', headers: { cookie }, body: form });
  assert.equal(upload.status, 201);
  const { image } = await upload.json();
  storagePath = decodeURIComponent(new URL(image.image_url).pathname.split('/supplier-assets/')[1]);
  assert.equal((await api(`/api/supplier/gallery?id=${image.id}`, { method: 'DELETE', cookie })).status, 200);
  const stored = await db.storage.from('supplier-assets').download(storagePath);
  assert.ok(stored.error, 'deleted gallery object must not remain downloadable');
});
