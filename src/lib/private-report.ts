import { createHash, timingSafeEqual } from 'node:crypto';

const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' };
const json = (body: object, status = 200) => Response.json(body, { status, headers });
const digest = (value: string) => createHash('sha256').update(value).digest();

export async function exportPrivateReport(request: Request): Promise<Response> {
  const token = process.env.REPORTS_EXPORT_TOKEN;
  if (!token) return json({ error: 'Report unavailable' }, 503);
  const authorization = request.headers.get('authorization') || '';
  const match = /^Bearer (\S+)$/i.exec(authorization);
  if (!match || !timingSafeEqual(digest(match[1]), digest(token))) return json({ error: 'Unauthorized' }, 401);

  const params = new URL(request.url).searchParams;
  const days = params.get('days') ?? '7';
  if (params.getAll('days').length > 1 || !['1', '7', '30', '90'].includes(days)) return json({ error: 'Invalid period' }, 400);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return json({ error: 'Report unavailable' }, 503);
  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/gymbuilder_private_report`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_days: Number(days) }),
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
      redirect: 'error',
    });
    if (!response.ok) throw new Error('Aggregate unavailable');
    const data = await response.json();
    if (data?.project !== 'gymbuilder' || data?.status !== 'connected' || typeof data.updatedAt !== 'string' || !Object.hasOwn(data, 'traffic') || !Object.hasOwn(data, 'business')) throw new Error('Invalid aggregate');
    return json({ project: data.project, status: data.status, updatedAt: data.updatedAt, startedAt: data.startedAt, traffic: data.traffic, business: data.business });
  } catch {
    return json({ error: 'Report unavailable' }, 503);
  }
}
