import { registrationUploads } from './registration-upload-fixtures.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { api, db, password } from './helpers.mjs';

test('supplier signup cannot self-activate a paid subscription', async t => {
  const email = `audit-${randomUUID()}@example.test`;
  t.after(async () => { await db.from('users').delete().eq('email', email); });
  const { cookie, paths } = await registrationUploads(t);
  const response = await api('/api/auth/register/supplier', { cookie, body: {
    email, password, firstName: 'Audit', lastName: 'Supplier', companyName: 'Audit Company', country: 'Romania', city: 'Bucharest', phone: '+40700000000',
    plan: 'enterprise', verificationPhotos: paths,
  } });
  assert.equal(response.status, 200);
  const { data: user } = await db.from('users').select('id').eq('email', email).single();
  const { data: profile } = await db.from('supplier_profiles').select('plan,contact_email').eq('user_id', user.id).single();
  assert.equal(profile.plan, 'free');
  assert.equal(profile.contact_email, null);
});

test('product image limits match every supplier plan', async t => {
 const { fixtureSupplier, cleanupUsers, login }=await import('./helpers.mjs');const suppliers=[];const name=`AuditImagePlan-${randomUUID()}`;
 t.after(async()=>{await cleanupUsers(suppliers);await db.from('brands').delete().eq('name',name);});
 for(const [plan,allowed] of [['free',1],['starter',5],['professional',10],['enterprise',25]]){
  const supplier=await fixtureSupplier('approved',plan);suppliers.push(supplier);const cookie=await login(supplier);
  const body={name:`Plan ${plan}`,category:'strength',brand:name,condition:'new',price_eur:100,images:Array.from({length:allowed},(_,i)=>`https://example.test/${i}.png`)};
  const response=await api('/api/supplier/products',{cookie,body});assert.equal(response.status,200,`plan ${plan}`);
  if(plan!=='enterprise')assert.equal((await api('/api/supplier/products',{cookie,body:{...body,images:[...body.images,'https://example.test/extra.png']}})).status,403);
 }
});

test('supplier registration stores an explicit public email separately from the login email', async t => {
  const email = `audit-${randomUUID()}@example.test`;
  t.after(async () => { await db.from('users').delete().eq('email', email); });
  const { cookie, paths } = await registrationUploads(t);
  const response = await api('/api/auth/register/supplier', { cookie, body: {
    email, password, firstName: 'Audit', lastName: 'Contact', companyName: 'Audit public email', country: 'Romania', city: 'Bucharest', phone: '+40700000000',
    contactEmail: ' SALES@Example.TEST ', plan: 'free', verificationPhotos: paths,
  } });
  assert.equal(response.status, 200);
  const { data: user } = await db.from('users').select('id,email').eq('email', email).single();
  const { data: profile } = await db.from('supplier_profiles').select('contact_email,status').eq('user_id', user.id).single();
  assert.equal(profile.contact_email, 'sales@example.test'); assert.equal(profile.status, 'pending'); assert.equal(user.email, email);
});

test('registration rejects invalid public email before creating a user', async () => {
  const email = `audit-${randomUUID()}@example.test`;
  const response = await api('/api/auth/register/supplier', { body: { email, password, firstName: 'Audit', lastName: 'Contact', companyName: 'Invalid public email', country: 'Romania', city: 'Bucharest', phone: '+40700000000', contactEmail: 'not an email' } });
  assert.equal(response.status, 400);
  const { count } = await db.from('users').select('id', { count: 'exact', head: true }).eq('email', email); assert.equal(count, 0);
});
