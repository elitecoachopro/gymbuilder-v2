import * as THREE from 'three';
import type { GymSpace } from './gym-space.ts';
export function roomShape(space: GymSpace, hole = false) {
  const shape = new THREE.Shape();
  space.outline.forEach((p, i) => (i ? shape.lineTo(p.x, -p.y) : shape.moveTo(p.x, -p.y)));
  shape.closePath();
  if (hole && space.stairwell) {
    const { x, y, w, d } = space.stairwell;
    const opening = new THREE.Path();
    opening.moveTo(x, -y);
    opening.lineTo(x + w, -y);
    opening.lineTo(x + w, -y - d);
    opening.lineTo(x, -y - d);
    opening.closePath();
    shape.holes.push(opening);
  }
  return shape;
}
