import { replaceFloorSpace, type Storey } from './gym-building.ts';
import { validateSpace, type GymSpace } from './gym-space.ts';

export type EditorDocument = { name: string; height: number; budget: number | null; brief: string; space: GymSpace };
export type EditorSnapshot = { document: EditorDocument; storey: Storey };
export type EditorHistory = { present: EditorSnapshot; past: EditorSnapshot[]; future: EditorSnapshot[] };

export function createEditorHistory(document: EditorDocument, storey: Storey = 0): EditorHistory {
  return { present: { document, storey: storey === 1 && document.space.upperFloor ? 1 : 0 }, past: [], future: [] };
}

export function commitEditorFloor(state: EditorHistory, floor: EditorDocument): { state: EditorHistory; error: string | null } {
  const next = { ...floor, space: replaceFloorSpace(state.present.document.space, floor.space, state.present.storey) };
  if (JSON.stringify(next) === JSON.stringify(state.present.document)) return { state, error: null };
  const error = validateSpace(next.space, next.height, next.budget);
  if (error) return { state, error };
  return { state: { present: { document: next, storey: state.present.storey }, past: [...state.past.slice(-49), state.present], future: [] }, error: null };
}

export function undoEditor(state: EditorHistory): EditorHistory {
  const previous = state.past.at(-1);
  if (!previous) return state;
  return { present: previous, past: state.past.slice(0, -1), future: [{ ...state.present, storey: previous.storey }, ...state.future] };
}

export function redoEditor(state: EditorHistory): EditorHistory {
  const next = state.future[0];
  if (!next) return state;
  return { present: next, past: [...state.past.slice(-49), { ...state.present, storey: next.storey }], future: state.future.slice(1) };
}
