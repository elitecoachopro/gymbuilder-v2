import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptySpace } from '../../src/lib/gym-space.ts';
import { editStructure, structureGesture } from '../../src/lib/gym-space-edit.ts';
import { createEditorHistory, commitEditorFloor, undoEditor } from '../../src/lib/gym-editor-history.ts';

const room = () => ({ ...emptySpace(), walls: [{ id: 'partition', x: 2, y: 4, length: 6, axis: 'x', thickness: 0.12 }], openings: [{ id: 'door', wallId: 'partition', kind: 'door', offset: 1, width: 1, height: 2.2, sill: 0 }] });
test('wall movement and length edits preserve identifiers, attached openings and every unrelated structure', () => {
  const space = { ...room(), upperFloor: emptySpace(), columns: [{ id: 'column', x: 16, y: 8, w: 0.4, d: 0.4 }], areas: [{ id: 'area', name: 'Cardio', colour: '#123456', x: 12, y: 8, w: 4, d: 3 }], items: [{ id: 'mat', templateId: 'saltea_yoga', x: 16, y: 12, rotation: 0 }], stairwell: { x: 17, y: 3, w: 2, d: 4, opening: false } };
  const result = editStructure(space, { kind: 'wall', id: 'partition', patch: { x: 3.12, y: 5, length: 8 } }, 3.5, null);
  assert.equal(result.error, null);
  assert.deepEqual(result.space.walls[0], { ...space.walls[0], x: 3.1, y: 5, length: 8 });
  assert.deepEqual(result.space.openings, space.openings);
  for (const key of ['outline', 'items', 'columns', 'areas', 'finishes', 'upperFloor', 'stairwell']) assert.equal(result.space[key], space[key]);
  assert.equal(space.walls[0].x, 2);
});
test('walls cannot cross equipment, columns, stairs or the outline and cannot truncate openings', () => {
  const space = { ...room(), items: [{ id: 'mat', templateId: 'saltea_yoga', x: 5, y: 7, rotation: 0 }] };
  for (const patch of [{ y: 7 }, { x: 19 }, { length: 1.5 }]) {
    const result = editStructure(space, { kind: 'wall', id: 'partition', patch }, 3.5, null);
    assert.ok(result.error); assert.equal(result.space, space);
  }
  for (const obstacle of [{ columns: [{ id: 'c', x: 4, y: 6.8, w: 0.4, d: 0.4 }] }, { stairwell: { x: 4, y: 6.8, w: 2, d: 3, opening: true } }]) {
    const source = { ...room(), ...obstacle };
    assert.ok(editStructure(source, { kind: 'wall', id: 'partition', patch: { y: 7 } }, 3.5, null).error);
  }
});
test('opening moves/resizes reject wall overflow, overlap and excessive height without mutating source', () => {
  const space = room();
  space.openings.push({ id: 'window', wallId: 'partition', kind: 'window', offset: 3, width: 1.5, height: 1.2, sill: 0.9 });
  const valid = editStructure(space, { kind: 'opening', id: 'door', patch: { offset: 0.5, width: 1.2 } }, 3.5, null);
  assert.equal(valid.error, null); assert.equal(valid.space.openings[0].offset, 0.5);
  for (const patch of [{ offset: 5.5 }, { width: 2.5 }, { height: 4 }, { offset: -1 }, { sill: 1 }]) {
    const result = editStructure(space, { kind: 'opening', id: 'door', patch }, 3.5, null);
    assert.ok(result.error); assert.equal(result.space, space);
  }
});
test('numeric and gesture coordinates use the same snap on horizontal and vertical walls', () => {
  for (const axis of ['x', 'y']) {
    const space = room(); space.walls[0].axis = axis;
    const command = structureGesture(space, { kind: 'wall-move', id: 'partition' }, 0.24, 0.36);
    const dragged = editStructure(space, command, 3.5, null);
    const numeric = editStructure(space, { kind: 'wall', id: 'partition', patch: { x: 2.24, y: 4.36 } }, 3.5, null);
    assert.deepEqual(dragged, numeric);
    const move = structureGesture(space, { kind: 'opening-move', id: 'door' }, 0.24, 0.36);
    assert.equal(editStructure(space, move, 3.5, null).space.openings[0].offset, axis === 'x' ? 1.2 : 1.4);
    const resize = structureGesture(space, { kind: 'wall-length', id: 'partition' }, 0.24, 0.36);
    assert.equal(editStructure(space, resize, 3.5, null).space.walls[0].length, axis === 'x' ? 6.2 : 6.4);
    const width = structureGesture(space, { kind: 'opening-width', id: 'door' }, 0.24, 0.36);
    assert.equal(editStructure(space, width, 3.5, null).space.openings[0].width, axis === 'x' ? 1.2 : 1.4);
  }
});
test('delete wall is atomic with its openings and undo restores both on the original editing floor', () => {
  const initial = { name: 'Test', height: 3.5, budget: null, brief: '', space: { ...emptySpace(), upperFloor: room() } };
  const state = createEditorHistory(initial, 1);
  const removed = editStructure(initial.space.upperFloor, { kind: 'delete-wall', id: 'partition' }, 3.5, null);
  assert.deepEqual(removed.space.walls, []); assert.deepEqual(removed.space.openings, []);
  const committed = commitEditorFloor(state, { ...initial, space: removed.space }).state;
  assert.equal(committed.past.length, 1);
  assert.deepEqual(undoEditor(committed).present.document, initial);
  assert.equal(undoEditor(committed).present.storey, 1);
});
test('exterior walls and missing selections are not moved or deleted; no-op returns the same document', () => {
  const space = room();
  for (const command of [{ kind: 'wall', id: 'edge-0', patch: { y: 2 } }, { kind: 'delete-wall', id: 'edge-0' }, { kind: 'opening', id: 'missing', patch: { offset: 2 } }]) {
    const result = editStructure(space, command, 3.5, null); assert.ok(result.error); assert.equal(result.space, space);
  }
  assert.equal(editStructure(space, { kind: 'wall', id: 'partition', patch: { x: 2 } }, 3.5, null).space, space);
});

test('unchanged off-grid coordinates survive another numeric edit and a zero-delta gesture', () => {
  const space = room(); space.walls[0].x = 0.15; space.walls[0].length = 6.15;
  const result = editStructure(space, { kind: 'wall', id: 'partition', patch: { ...space.walls[0], y: 4.2 } }, 3.5, null);
  assert.equal(result.error, null); assert.equal(result.space.walls[0].x, 0.15); assert.equal(result.space.walls[0].length, 6.15);
  const command = structureGesture(space, { kind: 'wall-move', id: 'partition' }, 0, 0);
  assert.equal(editStructure(space, command, 3.5, null).space, space);
});
test('edited walls and openings round-trip through the existing saved configuration without schema changes', async () => {
  const { studioConfigurationSchema } = await import('../../src/lib/gym-studio.ts');
  const initial = { ...room(), upperFloor: room() };
  const result = editStructure(initial, { kind: 'opening', id: 'door', patch: { width: 1.2 } }, 3.5, null);
  assert.equal(result.error, null);
  const config = { version: 1, height_m: 3.5, budget_eur: null, brief: '', zone_ids: ['cardio'], profile: 'balanced', space: result.space };
  const parsed = studioConfigurationSchema.parse(JSON.parse(JSON.stringify(config)));
  assert.deepEqual(parsed.space, result.space);
  assert.deepEqual(parsed.space.upperFloor, initial.upperFloor);
});
