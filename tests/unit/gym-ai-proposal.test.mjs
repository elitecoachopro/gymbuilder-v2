import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareGymAiInput } from '../../src/lib/gym-ai-context.ts';
import { createGymAiReview, applyGymAiReview, gymAiReviewCurrent } from '../../src/lib/gym-ai-proposal.ts';
import { emptySpace, spaceArea, spaceBounds, spaceCost, validateSpace } from '../../src/lib/gym-space.ts';
import { floorSpace } from '../../src/lib/gym-building.ts';
import { createEditorHistory, undoEditor, redoEditor } from '../../src/lib/gym-editor-history.ts';
import { buildZonedGymProposal } from '../../src/lib/gym-zoning.ts';

const zones = [{ zoneId: 'cardio', weight: 1, equipment: [{ templateId: 'banda_alergare', quantity: 3 }] }];
function document() {
  const space = emptySpace();
  space.columns = [{ id: 'current-column', x: 8, y: 6, w: 1, d: 1 }];
  space.stairwell = { x: 16, y: 10, w: 2, d: 3, opening: false };
  space.items = [{ id: 'old-bike', templateId: 'bicicleta_spinning', x: 4, y: 4, rotation: 90 }];
  space.upperFloor = emptySpace(10, 10);
  space.upperFloor.items = [{ id: 'upper-treadmill', templateId: 'banda_alergare', x: 5, y: 5, rotation: 0 }];
  return { name: 'Imperial Gym', height: 3.5, budget: 10000, brief: 'Trei benzi de alergare', space };
}
function response(doc, storey = 0) {
  const floor = floorSpace(doc.space, storey), budget = 10000 - spaceCost(floorSpace(doc.space, storey === 0 ? 1 : 0));
  return { design: { summary: 'Plan', questions: [], length_m: spaceBounds(floor).length, width_m: spaceBounds(floor).width, total_area: spaceArea(floor), height_m: doc.height, budget_eur: budget, profile: 'balanced', zones }, spaceProposal: buildZonedGymProposal(floor, zones, doc.height, budget, false) };
}
test('server context uses current active geometry, stairwell, equipment and reserved inactive-storey cost', () => {
  const doc = document(), before = JSON.stringify(doc);
  const result = prepareGymAiInput({ brief: doc.brief, locale: 'ro', target_floor: 0, space: doc.space, context: { length_m: 20, width_m: 15, total_area: 300, height_m: 3.5, budget_eur: 10000, zone_ids: ['cardio'], profile: 'balanced' } });
  assert.equal(result.budget, 6500);
  assert.equal(result.context.reserved_budget_eur, 3500);
  assert.equal(result.context.target_floor.index, 0);
  assert.deepEqual(result.context.fixed_architecture.stairwell, doc.space.stairwell);
  assert.deepEqual(result.context.fixed_architecture.columns, doc.space.columns);
  assert.equal(result.context.fixed_architecture.equipment[0].id, 'old-bike');
  assert.equal(result.context.fixed_architecture.equipment[0].price_eur, 1100);
  assert.equal(result.space.upperFloor, undefined);
  assert.equal(JSON.stringify(doc), before);
  assert.throws(() => prepareGymAiInput({ brief: doc.brief, locale: 'ro', space: doc.space, context: { length_m: null, width_m: 15, total_area: 300, height_m: 3.5, budget_eur: 10000, zone_ids: [], profile: 'balanced' } }));
});
test('preview is immutable, reports full replacement, and apply is one undoable active-floor action within the reserved budget', () => {
  const doc = document(), state = createEditorHistory(doc), before = JSON.stringify(state), review = createGymAiReview(response(doc), state.present, 7);
  assert.equal(JSON.stringify(state), before);
  assert.equal(review.replacedCount, 1); assert.equal(review.proposal.space.items.length, 1);
  assert.ok(review.proposal.omitted.some(o => o.reason === 'budget'));
  const applied = applyGymAiReview(state, review, 7, true);
  assert.equal(applied.error, null); assert.equal(applied.mode, '2d'); assert.equal(applied.state.past.length, 1);
  assert.deepEqual(applied.state.present.document.space.upperFloor, doc.space.upperFloor);
  assert.deepEqual(applied.state.present.document.space.stairwell, doc.space.stairwell);
  assert.equal(validateSpace(applied.state.present.document.space, 3.5, 10000), null);
  assert.deepEqual(undoEditor(applied.state).present.document, doc);
  assert.deepEqual(redoEditor(undoEditor(applied.state)).present.document, applied.state.present.document);
});
test('changed floor or revision blocks a proposal even if document bytes match, and malformed or physically invalid responses never apply', () => {
  const doc = document(), state = createEditorHistory(doc), review = createGymAiReview(response(doc), state.present, 7);
  assert.equal(gymAiReviewCurrent(review, state.present, 8), false);
  assert.equal(gymAiReviewCurrent(review, { document: doc, storey: 1 }, 7), false);
  assert.equal(applyGymAiReview(state, review, 8, false).state, state);
  assert.equal(applyGymAiReview(state, review, 7, false).mode, '3d');
  const missing = response(doc); missing.design.height_m = null;
  assert.equal(createGymAiReview(missing, state.present, 7).proposal, null);
  const invalid = response(doc); invalid.spaceProposal.space.items[0].x = 8.5; invalid.spaceProposal.space.items[0].y = 6.5;
  assert.throws(() => createGymAiReview(invalid, state.present, 7));
  assert.throws(() => createGymAiReview({ design: {} }, state.present, 7));
});
test('upper-floor generation reserves ground equipment and applies only upstairs through Undo/Redo', () => {
  const doc = document(), state = createEditorHistory(doc, 1);
  const prepared = prepareGymAiInput({ brief: doc.brief, locale: 'en', target_floor: 1, space: doc.space, automatic_zoning: false, context: { length_m: 10, width_m: 10, total_area: 100, height_m: 3.5, budget_eur: 10000, zone_ids: ['cardio'], profile: 'balanced' } });
  assert.equal(prepared.budget, 8900); assert.equal(prepared.context.reserved_budget_eur, 1100);
  assert.equal(prepared.context.target_floor.index, 1);
  assert.equal(prepared.context.fixed_architecture.equipment[0].id, 'upper-treadmill');
  assert.equal(spaceArea(prepared.space), 100);
  const review = createGymAiReview(response(doc, 1), state.present, 9);
  const applied = applyGymAiReview(state, review, 9, true);
  assert.equal(applied.error, null); assert.equal(applied.state.present.storey, 1);
  assert.deepEqual(floorSpace(applied.state.present.document.space, 0), floorSpace(doc.space, 0));
  assert.equal(applied.state.present.document.space.upperFloor.items.length, 2);
  assert.equal(validateSpace(applied.state.present.document.space, doc.height, doc.budget), null);
  assert.deepEqual(undoEditor(applied.state).present, state.present);
  assert.deepEqual(redoEditor(undoEditor(applied.state)), applied.state);
});
test('proposal guards reject changes to preserved architecture even with valid equipment placement', () => {
  const doc = document(), state = createEditorHistory(doc);
  const changes = [
    space => { space.outline[1].x -= 0.1; },
    space => { space.columns[0].x += 0.1; },
    space => { space.stairwell.x -= 0.1; },
    space => { space.finishes = { ...space.finishes, wall: '#ffffff' }; },
    space => { space.visualization = { snap: 0.05, dimensions: true }; },
    space => { space.walls = [{ id: 'injected-wall', axis: 'x', x: 12, y: 12, length: 1, thickness: 0.1 }]; },
  ];
  for (const change of changes) {
    const candidate = structuredClone(response(doc)); change(candidate.spaceProposal.space);
    assert.throws(() => createGymAiReview(candidate, state.present, 1));
  }
  assert.deepEqual(state, createEditorHistory(doc));
});
