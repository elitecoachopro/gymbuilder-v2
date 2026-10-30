import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptySpace } from '../../src/lib/gym-space.ts';
import { createEditorHistory, commitEditorFloor, undoEditor, redoEditor } from '../../src/lib/gym-editor-history.ts';

const document = () => ({ name: 'Imperial Gym', height: 3.5, budget: null, brief: '', space: { ...emptySpace(), upperFloor: emptySpace() } });

test('upper-floor undo and redo restore the editing floor and preserve the entire building', () => {
  const initial = document();
  const state = createEditorHistory(initial, 1);
  const floor = { ...initial, space: { ...initial.space.upperFloor, finishes: { ...initial.space.finishes, wall: '#123456' } } };
  const edited = commitEditorFloor(state, floor).state;
  assert.equal(edited.present.document.space.finishes.wall, initial.space.finishes.wall);
  const switched = { ...edited, present: { ...edited.present, storey: 0 } };
  const undone = undoEditor(switched);
  assert.equal(undone.present.storey, 1);
  assert.deepEqual(undone.present.document, initial);
  const redone = redoEditor(undone);
  assert.equal(redone.present.storey, 1);
  assert.equal(redone.present.document.space.upperFloor.finishes.wall, '#123456');
});

test('invalid/no-op edits preserve history, new edits clear redo, history is bounded', () => {
  let state = createEditorHistory(document());
  assert.equal(commitEditorFloor(state, state.present.document).state, state);
  const bad = commitEditorFloor(state, { ...state.present.document, height: 1 });
  assert.ok(bad.error);
  assert.equal(bad.state, state);
  for (let n = 0; n < 55; n++) state = commitEditorFloor(state, { ...state.present.document, name: `Gym ${n}` }).state;
  assert.equal(state.past.length, 50);
  state = undoEditor(state);
  assert.equal(state.future.length, 1);
  state = commitEditorFloor(state, { ...state.present.document, name: 'A different edit' }).state;
  assert.equal(state.future.length, 0);
  assert.equal(redoEditor(state), state);
});
