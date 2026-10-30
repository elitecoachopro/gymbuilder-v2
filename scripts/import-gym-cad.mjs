import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const occt = await require(process.env.OCCT_IMPORT_MODULE || 'occt-import-js')();
const sourceDir = process.argv[2];
if (!sourceDir) throw new Error('Usage: OCCT_IMPORT_MODULE=/path/to/occt-import-js node scripts/import-gym-cad.mjs /path/to/downloaded-step-files');
const selection = JSON.parse(await fs.readFile(path.join(root, 'assets/gym-cad-sources.json'), 'utf8'));
const output = path.join(root, 'public/models/gym/innerscene');
await fs.mkdir(path.join(output, 'cad'), { recursive: true });
const manifest = [];
const catalog = [];
const sha256 = data => createHash('sha256').update(data).digest('hex');

function finishFor(name) {
  if (/rubber|floor foot|grip|belt|bumper|dumbbell|weight plate/i.test(name)) return null;
  if (/seat|backrest|upholster|cushion|pad/i.test(name)) return 'upholstery';
  if (/frame|rail|support|stabilizer|upright|mast|cross.?bar|column|leg\b/i.test(name)) return 'frame';
  return null;
}
function materialFor(mesh) {
  const name = mesh.name, colour = mesh.color || [0.12, 0.16, 0.2];
  const chrome = /chrome|steel|axle|rod|guide|barbell|collar/i.test(name);
  const soft = /rubber|pad|seat|backrest|belt|grip|cushion/i.test(name);
  return { name, pbrMetallicRoughness: { baseColorFactor: [...colour, 1], metallicFactor: chrome ? 0.8 : soft ? 0 : 0.45, roughnessFactor: chrome ? 0.23 : soft ? 0.85 : 0.4 }, extras: { gymbuilderFinish: finishFor(name) } };
}
function glbFromCad(result, id, sourceUrl) {
  const minimum = [Infinity, Infinity, Infinity], maximum = [-Infinity, -Infinity, -Infinity];
  for (const mesh of result.meshes) {
    const values = mesh.attributes.position.array;
    for (let i = 0; i < values.length; i += 3) for (let j = 0; j < 3; j++) {
      if (!Number.isFinite(values[i + j])) throw new Error(`${id}: non-finite CAD coordinates`);
      minimum[j] = Math.min(minimum[j], values[i + j]); maximum[j] = Math.max(maximum[j], values[i + j]);
    }
  }
  const size = maximum.map((v, i) => v - minimum[i]);
  if (size.some(v => !(v > 0 && v <= 200))) throw new Error(`${id}: invalid metre bounds`);
  const centre = maximum.map((v, i) => (v + minimum[i]) / 2);
  const document = { asset: { version: '2.0', generator: 'GymBuilder CAD importer / occt-import-js 0.0.23', copyright: 'Innerscene — CC0 1.0', extras: { sourceUrl, sourceAxes: 'STEP: Z up; GLB: Y up; metres; centred X/Z, floor Y=0' } }, scene: 0, scenes: [{ nodes: [] }], nodes: [], meshes: [], materials: [], accessors: [], bufferViews: [], buffers: [] };
  const chunks = []; let byteLength = 0, triangles = 0;
  function accessor(array, type, componentType, limits) {
    const data = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
    const view = document.bufferViews.push({ buffer: 0, byteOffset: byteLength, byteLength: data.length, target: type === 'SCALAR' ? 34963 : 34962 }) - 1;
    chunks.push(data); byteLength += data.length;
    return document.accessors.push({ bufferView: view, componentType, count: array.length / (type === 'VEC3' ? 3 : 1), type, ...limits }) - 1;
  }
  for (const mesh of result.meshes) {
    const original = mesh.attributes.position.array, positions = new Float32Array(original.length);
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < original.length; i += 3) {
      positions[i] = original[i + 1] - centre[1];
      positions[i + 1] = original[i + 2] - minimum[2];
      positions[i + 2] = original[i] - centre[0];
      for (let j = 0; j < 3; j++) { min[j] = Math.min(min[j], positions[i + j]); max[j] = Math.max(max[j], positions[i + j]); }
    }
    const attributes = { POSITION: accessor(positions, 'VEC3', 5126, { min, max }) };
    if (mesh.attributes.normal) {
      const n = mesh.attributes.normal.array, normals = new Float32Array(n.length);
      for (let i = 0; i < n.length; i += 3) { normals[i] = n[i + 1]; normals[i + 1] = n[i + 2]; normals[i + 2] = n[i]; }
      attributes.NORMAL = accessor(normals, 'VEC3', 5126);
    }
    const indices = accessor(new Uint32Array(mesh.index.array), 'SCALAR', 5125);
    triangles += mesh.index.array.length / 3;
    const material = document.materials.push(materialFor(mesh)) - 1;
    const meshIndex = document.meshes.push({ name: mesh.name, primitives: [{ attributes, indices, material }] }) - 1;
    document.scenes[0].nodes.push(document.nodes.push({ name: mesh.name, mesh: meshIndex }) - 1);
  }
  document.buffers.push({ byteLength });
  const json = Buffer.from(JSON.stringify(document));
  const jsonChunk = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20); json.copy(jsonChunk);
  const binary = Buffer.concat(chunks);
  const header = Buffer.alloc(20); header.write('glTF'); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + jsonChunk.length + binary.length, 8); header.writeUInt32LE(jsonChunk.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  const binaryHeader = Buffer.alloc(8); binaryHeader.writeUInt32LE(binary.length); binaryHeader.writeUInt32LE(0x004e4942, 4);
  return { data: Buffer.concat([header, jsonChunk, binaryHeader, binary]), dimensions: { length_m: Math.ceil(size[1] * 1000) / 1000, width_m: Math.ceil(size[0] * 1000) / 1000, height_m: Math.ceil(size[2] * 1000) / 1000 }, sourceBounds_m: { min: minimum, max: maximum }, triangles, meshes: result.meshes.length };
}
for (const [id, slug, name, nameEn, zone, price_eur] of selection) {
  const step = await fs.readFile(path.join(sourceDir, `${id}.step`));
  const sourceUrl = `https://www.innerscene.com/tools/library/3d-parts/${slug}`;
  const result = occt.ReadStepFile(new Uint8Array(step), { linearUnit: 'meter', linearDeflectionType: 'absolute_value', linearDeflection: 0.00075, angularDeflection: 0.22 });
  if (!result.success || !result.meshes?.length) throw new Error(`${id}: STEP import failed`);
  const converted = glbFromCad(result, id, sourceUrl);
  const modelUrl = `/models/gym/innerscene/${id}.glb`, cadUrl = `/models/gym/innerscene/cad/${id}.step`;
  await fs.writeFile(path.join(root, 'public', modelUrl), converted.data);
  await fs.writeFile(path.join(root, 'public', cadUrl), step);
  const asset = { url: modelUrl, cadUrl, sourceUrl, author: 'Innerscene', license: 'CC0-1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' };
  catalog.push({ id, name, zone, ...converted.dimensions, price_eur, label: `${name} — ${converted.dimensions.length_m} × ${converted.dimensions.width_m} m`, asset });
  manifest.push({ id, name, nameEn, ...converted.dimensions, ...asset, originalDownloadUrl: `https://www.innerscene.com/api/library/${slug}/download`, downloadedOn: '2026-10-23', stepSha256: sha256(step), glbSha256: sha256(converted.data), stepBytes: step.length, glbBytes: converted.data.length, sourceBounds_m: converted.sourceBounds_m, triangles: converted.triangles, meshes: converted.meshes, transformations: ['millimetres to metres via OpenCascade', '(X,Y,Z) to (Y,Z,X), preserving handedness', 'centre X/Z and place floor at Y=0', 'triangulate 0.75 mm; 0.22 rad', 'preserve source colours; assign PBR metalness/roughness by part name'], priceNote: 'GymBuilder indicative planning allowance, not a source or manufacturer quotation.' });
  console.log(`${id}: ${converted.meshes} meshes, ${converted.triangles} triangles, ${converted.data.length} bytes, ${JSON.stringify(converted.dimensions)}`);
}
await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
await fs.writeFile(path.join(root, 'src/lib/gym-imported-equipment.ts'), `import { REAL_EQUIPMENT } from './gym-real-equipment.ts';\nimport { pilotEquipmentUrl } from './gym-equipment-pilot.ts';\n// Generated by scripts/import-gym-cad.mjs from the retained CC0 STEP sources.\nexport const IMPORTED_EQUIPMENT = ${JSON.stringify(catalog, null, 2)};\n\nexport function importedEquipment(id: string) {\n  const equipment = IMPORTED_EQUIPMENT.find(equipment => equipment.id === id) ?? REAL_EQUIPMENT.find(equipment => equipment.id === id);\n  const url = pilotEquipmentUrl(id);\n  return equipment && url ? { ...equipment, asset: { ...equipment.asset, url } } : equipment;\n}\n`);
const dictionaryPath = path.join(root, 'src/i18n/ui.en.json');
const dictionary = JSON.parse(await fs.readFile(dictionaryPath, 'utf8'));
for (const [, , name, nameEn] of selection) dictionary[name] = nameEn;
await fs.writeFile(dictionaryPath, JSON.stringify(dictionary, null, 2) + '\n');
