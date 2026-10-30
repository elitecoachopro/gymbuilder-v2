import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createFloorMaps, createEquipmentRelief, EQUIPMENT_FINISH } from '../../src/lib/gym-pbr-textures.ts';

test('floor materials have separate colour and linear relief channels within a mobile texture budget', () => {
  for (const mode of ['rubber', 'oak', 'concrete', 'turf']) {
    const maps = createFloorMaps(mode);
    try {
      assert.equal(maps.map.colorSpace, THREE.SRGBColorSpace);
      assert.equal(maps.bumpMap.colorSpace, THREE.NoColorSpace);
      assert.equal(maps.roughnessMap.colorSpace, THREE.NoColorSpace);
      let bytes = 0;
      for (const texture of Object.values(maps)) {
        bytes += texture.image.data.byteLength;
        assert.equal(texture.wrapS, THREE.RepeatWrapping);
        assert.ok(texture.generateMipmaps);
      }
      assert.ok(bytes <= 3 * 256 * 256 * 4);
      assert.notDeepEqual(maps.map.image.data, maps.bumpMap.image.data);
    } finally { Object.values(maps).forEach(t => t.dispose()); }
  }
});

test('powder coating, upholstery and steel retain distinct non-plastic surface responses', () => {
  assert.ok(EQUIPMENT_FINISH.paint.metalness <= 0.2);
  assert.ok(EQUIPMENT_FINISH.upholstery.roughness >= 0.45 && EQUIPMENT_FINISH.upholstery.roughness <= 0.7);
  assert.equal(EQUIPMENT_FINISH.upholstery.metalness, 0);
  assert.ok(EQUIPMENT_FINISH.steel.metalness >= 0.85);
  assert.ok(EQUIPMENT_FINISH.steel.roughness < EQUIPMENT_FINISH.paint.roughness);
});

test('black EPDM stays neutral and green turf stays distinct within the existing texture allocation', () => {
  for (const mode of ['tartan', 'turf']) {
    const maps = createFloorMaps(mode);
    let disposed = 0;
    for (const map of Object.values(maps)) map.addEventListener('dispose', () => disposed++);
    try {
      const pixels = maps.map.image.data;
      for (let i = 0; i < pixels.length; i += 4) {
        if (mode === 'tartan') { assert.equal(pixels[i], pixels[i + 1]); assert.equal(pixels[i], pixels[i + 2]); assert.ok(pixels[i] >= 15 && pixels[i] < 50); }
        else assert.ok(pixels[i + 1] > pixels[i] && pixels[i + 1] > pixels[i + 2]);
      }
      assert.equal(Object.values(maps).reduce((sum, map) => sum + map.image.data.byteLength, 0), 786432);
    } finally { Object.values(maps).forEach(map => map.dispose()); }
    assert.equal(disposed, 3);
  }
});

test('rubber tile joints are recessed, wood has staggered boards and materials have distinct microrelief', () => {
  const rubber = createFloorMaps('rubber'), oak = createFloorMaps('oak');
  const height = (maps,x,y) => maps.bumpMap.image.data[(y * 256 + x) * 4];
  try {
    assert.ok(height(rubber,0,64) < height(rubber,64,64));
    assert.ok(height(oak,64,0) < height(oak,64,20));
    assert.ok(height(oak,0,20) < height(oak,0,52));
  } finally { [...Object.values(rubber), ...Object.values(oak)].forEach(t => t.dispose()); }
  const textures = ['paint','upholstery','rubber','steel'].map(createEquipmentRelief);
  try {
    assert.equal(new Set(textures.map(t => Buffer.from(t.image.data).toString('base64'))).size, 4);
    assert.ok(textures.every(t => t.image.data.byteLength <= 128 * 128 * 4));
  } finally { textures.forEach(t => t.dispose()); }
});
