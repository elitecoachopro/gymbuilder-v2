import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { databaseContainer } from './helpers.mjs';

test('every application table has RLS enabled', () => {
  const output = execFileSync('docker', ['exec', databaseContainer, 'psql', '-U', 'postgres', '-d', 'postgres', '-At', '-c',
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND NOT rowsecurity ORDER BY tablename"], { encoding: 'utf8' });
  assert.equal(output.trim(), '', `Tables without RLS: ${output.trim()}`);
});

test('public API key cannot read private application tables', async () => {
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  for (const table of ['users', 'contact_messages', 'contact_requests', 'messages', 'notifications', 'auth_logs', 'gym_projects']) {
    const { error } = await anon.from(table).select('*').limit(1);
    assert.ok(error, `${table} must not be directly accessible to anon`);
  }
});
