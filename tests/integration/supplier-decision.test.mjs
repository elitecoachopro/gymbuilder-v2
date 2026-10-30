import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, db, fixtureSupplier, fixtureUser, cleanupUsers, signedCookie } from './helpers.mjs';

test('admin decisions persist while reporting unavailable email honestly in both languages', async t => {
  assert.equal(Boolean(process.env.RESEND_API_KEY), false, 'This fixture must not send external email');
  const admin = await fixtureUser('admin'); t.after(() => cleanupUsers([admin]));
  const supplier = await fixtureSupplier('pending'); t.after(() => cleanupUsers([supplier]));
  const session = signedCookie({ userId: admin.id, version: 0, exp: Date.now() + 300000 });
  for (const [action,locale,expectedStatus] of [['approve','ro','approved'],['reject','en','rejected']]) {
    const response = await api('/api/admin/suppliers', { cookie: `${session}; locale=${locale}`, method: 'PATCH', body: { supplierId: supplier.supplierId, action, reason: 'Synthetic test' } });
    const result = await response.json();
    assert.equal(response.status,200,JSON.stringify(result)); assert.equal(result.success,true); assert.equal(result.emailSent,false);
    assert.ok(result.message.includes(locale === 'ro' ? 'nu a putut fi trimisă' : 'could not be sent'));
    assert.ok(!result.message.includes('Email trimis.'));
    const { data, error } = await db.from('supplier_profiles').select('status').eq('id',supplier.supplierId).single();
    assert.equal(error,null); assert.equal(data.status,expectedStatus);
  }
});
