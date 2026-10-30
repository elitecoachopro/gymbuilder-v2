import { EQUIPMENT_PILOT_IDS } from './gym-equipment-pilot.ts';
import { emptySpace } from './gym-space.ts';
import { DEFAULT_VISUALIZATION } from './gym-visualization.ts';

export function equipmentPilotSpace() {
  const space = emptySpace(20, 10);
  return {
    ...space,
    finishes: { ...space.finishes, floor: 'rubber' as const, frame: '#343f48', upholstery: '#98423d' },
    visualization: { ...DEFAULT_VISUALIZATION, interiorStyle: 'warm' as const, lighting: 'studio' as const, dimensions: false },
    openings: [
      ...[1, 4, 7].map((offset, i) => ({ id: `pilot-window-${i}`, wallId: 'edge-3', kind: 'window' as const, offset, width: 2, height: 2, sill: 0.7 })),
      { id: 'pilot-entry', wallId: 'edge-2', kind: 'door' as const, offset: 1, width: 1.2, height: 2.2, sill: 0 },
    ],
    items: EQUIPMENT_PILOT_IDS.map((templateId, index) => ({
      id: `pilot-${index + 1}`, templateId,
      x: 2 + index % 5 * 4, y: 2.5 + Math.floor(index / 5) * 5, rotation: 0,
    })),
  };
}
