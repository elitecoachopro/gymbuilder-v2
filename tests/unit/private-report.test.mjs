import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { exportPrivateReport } from '../../src/lib/private-report.ts';

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
afterEach(() => { globalThis.fetch = originalFetch; process.env = { ...originalEnv }; });
function configure() {
  process.env.REPORTS_EXPORT_TOKEN = 'private-test-token';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://database.example';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-test-key';
}
const request = (query = '', token = 'private-test-token') => new Request(`https://gymbuilder.app/api/private-reports${query}`, { headers: token === null ? {} : { Authorization: `Bearer ${token}` } });

test('private report rejects missing/wrong credentials before any database access', async () => {
  configure();
  globalThis.fetch = () => { throw new Error('Database must not be reached'); };
  for (const token of [null, '', 'incorrect', 'private-test-token-extra']) {
    const response = await exportPrivateReport(request('', token));
    assert.equal(response.status, 401);
    assert.match(response.headers.get('cache-control'), /no-store/);
  }
});

test('missing configuration fails closed and valid authentication still bounds the period', async () => {
  configure();
  globalThis.fetch = () => { throw new Error('Database must not be reached'); };
  delete process.env.REPORTS_EXPORT_TOKEN;
  assert.equal((await exportPrivateReport(request())).status, 503);
  configure();
  for (const days of ['', '0', '2', '999', '7.5', '7&days=30']) {
    assert.equal((await exportPrivateReport(request(`?days=${days}`))).status, 400);
  }
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert.equal((await exportPrivateReport(request('?days=7'))).status, 503);
});

test('authenticated export reads only the aggregate RPC and returns the hub contract', async () => {
  configure();
  const report = { project: 'gymbuilder', status: 'connected', updatedAt: '2026-11-03T10:00:00Z', startedAt: null, traffic: null, business: { metrics: [], days: [] } };
  for (const days of [1, 7, 30, 90]) {
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), 'https://database.example/rest/v1/rpc/gymbuilder_private_report');
      assert.equal(options.method, 'POST');
      assert.equal(options.headers.Authorization, 'Bearer service-test-key');
      assert.deepEqual(JSON.parse(options.body), { p_days: days });
      return Response.json({ ...report, internalDebug: { email: 'never-export@example.test' } });
    };
    const response = await exportPrivateReport(request(`?days=${days}`));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), report);
    assert.match(response.headers.get('cache-control'), /private.*no-store/);
  }
});

test('database failure returns unavailable rather than fabricated zero counts or error details', async () => {
  configure();
  for (const mock of [async () => new Response('database secret', { status: 500 }), async () => { throw new Error('database secret'); }, async () => Response.json({ project: 'wrong' })]) {
    globalThis.fetch = mock;
    const response = await exportPrivateReport(request('?days=7'));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'Report unavailable' });
  }
});
