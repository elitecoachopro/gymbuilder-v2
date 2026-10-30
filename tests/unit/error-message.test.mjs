import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getErrorMessage } from '../../src/lib/error-message.ts';
test('unknown thrown values always produce a string error message', () => {
  assert.equal(getErrorMessage(new Error('Failed')), 'Failed');
  assert.equal(getErrorMessage({ message: 'Database failure' }), 'Database failure');
  for (const thrown of [null, undefined, 'failure', 42, {}, { message: {} }, new Error('')]) {
    assert.equal(getErrorMessage(thrown, 'Connection failed'), 'Connection failed');
  }
});
