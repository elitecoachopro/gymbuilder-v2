export interface LayoutInput { id: string; name: string; color: string; area_m2: number }
export interface LayoutZone extends LayoutInput { x: number; y: number; w: number; h: number }

// Recursively divide a rectangle; every zone keeps its requested area.
export function layoutZones(inputs: LayoutInput[], totalArea: number, length: number, width: number): LayoutZone[] {
  if (![totalArea, length, width].every(value => Number.isFinite(value) && value > 0) || Math.abs(length * width - totalArea) > 0.02) throw new Error('Suprafața trebuie să corespundă lungimii × lățimii.');
  if (inputs.some(zone => !Number.isFinite(zone.area_m2) || zone.area_m2 < 0)) throw new Error('Suprafețele zonelor trebuie să fie pozitive.');
  const zones = inputs.filter(zone => zone.area_m2 > 0);
  const sum = zones.reduce((acc, zone) => acc + zone.area_m2, 0);
  if (sum > totalArea + 0.001 || sum <= 0) throw new Error('Suprafețele zonelor depășesc sala sau sunt goale.');
  const split = (items: LayoutInput[], x: number, y: number, w: number, h: number): LayoutZone[] => {
    if (items.length === 1) return [{ ...items[0], x, y, w, h }];
    const mid = Math.ceil(items.length / 2);
    const left = items.slice(0, mid), right = items.slice(mid);
    const ratio = left.reduce((n, item) => n + item.area_m2, 0) / items.reduce((n, item) => n + item.area_m2, 0);
    return w * length >= h * width
      ? [...split(left, x, y, w * ratio, h), ...split(right, x + w * ratio, y, w * (1 - ratio), h)]
      : [...split(left, x, y, w, h * ratio), ...split(right, x, y + h * ratio, w, h * (1 - ratio))];
  };
  return split(zones, 0, 0, 100 * sum / totalArea, 100);
}

export function validProjectGeometry(project: { total_area: number; length_m: number; width_m: number; zones?: unknown }) {
  const { total_area: area, length_m: length, width_m: width } = project;
  if (project.zones != null && (!Array.isArray(project.zones) || project.zones.some(zone => !zone || typeof zone !== 'object' || Array.isArray(zone)))) return false;
  const zones: Array<Record<string, unknown>> = project.zones == null ? [] : project.zones as Array<Record<string, unknown>>;
  if (![area, length, width].every(value => Number.isFinite(value) && value > 0) || Math.abs(area - length * width) > 0.02) return false;
  const tolerance = 0.001;
  for (const zone of zones) {
    if (typeof zone.id !== 'string' || !zone.id || zone.id.length > 100 || typeof zone.name !== 'string' || !zone.name.trim() || zone.name.length > 120 || typeof zone.color !== 'string' || !/^#(?:[a-f0-9]{3}|[a-f0-9]{6}|[a-f0-9]{8})$/i.test(zone.color)) return false;
    const { x, y, w, h, area_m2 } = zone;
    if (![x, y, w, h, area_m2].every(value => typeof value === 'number' && Number.isFinite(value))) return false;
    const rectangle = zone as unknown as LayoutZone;
    if (rectangle.x < 0 || rectangle.y < 0 || rectangle.w <= 0 || rectangle.h <= 0 || rectangle.x + rectangle.w > 100 + tolerance || rectangle.y + rectangle.h > 100 + tolerance) return false;
    if (Math.abs(rectangle.area_m2 - rectangle.w * rectangle.h * area / 10000) > 0.02) return false;
    if (zones.some(other => other !== zone && rectangle.x < Number(other.x) + Number(other.w) - tolerance && rectangle.x + rectangle.w > Number(other.x) + tolerance && rectangle.y < Number(other.y) + Number(other.h) - tolerance && rectangle.y + rectangle.h > Number(other.y) + tolerance)) return false;
  }
  const allEquipment: EquipmentRectangle[] = [];
  for (const zone of zones) {
    if (zone.equipment === undefined) continue;
    if (!Array.isArray(zone.equipment)) return false;
    for (const item of zone.equipment) {
      if (!item || typeof item !== 'object' || Array.isArray(item) || typeof item.instanceId !== 'string' || !item.instanceId || item.instanceId.length > 200 || allEquipment.some(other => other.instanceId === item.instanceId) || ![item.x, item.y, item.w, item.h, item.length_m, item.width_m].every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0)) return false;
      const equipment = item as EquipmentRectangle;
      if (!equipmentFits(equipment, zone as unknown as LayoutZone, allEquipment) || Math.abs(equipment.w * length / 100 - item.length_m) > 0.02 || Math.abs(equipment.h * width / 100 - item.width_m) > 0.02) return false;
      allEquipment.push(equipment);
    }
  }
  return new Set(zones.map(zone => zone.id)).size === zones.length;
}

export interface EquipmentRectangle { instanceId: string; zoneId: string; x: number; y: number; w: number; h: number }
export function equipmentFits(candidate: EquipmentRectangle, zone: { id: string; x: number; y: number; w: number; h: number }, placed: EquipmentRectangle[]) {
  const epsilon = 0.00001;
  return candidate.zoneId === zone.id && candidate.w > 0 && candidate.h > 0 && candidate.x >= zone.x - epsilon && candidate.y >= zone.y - epsilon && candidate.x + candidate.w <= zone.x + zone.w + epsilon && candidate.y + candidate.h <= zone.y + zone.h + epsilon && !placed.some(other => other.instanceId !== candidate.instanceId && candidate.x < other.x + other.w - epsilon && candidate.x + candidate.w > other.x + epsilon && candidate.y < other.y + other.h - epsilon && candidate.y + candidate.h > other.y + epsilon);
}
export function findEquipmentPosition(zone: { id: string; x: number; y: number; w: number; h: number }, w: number, h: number, placed: EquipmentRectangle[]) {
  if (w > zone.w || h > zone.h || w <= 0 || h <= 0) return null;
  let instanceId = 'candidate';
  while (placed.some(item => item.instanceId === instanceId)) instanceId += '-';
  const xCandidates = [zone.x, ...placed.filter(item => item.zoneId === zone.id).map(item => item.x + item.w + 0.25)];
  const yCandidates = [zone.y, ...placed.filter(item => item.zoneId === zone.id).map(item => item.y + item.h + 0.25)];
  for (const y of yCandidates) for (const x of xCandidates) {
    const candidate = { instanceId, zoneId: zone.id, x, y, w, h };
    if (equipmentFits(candidate, zone, placed)) return { x, y };
  }
  return null;
}
