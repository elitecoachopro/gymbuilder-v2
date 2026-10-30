import { emptySpace, demoSpace, spaceArea, spaceCost, type GymSpace } from './gym-space.ts';

export const FLOOR_RISE_M = 3.9;
export type Storey = 0 | 1;
export function floorSpace(building: GymSpace, storey: Storey): GymSpace {
  if (storey === 1 && building.upperFloor) return building.upperFloor;
  const { upperFloor: _upper, ...ground } = building;
  return ground;
}
export function replaceFloorSpace(building: GymSpace, floor: GymSpace, storey: Storey): GymSpace {
  const { upperFloor: _ignored, ...clean } = floor;
  return storey === 1
    ? { ...building, upperFloor: clean }
    : { ...clean, ...(building.upperFloor ? { upperFloor: building.upperFloor } : {}) };
}
export function buildingArea(building: GymSpace) {
  return spaceArea(building) + (building.upperFloor ? spaceArea(building.upperFloor) : 0);
}
export function floorBudget(building: GymSpace, storey: Storey, budget: number | null) {
  if (budget === null) return null;
  const inactive = storey === 1 ? floorSpace(building, 0) : building.upperFloor;
  return Math.max(0, budget - (inactive ? spaceCost(inactive) : 0));
}
export function demoBuildingSpace(): GymSpace {
  const ground = demoSpace();
  ground.items = ground.items.filter((i) => !(i.x > 16 && i.y > 9));
  ground.items.push({
    id: 'campus-receptionist',
    templateId: 'person_reception',
    x: 2.35,
    y: 2.65,
    rotation: 180,
  });
  ground.openings = ground.openings.map((o) =>
    o.id === 'exit' ? { ...o, wallId: 'edge-2', offset: 8 } : o
  );
  ground.items.push({
    id: 'campus-floor-coach',
    templateId: 'person_coach',
    x: 10.8,
    y: 9.4,
    rotation: 135,
  });
  ground.stairwell = { x: 16.6, y: 9.8, w: 3, d: 4.8, opening: false };
  const upper = emptySpace();
  upper.finishes = { floor: 'tartan', wall: '#d8d9d3', frame: '#252d30', upholstery: '#805f4d' };
  upper.stairwell = { ...ground.stairwell, opening: true };
  upper.openings = [
    {
      id: 'u-window-a',
      wallId: 'edge-0',
      kind: 'window',
      offset: 1,
      width: 7,
      height: 2.4,
      sill: 0.4,
    },
    {
      id: 'u-window-b',
      wallId: 'edge-1',
      kind: 'window',
      offset: 1,
      width: 7,
      height: 2.4,
      sill: 0.4,
    },
    {
      id: 'u-window-c',
      wallId: 'edge-3',
      kind: 'window',
      offset: 1,
      width: 10,
      height: 2.4,
      sill: 0.4,
    },
  ];
  upper.areas = [
    {
      id: 'functional',
      name: 'Pistă sanie · 10 m',
      colour: '#587760',
      x: 0.7,
      y: 2,
      w: 2.5,
      d: 10,
    },
    { id: 'greutati', name: 'Fitness · etaj 1', colour: '#63717a', x: 5, y: 1, w: 10.5, d: 12.8 },
  ];
  const items: Array<[string, number, number, number?]> = [
    ['sled_training', 1.95, 5.5],
    ['person_coach', 4.05, 5.4, 90],
    ['real_power_rack', 7, 3, 90],
    ['real_power_rack', 10.1, 3, 90],
    ['real_cable_crossover', 14, 3.2, 90],
    ['real_multigym', 7, 6.3, 90],
    ['cad_leg_press', 10.3, 6.4, 90],
    ['plate_chest_press', 7, 9.2],
    ['hip_thrust', 10, 9.2],
    ['cad_dumbbell_rack', 13.6, 8.9, 90],
    ['real_spin_bike', 6.5, 12.8, 90],
    ['real_spin_bike', 8, 12.8, 90],
    ['real_rower', 11.3, 12.6],
    ['eliptica', 14.1, 12.6],
    ['shoulder_press',17.6,3],
    ['seated_row',14,6.3],
    ['real_adjustable_bench',8.4,10.9,90],
  ];
  upper.items = items.map(([templateId, x, y, rotation = 0], i) => ({
    id: 'upper-' + i,
    templateId,
    x,
    y,
    rotation,
  }));
  return { ...ground, upperFloor: upper };
}
