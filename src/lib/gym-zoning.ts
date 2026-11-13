import { EQUIPMENT_CATALOG, ZONE_DEFINITIONS, areaZoneId, equipmentMatchesZone } from './gym-catalog.ts';
import { areasForZone, emptySpace, itemFitsSpace, itemPolygon, populateSpace, spaceBounds, spaceCost, validateSpace, type GymSpace, type SpaceItem, type SpaceBox } from './gym-space.ts';

type ZoneRequest = { zoneId: string; weight?: number; equipment: Array<{ templateId: string; quantity: number }> };
type Area = GymSpace['areas'][number];
type Omission = ReturnType<typeof populateSpace>['omitted'][number];
const INSET = 0.2, HALL = 1.2;
const round = (v: number) => Math.round(v * 100) / 100;
const boundsOf = (item: SpaceItem): SpaceBox => {
  const p = itemPolygon(item), x = Math.min(...p.map(p => p.x)), y = Math.min(...p.map(p => p.y));
  return { x, y, w: Math.max(...p.map(p => p.x)) - x, d: Math.max(...p.map(p => p.y)) - y };
};
const overlaps = (a: SpaceBox, b: SpaceBox, gap = 0) => a.x < b.x + b.w + gap - 0.001 && a.x + a.w + gap > b.x + 0.001 && a.y < b.y + b.d + gap - 0.001 && a.y + a.d + gap > b.y + 0.001;
const inside = (item: SpaceItem, area: SpaceBox) => itemPolygon(item).every(p => p.x >= area.x && p.y >= area.y && p.x <= area.x + area.w && p.y <= area.y + area.d);

function architecture(length: number, depth: number, requests: ZoneRequest[]) {
  const space = emptySpace(length, depth);
  const active = requests;
  const reception = active.some(z => z.zoneId === 'receptie'), changing = active.some(z => z.zoneId === 'vestiare');
  const services = reception || changing;
  const serviceDepth = services ? round(Math.max(3.6, Math.min(5.5, depth * 0.32))) : 0;
  const hallY = services ? serviceDepth + 0.1 : INSET;
  space.areas.push({ id: 'circulatie', name: 'Circulație principală', colour: '#64748b', x: INSET, y: hallY, w: length - 2 * INSET, d: HALL });
  const serviceRooms: Array<{ id: string; name: string; x: number; w: number; colour: string }> = [];
  const receptionWidth = changing ? Math.max(3.2, Math.min(4, length * 0.2)) : length;
  if (reception) serviceRooms.push({ id: 'receptie', name: 'Recepție', x: 0, w: receptionWidth, colour: '#f59e0b' });
  if (changing) {
    const start = reception ? receptionWidth : 0, roomWidth = (length - start) / 2;
    serviceRooms.push({ id: 'vestiare-femei', name: 'Vestiar femei · dușuri și WC', x: start, w: roomWidth, colour: '#8b5cf6' }, { id: 'vestiare-barbati', name: 'Vestiar bărbați · dușuri și WC', x: start + roomWidth, w: roomWidth, colour: '#6366f1' });
  }
  if (services) {
    space.walls.push({ id: 'zoning-back', x: 0.08, y: serviceDepth, length: length - 0.16, axis: 'x', thickness: 0.12 });
    for (const [index, room] of serviceRooms.entries()) {
      space.areas.push({ id: room.id, name: room.name, colour: room.colour, x: round(room.x + INSET), y: INSET, w: round(room.w - 2 * INSET), d: round(serviceDepth - 2 * INSET) });
      if (index > 0) space.walls.push({ id: `zoning-divider-${index}`, x: room.x, y: 0.08, length: serviceDepth - 0.08, axis: 'y', thickness: 0.12 });
      space.openings.push({ id: `zoning-door-${room.id}`, wallId: 'zoning-back', kind: 'door', offset: round(room.x + room.w / 2 - 0.08 - 0.5), width: 1, height: 2.1, sill: 0 });
    }
  }
  space.openings.push({ id: 'zoning-entry', wallId: reception ? 'edge-0' : 'edge-1', kind: 'door', offset: reception ? round(receptionWidth / 2 - 0.5) : round(hallY + HALL / 2 - 0.5), width: 1, height: 2.1, sill: 0 });
  const training = active.filter(z => !['receptie', 'vestiare'].includes(z.zoneId));
  const available = length - 2 * INSET - Math.max(0, training.length - 1) * 0.4;
  const trainingDepth = depth - INSET - (hallY + HALL + INSET);
  const minimumWidths = training.map(zone => {
    const enclosed = ['studio', 'spa'].includes(zone.zoneId);
    return zone.equipment.reduce((width, equipment) => {
      const template = EQUIPMENT_CATALOG.find(model => model.id === equipment.templateId);
      if (!template || equipment.quantity === 0) return width;
      const candidates = [
        { width: template.length_m, depth: template.width_m },
        { width: template.width_m, depth: template.length_m },
      ].filter(size => size.depth + 0.22 <= trainingDepth);
      return candidates.length ? Math.max(width, Math.min(...candidates.map(size => size.width)) + 0.22) : width;
    }, enclosed ? 1.4 : 0.5);
  });
  const weights = training.map(zone => Math.max(1, zone.weight || 0, zone.equipment.reduce((sum, equipment) => {
    const template = EQUIPMENT_CATALOG.find(model => model.id === equipment.templateId);
    return sum + (template ? (template.length_m + 0.8) * (template.width_m + 0.8) * equipment.quantity : 0);
  }, 0)));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const baseWidths = weights.map(weight => available * weight / total);
  const minimumTotal = minimumWidths.reduce((sum, width) => sum + width, 0);
  const extra = available - minimumTotal;
  const slack = baseWidths.map((width, index) => Math.max(0, width - minimumWidths[index]));
  const totalSlack = slack.reduce((sum, width) => sum + width, 0);
  const widths = extra >= 0 && totalSlack > 0
    ? minimumWidths.map((width, index) => width + extra * slack[index] / totalSlack)
    : baseWidths;
  let x = INSET;
  for (const [index, z] of training.entries()) {
    const definition = ZONE_DEFINITIONS.find(d => d.id === z.zoneId);
    const width = index === training.length - 1 ? length - INSET - x : widths[index];
    const area = { id: z.zoneId, name: definition?.name || z.zoneId, colour: definition?.color || '#64748b', x: round(x), y: round(hallY + HALL + INSET), w: round(width), d: round(trainingDepth) };
    space.areas.push(area);
    if (['studio', 'spa'].includes(z.zoneId) && area.w >= 1.4) {
      const left = round(area.x - 0.1), right = round(area.x + area.w + 0.1);
      const front = round(area.y - 0.1), back = round(area.y + area.d + 0.1);
      const prefix = `zoning-${z.zoneId}`;
      space.walls.push(
        { id: `${prefix}-front`, x: left, y: front, length: round(right - left), axis: 'x', thickness: 0.12 },
        { id: `${prefix}-back`, x: left, y: back, length: round(right - left), axis: 'x', thickness: 0.12 },
        { id: `${prefix}-left`, x: left, y: front, length: round(back - front), axis: 'y', thickness: 0.12 },
        { id: `${prefix}-right`, x: right, y: front, length: round(back - front), axis: 'y', thickness: 0.12 },
      );
      space.openings.push({ id: `zoning-door-${z.zoneId}`, wallId: `${prefix}-front`, kind: 'door', offset: round((right - left - 1) / 2), width: 1, height: 2.1, sill: 0 });
    }
    x += width + 0.4;
  }
  return space;
}

