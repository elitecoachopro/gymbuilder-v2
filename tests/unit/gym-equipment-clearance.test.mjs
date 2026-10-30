import { test } from 'node:test';
import assert from 'node:assert/strict';
import { equipmentUsagePolygon, assessEquipmentUsage } from '../../src/lib/gym-equipment-clearance.ts';
import { emptySpace, itemFitsSpace, validateSpace } from '../../src/lib/gym-space.ts';
import { EQUIPMENT_CATALOG } from '../../src/lib/gym-catalog.ts';

const item = { id: 'treadmill', templateId: 'cad_treadmill', x: 5, y: 5, rotation: 0 };
test('usage envelope is independent from the physical footprint and rotates in the same local axes', () => {
  const model = EQUIPMENT_CATALOG.find(e => e.id === item.templateId);
  assert.deepEqual(model.usage, { lengthMargin: 1, widthMargin: 0.6, basis: 'planning-estimate' });
  const polygon = equipmentUsagePolygon(item);
  assert.equal(polygon.length, 4);
  const extent = (p, key) => Math.max(...p.map(v => v[key])) - Math.min(...p.map(v => v[key]));
  assert.ok(Math.abs(extent(polygon, 'x') - 3.95) < 0.00001);
  assert.ok(Math.abs(extent(polygon, 'y') - 2.09) < 0.00001);
  const rotated = equipmentUsagePolygon({ ...item, rotation: 90 });
  assert.ok(Math.abs(extent(rotated, 'x') - 2.09) < 0.00001);
  assert.ok(Math.abs(extent(rotated, 'y') - 3.95) < 0.00001);
});
test('advisory overlaps warn without invalidating physical placement or changing the saved document', () => {
  const space = { ...emptySpace(), items: [item, { ...item, id: 'other', x: 7.2 }] };
  const before = JSON.stringify(space);
  assert.equal(validateSpace(space, 3.5, null), null);
  const assessment = assessEquipmentUsage(space, item);
  assert.deepEqual(assessment.conflicts, [{ kind: 'equipment', id: 'other' }]);
  assert.equal(JSON.stringify(space), before);
  assert.equal(itemFitsSpace(space, { ...space.items[1], x: 5.5 }, 3.5), false);
});
test('envelopes flag walls, columns, stairwells and concave bounds without blocking a valid older project', () => {
  const space = { ...emptySpace(), items: [item], walls: [{ id: 'wall', x: 6.5, y: 3.5, length: 3, thickness: 0.12, axis: 'y' }], columns: [{ id: 'column', x: 3.4, y: 4.7, w: 0.3, d: 0.3 }], stairwell: { x: 4, y: 5.7, w: 1, d: 1, opening: false } };
  assert.equal(validateSpace(space, 3.5, null), null);
  const conflicts = assessEquipmentUsage(space, item).conflicts;
  assert.ok(conflicts.some(c => c.kind === 'wall' && c.id === 'wall'));
  assert.ok(conflicts.some(c => c.kind === 'column' && c.id === 'column'));
  assert.ok(conflicts.some(c => c.kind === 'stairs'));
  const edge = { ...item, x: 1.2 };
  assert.ok(assessEquipmentUsage({ ...emptySpace(), items: [edge] }, edge).conflicts.some(c => c.kind === 'outline'));
  const concave = emptySpace(); concave.outline = [{x:0,y:0},{x:20,y:0},{x:20,y:10},{x:15,y:10},{x:15,y:15},{x:0,y:15}];
  const nearNotch = { ...item, x: 13.8, y: 11 };
  assert.equal(itemFitsSpace(concave, nearNotch, 3.5), true);
  assert.ok(assessEquipmentUsage(concave, nearNotch).conflicts.some(c => c.kind === 'outline'));
});
test('missing metadata remains unknown rather than a fabricated safe clearance', () => {
  const generic = { ...item, templateId: 'saltea_yoga' };
  const assessment = assessEquipmentUsage({ ...emptySpace(), items: [generic] }, generic);
  assert.equal(assessment.envelope, null);
  assert.deepEqual(assessment.conflicts, []);
  assert.equal(equipmentUsagePolygon(generic), null);
});
