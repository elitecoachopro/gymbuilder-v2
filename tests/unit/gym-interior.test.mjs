import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptySpace, insideOutline, spaceSchema } from '../../src/lib/gym-space.ts';
import { DEFAULT_VISUALIZATION, visualizationSchema } from '../../src/lib/gym-visualization.ts';
import { ceilingFixtures, buildCeilingFixtures, buildWallFinish, INTERIOR_PALETTES } from '../../src/lib/gym-interior.ts';

test('interior styles round-trip while older projects need no new fields', () => {
  assert.ok(spaceSchema.safeParse(emptySpace()).success);
  for (const interiorStyle of ['minimal', 'warm', 'industrial']) {
    const visualization = { ...DEFAULT_VISUALIZATION, interiorStyle };
    const restored = spaceSchema.parse(JSON.parse(JSON.stringify({ ...emptySpace(), visualization })));
    assert.equal(restored.visualization.interiorStyle, interiorStyle);
  }
  assert.equal(visualizationSchema.safeParse({ ...DEFAULT_VISUALIZATION, interiorStyle: 'unknown' }).success, false);
});

test('ceiling fixtures avoid concave cutouts, stairs, columns and partitions within a fixed budget', () => {
  const room = emptySpace(20, 15);
  room.outline = [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 15 }, { x: 10, y: 15 }, { x: 10, y: 6 }, { x: 0, y: 6 }];
  room.stairwell = { x: 12, y: 2, w: 3, d: 5, opening: true };
  room.columns = [{ id: 'column', x: 7, y: 1, w: 1, d: 1 }];
  room.walls = [{ id: 'partition', x: 2, y: 3, length: 15, axis: 'x', thickness: 0.15 }];
  const positions = ceilingFixtures(room);
  assert.ok(positions.length > 0 && positions.length <= 24);
  for (const [x, z] of positions) {
    for (const dx of [-1.05, 1.05]) for (const dz of [-0.7, 0.7]) assert.ok(insideOutline({ x: x + dx, y: z + dz }, room.outline));
    assert.ok(x + 1.05 <= 12 || x - 1.05 >= 15 || z + 0.7 <= 2 || z - 0.7 >= 7);
    assert.ok(x + 1.05 <= 7 || x - 1.05 >= 8 || z + 0.7 <= 1 || z - 0.7 >= 2);
    assert.ok(x + 1.05 <= 2 || x - 1.05 >= 17 || Math.abs(z - 3) >= 0.775);
  }
  assert.ok(ceilingFixtures(emptySpace(200, 200)).length <= 24);
});

test('three interior finishes have bounded geometry, real metre sizes and distinct appearances', () => {
  const signatures = new Set();
  for (const style of ['minimal', 'warm', 'industrial']) {
    const fixtures = buildCeilingFixtures([[2, 2], [6, 2]], 3.5, style);
    const panels = buildWallFinish(5, 3.5, style);
    const geometry = [...Object.values(fixtures), ...Object.values(panels)];
    let triangles = 0;
    try {
      assert.ok(Object.keys(fixtures).length <= 2);
      assert.ok(Object.keys(panels).length <= 2);
      for (const g of geometry) {
        g.computeBoundingBox();
        assert.ok([...g.attributes.position.array, ...g.attributes.normal.array].every(Number.isFinite));
        assert.ok(g.boundingBox.min.y >= 0 && g.boundingBox.max.y <= 3.5);
        triangles += (g.index?.count ?? g.attributes.position.count) / 3;
      }
      assert.ok(triangles < 3000);
      signatures.add(triangles + INTERIOR_PALETTES[style].ceiling);
    } finally { geometry.forEach(g => g.dispose()); }
  }
  assert.equal(signatures.size, 3);
});

test('visible fixtures and wall finishes contain renderable geometry for every style', () => {
  for (const style of ['minimal', 'warm', 'industrial']) {
    const fixtures = buildCeilingFixtures([[2, 2]], 3.5, style);
    const panels = buildWallFinish(5, 3.5, style);
    try {
      assert.ok(fixtures.housing?.attributes.position.count > 0, `${style} fixture housing`);
      assert.ok(fixtures.diffuser?.attributes.position.count > 0, `${style} luminous diffuser`);
      assert.ok(panels.backing?.attributes.position.count > 0, `${style} wall backing`);
      if (style !== 'minimal') assert.ok(panels.ribs?.attributes.position.count > 0, `${style} wall ribs`);
    } finally { [...Object.values(fixtures), ...Object.values(panels)].forEach(g => g.dispose()); }
  }
});

test('a partition through a fixture row excludes that row without losing the unobstructed row', () => {
  const room = emptySpace(20, 10);
  assert.equal(ceilingFixtures(room).length, 10);
  room.walls = [{ id: 'partition', x: 0, y: 2.5, length: 20, axis: 'x', thickness: 0.15 }];
  const fixtures = ceilingFixtures(room);
  assert.equal(fixtures.length, 5);
  assert.ok(fixtures.every(([, z]) => z === 7.5));
});
