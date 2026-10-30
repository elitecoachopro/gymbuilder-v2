import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

const directory = new URL('../public/models/gym/innerscene/', import.meta.url);
const manifest = JSON.parse(await fs.readFile(new URL('manifest.json', directory), 'utf8'));
for (const entry of manifest) {
  const file = new URL(`${entry.id}.glb`, directory);
  const before = await fs.readFile(file);
  const jsonLength = before.readUInt32LE(12);
  const document = JSON.parse(before.subarray(20, 20 + jsonLength).toString());
  const binary = before.subarray(28 + jsonLength, 28 + jsonLength + document.buffers[0].byteLength);
  const parts = [binary]; let offset = binary.length, changed = false;
  for (const mesh of document.meshes) for (const primitive of mesh.primitives) {
    if (primitive.attributes.TEXCOORD_0 !== undefined) continue;
    const position = document.accessors[primitive.attributes.POSITION];
    const normal = document.accessors[primitive.attributes.NORMAL];
    const positionOffset = document.bufferViews[position.bufferView].byteOffset + (position.byteOffset || 0);
    const normalOffset = normal ? document.bufferViews[normal.bufferView].byteOffset + (normal.byteOffset || 0) : 0;
    if (position.componentType !== 5126 || document.bufferViews[position.bufferView].byteStride) throw new Error('Expected packed float CAD positions.');
    const uv = Buffer.alloc(position.count * 8);
    for (let i = 0; i < position.count; i++) {
      const n = normal ? [0, 1, 2].map(axis => Math.abs(binary.readFloatLE(normalOffset + i * 12 + axis * 4))) : [0, 1, 0];
      const dominant = n.indexOf(Math.max(...n));
      const axes = dominant === 0 ? [2, 1] : dominant === 1 ? [0, 2] : [0, 1];
      axes.forEach((axis, component) => {
        const span = position.max[axis] - position.min[axis];
        uv.writeFloatLE(span > 0.00001 ? (binary.readFloatLE(positionOffset + i * 12 + axis * 4) - position.min[axis]) / span : 0, i * 8 + component * 4);
      });
    }
    const view = document.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: uv.length, target: 34962 }) - 1;
    primitive.attributes.TEXCOORD_0 = document.accessors.push({ bufferView: view, componentType: 5126, count: position.count, type: 'VEC2' }) - 1;
    parts.push(uv); offset += uv.length; changed = true;
  }
  if (!changed) continue;
  document.buffers[0].byteLength = offset;
  const json = Buffer.from(JSON.stringify(document)), padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20); json.copy(padded);
  const header = Buffer.alloc(20); header.write('glTF'); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + padded.length + offset, 8); header.writeUInt32LE(padded.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  const binaryHeader = Buffer.alloc(8); binaryHeader.writeUInt32LE(offset); binaryHeader.writeUInt32LE(0x004e4942, 4);
  const result = Buffer.concat([header, padded, binaryHeader, ...parts]);
  if (!result.subarray(28 + padded.length, 28 + padded.length + binary.length).equals(binary)) throw new Error('Original CAD geometry changed.');
  await fs.writeFile(file, result);
  entry.glbBytes = result.length; entry.glbSha256 = createHash('sha256').update(result).digest('hex');
  entry.transformations.push('add planar UV coordinates; original position/normal/index buffers unchanged');
  console.log(`${entry.id}: UV added, original geometry preserved, ${result.length} bytes`);
}
await fs.writeFile(new URL('manifest.json', directory), JSON.stringify(manifest, null, 2) + '\n');
