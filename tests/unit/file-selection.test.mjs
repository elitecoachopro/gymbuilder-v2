import { test } from 'node:test';
import assert from 'node:assert/strict';
import { consumeFileSelection } from '../../src/lib/file-selection.ts';

test('selection is copied before the input is cleared for same-file reselection', () => {
  const file = new File(['test'], 'photo.png', { type: 'image/png' });
  const live = { 0: file, length: 1 };
  let value = 'photo.png';
  const input = { files: live, get value() { return value; }, set value(next) { value = next; delete live[0]; live.length = 0; } };
  assert.deepEqual(consumeFileSelection(input), [file]);
  assert.equal(value, '');
});

test('empty and cancelled selections are safe', () => {
  assert.deepEqual(consumeFileSelection({ files: null, value: '' }), []);
  assert.deepEqual(consumeFileSelection({ files: [], value: '' }), []);
});
