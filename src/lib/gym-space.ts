import { z } from 'zod';
import { EQUIPMENT_CATALOG } from './gym-catalog.ts';
import { visualizationSchema } from './gym-visualization.ts';

const metre = z.number().finite().min(0).max(200);
const positive = z.number().finite().min(0.05).max(200);
const id = z.string().min(1).max(100);
const colour = z.string().regex(/^#[0-9a-f]{6}$/i);
const floorSchema = z.object({
  version: z.literal(1),
  outline: z.array(z.object({ x: metre, y: metre }).strict()).min(4).max(40),
  walls: z.array(z.object({ id, x: metre, y: metre, length: positive, axis: z.enum(['x', 'y']), thickness: z.number().min(0.08).max(0.5) }).strict()).max(60),
  openings: z.array(z.object({ id, wallId: id, kind: z.enum(['door', 'window']), offset: metre, width: positive, height: positive, sill: metre }).strict()).max(100),
  columns: z.array(z.object({ id, x: metre, y: metre, w: positive, d: positive }).strict()).max(40),
  areas: z.array(z.object({ id, name: z.string().min(1).max(80), colour, x: metre, y: metre, w: positive, d: positive }).strict()).max(30),
  items: z.array(z.object({ id, templateId: id, x: metre, y: metre, rotation: z.number().finite().min(0).max(359) }).strict()).max(300),
  finishes: z.object({ floor: z.enum(['rubber', 'tartan', 'oak', 'concrete']), wall: colour, frame: colour, upholstery: colour }).strict(),
  visualization: visualizationSchema.optional(),
  stairwell: z.object({ x: metre, y: metre, w: positive, d: positive, opening: z.boolean() }).strict().optional(),
}).strict();
export const spaceSchema = floorSchema.extend({ upperFloor: floorSchema.optional() });
export type GymSpace = z.infer<typeof spaceSchema>;
export type SpaceItem = GymSpace['items'][number];
export type SpacePoint = GymSpace['outline'][number];
export type SpaceWall = GymSpace['walls'][number];
export type SpaceBox = { x: number; y: number; w: number; d: number };
const EPS = 0.00001;
export const spaceBounds = (space: Pick<GymSpace, 'outline'>) => ({ length: Math.max(...space.outline.map(p => p.x)), width: Math.max(...space.outline.map(p => p.y)) });
export function spaceArea(space: GymSpace) {
  return Math.abs(space.outline.reduce((sum, p, i, a) => sum + p.x * a[(i + 1) % a.length].y - a[(i + 1) % a.length].x * p.y, 0)) / 2;
}
export function insideOutline(p: SpacePoint, outline: SpacePoint[]) {
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const a = outline[j], b = outline[i];
    if (insideSegment(p, a, b)) return true;
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
function crosses(a: SpacePoint, b: SpacePoint, c: SpacePoint, d: SpacePoint) {
  const cross = (p: SpacePoint, q: SpacePoint, r: SpacePoint) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  return cross(a, b, c) * cross(a, b, d) < -EPS && cross(c, d, a) * cross(c, d, b) < -EPS;
}
export const boxPolygon = (b: SpaceBox): SpacePoint[] => [{ x: b.x, y: b.y }, { x: b.x + b.w, y: b.y }, { x: b.x + b.w, y: b.y + b.d }, { x: b.x, y: b.y + b.d }];
export function itemPolygon(item: SpaceItem): SpacePoint[] {
  const t = EQUIPMENT_CATALOG.find(t => t.id === item.templateId);
  if (!t) return [];
  const r = item.rotation * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => ({ x: item.x + x * t.length_m / 2 * c - y * t.width_m / 2 * s, y: item.y + x * t.length_m / 2 * s + y * t.width_m / 2 * c }));
}
export function polygonsOverlap(a: SpacePoint[], b: SpacePoint[]) {
  if (Math.max(...a.map(p => p.x)) <= Math.min(...b.map(p => p.x)) + EPS || Math.max(...b.map(p => p.x)) <= Math.min(...a.map(p => p.x)) + EPS || Math.max(...a.map(p => p.y)) <= Math.min(...b.map(p => p.y)) + EPS || Math.max(...b.map(p => p.y)) <= Math.min(...a.map(p => p.y)) + EPS) return false;
  for (const poly of [a, b]) for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const axis = { x: -(q.y - p.y), y: q.x - p.x };
    const aa = a.map(v => v.x * axis.x + v.y * axis.y), bb = b.map(v => v.x * axis.x + v.y * axis.y);
    if (Math.max(...aa) <= Math.min(...bb) + EPS || Math.max(...bb) <= Math.min(...aa) + EPS) return false;
  }
  return true;
}
export function polygonFits(poly: SpacePoint[], outline: SpacePoint[]) {
  return poly.length >= 3 && poly.every(p => insideOutline(p, outline)) && !poly.some((p, i) => outline.some((q, j) => crosses(p, poly[(i + 1) % poly.length], q, outline[(j + 1) % outline.length])));
}
export function spaceWalls(space: GymSpace): SpaceWall[] {
  return [...space.outline.map((a, i) => {
    const b = space.outline[(i + 1) % space.outline.length];
    return { id: `edge-${i}`, x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), length: Math.abs(b.x - a.x) + Math.abs(b.y - a.y), axis: (a.y === b.y ? 'x' : 'y') as 'x' | 'y', thickness: 0.14 };
  }), ...space.walls];
}
export function wallBox(wall: SpaceWall, start = 0, length = wall.length): SpaceBox {
  return wall.axis === 'x' ? { x: wall.x + start, y: wall.y - wall.thickness / 2, w: length, d: wall.thickness } : { x: wall.x - wall.thickness / 2, y: wall.y + start, w: wall.thickness, d: length };
}
export function doorBox(wall: SpaceWall, opening: GymSpace['openings'][number]): SpaceBox {
  return wall.axis === 'x' ? { x: wall.x + opening.offset, y: wall.y - 0.9, w: opening.width, d: 1.8 } : { x: wall.x - 0.9, y: wall.y + opening.offset, w: 1.8, d: opening.width };
}
export function itemFitsSpace(space: GymSpace, item: SpaceItem, height: number, ignoreId = item.id) {
  const template = EQUIPMENT_CATALOG.find(t => t.id === item.templateId), poly = itemPolygon(item);
  if (!template || template.height_m > height || !polygonFits(poly, space.outline)) return false;
  if (space.items.some(other => other.id !== ignoreId && polygonsOverlap(poly, itemPolygon(other)))) return false;
  if (space.columns.some(column => polygonsOverlap(poly, boxPolygon(column)))) return false;
  if (space.stairwell && polygonsOverlap(poly, boxPolygon(space.stairwell))) return false;
  for (const wall of spaceWalls(space)) {
    if (polygonsOverlap(poly, boxPolygon(wallBox(wall)))) return false;
    if (space.openings.some(o => o.kind === 'door' && o.wallId === wall.id && polygonsOverlap(poly, boxPolygon(doorBox(wall, o))))) return false;
  }
  return true;
}
export function spaceCost(space: GymSpace): number {
  return space.items.reduce((sum, item) => sum + (EQUIPMENT_CATALOG.find(t => t.id === item.templateId)?.price_eur || 0), 0) + (space.upperFloor ? spaceCost(space.upperFloor) : 0);
}
export function validateSpace(value: unknown, height: number, budget: number | null): string | null {
  const result = spaceSchema.safeParse(value);
  if (!result.success) return 'Datele spațiului sunt invalide.';
  const space = result.data, outline = space.outline;
  if (!Number.isFinite(height) || height < 2 || height > 30 || (budget !== null && (!Number.isFinite(budget) || budget <= 0))) return 'Înălțime sau buget invalid.';
  if (Math.min(...outline.map(p => p.x)) !== 0 || Math.min(...outline.map(p => p.y)) !== 0 || spaceArea(space) < 4) return 'Conturul trebuie să pornească de la origine și să aibă minimum 4 m².';
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i], b = outline[(i + 1) % outline.length];
    if ((a.x !== b.x && a.y !== b.y) || Math.abs(a.x - b.x) + Math.abs(a.y - b.y) < 0.1) return 'Folosește un contur ortogonal fără laturi nule.';
    for (let j = i + 1; j < outline.length; j++) {
      if (j === i + 1 || (i === 0 && j === outline.length - 1)) continue;
      const c = outline[j], d = outline[(j + 1) % outline.length];
      if (crosses(a, b, c, d) || insideSegment(a, c, d) || insideSegment(b, c, d) || insideSegment(c, a, b) || insideSegment(d, a, b)) return 'Conturul nu poate avea laturi care se intersectează.';
    }
  }
  const ids = [...space.items, ...space.walls, ...space.columns, ...space.openings, ...space.areas].map(v => v.id);
  if (new Set(ids).size !== ids.length || space.walls.some(w => w.id.startsWith('edge-'))) return 'Identificatori duplicați în proiect.';
  for (const wall of space.walls) {
    if (!polygonFits(boxPolygon(wallBox(wall)), outline)) return 'Un perete depășește conturul spațiului.';
  }
  for (const column of space.columns) if (!polygonFits(boxPolygon(column), outline)) return 'Un stâlp depășește conturul spațiului.';
  for (const area of space.areas) if (!polygonFits(boxPolygon(area), outline)) return 'O zonă depășește conturul spațiului.';
  const walls = spaceWalls(space);
  for (const opening of space.openings) {
    const wall = walls.find(w => w.id === opening.wallId);
    if (!wall || opening.offset + opening.width > wall.length + EPS || opening.height + opening.sill > height || (opening.kind === 'door' && opening.sill !== 0)) return 'O ușă sau fereastră depășește peretele.';
    if (space.openings.some(o => o.id !== opening.id && o.wallId === opening.wallId && o.offset < opening.offset + opening.width - EPS && o.offset + o.width > opening.offset + EPS)) return 'Deschiderile din același perete se suprapun.';
  }
  if (space.stairwell && !polygonFits(boxPolygon(space.stairwell), outline)) return 'Scara depășește conturul spațiului.';
  if (space.upperFloor && validateSpace(space.upperFloor, height, null)) return 'Etajul conține date incompatibile.';
  if (space.items.some(item => !itemFitsSpace(space, item, height))) return 'Un aparat se suprapune, blochează o ușă sau depășește spațiul ori înălțimea.';
  if (budget !== null && spaceCost(space) > budget) return 'Dotările depășesc bugetul proiectului.';
  return null;
}
function insideSegment(p: SpacePoint, a: SpacePoint, b: SpacePoint) {
  return Math.abs((p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x)) < EPS && p.x >= Math.min(a.x, b.x) - EPS && p.x <= Math.max(a.x, b.x) + EPS && p.y >= Math.min(a.y, b.y) - EPS && p.y <= Math.max(a.y, b.y) + EPS;
}
export function emptySpace(length = 20, width = 15): GymSpace {
  return { version: 1, outline: [{ x: 0, y: 0 }, { x: length, y: 0 }, { x: length, y: width }, { x: 0, y: width }], walls: [], openings: [], columns: [], areas: [], items: [], finishes: { floor: 'rubber', wall: '#e7e5df', frame: '#353b43', upholstery: '#945c39' } };
}
export function findSpacePosition(space: GymSpace, templateId: string, height: number, rotation = 0, area?: SpaceBox): SpaceItem | null {
  const bounds = spaceBounds(space), t = EQUIPMENT_CATALOG.find(t => t.id === templateId);
  if (!t || t.height_m > height) return null;
  const region = area || { x: 0, y: 0, w: bounds.length, d: bounds.width };
  const prototype = { id: 'placement-candidate', templateId, x: 0, y: 0, rotation };
  const local = itemPolygon(prototype);
  const halfW = Math.max(...local.map(p => p.x)), halfD = Math.max(...local.map(p => p.y));
  const walls = spaceWalls(space);
  const obstacles = [...(space.stairwell ? [boxPolygon(space.stairwell)] : []), ...space.items.map(itemPolygon), ...space.columns.map(boxPolygon), ...walls.map(w => boxPolygon(wallBox(w))), ...space.openings.filter(o => o.kind === 'door').flatMap(o => { const wall = walls.find(w => w.id === o.wallId); return wall ? [boxPolygon(doorBox(wall, o))] : []; })];
  const tryAt = (x: number, y: number): SpaceItem | null => {
    x = Math.round(x * 100) / 100; y = Math.round(y * 100) / 100;
    const poly = local.map(p => ({ x: p.x + x, y: p.y + y }));
    if (!poly.every(p => p.x >= region.x + 0.15 && p.y >= region.y + 0.15 && p.x <= region.x + region.w - 0.15 && p.y <= region.y + region.d - 0.15) || !polygonFits(poly, space.outline) || obstacles.some(other => polygonsOverlap(poly, other))) return null;
    return { ...prototype, x, y };
  };
  const xs = [...new Set([region.x + halfW + 0.25, ...obstacles.map(p => Math.max(...p.map(v => v.x)) + halfW + 0.3)])].filter(x => x < region.x + region.w - halfW).sort((a, b) => a - b);
  const ys = [...new Set([region.y + halfD + 0.25, ...obstacles.map(p => Math.max(...p.map(v => v.y)) + halfD + 0.3)])].filter(y => y < region.y + region.d - halfD).sort((a, b) => a - b);
  for (const y of ys) for (const x of xs) { const found = tryAt(x, y); if (found) return found; }
  const step = Math.max(0.35, region.w / 45, region.d / 45);
  for (let y = region.y + halfD + 0.2; y < region.y + region.d - halfD; y += step) for (let x = region.x + halfW + 0.2; x < region.x + region.w - halfW; x += step) { const found = tryAt(x, y); if (found) return found; }
  return null;
}
export function populateSpace(space: GymSpace, requests: Array<{ zoneId: string; equipment: Array<{ templateId: string; quantity: number }> }>, height: number, budget: number | null) {
  const next: GymSpace = { ...space, items: [] }, omitted: Array<{ templateId: string; quantity: number; reason: 'height' | 'budget' | 'space' }> = [];
  const usedIds = new Set([...space.walls, ...space.openings, ...space.columns, ...space.areas].map(entry => entry.id));
  let itemNumber = 0;
  for (const request of requests) for (const wanted of request.equipment) for (let i = 0; i < wanted.quantity; i++) {
    const template = EQUIPMENT_CATALOG.find(t => t.id === wanted.templateId && t.zone === request.zoneId);
    if (!template) continue;
    let reason: 'height' | 'budget' | 'space' = 'space';
    let candidate: SpaceItem | null = null;
    if (template.height_m > height) reason = 'height';
    else if (budget !== null && spaceCost(next) + template.price_eur > budget) reason = 'budget';
    else if (next.items.length >= 300) reason = 'space';
    else {
      const area = next.areas.find(a => a.id === request.zoneId);
      candidate = findSpacePosition(next, template.id, height, 0, area) || findSpacePosition(next, template.id, height, 90, area);
    }
    if (candidate && next.items.length < 300) {
      let id: string;
      do { id = `design-${++itemNumber}`; } while (usedIds.has(id));
      usedIds.add(id);
      next.items.push({ ...candidate, id });
    }
    else { const quantity = wanted.quantity - i; const previous = omitted.find(o => o.templateId === template.id && o.reason === reason); if (previous) previous.quantity += quantity; else omitted.push({ templateId: template.id, quantity, reason }); break; }
  }
  return { space: next, omitted };
}
export function demoSpace(): GymSpace {
  const space = emptySpace();
  space.walls = [
    { id: 'front-services', x: 0.15, y: 4, length: 14.85, axis: 'x', thickness: 0.12 },
    { id: 'reception-divider', x: 5, y: 0.15, length: 3.79, axis: 'y', thickness: 0.12 },
    { id: 'locker-divider', x: 10, y: 0.15, length: 3.79, axis: 'y', thickness: 0.12 },
    { id: 'locker-end', x: 15, y: 0.15, length: 3.79, axis: 'y', thickness: 0.12 },
  ];
  space.openings = [
    { id: 'entrance', wallId: 'edge-2', kind: 'door', offset: 1.2, width: 1.6, height: 2.3, sill: 0 },
    { id: 'main-entry', wallId: 'edge-0', kind: 'door', offset: 1.2, width: 1.6, height: 2.3, sill: 0 },
    { id: 'exit', wallId: 'edge-1', kind: 'door', offset: 12.5, width: 1.2, height: 2.3, sill: 0 },
    ...[1.4, 6.4, 11.4].map((offset, i) => ({ id: `room-door-${i}`, wallId: 'front-services', kind: 'door' as const, offset, width: 1, height: 2.2, sill: 0 })),
    { id: 'north-window', wallId: 'edge-0', kind: 'window', offset: 16, width: 3, height: 1.7, sill: 0.9 },
    { id: 'east-window', wallId: 'edge-1', kind: 'window', offset: 5, width: 4, height: 2.4, sill: 0.4 },
    { id: 'west-window', wallId: 'edge-3', kind: 'window', offset: 4.8, width: 3.6, height: 2.4, sill: 0.4 },
  ];
  space.columns = [{ id: 'column-a', x: 9.6, y: 8.6, w: 0.4, d: 0.4 }, { id: 'column-b', x: 14.6, y: 8.6, w: 0.4, d: 0.4 }];
  space.areas = [
    { id: 'receptie', name: 'Recepție', colour: '#b08d57', x: 0.2, y: 0.2, w: 4.6, d: 3.6 },
    { id: 'vestiare', name: 'Vestiare', colour: '#728185', x: 5.2, y: 0.2, w: 9.6, d: 3.6 },
    { id: 'functional', name: 'Funcțional', colour: '#8c917b', x: 15.3, y: 0.3, w: 4.4, d: 3.4 },
    { id: 'cardio', name: 'Cardio', colour: '#748b97', x: 0.3, y: 4.3, w: 7.3, d: 4.3 },
    { id: 'aparate', name: 'Forță', colour: '#9c826c', x: 8, y: 4.3, w: 11.6, d: 4 },
    { id: 'greutati', name: 'Greutăți libere', colour: '#7c858e', x: 0.3, y: 9.3, w: 9.2, d: 5.3 },
    { id: 'stretching', name: 'Stretching', colour: '#8a9b83', x: 10.3, y: 10, w: 9.3, d: 4.6 },
  ];
  space.finishes = { floor: 'tartan', wall: '#e3e2db', frame: '#333d46', upholstery: '#536c68' };
  const groups: Array<{ templateId: string; positions: Array<[number, number, number?]> }> = [
    { templateId: 'desk_receptie', positions: [[2.5, 1.8, 180]] },
    { templateId: 'canapea', positions: [[3.7, 3.2, 180]] },
    { templateId: 'dulap_vestiar', positions: [[5.65, 1.7, 270], [9.35, 1.7, 90], [10.65, 1.7, 270], [14.35, 1.7, 90]] },
    { templateId: 'banca_vestiar', positions: [[7.5, 2.2], [12.5, 2.2]] },
    { templateId: 'dus', positions: [[8.2, 0.9], [13.2, 0.9]] },
    { templateId: 'wc', positions: [[6.8, 0.9], [11.8, 0.9]] },
    { templateId: 'lavoar', positions: [[8.5, 3.2], [13.5, 3.2]] },
    { templateId: 'banda_alergare', positions: [[1.3, 6.2, 90], [2.8, 6.2, 90], [4.3, 6.2, 90]] },
    { templateId: 'real_spin_bike', positions: [[5.8, 5.7, 90], [7, 5.7, 90]] },
    { templateId: 'eliptica', positions: [[6.35, 7.6]] },
    { templateId: 'real_multigym', positions: [[9.2, 6.1, 90]] },
    { templateId: 'aparat_piept', positions: [[11.4, 6.1, 90]] },
    { templateId: 'cad_leg_press', positions: [[14.1, 6.2, 90]] },
    { templateId: 'real_cable_crossover', positions: [[17.4, 6.1, 90]] },
    { templateId: 'real_rower', positions: [[18.7, 12.9, 90]] },
    { templateId: 'real_power_rack', positions: [[1.6, 10.8, 90], [4.5, 10.8, 90]] },
    { templateId: 'real_adjustable_bench', positions: [[1.5, 13.1, 90], [4.2, 13.1, 90], [7.2, 13.1, 90]] },
    { templateId: 'cad_dumbbell_rack', positions: [[7.5, 10, 90], [7.5, 11.5, 90]] },
    { templateId: 'rig_crossfit', positions: [[17.4, 1.9]] },
    { templateId: 'box_pliometric', positions: [[15.8, 3.1], [19.1, 3.1]] },
    { templateId: 'saltea_stretching', positions: [[11.9, 11.4], [15.1, 11.4], [11.9, 13.5], [15.1, 13.5]] },
  ];
  space.items = groups.flatMap(({ templateId, positions }) => positions.map(([x, y, rotation = 0], i) => ({ id: `demo-${templateId}-${i + 1}`, templateId, x, y, rotation })));
  return space;
}
