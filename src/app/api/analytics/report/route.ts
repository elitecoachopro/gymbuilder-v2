import { analyticsDatabase } from '@/lib/analytics-server';
import { getSessionUser } from '@/lib/session-server';

export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'private, no-store' };
  const user = await getSessionUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
  if (!['admin','supplier'].includes(user.role)) return Response.json({ error: 'Forbidden' }, { status: 403, headers });
  const params = new URL(request.url).searchParams;
  const days = params.get('days') || '30', day = params.get('day');
  if (!['1','7','30','90'].includes(days) || (day !== null && (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(Date.parse(day)) || new Date(day).toISOString().slice(0,10) !== day))) return Response.json({ error: 'Invalid period' }, { status: 400, headers });
  const { data, error } = await analyticsDatabase().rpc('gymbuilder_detailed_report', { p_user_id: user.id, p_days: Number(days), ...(day ? { p_day: day } : {}) });
  if (error) return Response.json({ error: error.code === '22023' ? 'Invalid period' : 'Report unavailable' }, { status: error.code === '22023' ? 400 : 503, headers });
  return Response.json({ summary: data }, { headers });
}
