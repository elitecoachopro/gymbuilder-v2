import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptySpace } from '../../src/lib/gym-space.ts';
import { readEditorDraft, isRecoverableEditorDraft, DraftWriteQueue } from '../../src/lib/gym-editor-draft.ts';

const draft = () => ({ version: 1, owner: 'account-a', projectId: null, savedFingerprint: '', updatedAt: 1234, storey: 1, document: { name: 'Imperial Gym', height: 3.5, budget: null, brief: '', space: { ...emptySpace(), upperFloor: emptySpace() } } });

test('versioned recovery validates the complete building and isolates accounts', () => {
  const record = draft();
  assert.deepEqual(readEditorDraft(JSON.parse(JSON.stringify(record)), 'account-a'), record);
  assert.equal(readEditorDraft(record, 'account-b'), null);
  assert.equal(readEditorDraft({ ...record, version: 2 }, 'account-a'), null);
  assert.equal(readEditorDraft({ ...record, document: { ...record.document, height: 1 } }, 'account-a'), null);
  assert.equal(readEditorDraft({ ...record, document: { ...record.document, space: emptySpace() } }, 'account-a'), null);
  assert.equal(readEditorDraft({ ...record, secret: 'unsupported-field' }, 'account-a'), null);
});

test('queued writes cannot finish out of order and a failed write does not destroy the previous record', async () => {
  let release;
  let stored = draft();
  const queue = new DraftWriteQueue(async value => {
    if (value.updatedAt === 2) await new Promise(resolve => { release = resolve; });
    if (value.updatedAt === 4) throw new Error('QuotaExceededError');
    stored = value;
  });
  const first = queue.write({ ...draft(), updatedAt: 2 });
  const second = queue.write({ ...draft(), updatedAt: 3 });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(stored.updatedAt, 1234);
  release();
  await Promise.all([first, second]);
  assert.equal(stored.updatedAt, 3);
  await assert.rejects(queue.write({ ...draft(), updatedAt: 4 }), /Quota/);
  assert.equal(stored.updatedAt, 3);
  await queue.write({ ...draft(), updatedAt: 5 });
  assert.equal(stored.updatedAt, 5);
});

 test('a clean checkpoint after Undo or Save is not offered as unsaved recovery', async () => {
  const initial = draft();
  initial.savedFingerprint = JSON.stringify(initial.document);
  let stored = initial;
  const queue = new DraftWriteQueue(async value => { stored = value; });
  const edited = { ...initial, document: { ...initial.document, name: 'Edited name' } };
  await queue.write(edited);
  assert.equal(isRecoverableEditorDraft(stored), true);
  await queue.write(initial);
  assert.equal(isRecoverableEditorDraft(stored), false);
  assert.deepEqual(readEditorDraft(stored, 'account-a').document, initial.document);
});
