import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db } from './helpers.mjs';

for (const table of ['messages', 'notifications', 'newsletter_subscribers', 'product_views', 'product_variants', 'supplier_gallery', 'budget_estimates', 'account_deletion_requests']) {
  test(`database supports ${table} API persistence`, async () => {
    const { error } = await db.from(table).select('id').limit(0);
    assert.equal(error, null, error?.message);
  });
}

test('supplier registration verification photos exist in schema', async () => {
  const { error } = await db.from('supplier_profiles').select('verification_photos').limit(0);
  assert.equal(error, null, error?.message);
});

test('supplier request read markers match schema', async () => {
  const { error } = await db.from('contact_requests').select('viewed_at').eq('status', 'viewed').limit(0);
  assert.equal(error, null, error?.message);
});

test('supplier gallery storage bucket is provisioned', async () => {
  const { data, error } = await db.storage.getBucket('supplier-assets');
  assert.equal(error, null, error?.message);
  assert.equal(data.public, true);
});
