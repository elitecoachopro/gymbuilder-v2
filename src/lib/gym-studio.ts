import { z } from 'zod';
import { buildingArea } from './gym-building.ts';
import { EQUIPMENT_CATALOG, ZONE_DEFINITIONS } from './gym-catalog.ts';
import { importedEquipment } from './gym-imported-equipment.ts';
import { layoutZones, findEquipmentPosition, validProjectGeometry, type LayoutZone } from './gym-layout.ts';
import { spaceSchema, spaceBounds, validateSpace } from './gym-space.ts';

export const studioConfigurationSchema = z.object({
  version: z.literal(1), height_m: z.number().finite().min(2).max(30),
  budget_eur: z.number().finite().positive().max(99999999).nullable(),
  brief: z.string().max(6000), zone_ids: z.array(z.string()).min(1).max(10),
  profile: z.enum(['balanced', 'strength', 'boutique']),
  space: spaceSchema.optional(),
}).strict().refine(v => new Set(v.zone_ids).size === v.zone_ids.length && v.zone_ids.every(id => ZONE_DEFINITIONS.some(z => z.id === id)));
export type StudioConfiguration = z.infer<typeof studioConfigurationSchema>;
export type GymBrief = Omit<StudioConfiguration, 'version'> & { total_area: number; length_m: number; width_m: number };
export interface StudioEquipment {
  instanceId: string; templateId: string; name: string; zoneId: string;
  x: number; y: number; w: number; h: number; length_m: number; width_m: number;
  height_m?: number; rotation?: number;
}
export interface ZoneRequest { zoneId: string; weight: number; equipment: Array<{ templateId: string; quantity: number }> }
export interface GymProposal {
  zones: LayoutZone[]; equipment: StudioEquipment[]; cost_eur: number; circulation_m2: number;
  unplaced: Array<{ templateId: string; quantity: number; reason: 'height' | 'budget' | 'space' }>;
}

export function equipmentCost(equipment: StudioEquipment[]) {
  return equipment.reduce((sum, item) => sum + (EQUIPMENT_CATALOG.find(t => t.id === item.templateId)?.price_eur || 0), 0);
}

export function defaultZoneRequests(brief: GymBrief): ZoneRequest[] {
  return ZONE_DEFINITIONS.filter(z => brief.zone_ids.includes(z.id)).map(zone => ({
    zoneId: zone.id,
    weight: zone.defaultPercent * (brief.profile === 'strength' && ['greutati', 'aparate', 'functional'].includes(zone.id) ? 1.8 : brief.profile === 'boutique' && ['studio', 'stretching', 'lounge'].includes(zone.id) ? 1.8 : 1),
    equipment: EQUIPMENT_CATALOG.filter(t => t.zone === zone.id && !importedEquipment(t.id)).map(t => ({ templateId: t.id, quantity: ['cardio', 'aparate', 'greutati'].includes(zone.id) ? Math.max(1, Math.min(8, Math.floor(brief.total_area / 180))) : 1 })),
  }));
}

