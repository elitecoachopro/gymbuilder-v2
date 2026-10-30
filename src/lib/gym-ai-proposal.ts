import { z } from 'zod';
import { EQUIPMENT_CATALOG } from './gym-catalog.ts';
import { aiDesignSchema } from './gym-ai.ts';
import { matchesGymAiMeasurements } from './gym-ai-context.ts';
import { floorBudget, floorSpace } from './gym-building.ts';
import { commitEditorFloor, type EditorSnapshot, type EditorHistory } from './gym-editor-history.ts';
import { spaceSchema, validateSpace } from './gym-space.ts';
import type { buildZonedGymProposal } from './gym-zoning.ts';

const proposalSchema = z.object({ space: spaceSchema, omitted: z.array(z.object({ templateId: z.string().refine(id => EQUIPMENT_CATALOG.some(model => model.id === id)), quantity: z.number().int().min(1).max(9000), reason: z.enum(['space', 'height', 'budget']) })), zoning: z.enum(['generated', 'preserved', 'off']) });
export type GymAiReview = ReturnType<typeof createGymAiReview>;
export function createGymAiReview(value: unknown, snapshot: EditorSnapshot, revision: number) {
  const response = z.object({ design: aiDesignSchema, spaceProposal: proposalSchema.nullable().optional() }).parse(value);
  const { document, storey } = snapshot, original = floorSpace(document.space, storey), budget = floorBudget(document.space, storey, document.budget);
  let proposal: ReturnType<typeof buildZonedGymProposal> | null = response.spaceProposal ?? null;
  if (response.design.questions.length || !matchesGymAiMeasurements(response.design, original, document.height, budget)) proposal = null;
  if (proposal) {
    if (proposal.space.upperFloor || validateSpace(proposal.space, document.height, budget)) throw Error('INVALID_PROPOSAL');
    for (const key of ['outline', 'columns', 'stairwell', 'finishes', 'visualization'] as const) if (JSON.stringify(proposal.space[key]) !== JSON.stringify(original[key])) throw Error('INVALID_PROPOSAL');
    const generated = proposal.zoning === 'generated';
    if (generated && (original.walls.length || original.openings.length || original.areas.length || original.columns.length || original.stairwell)) throw Error('INVALID_PROPOSAL');
    if (!generated) for (const key of ['walls', 'openings', 'areas'] as const) if (JSON.stringify(proposal.space[key]) !== JSON.stringify(original[key])) throw Error('INVALID_PROPOSAL');
  }
  const changes = [...new Set([...original.items, ...(proposal?.space.items ?? [])].map(item => item.templateId))].map(templateId => ({ templateId, before: original.items.filter(item => item.templateId === templateId).length, after: proposal?.space.items.filter(item => item.templateId === templateId).length ?? 0 }));
  return { design: response.design, proposal, source: { fingerprint: JSON.stringify(document), storey, revision }, replacedCount: original.items.length, changes, budget };
}
export function gymAiReviewCurrent(review: GymAiReview, snapshot: EditorSnapshot, revision: number) {
  return review.source.revision === revision && review.source.storey === snapshot.storey && review.source.fingerprint === JSON.stringify(snapshot.document);
}
export function applyGymAiReview(state: EditorHistory, review: GymAiReview, revision: number, graphicsFailed: boolean) {
  const mode = graphicsFailed ? '2d' as const : '3d' as const;
  if (!review.proposal || !gymAiReviewCurrent(review, state.present, revision)) return { state, error: 'STALE_PROPOSAL', mode };
  return { ...commitEditorFloor(state, { ...state.present.document, space: review.proposal.space }), mode };
}
