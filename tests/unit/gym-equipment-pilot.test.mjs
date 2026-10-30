import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { EQUIPMENT_PILOT_IDS } from '../../src/lib/gym-equipment-pilot.ts';
import { equipmentPilotSpace } from '../../src/lib/gym-equipment-pilot-space.ts';
import { importedEquipment } from '../../src/lib/gym-imported-equipment.ts';
import { EQUIPMENT_CATALOG } from '../../src/lib/gym-catalog.ts';
import { validateSpace } from '../../src/lib/gym-space.ts';

test('ten pilot machines preserve catalogue identity, metre dimensions and source provenance', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../../public/models/gym/pilot/manifest.json', import.meta.url)));
  assert.equal(EQUIPMENT_PILOT_IDS.length, 10);
  assert.deepEqual(manifest.map(entry => entry.id), [...EQUIPMENT_PILOT_IDS]);
  for (const entry of manifest) {
    const equipment = importedEquipment(entry.id);
    const template = EQUIPMENT_CATALOG.find(model => model.id === entry.id);
    assert.ok(template);
    assert.equal(equipment.asset.url, entry.url);
    assert.equal(equipment.asset.sourceUrl, entry.sourceUrl);
    assert.equal(entry.license, 'CC0-1.0');
    for (const [dimension, axis] of [['length_m', 0], ['height_m', 1], ['width_m', 2]]) {
      assert.ok(Math.abs(entry.bounds.max[axis] - entry.bounds.min[axis] - template[dimension]) < 0.002, `${entry.id} ${dimension}`);
      assert.ok(Math.abs(entry.bounds.min[axis] - entry.sourceBounds.min[axis]) < 0.00001);
      assert.ok(Math.abs(entry.bounds.max[axis] - entry.sourceBounds.max[axis]) < 0.00001);
    }
    const bytes = fs.readFileSync(new URL('../../public' + entry.url, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256);
    assert.ok(bytes.length <= 2_600_000, entry.id + ' download budget');
    assert.ok(entry.drawCalls <= 20, entry.id + ' draw-call budget');
    assert.ok(entry.triangles <= 40000, entry.id + ' triangle budget');
    assert.equal(entry.triangles, entry.sourceTriangles, 'surface improvements must not deform geometry');
    const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
    const original = fs.readFileSync(new URL('../../public' + entry.sourceAsset, import.meta.url));
    const source = JSON.parse(original.toString('utf8', 20, 20 + original.readUInt32LE(12)));
    const images = (buffer, document) => (document.images ?? []).map(image => {
      const view = document.bufferViews[image.bufferView], start = 28 + buffer.readUInt32LE(12) + (view.byteOffset ?? 0);
      return createHash('sha256').update(buffer.subarray(start, start + view.byteLength)).digest('hex');
    });
    const outputImages = images(bytes, gltf);
    for (const image of images(original, source)) assert.ok(outputImages.includes(image), 'original textures and printed decals retained');
    assert.ok(gltf.materials.some(material => material.normalTexture), 'visible microdetail baked into asset');
    assert.ok(gltf.images.every(image => !image.uri));
    assert.ok(!(gltf.extensionsRequired ?? []).some(extension => /draco|meshopt|basisu/i.test(extension)));
    for (const mesh of gltf.meshes) for (const primitive of mesh.primitives) {
      if (gltf.materials[primitive.material].normalTexture) assert.ok(primitive.attributes.TANGENT !== undefined);
    }
  }
});

test('pilot showroom fits all ten machines and preserves existing-project format', () => {
  const space = equipmentPilotSpace();
  assert.equal(validateSpace(space, 3.5, null), null);
  assert.deepEqual(space.items.map(item => item.templateId), [...EQUIPMENT_PILOT_IDS]);
  assert.equal(space.items.length, 10);
  assert.equal(new Set(space.items.map(item => item.id)).size, 10);
});
