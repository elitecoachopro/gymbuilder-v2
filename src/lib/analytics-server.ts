import { createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.generated';
import { analyticsPath } from '@/lib/analytics';
import { trafficSources } from '@/lib/traffic-attribution';
import { getSessionUser } from '@/lib/session-server';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

export function analyticsDatabase() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function recordTraffic(request: Request, mode: 'view' | 'legacy-product' | 'event' = 'view'): Promise<Response> {
  const json = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  const expectedOrigin = new URL(request.url);
  expectedOrigin.host = request.headers.get('host') || expectedOrigin.host;
  if (request.headers.get('origin') !== expectedOrigin.origin) return json({ error: 'Forbidden' }, 403);
  if (/bot|crawler|spider|headless|preview/i.test(request.headers.get('user-agent') || '')) return json({ recorded: false });
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid data' }, 400); }
  if (!body || body.consent !== 'all') return json({ recorded: false, reason: 'consent_required' });
  const path = analyticsPath(mode === 'legacy-product' ? `/products/${body.product_id}` : body.path);
  if (!path || typeof body.session_id !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(body.session_id)) return json({ error: 'Invalid data' }, 400);
  if (mode === 'event' && (!['view', 'phone', 'whatsapp'].includes(body.kind) || !trafficSources.includes(body.source) || typeof body.event_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(body.event_id))) return json({ error: 'Invalid event' }, 400);
  const limit = await checkRateLimit(`analytics:${getClientIP(request)}`, { maxRequests: 120, windowMs: 60000 });
  if (!limit.allowed) return rateLimitResponse(limit.resetTime);
  const user = await getSessionUser();
  const hash = createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!).update(`analytics:${body.session_id}`).digest('hex');
  const database = analyticsDatabase();
  const { data, error } = mode === 'event'
    ? await database.rpc('record_gymbuilder_event', { p_path: path, p_session_hash: hash, p_actor_id: user?.id, p_kind: body.kind, p_source: body.source, p_event_id: body.event_id })
    : await database.rpc('record_public_page_view', { p_path: path, p_session_hash: hash, p_actor_id: user?.id });
  if (error) return json({ error: 'Analytics unavailable' }, 503);
  return json({ recorded: data === true });
}
