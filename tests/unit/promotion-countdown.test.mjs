import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promotionCountdown } from '../../src/lib/promotions.ts';

test('Super price countdown uses elapsed time, rounds partial seconds and never goes negative', () => {
  const end = '2026-10-25T12:00:00Z';
  assert.equal(promotionCountdown(end, Date.parse('2026-10-25T00:00:00Z')), '12:00:00');
  assert.equal(promotionCountdown(end, Date.parse(end) - 1001), '00:00:02');
  assert.equal(promotionCountdown(end, Date.parse(end)), '00:00:00');
  assert.equal(promotionCountdown(end, Date.parse(end) + 5000), '00:00:00');
});
