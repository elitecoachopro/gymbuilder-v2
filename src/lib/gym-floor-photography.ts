import * as THREE from 'three';

type FloorMapKey = 'map' | 'bumpMap' | 'roughnessMap';
type FloorPixels = Record<FloorMapKey, {
  data: Uint8Array<ArrayBuffer>;
  width: number;
  height: number;
}>;
const FLOOR_MAP_KEYS = ['map', 'bumpMap', 'roughnessMap'] as const;
const FLOOR_MAP_SIZE = 256;
let oakPixels: Promise<FloorPixels> | undefined;

async function loadFloorMapPixels(key: FloorMapKey) {
  const texture = await new THREE.TextureLoader().loadAsync(`/textures/wood-floor/${key}.jpg`);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = FLOOR_MAP_SIZE;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Floor canvas unavailable');
    context.drawImage(texture.image, 0, 0, FLOOR_MAP_SIZE, FLOOR_MAP_SIZE);
    const data = new Uint8Array(context.getImageData(0, 0, FLOOR_MAP_SIZE, FLOOR_MAP_SIZE).data);
    // Satin gym flooring: keep the grain without the source floor's polished glare.
    if (key === 'roughnessMap') {
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i + 1] = data[i + 2] = 190 + Math.round(data[i + 1] / 4);
      }
    }
    return [key, {
      data,
      width: FLOOR_MAP_SIZE,
      height: FLOOR_MAP_SIZE,
    }] as const;
  } finally {
    texture.dispose();
  }
}

export function loadOakFloorPixels() {
  if (!oakPixels) {
    oakPixels = Promise.all(FLOOR_MAP_KEYS.map(loadFloorMapPixels))
      .then(entries => Object.fromEntries(entries) as FloorPixels)
      .catch(error => {
        oakPixels = undefined;
        throw error;
      });
  }
  return oakPixels;
}
