import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session-server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { requestGymAiDesign } from '@/lib/gym-ai';
import { buildGymProposal } from '@/lib/gym-studio';
import { matchesGymAiMeasurements, prepareGymAiInput } from '@/lib/gym-ai-context';
import { buildZonedGymProposal } from '@/lib/gym-zoning';

export const runtime = 'nodejs';
const ready = () => Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_GYM_MODEL);
export async function GET() {
  return NextResponse.json({ configured: ready() }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  if (!ready()) return NextResponse.json({ error: 'AI_NOT_CONFIGURED' }, { status: 503 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'INVALID_BRIEF' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || !('aiConsent' in body) || body.aiConsent !== true) return NextResponse.json({ error: 'AI_CONSENT_REQUIRED' }, { status: 400 });
  let prepared: ReturnType<typeof prepareGymAiInput>;
  try { prepared = prepareGymAiInput(body); } catch { return NextResponse.json({ error: 'INVALID_BRIEF' }, { status: 400 }); }
  const { input, space, budget, context } = prepared;
  const limit = await checkRateLimit(`gym-ai:${user.id}`, { maxRequests: 5, windowMs: 3600000 });
  if (!limit.allowed) return rateLimitResponse(limit.resetTime);
  try {
    const design = await requestGymAiDesign({ brief: input.brief, locale: input.locale, context }, { apiKey: process.env.OPENAI_API_KEY!, model: process.env.OPENAI_GYM_MODEL! });
    if (!design) return NextResponse.json({ error: 'AI_UNAVAILABLE' }, { status: 502 });
    if (space) {
      const spaceProposal = design.questions.length || !matchesGymAiMeasurements(design, space, input.context.height_m!, budget) ? null : buildZonedGymProposal(space, design.zones, input.context.height_m!, budget, input.automatic_zoning);
      return NextResponse.json({ design, spaceProposal }, { headers: { 'Cache-Control': 'no-store' } });
    }
    let proposal = null;
    if (design.length_m !== null && design.width_m !== null && design.total_area !== null && design.height_m !== null) {
      proposal = buildGymProposal({ ...design, length_m: design.length_m, width_m: design.width_m, total_area: design.total_area, height_m: design.height_m, brief: input.brief, zone_ids: design.zones.map(z => z.zoneId) }, design.zones);
    }
    return NextResponse.json({ design, proposal }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') return NextResponse.json({ error: 'AI_TIMEOUT' }, { status: 504 });
    return NextResponse.json({ error: 'AI_INVALID_RESPONSE' }, { status: 502 });
  }
}
