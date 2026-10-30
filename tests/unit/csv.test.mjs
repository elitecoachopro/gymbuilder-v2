import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV, parseCSVPrice } from '../../src/lib/csv.ts';
test('CSV preserves escaped quotes, multiline fields and BOM headers', () => {
  assert.deepEqual(parseCSV('\uFEFFname,description,price\r\n"Rack ""Pro""","First line\nSecond line",99.50'), { headers: ['name','description','price'], rows: [['Rack "Pro"','First line\nSecond line','99.50']] });
});
test('semicolon CSV supports decimal comma without changing the price', () => {
  const csv = parseCSV('name;price\nRack;99,50'); assert.equal(parseCSVPrice(csv.rows[0][1]),99.5);
  assert.ok(Number.isNaN(parseCSVPrice('12abc'))); assert.ok(Number.isNaN(parseCSVPrice('-10')));
});
test('malformed CSV is rejected', () => { assert.throws(() => parseCSV('name,price\n"unclosed,10')); assert.throws(() => parseCSV('name,price\nRack,10,extra')); });
