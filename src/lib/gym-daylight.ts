import { insideOutline, spaceBounds, spaceWalls, type GymSpace } from './gym-space.ts';

export interface WindowDaylight {
  id: string;
  x: number;
  y: number;
  elevation: number;
  width: number;
  height: number;
  rotation: number;
  patch: { x: number; y: number; w: number; d: number } | null;
}

export function windowDaylights(space: GymSpace): WindowDaylight[] {
  const { length, width } = spaceBounds(space);
  const walls = spaceWalls(space);
  const signedArea = space.outline.reduce((sum, point, index) => {
    const next = space.outline[(index + 1) % space.outline.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0);
  const winding = signedArea >= 0 ? 1 : -1;

  return space.openings.flatMap(opening => {
    const match = /^edge-(\d+)$/.exec(opening.wallId);
    if (opening.kind !== 'window' || !match) return [];
    const index = Number(match[1]);
    const a = space.outline[index];
    const b = space.outline[(index + 1) % space.outline.length];
    const wall = walls.find(candidate => candidate.id === opening.wallId);
    if (!a || !b || !wall || !wall.length) return [];

    const normalX = -(b.y - a.y) / wall.length * winding;
    const normalY = (b.x - a.x) / wall.length * winding;
    const centre = opening.offset + opening.width / 2;
    const x = wall.x + (wall.axis === 'x' ? centre : 0);
    const y = wall.y + (wall.axis === 'y' ? centre : 0);
    const depth = Math.min(3.2, length / 4, width / 4);
    const span = opening.width * 0.86;
    const patch = {
      x: x + normalX * (0.2 + depth / 2),
      y: y + normalY * (0.2 + depth / 2),
      w: wall.axis === 'x' ? span : depth,
      d: wall.axis === 'x' ? depth : span,
    };
    const fits = [-1, 1].every(dx => [-1, 1].every(dy => insideOutline({
      x: patch.x + dx * patch.w / 2,
      y: patch.y + dy * patch.d / 2,
    }, space.outline)));

    return [{
      id: opening.id,
      x: x - normalX * 0.09,
      y: y - normalY * 0.09,
      elevation: opening.sill + opening.height / 2,
      width: opening.width,
      height: opening.height,
      rotation: Math.atan2(normalX, normalY),
      patch: fits ? patch : null,
    }];
  });
}
