import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { EQUIPMENT_PILOT_IDS, pilotEquipmentEvidence, pilotPublicationError } from '../src/lib/gym-equipment-pilot.ts';
import { EQUIPMENT_CATALOG } from '../src/lib/gym-catalog.ts';
import { assertCurrentPilotRights } from './lib/gym-pilot-record.mjs';
const manifest = JSON.parse(fs.readFileSync(new URL('../public/models/gym/pilot/manifest.json', import.meta.url)));
const reviews = JSON.parse(fs.readFileSync(new URL('../assets/gym-pilot-rights.json', import.meta.url)));
if (JSON.stringify(manifest.map(e => e.id)) !== JSON.stringify(EQUIPMENT_PILOT_IDS)) throw Error('Pilot inventory mismatch');
for (const id of EQUIPMENT_PILOT_IDS) {
  const entry = pilotEquipmentEvidence(id), problem = pilotPublicationError(entry ?? {});
  if (problem) throw Error(`${id}: ${problem}`);
  assertCurrentPilotRights(entry, reviews.find(review => review.id === id));
  const model = EQUIPMENT_CATALOG.find(model => model.id === id);
  for (const key of ['length_m', 'width_m', 'height_m']) if (model?.[key] !== entry.catalogueDimensions[key]) throw Error(`${id}: catalogue evidence is stale`);
  const bytes = fs.readFileSync(new URL('../public' + entry.url, import.meta.url));
  if (bytes.length !== entry.bytes || createHash('sha256').update(bytes).digest('hex') !== entry.sha256 || bytes.toString('ascii', 0, 4) !== 'glTF' || bytes.readUInt32LE(8) !== bytes.length) throw Error(`${id}: packaged asset differs from verified evidence`);
}
console.log('Pilot publication gate: 10 assets verified. Unbranded CC0 models; dimensions are not manufacturer-certified.');
