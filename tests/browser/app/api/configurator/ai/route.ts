import fullDesign from '../../../../../fixtures/gym-zoning-real-design.json';
import { buildZonedGymProposal } from '../../../../../../src/lib/gym-zoning';
import { prepareGymAiInput } from '../../../../../../src/lib/gym-ai-context';

export function GET() { return Response.json({ configured: true }); }
// Deterministic browser fixtures only; no provider calls or production data.
export async function POST(request: Request) {
  const { input, space, budget } = prepareGymAiInput(await request.json());
  const { brief, context } = input;
  if (brief.includes('TEST_AUTH')) return Response.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  if (brief.includes('TEST_LIMIT')) return Response.json({ error: 'RATE_LIMITED' }, { status: 429 });
  if (brief.includes('TEST_FAIL')) return Response.json({ error: 'AI_UNAVAILABLE' }, { status: 502 });
  if (brief.includes('TEST_TIMEOUT')) return Response.json({ error: 'AI_TIMEOUT' }, { status: 504 });
  const zones = brief.includes('TEST_FULL') ? fullDesign.zones : [{ zoneId: 'cardio', weight: 1, equipment: [{ templateId: 'banda_alergare', quantity: 2 }] }];
  const questions = brief.includes('TEST_QUESTION') ? ['Confirmă înălțimea liberă a sălii.'] : [];
  const design = { summary: 'Propunere AI de test: dotări pentru nivelul activ.', questions, zones, length_m: context.length_m, width_m: context.width_m, total_area: context.total_area, height_m: brief.includes('TEST_MISSING') ? null : context.height_m, budget_eur: budget, profile: context.profile };
  const spaceProposal = questions.length || design.height_m === null ? null : buildZonedGymProposal(space!, zones, context.height_m!, budget, input.automatic_zoning);
  if (brief.includes('TEST_INVALID') && spaceProposal) spaceProposal.space.items[0].x = -10;
  return Response.json({ design, spaceProposal });
}
