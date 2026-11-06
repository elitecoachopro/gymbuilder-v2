import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serviceProfileSchema, hasServices } from '../../src/lib/gym-services.ts';

test('legacy registrations stay equipment suppliers without service data', () => {
  assert.deepEqual(serviceProfileSchema.parse({}), { businessType: 'equipment', serviceCategories: [], serviceAreas: '', serviceBrands: '' });
  assert.equal(hasServices('equipment'), false);
  assert.equal(hasServices('service'), true);
  assert.equal(hasServices('both'), true);
});

test('service profiles require real coverage and known service categories', () => {
  const valid = { businessType: 'service', serviceCategories: ['repairs', 'preventive'], serviceAreas: ' București și Ilfov ', serviceBrands: 'Technogym, Life Fitness' };
  assert.equal(serviceProfileSchema.parse(valid).serviceAreas, 'București și Ilfov');
  for (const delta of [{ serviceCategories: [] }, { serviceCategories: ['invented'] }, { serviceAreas: ' ' }, { serviceAreas: '<b></b>' }, { businessType: 'admin' }, { serviceBrands: 'x'.repeat(501) }, { status: 'approved' }, { user_id: 'someone-else' }]) {
    assert.equal(serviceProfileSchema.safeParse({ ...valid, ...delta }).success, false, JSON.stringify(delta));
  }
  assert.equal(serviceProfileSchema.safeParse({ ...valid, businessType: 'both' }).success, true);
});

test('switching off services removes stale public service metadata', () => {
  assert.deepEqual(serviceProfileSchema.parse({ businessType: 'equipment', serviceCategories: ['repairs'], serviceAreas: 'Ilfov', serviceBrands: 'Example' }), { businessType: 'equipment', serviceCategories: [], serviceAreas: '', serviceBrands: '' });
});

test('public service text preserves punctuation and strips HTML without pre-encoding React text', () => {
  const value = serviceProfileSchema.parse({ businessType: 'service', serviceCategories: ['repairs'], serviceAreas: ' <b>București & Ilfov</b> ', serviceBrands: "Tom's Fitness & Co" });
  assert.equal(value.serviceAreas, 'București & Ilfov');
  assert.equal(value.serviceBrands, "Tom's Fitness & Co");
});
