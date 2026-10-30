import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visualizationSchema, DEFAULT_VISUALIZATION, outlineDimensions, snapMetres, FLOOR_SURFACES } from '../../src/lib/gym-visualization.ts';
import { emptySpace, spaceSchema } from '../../src/lib/gym-space.ts';

test('old spaces remain valid and visual settings survive project JSON round trips', () => {
  const old = emptySpace();
  assert.ok(spaceSchema.safeParse(old).success);
  const visualization = { ...DEFAULT_VISUALIZATION, lighting: 'evening', eyeHeight: 1.8, fov: 60, snap: 0.05, dimensions: false };
  const saved = spaceSchema.parse(JSON.parse(JSON.stringify({ ...old, visualization })));
  assert.deepEqual(saved.visualization, visualization);
  for (const invalid of [{ fov: 180 }, { eyeHeight: 0 }, { lighting: 'unknown' }, { snap: 0 }, { snap: NaN }]) {
    assert.equal(visualizationSchema.safeParse({ ...visualization, ...invalid }).success, false);
  }
});

test('alignment rounds to the selected real-world step without decimal drift', () => {
  assert.equal(snapMetres(1.234, 0.01), 1.23);
  assert.equal(snapMetres(1.234, 0.05), 1.25);
  assert.equal(snapMetres(1.234, 0.1), 1.2);
  assert.equal(snapMetres(1.234, 0.25), 1.25);
  assert.equal(snapMetres(0.15, 0.05), 0.15);
});

test('dimension lines follow every wall of an L-shaped outline in either winding order', () => {
  const outline = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 8 }, { x: 0, y: 8 }];
  const dims = outlineDimensions(outline);
  assert.deepEqual(dims.map(d => d.length), [10, 5, 4, 3, 6, 8]);
  assert.ok(dims[0].start.y < 0);
  const reverse = outlineDimensions([...outline].reverse());
  assert.equal(reverse.find(d => d.length === 10).start.y, dims[0].start.y);
  const rotated = outlineDimensions([{ x: 2, y: 3 }, { x: 2, y: 5 }, { x: 1, y: 5 }, { x: 1, y: 3 }]);
  assert.deepEqual(rotated.slice(0, 2).map(d => d.length), [2, 1]);
});

test('floor patterns have physical tile sizes shared by whole-room and zone materials', () => {
  assert.equal(FLOOR_SURFACES.rubber.tileMetres, 0.5);
  assert.equal(FLOOR_SURFACES.oak.tileMetres, 1.7);
  for (const surface of Object.values(FLOOR_SURFACES)) {
    assert.ok(surface.roughness >= 0 && surface.roughness <= 1);
    assert.ok(surface.bumpScale > 0 && surface.bumpScale < 0.01);
  }
});
