import { canResumeDraft } from './journeys.ts';
import { studioConfigurationSchema } from './gym-studio.ts';
import { validateSpace } from './gym-space.ts';
import type { EditorDocument } from './gym-editor-history.ts';

export function restoreLoginHandoff(raw: string | null, nonce: string, currentOwner: string, now = Date.now()) {
  if (!raw || raw.length > 5_000_000) throw new Error('Invalid handoff');
  const saved = JSON.parse(raw);
  if (typeof saved.owner !== 'string' || typeof saved.nonce !== 'string' || !canResumeDraft(saved.owner, currentOwner, saved.nonce, nonce)
    || !Number.isFinite(saved.createdAt) || saved.createdAt > now || now - saved.createdAt > 3_600_000) throw new Error('Invalid handoff');
  const value = saved.document;
  if (!value || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 120
    || (saved.projectId !== null && (typeof saved.projectId !== 'string' || !saved.projectId || saved.projectId.length > 100))
    || typeof saved.savedFingerprint !== 'string') throw new Error('Invalid handoff');
  const parsed = studioConfigurationSchema.safeParse({ version: 1, height_m: value.height, budget_eur: value.budget, brief: value.brief, zone_ids: ['cardio'], profile: 'balanced', space: value.space });
  if (!parsed.success || !parsed.data.space || validateSpace(parsed.data.space, parsed.data.height_m, parsed.data.budget_eur)) throw new Error('Invalid handoff');
  const document: EditorDocument = { name: value.name, height: parsed.data.height_m, budget: parsed.data.budget_eur, brief: parsed.data.brief, space: parsed.data.space };
  return { document, projectId: saved.projectId as string | null, savedFingerprint: saved.savedFingerprint as string,
    storey: saved.storey === 1 && document.space.upperFloor ? 1 as const : 0 as const,
    tab: (['room', 'library', 'finishes', 'ai'].includes(saved.tab) ? saved.tab : 'room') as 'room' | 'library' | 'finishes' | 'ai' };
}
