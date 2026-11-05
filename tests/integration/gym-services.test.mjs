import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { db, api, origin, password, fixtureUser, fixtureSupplier, login, cleanupUsers } from './helpers.mjs';
import { registrationUploads } from './registration-upload-fixtures.mjs';

const service = { businessType: 'service', serviceCategories: ['repairs', 'preventive'], serviceAreas: 'București, Ilfov', serviceBrands: 'Life Fitness' };

test('database defaults preserve equipment suppliers and reject incomplete service profiles', async t => {
  const user = await fixtureSupplier(); t.after(() => cleanupUsers([user]));
  const { data: before } = await db.from('supplier_profiles').select('business_type,service_categories,service_areas').eq('id', user.supplierId).single();
  assert.deepEqual(before, { business_type: 'equipment', service_categories: [], service_areas: '' });
  for (const update of [{ business_type: 'service' }, { business_type: 'service', service_categories: ['invented'], service_areas: 'Ilfov' }, { business_type: 'both', service_categories: ['repairs'], service_areas: ' ' }]) {
    const { error } = await db.from('supplier_profiles').update(update).eq('id', user.supplierId);
    assert.equal(error?.code, '23514');
  }
});

test('service metadata is owner-only and cannot change ownership, approval or plan', async t => {
  const own = await fixtureSupplier(), other = await fixtureSupplier(), client = await fixtureUser();
  t.after(() => cleanupUsers([own, other, client]));
  assert.equal((await api('/api/supplier/services')).status, 401);
  assert.equal((await api('/api/supplier/services', { method: 'PATCH', body: service })).status, 401);
  assert.equal((await api('/api/supplier/services', { cookie: await login(client), method: 'PATCH', body: service })).status, 403);
  const cookie = await login(own);
  for (const body of [{}, { ...service, supplierId: other.supplierId }, { ...service, status: 'approved' }, { ...service, serviceCategories: ['unknown'] }, { ...service, serviceAreas: '' }]) {
    assert.equal((await api('/api/supplier/services', { method: 'PATCH', cookie, body })).status, 400);
  }
  assert.equal((await api('/api/supplier/services', { method: 'PATCH', cookie, body: service })).status, 200);
  const response = await api('/api/supplier/services', { cookie });
  assert.match(response.headers.get('cache-control'), /private.*no-store/);
  const saved = (await response.json()).supplier;
  assert.equal(saved.id, own.supplierId); assert.equal(saved.service_areas, service.serviceAreas);
  const { data: rows, error } = await db.from('supplier_profiles').select('id,business_type,plan,status').in('id', [own.supplierId, other.supplierId]);
  assert.ifError(error);
  assert.equal(rows.find(p => p.id === other.supplierId).business_type, 'equipment');
  assert.deepEqual(rows.map(p => [p.plan, p.status]), [['free', 'approved'], ['free', 'approved']]);
});

test('approved service providers are filtered separately and both-mode suppliers remain in equipment', async t => {
  const user = await fixtureSupplier('pending'); t.after(() => cleanupUsers([user]));
  const name = `Service audit ${randomUUID()}`;
  const cookie = await login(user);
  await db.from('supplier_profiles').update({ company_name: name }).eq('id', user.supplierId);
  assert.equal((await api('/api/supplier/services', { method: 'PATCH', cookie, body: service })).status, 200);
  const directory = async extra => (await (await api(`/api/suppliers?business=service&search=${encodeURIComponent(name)}${extra || ''}`)).json()).suppliers;
  assert.deepEqual(await directory(), []);
  assert.equal((await api(`/api/suppliers/${user.supplierId}`)).status, 404);
  const admin = await fixtureUser('admin'); t.after(() => cleanupUsers([admin]));
  const adminCookie = await login(admin);
  const pending = await (await api('/api/admin/suppliers?status=pending', { cookie: adminCookie })).json();
  assert.equal(pending.suppliers.find(p => p.id === user.supplierId).service_areas, service.serviceAreas);
  const approved = await api('/api/admin/suppliers', { method: 'PATCH', cookie: adminCookie, body: { supplierId: user.supplierId, action: 'approve' } });
  assert.equal(approved.status, 200);
  const publicRows = await directory('&service=repairs&area=Ilfov');
  assert.equal(publicRows.length, 1); assert.equal(publicRows[0].id, user.supplierId);
  for (const privateField of ['email', 'user_id', 'verification_photos', 'password_hash']) assert.equal(publicRows[0][privateField], undefined);
  assert.deepEqual(await directory('&service=parts'), []);
  assert.deepEqual(await directory('&area=Cluj'), []);
  const equipment = async () => (await (await api(`/api/suppliers?search=${encodeURIComponent(name)}`)).json()).suppliers;
  assert.deepEqual(await equipment(), []);
  assert.equal((await api('/api/supplier/services', { method: 'PATCH', cookie, body: { ...service, businessType: 'both' } })).status, 200);
  assert.equal((await equipment()).length, 1);
  const detail = (await (await api(`/api/suppliers/${user.supplierId}`)).json()).supplier;
  assert.equal(detail.business_type, 'both'); assert.deepEqual(detail.service_categories, service.serviceCategories);
  const enquiry = await api('/api/contact/supplier', { body: { supplierId: user.supplierId, name: 'Service Test Client', email: 'service-client@example.test', message: 'Revizie și reparație bandă de alergare în Ilfov.' } });
  assert.equal(enquiry.status, 200);
  const { requestId } = await enquiry.json();
  const { data: request } = await db.from('contact_requests').select('supplier_id,message').eq('id', requestId).single();
  assert.equal(request.supplier_id, user.supplierId); assert.match(request.message, /Ilfov/);
  const dashboard = await (await api('/api/supplier/dashboard', { cookie })).json();
  assert.ok(dashboard.recentRequests.some(r => r.id === requestId));
});

test('service registration keeps private photos, email verification, pending approval and free activation', async t => {
  const uploads = await registrationUploads(t);
  const email = `audit-service-${randomUUID()}@example.test`;
  const body = { firstName: 'Service', lastName: 'Audit', companyName: 'Atelier Service Audit', email, password, country: 'Romania', city: 'București', phone: '+40722000111', plan: 'enterprise', verificationPhotos: uploads.paths, ...service };
  const registered = await api('/api/auth/register/supplier', { cookie: uploads.cookie, body });
  assert.equal(registered.status, 200);
  const result = await registered.json(); assert.equal(result.success, true); assert.equal(result.emailSent, false);
  t.after(() => cleanupUsers([{ id: result.user.id }]));
  const { data: user } = await db.from('users').select('id,email_verified,verification_token,role').eq('id', result.user.id).single();
  assert.equal(user.role, 'supplier'); assert.equal(user.email_verified, false);
  const { data: profile } = await db.from('supplier_profiles').select('*').eq('user_id', user.id).single();
  assert.equal(profile.status, 'pending'); assert.equal(profile.plan, 'free'); assert.equal(profile.requested_plan, 'free'); assert.equal(profile.business_type, 'service');
  assert.deepEqual(profile.verification_photos, uploads.paths); assert.equal(profile.service_areas, service.serviceAreas);
  const blocked = await api('/api/auth/login', { body: { email, password } }); assert.equal(blocked.status, 403);
  await fetch(`${origin}/api/auth/verify-email?token=${user.verification_token}`, { redirect: 'manual' });
  const cookie = await login({ email });
  assert.equal((await api('/api/supplier/services', { cookie })).status, 200);
  assert.equal((await api(`/api/suppliers/${profile.id}`)).status, 404);
});
