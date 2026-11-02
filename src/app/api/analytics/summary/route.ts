import { analyticsDays } from '@/lib/analytics';
import { analyticsDatabase } from '@/lib/analytics-server';
import { getSessionUser } from '@/lib/session-server';

export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'private, no-store' };
  const user = await getSessionUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
  if (!['admin', 'supplier'].includes(user.role)) return Response.json({ error: 'Forbidden' }, { status: 403, headers });
  const days = analyticsDays(new URL(request.url).searchParams.get('days'));
  if (days === null) return Response.json({ error: 'Invalid period' }, { status: 400, headers });
  const { data, error } = await analyticsDatabase().rpc('gymbuilder_traffic_summary', { p_user_id: user.id, p_days: days });
  if (error) return Response.json({ error: 'Analytics unavailable' }, { status: 503, headers });
  return Response.json({ summary: data }, { headers });
}