function transpose(space: GymSpace, outline: GymSpace['outline']): GymSpace {
  return { ...space, outline,
    walls: space.walls.map(w => ({ ...w, x: w.y, y: w.x, axis: w.axis === 'x' ? 'y' : 'x' })),
    openings: space.openings.map(o => ({ ...o, wallId: o.wallId === 'edge-0' ? 'edge-3' : o.wallId === 'edge-1' ? 'edge-2' : o.wallId })),
    areas: space.areas.map(a => ({ ...a, x: a.y, y: a.x, w: a.d, d: a.w })),
    items: space.items.map(i => ({ ...i, x: i.y, y: i.x, rotation: (90 - i.rotation + 360) % 360 })),
  };
}

function findZonedPosition(space: GymSpace, templateId: string, area: Area, height: number, transposed: boolean) {
  const template = EQUIPMENT_CATALOG.find(t => t.id === templateId);
  if (!template) return null;
  const service = areaZoneId(area) === 'receptie' || areaZoneId(area) === 'vestiare';
  const aisle: SpaceBox | null = !service ? null : transposed
    ? { x: area.x, y: area.y + area.d / 2 - 0.5, w: area.w, d: 1 }
    : { x: area.x + area.w / 2 - 0.5, y: area.y, w: 1, d: area.d };
  const gap = service ? 0.3 : 0.75;
  const neighbours = space.items.filter(i => inside(i, area));
  const neighbourBounds = neighbours.map(boundsOf);
  let best: SpaceItem | null = null, bestScore = -Infinity;
  for (const rotation of [0, 90]) {
    const halfW = (rotation ? template.width_m : template.length_m) / 2, halfD = (rotation ? template.length_m : template.width_m) / 2;
    const x0 = area.x + halfW + 0.1, x1 = area.x + area.w - halfW - 0.1;
    const y0 = area.y + halfD + 0.1, y1 = area.y + area.d - halfD - 0.1;
    if (x0 > x1 || y0 > y1) continue;
    const nx = Math.min(30, Math.max(1, Math.ceil((x1 - x0) / 0.35))), ny = Math.min(30, Math.max(1, Math.ceil((y1 - y0) / 0.35)));
    for (let iy = 0; iy <= ny; iy++) for (let ix = 0; ix <= nx; ix++) {
      const item = { id: 'zoning-candidate', templateId, x: round(x0 + (x1 - x0) * ix / nx), y: round(y0 + (y1 - y0) * iy / ny), rotation };
      const box = boundsOf(item);
      if (!inside(item, area) || (aisle && overlaps(box, aisle)) || neighbourBounds.some(other => overlaps(box, other, gap)) || !itemFitsSpace(space, item, height)) continue;
      const score = neighbours.length ? Math.min(...neighbours.map(i => (i.x - item.x) ** 2 + (i.y - item.y) ** 2)) : -((item.x - x0) ** 2 + (item.y - y0) ** 2);
      if (score > bestScore) { best = item; bestScore = score; }
    }
  }
  return best;
}

