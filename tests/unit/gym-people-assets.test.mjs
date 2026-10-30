import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {PEOPLE_MODELS} from '../../src/lib/gym-people-assets.ts';
import {EQUIPMENT_CATALOG} from '../../src/lib/gym-catalog.ts';

function imagePixels(image,mime){
 if(mime==='image/png')return image.readUInt32BE(16)*image.readUInt32BE(20);
 assert.equal(mime,'image/jpeg');assert.equal(image.readUInt16BE(0),0xffd8);
 for(let offset=2;offset+9<image.length;){
  assert.equal(image[offset],0xff);const marker=image[offset+1],size=image.readUInt16BE(offset+2);
  if([0xc0,0xc1,0xc2].includes(marker))return image.readUInt16BE(offset+5)*image.readUInt16BE(offset+7);
  assert.ok(size>=2);offset+=size+2;
 }
 throw Error('Missing JPEG dimensions');
}

test('textured fictional people fit the editor footprints without external decoders or texture requests',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../../public/models/people/manifest.json',import.meta.url)));
 for(const pose of ['reception','coach','child']){
  const model=PEOPLE_MODELS[pose], entry=manifest.find(m=>m.pose===pose);
  assert.equal(entry.url,model.url);assert.equal(entry.license,'CC0-1.0');
  const b=fs.readFileSync(new URL('../../public'+model.url,import.meta.url));
  assert.equal(b.toString('ascii',0,4),'glTF');assert.equal(createHash('sha256').update(b).digest('hex'),entry.sha256);
  assert.ok(b.length<3_000_000,'bounded transfer per person');
  const g=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));
  assert.ok(g.images.length>0);assert.ok(g.images.every(i=>i.bufferView!==undefined&&!i.uri));
  assert.ok(g.buffers.every(i=>!i.uri));assert.ok(!(g.extensionsRequired||[]).some(e=>/draco|meshopt|basisu/i.test(e)));
  let triangles=0,draws=0;let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(const mesh of g.meshes)for(const p of mesh.primitives){draws++;const a=g.accessors[p.attributes.POSITION];
   triangles+=(p.indices!==undefined?g.accessors[p.indices].count:a.count)/3;
   for(let i=0;i<3;i++){min[i]=Math.min(min[i],a.min[i]);max[i]=Math.max(max[i],a.max[i]);}
  }
  const t=pose==='child'?{height_m:1.35,length_m:.5,width_m:.4}:EQUIPMENT_CATALOG.find(t=>t.id==='person_'+pose);
  assert.ok(triangles<48000&&draws<=10,'same order of geometric cost as procedural people');
  assert.ok(min[1]>=-.001&&max[1]<=t.height_m+.001);assert.ok(max[0]-min[0]<=t.length_m+.001);assert.ok(max[2]-min[2]<=t.width_m+.001);
  const binaryStart=20+b.readUInt32LE(12)+8;
  const pixels=g.images.reduce((total,image)=>{
   const view=g.bufferViews[image.bufferView],offset=binaryStart+(view.byteOffset??0);
   return total+imagePixels(b.subarray(offset,offset+view.byteLength),image.mimeType);
  },0);
  assert.equal(pixels,entry.texturePixels);assert.ok(pixels<=4_000_000,'bounded decoded texture memory');
 }
});

test('sled athlete preserves a bounded embedded skinned character with independently measured texture pixels',()=>{
 const entry=JSON.parse(fs.readFileSync(new URL('../../public/models/people/athlete-manifest.json',import.meta.url)));
 const b=fs.readFileSync(new URL('../../public'+entry.url,import.meta.url));
 assert.equal(createHash('sha256').update(b).digest('hex'),entry.sha256);assert.equal(entry.license,'CC0-1.0');assert.ok(b.length<3_000_000);
 const g=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12))),binaryStart=28+b.readUInt32LE(12);
 assert.equal(g.skins[0].joints.length,56);assert.ok(!g.animations?.length);
 assert.ok(g.meshes.every(m=>m.primitives.every(p=>p.attributes.JOINTS_0!==undefined&&p.attributes.WEIGHTS_0!==undefined)));
 assert.ok(g.buffers.every(i=>!i.uri));assert.ok(g.images.every(i=>i.bufferView!==undefined&&!i.uri));
 const pixels=g.images.reduce((total,image)=>{const view=g.bufferViews[image.bufferView],offset=binaryStart+(view.byteOffset??0);return total+imagePixels(b.subarray(offset,offset+view.byteLength),image.mimeType);},0);
 assert.equal(pixels,entry.texturePixels);assert.ok(pixels<=4_000_000);
 const primitives=g.meshes.flatMap(m=>m.primitives);assert.ok(primitives.length<=14);
 assert.ok(primitives.reduce((n,p)=>n+g.accessors[p.indices??p.attributes.POSITION].count/3,0)<50000);
});
