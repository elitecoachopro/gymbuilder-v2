import { createClient } from '@supabase/supabase-js';
import { randomUUID, randomInt, createHmac } from 'node:crypto';
import { hashPassword } from '../../src/lib/password.ts';

const databaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
if (!['127.0.0.1', 'localhost'].includes(databaseUrl.hostname)) {
  throw new Error('Integration fixtures may only run against local Supabase.');
}
if (process.env.RESEND_API_KEY || process.env.STRIPE_SECRET_KEY) throw new Error('Use an isolated test environment without live email/payment credentials.');
export const db = createClient(databaseUrl.href, process.env.SUPABASE_SERVICE_ROLE_KEY);
const applicationUrl = new URL(process.env.TEST_APP_URL || 'http://127.0.0.1:3000');
if (!['127.0.0.1', 'localhost'].includes(applicationUrl.hostname)) throw new Error('Integration requests may only target a local application.');
export const origin = applicationUrl.origin;
export const databaseContainer = process.env.TEST_DB_CONTAINER || 'supabase_db_gymbuilder-v2';
export const password = 'AuditLocal123!';

export async function fixtureUser(role = 'client') {
  const id = randomUUID();
  const email = `audit-${id}@example.test`;
  const { error } = await db.from('users').insert({
    id, email, full_name: `Audit ${role}`, role, email_verified: true,
    password_hash: await hashPassword(password),
  });
  if (error) throw new Error(`Fixture user: ${error.message}`);
  return { id, email, role };
}

export async function login(user) {
  const response = await fetch(`${origin}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `127.0.${randomInt(1,255)}.${randomInt(1,255)}` },
    body: JSON.stringify({ email: user.email, password }),
  });
  if (!response.ok) throw new Error(`Fixture login: HTTP ${response.status}`);
  return response.headers.get('set-cookie').split(';')[0];
}

export function signedCookie(payload) {
  const data = JSON.stringify(payload);
  const signature = createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY).update(data).digest('hex');
  return `session_token=${Buffer.from(data).toString('base64')}.${signature}`;
}

export async function cleanupUsers(users) {
  await db.from('account_deletion_requests').delete().in('user_id', users.map(user => user.id));
  await db.from('users').delete().in('id', users.map(user => user.id));
}

export async function fixtureSupplier(status = 'approved', plan = 'free') {
  const user = await fixtureUser('supplier');
  const { data, error } = await db.from('supplier_profiles').insert({
    user_id: user.id, company_name: 'Audit Supplier', country: 'Romania', city: 'Bucharest', status, plan,
  }).select('id').single();
  if (error) { await cleanupUsers([user]); throw new Error(`Fixture supplier: ${error.message}`); }
  return { ...user, supplierId: data.id };
}

export async function fixtureProduct(supplierId, extras = {}) {
  const { data, error } = await db.from('products').insert({
    supplier_id: supplierId, name: 'Audit Equipment', category: 'strength', price_eur: 100, condition: 'new', status: 'active', ...extras,
  }).select('*').single();
  if (error) throw new Error(`Fixture product: ${error.message}`);
  return data;
}

export function api(path, { body, cookie, method = body === undefined ? 'GET' : 'POST' } = {}) {
  return fetch(`${origin}${path}`, {
    method,
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `127.0.${randomInt(1,255)}.${randomInt(1,255)}`, ...(cookie ? { cookie } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
