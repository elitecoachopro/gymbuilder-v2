import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EQUIPMENT_PILOT_IDS, pilotEquipmentEvidence, pilotPublicationError } from '../../src/lib/gym-equipment-pilot.ts';
import { assertCurrentPilotRights } from '../../scripts/lib/gym-pilot-record.mjs';

test('every pilot exposes measured bounds, catalogue dimensions and reviewed unbranded provenance', () => {
  for (const id of EQUIPMENT_PILOT_IDS) {
    const record = pilotEquipmentEvidence(id);
    assert.equal(record.manufacturerCertified, false);
    assert.equal(record.dimensionBasis, 'measured-model-bounds');
    assert.equal(record.rightsReview.status, 'verified-cc0');
    assert.equal(record.rightsReview.sourceUrl, record.sourceUrl);
    assert.equal(pilotPublicationError(record), null);
    for (const key of ['length_m', 'width_m', 'height_m']) assert.ok(Math.abs(record.modelDimensions[key] - record.catalogueDimensions[key]) < 0.002);
  }
  assert.equal(pilotEquipmentEvidence('aparat_piept'), undefined);
  assert.equal(pilotEquipmentEvidence('unknown'), undefined);
});
test('publication gate rejects unclear rights, missing measurements and over-budget or uncertified claims', () => {
  const good = pilotEquipmentEvidence('cad_treadmill');
  for (const patch of [{ license: 'unknown' }, { rightsReview: undefined }, { rightsReview: { ...good.rightsReview, status: 'pending' } }, { rightsReview: { ...good.rightsReview, sourceUrl: 'https://example.test/other' } }, { manufacturerCertified: true }, { modelDimensions: undefined }, { bytes: 2_600_001 }, { triangles: 40001 }, { drawCalls: 21 }, { validation: { errors: 1, warnings: 0 } }]) assert.ok(pilotPublicationError({ ...good, ...patch }));
});

test('current rights review governs publication even when generated evidence has not changed', () => {
  const entry = pilotEquipmentEvidence('cad_treadmill');
  const approved = { ...entry.rightsReview };
  assert.doesNotThrow(() => assertCurrentPilotRights(entry, approved));
  for (const review of [undefined, { ...approved, status: 'pending' }, { ...approved, sourceUrl: 'https://example.test/other' }]) assert.throws(() => assertCurrentPilotRights(entry, review), /commercial-use evidence/);
  assert.throws(() => assertCurrentPilotRights(entry, { ...approved, checkedOn: '2026-10-27' }), /embedded rights evidence is stale/);
  assert.equal(entry.rightsReview.status, 'verified-cc0');
});
