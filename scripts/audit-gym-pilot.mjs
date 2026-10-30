import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { EQUIPMENT_CATALOG } from '../src/lib/gym-catalog.ts';
import { EQUIPMENT_PILOT_IDS } from '../src/lib/gym-equipment-pilot.ts';
import { annotatePilotRecord } from './lib/gym-pilot-record.mjs';
const root = fileURLToPath(new URL('../', import.meta.url)), toolRoot = process.env.GYM_GLTF_TOOLS;
if (!toolRoot) throw Error('Set GYM_GLTF_TOOLS to the offline glTF tools node_modules directory.');
const { NodeIO } = await import(pathToFileURL(path.join(toolRoot, '@gltf-transform/core/dist/index.js')));
const { KHRMeshQuantization } = await import(pathToFileURL(path.join(toolRoot, '@gltf-transform/extensions/dist/index.js')));
const { getBounds } = await import(pathToFileURL(path.join(toolRoot, '@gltf-transform/functions/dist/index.js')));
const { validateBytes } = createRequire(import.meta.url)(path.join(toolRoot, 'gltf-validator'));
const io = new NodeIO().registerExtensions([KHRMeshQuantization]);
const manifestPath = path.join(root, 'public/models/gym/pilot/manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath)), reviews = JSON.parse(await fs.readFile(path.join(root, 'assets/gym-pilot-rights.json')));
if (JSON.stringify(manifest.map(e => e.id)) !== JSON.stringify(EQUIPMENT_PILOT_IDS)) throw Error('Pilot inventory mismatch');
const output = [];
for (const entry of manifest) {
  const bytes = await fs.readFile(path.join(root, 'public', entry.url)), source = await fs.readFile(path.join(root, 'public', entry.sourceAsset));
  const hash = b => createHash('sha256').update(b).digest('hex');
  if (hash(bytes) !== entry.sha256 || hash(source) !== entry.sourceSha256) throw Error(`${entry.id}: hash mismatch`);
  const doc = await io.readBinary(bytes), original = await io.readBinary(source);
  const bounds = getBounds(doc.getRoot().getDefaultScene()), sourceBounds = getBounds(original.getRoot().getDefaultScene());
  for (const key of ['min', 'max']) for (let axis = 0; axis < 3; axis++) if (Math.abs(bounds[key][axis] - entry.bounds[key][axis]) > 0.00001 || Math.abs(sourceBounds[key][axis] - entry.sourceBounds[key][axis]) > 0.00001) throw Error(`${entry.id}: bounds mismatch`);
  let triangles = 0, drawCalls = 0;
  for (const mesh of doc.getRoot().listMeshes()) for (const primitive of mesh.listPrimitives()) { triangles += (primitive.getIndices()?.getCount() ?? primitive.getAttribute('POSITION').getCount()) / 3; drawCalls++; }
  if (bytes.length !== entry.bytes || triangles !== entry.triangles || drawCalls !== entry.drawCalls || bytes.length > 2600000 || triangles > 40000 || drawCalls > 20) throw Error(`${entry.id}: rendering budget mismatch`);
  const validation = await validateBytes(bytes, { uri: entry.id + '.glb' });
  if (validation.issues.numErrors || validation.issues.numWarnings) throw Error(`${entry.id}: invalid GLB`);
  output.push(annotatePilotRecord({ ...entry, bounds, sourceBounds }, EQUIPMENT_CATALOG.find(m => m.id === entry.id), reviews.find(r => r.id === entry.id)));
  console.log(`${entry.id}: verified bounds, ${triangles} triangles, ${drawCalls} draws, ${bytes.length} bytes`);
}
if (process.argv.includes('--write')) await fs.writeFile(manifestPath, JSON.stringify(output, null, 2) + '\n');
else if (JSON.stringify(output) !== JSON.stringify(manifest)) throw Error('Pilot evidence is stale; review and run --write');
