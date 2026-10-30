import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

function loadTargets(overrides = {}) {
  return spawnSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', `
    const { origin, databaseContainer } = await import('./tests/integration/helpers.mjs');
    console.log(JSON.stringify({ origin, databaseContainer }));
  `], {
    cwd: new URL('../../', import.meta.url), encoding: 'utf8',
    env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:55321', SUPABASE_SERVICE_ROLE_KEY: 'local-test-key', RESEND_API_KEY: '', STRIPE_SECRET_KEY: '', TEST_APP_URL: '', TEST_DB_CONTAINER: '', ...overrides },
  });
}

test('integration targets preserve defaults and support a separate local installation', () => {
  const defaults = loadTargets();
  assert.equal(defaults.status, 0, defaults.stderr);
  assert.deepEqual(JSON.parse(defaults.stdout), { origin: 'http://127.0.0.1:3000', databaseContainer: 'supabase_db_gymbuilder-v2' });
  const isolated = loadTargets({ TEST_APP_URL: 'http://127.0.0.1:3100', TEST_DB_CONTAINER: 'supabase_db_gymbuilder-fresh-test' });
  assert.equal(isolated.status, 0, isolated.stderr);
  assert.deepEqual(JSON.parse(isolated.stdout), { origin: 'http://127.0.0.1:3100', databaseContainer: 'supabase_db_gymbuilder-fresh-test' });
});

test('integration targets reject remote application and database URLs before any fixtures run', () => {
  const application = loadTargets({ TEST_APP_URL: 'https://example.test' });
  assert.notEqual(application.status, 0);
  assert.match(application.stderr, /only target a local application/);
  const database = loadTargets({ NEXT_PUBLIC_SUPABASE_URL: 'https://example.test' });
  assert.notEqual(database.status, 0);
  assert.match(database.stderr, /only run against local Supabase/);
});