export function buildGymProposal(brief: GymBrief, requests = defaultZoneRequests(brief)): GymProposal {
  studioConfigurationSchema.parse({ version: 1, height_m: brief.height_m, budget_eur: brief.budget_eur, brief: brief.brief, zone_ids: brief.zone_ids, profile: brief.profile });
  if (!requests.length || requests.length > 10 || new Set(requests.map(r => r.zoneId)).size !== requests.length) throw new Error('Invalid zone requests');
  for (const request of requests) {
    if (!brief.zone_ids.includes(request.zoneId) || !Number.isFinite(request.weight) || request.weight <= 0 || request.weight > 1000 || request.equipment.length > 30) throw new Error('Invalid zone requests');
    for (const item of request.equipment) {
      if (!Number.isInteger(item.quantity) || item.quantity < 0 || item.quantity > 30 || !EQUIPMENT_CATALOG.some(t => t.id === item.templateId && t.zone === request.zoneId)) throw new Error('Invalid catalog request');
    }
  }
  if (requests.reduce((n, r) => n + r.equipment.reduce((m, e) => m + e.quantity, 0), 0) > 500) throw new Error('Too many models');
  const weight = requests.reduce((n, r) => n + r.weight, 0);
  const zones = layoutZones(requests.map(r => ({ ...ZONE_DEFINITIONS.find(z => z.id === r.zoneId)!, area_m2: brief.total_area * 0.85 * r.weight / weight })), brief.total_area, brief.length_m, brief.width_m);
  const equipment: StudioEquipment[] = [], unplaced: GymProposal['unplaced'] = [];
  let cost = 0;
  for (const request of requests) for (const item of request.equipment) {
    const t = EQUIPMENT_CATALOG.find(t => t.id === item.templateId)!;
    const zone = zones.find(z => z.id === request.zoneId)!;
    for (let i = 0; i < item.quantity; i++) {
      let reason: GymProposal['unplaced'][number]['reason'] | undefined;
      if (t.height_m > brief.height_m) reason = 'height';
      else if (brief.budget_eur !== null && cost + t.price_eur > brief.budget_eur) reason = 'budget';
      const workingClearanceM = 0.3;
      const marginX = workingClearanceM / brief.length_m * 100, marginY = workingClearanceM / brief.width_m * 100;
      const w = t.length_m / brief.length_m * 100, h = t.width_m / brief.width_m * 100;
      const envelopes = equipment.map(e => ({ ...e, x: e.x - marginX, y: e.y - marginY, w: e.w + 2 * marginX, h: e.h + 2 * marginY }));
      const p = reason ? null : findEquipmentPosition(zone, w + 2 * marginX, h + 2 * marginY, envelopes);
      if (!p && !reason) reason = 'space';
      if (reason) { const previous = unplaced.find(e => e.templateId === t.id && e.reason === reason); if (previous) previous.quantity++; else unplaced.push({ templateId: t.id, quantity: 1, reason }); }
      else if (p) {
        equipment.push({ instanceId: `generated-${equipment.length + 1}`, templateId: t.id, name: t.name, zoneId: zone.id, x: p.x + marginX, y: p.y + marginY, w, h, length_m: t.length_m, width_m: t.width_m, height_m: t.height_m, rotation: 0 });
        cost += t.price_eur;
      }
    }
  }
  return { zones, equipment, cost_eur: cost, circulation_m2: brief.total_area * 0.15, unplaced };
}

export function validStudioProject(project: { total_area: number; length_m: number; width_m: number; zones?: unknown; configuration?: unknown }) {
  if (project.configuration && typeof project.configuration === 'object' && 'space' in project.configuration) {
    const config = studioConfigurationSchema.safeParse(project.configuration);
    if (!config.success || !config.data.space || !Array.isArray(project.zones) || project.zones.length !== 0) return false;
    const bounds = spaceBounds(config.data.space);
    return Math.abs(buildingArea(config.data.space) - project.total_area) < 0.02 && Math.abs(bounds.length - project.length_m) < 0.02 && Math.abs(bounds.width - project.width_m) < 0.02 && validateSpace(config.data.space, config.data.height_m, config.data.budget_eur) === null;
  }
  if (!validProjectGeometry(project)) return false;
  if (project.configuration == null) return true;
  const parsed = studioConfigurationSchema.safeParse(project.configuration);
  if (!parsed.success) return false;
  const zoneIds = (project.zones as LayoutZone[] || []).map(z => z.id);
  if (zoneIds.length !== parsed.data.zone_ids.length || zoneIds.some(id => !parsed.data.zone_ids.includes(id))) return false;
  const equipment = (project.zones as Array<LayoutZone & { equipment?: StudioEquipment[] }> || []).flatMap(z => z.equipment || []);
  if (equipment.length > 500) return false;
  for (const item of equipment) {
    const template = EQUIPMENT_CATALOG.find(t => t.id === item.templateId);
    if (!template || template.height_m > parsed.data.height_m || template.zone !== item.zoneId) return false;
    if (![0, 90, 180, 270].includes(item.rotation || 0)) return false;
    const rotated = item.rotation === 90 || item.rotation === 270;
    if (Math.abs(item.length_m - (rotated ? template.width_m : template.length_m)) > 0.02 || Math.abs(item.width_m - (rotated ? template.length_m : template.width_m)) > 0.02) return false;
  }
  return parsed.data.budget_eur === null || equipmentCost(equipment) <= parsed.data.budget_eur;
}
