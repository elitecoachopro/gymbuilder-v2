import * as THREE from 'three';

export type FloorFinish = 'tartan' | 'rubber' | 'oak' | 'concrete' | 'turf';
type EquipmentRelief = 'paint' | 'upholstery' | 'rubber' | 'steel';
export const EQUIPMENT_FINISH = {
  paint: { roughness: 0.55, metalness: 0.12, bumpScale: 0.00025 },
  upholstery: { roughness: 0.55, metalness: 0, bumpScale: 0.0009 },
  rubber: { roughness: 0.98, metalness: 0, bumpScale: 0.0012 },
  steel: { roughness: 0.35, metalness: 0.9, bumpScale: 0.00012 },
} as const;

function noise(x: number, y: number) {
  let seed = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263);
  seed = Math.imul(seed ^ (seed >>> 13), 1274126177);
  return ((seed ^ (seed >>> 16)) >>> 0) / 4294967295;
}
function texture(data: Uint8Array<ArrayBuffer>, size: number, colour = false) {
  const map = new THREE.DataTexture(data, size, size);
  map.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.magFilter = THREE.LinearFilter; map.minFilter = THREE.LinearMipmapLinearFilter;
  map.generateMipmaps = true; map.anisotropy = 4; map.needsUpdate = true;
  return map;
}
function pixel(data: Uint8Array, index: number, r: number, g = r, b = r) {
  data[index] = r; data[index + 1] = g; data[index + 2] = b; data[index + 3] = 255;
}

export function createEquipmentRelief(finish: EquipmentRelief) {
  const size = 128, data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const n = noise(x, y);
    const value = finish === 'steel' ? 125 + noise(0, y) * 80 + n * 12
      : finish === 'upholstery' ? 205 + n * 30 + Math.sin(x * Math.PI / 4) * Math.sin(y * Math.PI / 4) * 10
      : finish === 'rubber' ? 165 + n * 70 - (x % 8 < 2 ? 45 : 0)
      : 195 + n * 35;
    pixel(data, (y * size + x) * 4, value);
  }
  const map = texture(data, size); map.repeat.set(8, 8);
  return map;
}

export function createFloorMaps(finish: FloorFinish) {
  const size = 256, colour = new Uint8Array(size * size * 4), bump = new Uint8Array(colour.length), roughness = new Uint8Array(colour.length);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4, n = noise(x, y);
    let r: number, g: number, b: number, relief: number, rough: number;
    if (finish === 'tartan') {
      // Dense black EPDM granules; no bright flecks or modular tile seams.
      const granule = noise(Math.floor(x / 2), Math.floor(y / 2));
      const shade = 22 + granule * 10 + n * 4;
      r = shade; g = shade; b = shade;
      relief = 105 + granule * 80 + n * 35; rough = 235 + n * 20;
    } else if (finish === 'rubber') {
      const joint = x < 2 || y < 2;
      const fleck = n > 0.965 ? 32 : n * 11;
      r = 40 + fleck; g = 45 + fleck; b = 48 + fleck;
      relief = joint ? 30 : 165 + n * 45; rough = 220 + n * 30;
      if (joint) { r *= 0.6; g *= 0.6; b *= 0.6; }
    } else if (finish === 'oak') {
      const row = Math.floor(y / 32), offset = row % 2 * 64;
      const joint = y % 32 < 1 || (x + offset) % 128 < 1;
      const board = noise(Math.floor((x + offset) / 128), row) * 18;
      const grain = Math.sin(y * 1.5 + Math.sin(x * Math.PI / 64) * 2) * 5 + n * 7;
      r = 154 + board + grain; g = 113 + board + grain; b = 74 + board + grain;
      relief = joint ? 35 : 160 + grain; rough = 170 + n * 25;
      if (joint) { r *= 0.65; g *= 0.65; b *= 0.65; }
    } else if (finish === 'concrete') {
      const cloud = Math.sin(x * Math.PI / 64) * Math.cos(y * Math.PI / 128) * 5;
      r = 153 + cloud + n * 12; g = r + 2; b = r - 2;
      relief = 150 + n * 45; rough = 205 + n * 35;
    } else {
      const blade = noise(x, Math.floor(y / 4));
      r = 39 + blade * 23; g = 71 + blade * 36; b = 43 + blade * 19;
      relief = 100 + blade * 110; rough = 235 + n * 20;
    }
    pixel(colour, i, r, g, b); pixel(bump, i, relief); pixel(roughness, i, rough);
  }
  return { map: texture(colour, size, true), bumpMap: texture(bump, size), roughnessMap: texture(roughness, size) };
}
