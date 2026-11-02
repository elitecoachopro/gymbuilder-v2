import { NextRequest } from 'next/server';
import { localizedJson } from '@/lib/json-response';
import { getSessionUser } from '@/lib/session-server';
import { parseViewInput } from '@/lib/analytics/input';
import { analyticsDatabase, analyticsEnvironment } from '@/lib/analytics/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    if (Number(request.headers.get('content-length') || 0) > 1500) return localizedJson({ error: 'Date invalide.' }, { status: 400 });
    const input = parseViewInput(await request.json());
    if (!input) return localizedJson({ error: 'Date invalide.' }, { status: 400 });
    const quota = await checkRateLimit(`traffic:${analyticsEnvironment()}:${input.sessionId}`, { maxRequests: 120, windowMs: 60000 });
    if (!quota.allowed) return rateLimitResponse(quota.resetTime);
    const actor = await getSessionUser();
    const { data, error } = await analyticsDatabase().rpc('record_traffic_view', {
      p_event_id: input.eventId, p_session_id: input.sessionId, p_path: input.path,
      p_environment: analyticsEnvironment(), p_actor_id: actor?.userId ?? null,
    });
    if (error) return localizedJson({ error: 'Înregistrarea vizualizării nu este disponibilă.' }, { status: 503 });
    return localizedJson({ recorded: data === true });
  } catch {
    return localizedJson({ error: 'Date invalide.' }, { status: 400 });
  }
}
