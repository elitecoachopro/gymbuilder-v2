import { z } from 'zod';

export const visualizationSchema = z.object({
  lighting: z.enum(['daylight', 'evening', 'studio']),
  eyeHeight: z.number().finite().min(1.2).max(2),
  fov: z.number().finite().min(35).max(75),
  snap: z.union([z.literal(0.01), z.literal(0.05), z.literal(0.1), z.literal(0.25)]),
  dimensions: z.boolean(),
  interiorStyle: z.enum(['minimal', 'warm', 'industrial']).optional(),
}).strict();
export type GymVisualization = z.infer<typeof visualizationSchema>;
export type InteriorStyle = NonNullable<GymVisualization['interiorStyle']>;
export const DEFAULT_VISUALIZATION: GymVisualization = { lighting: 'daylight', eyeHeight: 1.65, fov: 45, snap: 0.1, dimensions: true };

export const LIGHTING_PRESETS = {
  daylight: { background: '#c3cbc9', sky: '#f3f5f1', ground: '#7b868a', sun: '#fff3e5', fill: '#dce7ef', ambient: 0.3, hemisphere: 1.1, strength: 2.4, fillStrength: 1.35, exposure: 1.08, sunX: 0.2, sunZ: 0.6, sunHeight: 15 },
  evening: { background: '#727c91', sky: '#f4d8bc', ground: '#414b60', sun: '#ffb96b', fill: '#a5b5d2', ambient: 0.25, hemisphere: 0.85, strength: 1.7, fillStrength: 0.85, exposure: 0.98, sunX: -0.4, sunZ: 0.8, sunHeight: 5 },
  studio: { background: '#c3c8cf', sky: '#f0f3f6', ground: '#869094', sun: '#faf8f2', fill: '#e5edf2', ambient: 0.3, hemisphere: 1.2, strength: 2, fillStrength: 1.55, exposure: 1.12, sunX: 0.5, sunZ: 0.5, sunHeight: 18 },
} as const;
export const FLOOR_SURFACES = {
  tartan: { tileMetres: 0.5, roughness: 0.98, bumpScale: 0.002 },
  rubber: { tileMetres: 0.5, roughness: 0.93, bumpScale: 0.004 },
  oak: { tileMetres: 1.7, roughness: 0.95, bumpScale: 0.002 },
  concrete: { tileMetres: 1, roughness: 0.85, bumpScale: 0.001 },
  turf: { tileMetres: 1, roughness: 0.97, bumpScale: 0.004 },
} as const;

export function snapMetres(value: number, step: GymVisualization['snap']) {
  return Math.round(Math.round(value / step) * step * 100) / 100;
}
type Point = { x: number; y: number };
export interface SpaceDimension { start: Point; end: Point; label: Point; length: number }
export function outlineDimensions(outline: Point[], offset = 0.45): SpaceDimension[] {
  const area = outline.reduce((sum, p, i) => sum + p.x * outline[(i + 1) % outline.length].y - outline[(i + 1) % outline.length].x * p.y, 0);
  const sign = area >= 0 ? 1 : -1;
  return outline.map((a, i) => {
    const b = outline[(i + 1) % outline.length], dx = b.x - a.x, dy = b.y - a.y;
    const length = Math.hypot(dx, dy), nx = dy / length * sign, ny = -dx / length * sign;
    return {
      start: { x: a.x + nx * offset, y: a.y + ny * offset }, end: { x: b.x + nx * offset, y: b.y + ny * offset },
      label: { x: (a.x + b.x) / 2 + nx * (offset + 0.16), y: (a.y + b.y) / 2 + ny * (offset + 0.16) }, length,
    };
  });
}

export function sceneDimensions(outline: Point[], selectedPolygon?: Point[]): SpaceDimension[] {
  return [...outlineDimensions(outline), ...(selectedPolygon ? outlineDimensions(selectedPolygon, 0.18).slice(0, 2) : [])];
}
