import { EQUIPMENT_CATALOG } from './gym-catalog.ts';
import { boxPolygon, itemPolygon, polygonFits, polygonsOverlap, spaceWalls, wallBox, type GymSpace, type SpaceItem, type SpacePoint } from './gym-space.ts';

type UsageConflict = { kind: 'equipment' | 'wall' | 'column'; id: string } | { kind: 'outline' | 'stairs' };

export function equipmentUsagePolygon(item: SpaceItem): SpacePoint[] | null {
  const model = EQUIPMENT_CATALOG.find(e => e.id === item.templateId);
  if (!model?.usage) return null;
  const halfLength = model.length_m / 2 + model.usage.lengthMargin, halfWidth = model.width_m / 2 + model.usage.widthMargin;
  const radians = item.rotation * Math.PI / 180, c = Math.cos(radians), s = Math.sin(radians);
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => ({ x: item.x + x * halfLength * c - y * halfWidth * s, y: item.y + x * halfLength * s + y * halfWidth * c }));
}

export function assessEquipmentUsage(space: GymSpace, item: SpaceItem): { envelope: SpacePoint[] | null; conflicts: UsageConflict[] } {
  const envelope = equipmentUsagePolygon(item), conflicts: UsageConflict[] = [];
  if (!envelope) return { envelope, conflicts };
  if (!polygonFits(envelope, space.outline)) conflicts.push({ kind: 'outline' });
  for (const other of space.items) {
    if (other.id !== item.id && polygonsOverlap(envelope, equipmentUsagePolygon(other) ?? itemPolygon(other))) conflicts.push({ kind: 'equipment', id: other.id });
  }
  for (const wall of spaceWalls(space)) if (polygonsOverlap(envelope, boxPolygon(wallBox(wall)))) conflicts.push({ kind: 'wall', id: wall.id });
  for (const column of space.columns) if (polygonsOverlap(envelope, boxPolygon(column))) conflicts.push({ kind: 'column', id: column.id });
  if (space.stairwell && polygonsOverlap(envelope, boxPolygon(space.stairwell))) conflicts.push({ kind: 'stairs' });
  return { envelope, conflicts };
}
