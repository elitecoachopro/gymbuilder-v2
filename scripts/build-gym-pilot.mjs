import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { EQUIPMENT_PILOT_IDS } from '../src/lib/gym-equipment-pilot.ts';
import { EQUIPMENT_CATALOG } from '../src/lib/gym-catalog.ts';
import { assertPilotRights, annotatePilotRecord } from './lib/gym-pilot-record.mjs';
import { equipmentSurface } from '../src/lib/gym-surface.ts';
import { createEquipmentRelief } from '../src/lib/gym-pbr-textures.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const toolRoot = process.env.GYM_GLTF_TOOLS;
if (!toolRoot) throw Error('Set GYM_GLTF_TOOLS to the offline glTF tools node_modules directory.');
const modulePath = name => pathToFileURL(path.join(toolRoot, name));
const { NodeIO } = await import(modulePath('@gltf-transform/core/dist/index.js'));
const { dedup, flatten, join, prune, tangents, unweld, weld, quantize, getBounds } = await import(modulePath('@gltf-transform/functions/dist/index.js'));
const { KHRMeshQuantization } = await import(modulePath('@gltf-transform/extensions/dist/index.js'));
const { default: sharp } = await import(modulePath('sharp/lib/index.js'));
const require = createRequire(import.meta.url);
const { generateTangents } = require(path.join(toolRoot, 'mikktspace'));
const { validateBytes } = require(path.join(toolRoot, 'gltf-validator'));
function surfaceTangents(positions, normals, uvs) {
  const result = generateTangents(positions, normals, uvs);
  for (let i = 0; i < result.length; i += 4) {
    if (Math.hypot(result[i], result[i + 1], result[i + 2]) > 0.5) continue;
    // Collapsed source UV triangles have no tangent direction; choose an orthogonal basis.
    const n = i / 4 * 3, nx = normals[n], ny = normals[n + 1], nz = normals[n + 2];
    const tangent = Math.abs(ny) < 0.9 ? [-nz, 0, nx] : [0, nz, -ny];
    const length = Math.hypot(...tangent);
    result.set([...tangent.map(value => value / length), 1], i);
  }
  return result;
}
const io = new NodeIO().registerExtensions([KHRMeshQuantization]);
const out = path.join(root, 'public/models/gym/pilot');
await fs.mkdir(out, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const cad = JSON.parse(await fs.readFile(path.join(root, 'public/models/gym/innerscene/manifest.json')));
const detailed = JSON.parse(await fs.readFile(path.join(root, 'public/models/gym/precise/manifest.json')));
const manifests = new Map([...cad, ...detailed].map(source => [source.id, source]));
const reviews = JSON.parse(await fs.readFile(path.join(root, 'assets/gym-pilot-rights.json')));
const normals = new Map();
for (const role of ['paint', 'upholstery', 'rubber', 'steel']) {
  const relief = createEquipmentRelief(role);
  const { data, width: size } = relief.image;
  const normal = Buffer.alloc(data.length);
  const height = (x, y) => data[(((y + size) % size) * size + (x + size) % size) * 4] / 255;
  const strength = role === 'upholstery' ? 0.45 : role === 'rubber' ? 0.35 : 0.18;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (height(x - 1, y) - height(x + 1, y)) * strength;
    const dy = (height(x, y - 1) - height(x, y + 1)) * strength;
    const length = Math.hypot(dx, dy, 1), index = (y * size + x) * 4;
    normal[index] = Math.round((dx / length * 0.5 + 0.5) * 255);
    normal[index + 1] = Math.round((dy / length * 0.5 + 0.5) * 255);
    normal[index + 2] = Math.round((1 / length * 0.5 + 0.5) * 255);
    normal[index + 3] = 255;
  }
  normals.set(role, await sharp(normal, { raw: { width: size, height: size, channels: 4 } }).png().toBuffer());
  relief.dispose();
}
function stats(doc) {
  let triangles = 0, drawCalls = 0;
  for (const mesh of doc.getRoot().listMeshes()) for (const primitive of mesh.listPrimitives()) {
    triangles += (primitive.getIndices()?.getCount() ?? primitive.getAttribute('POSITION').getCount()) / 3;
    drawCalls++;
  }
  return { triangles, drawCalls };
}
const manifest = [];
for (const id of EQUIPMENT_PILOT_IDS) {
  const source = manifests.get(id);
  const review = reviews.find(review => review.id === id);
  assertPilotRights({ id, license: source.license, sourceUrl: source.sourceUrl }, review);
  const sourceUrl = source.url ?? `/models/gym/innerscene/${id}.glb`;
  const original = await fs.readFile(path.join(root, 'public', sourceUrl));
  if (hash(original) !== source.glbSha256) throw Error(`${id}: source hash mismatch`);
  const doc = await io.readBinary(original);
  const sourceBounds = getBounds(doc.getRoot().getDefaultScene());
  const sourceStats = stats(doc);
  const textures = new Map();
  for (const material of doc.getRoot().listMaterials()) {
    const role = equipmentSurface(material.getName());
    material.setExtras({ ...material.getExtras(), gymbuilderSurface: role, gymbuilderPilot: true });
    if (!normals.has(role)) continue;
    if (!textures.has(role)) textures.set(role, doc.createTexture(`${role} microdetail`).setImage(normals.get(role)).setMimeType('image/png'));
    material.setNormalTexture(textures.get(role));
    material.setNormalScale(0.65);
  }
  const materials = [];
  for (const material of doc.getRoot().listMaterials()) {
    const duplicate = materials.find(other => material.equals(other, new Set(['name'])));
    if (!duplicate) { materials.push(material); continue; }
    for (const mesh of doc.getRoot().listMeshes()) for (const primitive of mesh.listPrimitives()) {
      if (primitive.getMaterial() === material) primitive.setMaterial(duplicate);
    }
  }
  await doc.transform(flatten(), join({ keepNamed: false }), dedup(), prune(), unweld(), tangents({ generateTangents: surfaceTangents }), weld(), quantize({ pattern: /^(NORMAL|TANGENT)$/, quantizeNormal: 16 }));
  doc.createExtension(KHRMeshQuantization).setRequired(true);
  const bounds = getBounds(doc.getRoot().getDefaultScene()), outputStats = stats(doc);
  if (outputStats.triangles !== sourceStats.triangles) throw Error(`${id}: geometry changed`);
  const bytes = await io.writeBinary(doc), url = `/models/gym/pilot/${id}.glb`;
  if (bytes.length > 2_600_000 || outputStats.triangles > 40000 || outputStats.drawCalls > 20) throw Error(`${id}: rendering budget exceeded`);
  const validation = await validateBytes(bytes, { uri: `${id}.glb` });
  if (validation.issues.numErrors || validation.issues.numWarnings) throw Error(`${id}: invalid GLB: ${JSON.stringify(validation.issues)}`);
  await fs.writeFile(path.join(root, 'public', url), bytes);
  manifest.push(annotatePilotRecord({ id, url, sourceUrl: source.sourceUrl, license: source.license, author: source.author, sourceAsset: sourceUrl,
    sourceSha256: hash(original), sha256: hash(bytes), bytes: bytes.length, ...outputStats, sourceTriangles: sourceStats.triangles,
    sourceDrawCalls: sourceStats.drawCalls, sourceBounds, bounds, validation: { errors: validation.issues.numErrors, warnings: validation.issues.numWarnings },
    transforms: ['geometry and metre proportions retained', 'authored 128px embedded normal maps', 'MikkTSpace tangents', 'join identical finishes; preserve printed decals and surface roles'] }, EQUIPMENT_CATALOG.find(model => model.id === id), review));
  console.log(id, JSON.stringify({ bytes: bytes.length, ...outputStats, beforeDrawCalls: sourceStats.drawCalls }));
}
await fs.writeFile(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
await fs.writeFile(path.join(out, 'LICENSE.txt'), 'Original unbranded models by Innerscene, CC0-1.0. Source pages, hashes and transformations: manifest.json. Original microdetail maps authored for Gym Builder. Not manufacturer-certified models.\nhttps://www.innerscene.com/tools/library/terms\n');