export function buildZonedGymProposal(original: GymSpace, requests: ZoneRequest[], height: number, budget: number | null, automatic = true) {
  const bounds = spaceBounds(original), long = Math.max(bounds.length, bounds.width), short = Math.min(bounds.length, bounds.width);
  const rectangular = original.outline.length === 4 && original.outline.every(p => (p.x === 0 || p.x === bounds.length) && (p.y === 0 || p.y === bounds.width));
  const blankArchitecture = !original.walls.length && !original.openings.length && !original.columns.length && !original.areas.length && !original.stairwell && !original.upperFloor;
  const generated = automatic && rectangular && blankArchitecture && long >= 10 && short >= 7;
  const existingZoning = original.openings.some(o => o.id === 'zoning-entry') && original.areas.some(a => a.id === 'circulatie');
  if (!automatic || (!generated && !existingZoning)) return { ...populateSpace(original, requests, height, budget), zoning: automatic ? 'preserved' as const : 'off' as const };
  const isTransposed = generated ? bounds.width > bounds.length : original.walls.some(w => w.id === 'zoning-back' && w.axis === 'y');
  let next: GymSpace = generated ? architecture(long, short, requests) : { ...original, items: [] };
  if (generated) {
    if (isTransposed) next = transpose(next, original.outline);
    next = { ...next, outline: original.outline, finishes: original.finishes, visualization: original.visualization };
  }
  if (validateSpace(next, height, null)) return { ...populateSpace(original, requests, height, budget), zoning: 'preserved' as const };
  const omitted: Omission[] = [], used = new Set([...next.walls, ...next.openings, ...next.columns, ...next.areas].map(o => o.id));
  let sequence = 0;
  const omit = (templateId: string, reason: Omission['reason'], quantity = 1) => {
    const entry = omitted.find(o => o.templateId === templateId && o.reason === reason);
    if (entry) entry.quantity += quantity; else omitted.push({ templateId, reason, quantity });
  };
  for (const request of requests) {
    const equipment = [...request.equipment].sort((a, b) => {
      const ta = EQUIPMENT_CATALOG.find(t => t.id === a.templateId), tb = EQUIPMENT_CATALOG.find(t => t.id === b.templateId);
      return (tb ? tb.length_m * tb.width_m : 0) - (ta ? ta.length_m * ta.width_m : 0);
    });
    for (const wanted of equipment) {
      const template = EQUIPMENT_CATALOG.find(t => t.id === wanted.templateId && equipmentMatchesZone(t, request.zoneId));
      if (!template) continue;
      const rooms = areasForZone(next, request.zoneId, template.id);
      for (let n = 0; n < wanted.quantity; n++) {
        if (template.height_m > height) { omit(template.id, 'height', wanted.quantity - n); break; }
        if (budget !== null && spaceCost(next) + template.price_eur > budget) { omit(template.id, 'budget', wanted.quantity - n); break; }
        if (!rooms.length || next.items.length >= 300) { omit(template.id, 'space', wanted.quantity - n); break; }
        const area = rooms[n % rooms.length];
        const candidate = findZonedPosition(next, template.id, area, height, isTransposed);
        if (!candidate) { omit(template.id, 'space'); continue; }
        let id: string; do { id = `zoned-${++sequence}`; } while (used.has(id)); used.add(id);
        next.items.push({ ...candidate, id });
      }
    }
  }
  return { space: next, omitted, zoning: generated ? 'generated' as const : 'preserved' as const };
}
