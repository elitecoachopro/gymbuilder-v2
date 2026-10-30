import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { REAL_EQUIPMENT } from '../../src/lib/gym-real-equipment.ts';
import { createHash } from 'node:crypto';

test('detailed imported GLBs retain provenance, metre bounds and an economic rendering budget', () => {
 for (const variant of ['detailed','precise']) {
 const manifest=JSON.parse(fs.readFileSync(new URL('../../public/models/gym/'+variant+'/manifest.json',import.meta.url)));
 assert.equal(manifest.length,6);
 for(const entry of manifest){
  if(variant==='precise') assert.equal(REAL_EQUIPMENT.find(model=>model.id===entry.id)?.asset.url,entry.url,'runtime catalog must use the verified precise asset');
  assert.equal(entry.license,'CC0-1.0');assert.ok(entry.sourceUrl.startsWith('https://www.innerscene.com/tools/library/3d-parts/'));
  const bytes=fs.readFileSync(new URL('../../public'+entry.url,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.glbSha256);
  assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(bytes.readUInt32LE(8),bytes.length);
  assert.ok(bytes.length<=2_500_000,`${entry.id} download budget`);
  assert.ok(entry.triangles<=40000,`${entry.id} triangle budget`);assert.ok(entry.drawCalls<=20,`${entry.id} draw calls`);
  assert.ok(entry.length_m>0.5&&entry.length_m<4);assert.ok(entry.width_m>0.3&&entry.width_m<4);assert.ok(entry.height_m>0.3&&entry.height_m<2.5);
  const json=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
  assert.ok(!(json.extensionsRequired||[]).some(e=>/draco|meshopt|basisu/i.test(e)),'no external runtime decoder');
  assert.ok((json.buffers||[]).every(b=>!b.uri));assert.ok((json.images||[]).every(image=>!image.uri));
 }
 }
});
