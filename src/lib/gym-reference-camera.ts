import {polygonFits, type GymSpace} from './gym-space.ts';

type Point = {x: number; y: number};
export function referenceCameraOffset(origin: Point, preferred: readonly number[], outline: GymSpace['outline']): [number, number, number] {
 const distance = Math.hypot(...preferred), radius = Math.hypot(preferred[0], preferred[2]);
 const angle = Math.atan2(preferred[0], preferred[2]);
 const fits = (x: number, z: number) => {
  const camera = {x: origin.x + x, y: origin.y + z}, margin = .22;
  const eye = [{x:camera.x-margin,y:camera.y-margin},{x:camera.x+margin,y:camera.y-margin},{x:camera.x+margin,y:camera.y+margin},{x:camera.x-margin,y:camera.y+margin}];
  return polygonFits(eye, outline) && polygonFits([origin, camera, {x:origin.x+.001,y:origin.y+.001}], outline);
 };
 for (const scale of [1, .75, .5, .25, 0]) {
  for (let step = 0; step <= 12; step++) {
   for (const sign of step === 0 ? [1] : [-1, 1]) {
    const a = angle + sign * step * Math.PI / 12;
    const x = Math.sin(a) * radius * scale, z = Math.cos(a) * radius * scale;
    if (fits(x, z)) return [x, Math.sqrt(Math.max(0, distance * distance - x * x - z * z)), z];
   }
  }
 }
 return [0, distance, 0];
}
