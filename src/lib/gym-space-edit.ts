import { validateSpace, wallBox, spaceWalls, type GymSpace, type SpaceWall, type SpaceBox } from './gym-space.ts';
import { DEFAULT_VISUALIZATION, snapMetres } from './gym-visualization.ts';

export type StructureCommand =
  | { kind: 'wall'; id: string; patch: Partial<Pick<SpaceWall, 'x' | 'y' | 'length' | 'thickness'>> }
  | { kind: 'opening'; id: string; patch: Partial<Pick<GymSpace['openings'][number], 'offset' | 'width' | 'height' | 'sill'>> }
  | { kind: 'delete-wall'; id: string }
  | { kind: 'delete-opening'; id: string };
export type StructureGesture = { kind: 'wall-move' | 'wall-length' | 'opening-move' | 'opening-width'; id: string };
const overlaps = (a: SpaceBox, b: SpaceBox) => a.x < b.x + b.w - 0.00001 && a.x + a.w > b.x + 0.00001 && a.y < b.y + b.d - 0.00001 && a.y + a.d > b.y + 0.00001;

/** The preview and final commit use the same operation; rejected previews never change the source. */
export function editStructure(space: GymSpace, command: StructureCommand, height: number, budget: number | null): { space: GymSpace; error: string | null } {
  const fail = (error: string) => ({ space, error });
  const step = (space.visualization ?? DEFAULT_VISUALIZATION).snap;
  let next: GymSpace;
  if (command.kind === 'wall' || command.kind === 'delete-wall') {
    const wall = space.walls.find(w => w.id === command.id);
    if (!wall) return fail('Selectează un perete interior existent.');
    if (command.kind === 'delete-wall') next = { ...space, walls: space.walls.filter(w => w.id !== wall.id), openings: space.openings.filter(o => o.wallId !== wall.id) };
    else {
      const patch = { ...command.patch };
      for (const key of ['x', 'y', 'length'] as const) if (patch[key] !== undefined && patch[key] !== wall[key]) patch[key] = snapMetres(patch[key], step);
      const candidate = { ...wall, ...patch };
      if ([...space.columns, ...(space.stairwell ? [space.stairwell] : [])].some(box => overlaps(wallBox(candidate), box))) return fail('Peretele se suprapune peste un stâlp sau peste scară.');
      next = { ...space, walls: space.walls.map(w => w.id === wall.id ? candidate : w) };
    }
  } else {
    const opening = space.openings.find(o => o.id === command.id);
    if (!opening) return fail('Selectează o deschidere existentă.');
    if (command.kind === 'delete-opening') next = { ...space, openings: space.openings.filter(o => o.id !== opening.id) };
    else {
      const patch = { ...command.patch };
      for (const key of ['offset', 'width'] as const) if (patch[key] !== undefined && patch[key] !== opening[key]) patch[key] = snapMetres(patch[key], step);
      next = { ...space, openings: space.openings.map(o => o.id === opening.id ? { ...o, ...patch } : o) };
    }
  }
  const error = validateSpace(next, height, budget);
  if (error) return fail(error);
  return { space: JSON.stringify(next) === JSON.stringify(space) ? space : next, error: null };
}

/** Deltas are measured from the gesture's immutable starting document, never from its last preview. */
export function structureGesture(space: GymSpace, gesture: StructureGesture, dx: number, dy: number): StructureCommand {
  if (gesture.kind === 'wall-move' || gesture.kind === 'wall-length') {
    const wall = space.walls.find(w => w.id === gesture.id);
    if (!wall) return { kind: 'wall', id: gesture.id, patch: {} };
    if (gesture.kind === 'wall-move') return { kind: 'wall', id: gesture.id, patch: { x: wall.x + dx, y: wall.y + dy } };
    const delta = wall.axis === 'x' ? dx : dy;
    return { kind: 'wall', id: gesture.id, patch: { length: wall.length + delta } };
  }
  const opening = space.openings.find(o => o.id === gesture.id);
  const wall = spaceWalls(space).find(w => w.id === opening?.wallId);
  const delta = wall?.axis === 'x' ? dx : dy;
  if (!opening) return { kind: 'opening', id: gesture.id, patch: {} };
  if (gesture.kind === 'opening-move') return { kind: 'opening', id: gesture.id, patch: { offset: opening.offset + delta } };
  return { kind: 'opening', id: gesture.id, patch: { width: opening.width + delta } };
}
