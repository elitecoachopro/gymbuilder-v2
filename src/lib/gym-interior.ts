import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { insideOutline, spaceBounds, wallBox, type GymSpace } from './gym-space.ts';
import type { InteriorStyle } from './gym-visualization.ts';

export const INTERIOR_PALETTES = {
  minimal: { ceiling: '#d4d6cf', housing: '#29343c', panel: '#c3c9c6', slats: '#929d9e', light: '#edf5ff', reflection: 0.8 },
  warm: { ceiling: '#b9b2a5', housing: '#383a37', panel: '#3e403c', slats: '#a27c52', light: '#ffe3b1', reflection: 0.75 },
  industrial: { ceiling: '#242b31', housing: '#10171c', panel: '#252e35', slats: '#505b65', light: '#e3efff', reflection: 0.9 },
} satisfies Record<InteriorStyle, object>;

export function ceilingFixtures(space: Pick<GymSpace, 'outline' | 'columns' | 'walls' | 'stairwell'>): Array<[number, number]> {
  const { length, width } = spaceBounds(space);
  const positions: Array<[number, number]> = [];
  const nx = Math.min(6, Math.max(1, Math.floor(length / 3.5)));
  const nz = Math.min(4, Math.max(1, Math.floor(width / 3.5)));
  const obstacles = [...space.columns, ...space.walls.map(wall => wallBox(wall)), ...(space.stairwell ? [space.stairwell] : [])];
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const x = (i + 0.5) * length / nx, z = (j + 0.5) * width / nz;
    const a = x - 1.05, b = x + 1.05, c = z - 0.7, d = z + 0.7;
    if (![a, b].every(px => [c, d].every(py => insideOutline({ x: px, y: py }, space.outline)))) continue;
    if (space.outline.some(p => p.x > a && p.x < b && p.y > c && p.y < d)) continue;
    if (obstacles.some(box => a < box.x + box.w && b > box.x && c < box.y + box.d && d > box.y)) continue;
    positions.push([x, z]);
  }
  return positions;
}

type Box = [number, number, number, number, number, number];
function boxGeometry(boxes: Box[]) {
  const cube = new THREE.BoxGeometry(1, 1, 1), matrix = new THREE.Matrix4();
  const parts = boxes.map(([x, y, z, w, h, d]) => {
    matrix.makeScale(w, h, d).setPosition(x, y, z);
    return cube.clone().applyMatrix4(matrix);
  });
  cube.dispose();
  const geometry = mergeGeometries(parts);
  parts.forEach(part => part.dispose());
  return geometry;
}

export function buildCeilingFixtures(positions: Array<[number, number]>, height: number, style: InteriorStyle) {
  if (!positions.length) return {};
  const housing: Box[] = [], diffuser: Box[] = [];
  for (const [x, z] of positions) {
    const y = height - 0.22;
    if (style === 'minimal') {
      housing.push([x, y, z, 1.84, 0.06, 0.13]);
      diffuser.push([x, y - 0.035, z, 1.75, 0.012, 0.075]);
    } else {
      for (const side of [-1, 1]) {
        housing.push([x, y, z + side * 0.55, 1.96, 0.065, 0.085], [x + side * 0.94, y, z, 0.085, 0.065, 1.1]);
        diffuser.push([x, y - 0.038, z + side * 0.55, 1.86, 0.012, 0.038], [x + side * 0.94, y - 0.038, z, 0.038, 0.012, 1.1]);
        housing.push([x + side * 0.8, height - 0.09, z, 0.012, 0.18, 0.012]);
      }
    }
  }
  return { housing: boxGeometry(housing), diffuser: boxGeometry(diffuser) };
}

export function buildWallFinish(width: number, height: number, style: InteriorStyle) {
  const h = Math.min(height - 0.3, 3.1);
  const backing: Box[] = [[0, h / 2 + 0.06, -0.015, width, h, 0.025]];
  const ribs: Box[] = [];
  const count = Math.min(48, Math.floor(width / (style === 'industrial' ? 0.3 : 0.12)));
  if (style !== 'minimal') for (let i = 0; i < count; i++) {
    ribs.push([-width / 2 + (i + 0.5) * width / count, h / 2 + 0.06, 0.012, style === 'industrial' ? 0.018 : 0.036, h, 0.045]);
  }
  return { backing: boxGeometry(backing), ...(ribs.length ? { ribs: boxGeometry(ribs) } : {}) };
}
