import { test } from 'node:test';
import assert from 'node:assert/strict';
import { equipmentSurface } from '../../src/lib/gym-surface.ts';

test('CAD structure and mounting hardware never become upholstered seats', () => {
  for (const name of ['010_Leg press seat base crossmember', '011_Seat mast', 'Seat mounting saddle', 'Back pad bearer']) assert.equal(equipmentSurface(name), 'paint');
  for (const name of ['014_Backrest', '012_Inclined back pad', 'Bicycle saddle', 'Short bench seat']) assert.equal(equipmentSurface(name), 'upholstery');
});
test('CAD belts, controls and metal grips keep distinct surface roles', () => {
  assert.equal(equipmentSurface('Continuous running belt'), 'rubber');
  assert.equal(equipmentSurface('Dumbbell textured grip'), 'steel');
  assert.equal(equipmentSurface('Dumbbell circular head'), 'rubber');
  assert.equal(equipmentSurface('Inset display'), 'display');
  assert.equal(equipmentSurface('Emergency stop button'), 'control');
  assert.equal(equipmentSurface('Unknown component'), 'original');
});

test('detailed GLB finishes retain printed source decals and distinguish coated steel from vinyl', () => {
 assert.equal(equipmentSurface('printed labels and displays'),'original');
 assert.equal(equipmentSurface('graphite powder coat (textured)'),'paint');
 assert.equal(equipmentSurface('red upholstery vinyl'),'upholstery');
 assert.equal(equipmentSurface('chrome-plated steel'),'steel');
});
