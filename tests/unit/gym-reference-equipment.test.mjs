import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createEquipmentModel} from '../../src/lib/gym-reference-models.js';
for(const [id,l,w,h] of [['cad_treadmill',1.95,.89,1.41],['cad_leg_press',2.112,1.42,1.501]])test(id+' retains saved-project footprint and a bounded detailed model',()=>{
 const model=createEquipmentModel(id);const bounds=new THREE.Box3().setFromObject(model);assert.ok(bounds.min.x>=-l/2-.001&&bounds.max.x<=l/2+.001);assert.ok(bounds.min.z>=-w/2-.001&&bounds.max.z<=w/2+.001);assert.ok(bounds.min.y>=-.001&&bounds.max.y<=h+.001);let triangles=0,meshes=0;const roles=new Set();model.traverse(o=>{if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;roles.add(o.material.userData.gymbuilderSurface);});assert.ok(triangles>5000&&triangles<15000);assert.ok(meshes<=12);assert.ok(roles.has('paint')&&roles.has('steel')&&roles.has('rubber'));model.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
});

import fs from 'node:fs';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {referenceStrengthSource} from '../../src/lib/gym-reference-assets.ts';
import {referenceInspectionDirection} from '../../src/lib/gym-reference-identity.ts';
async function geometryOnly(id){
 const buffer=fs.readFileSync(new URL('../../public/models/gym/pilot/'+id+'.glb',import.meta.url));const length=buffer.readUInt32LE(12),doc=JSON.parse(buffer.subarray(20,20+length));doc.materials=doc.materials.map(m=>({name:m.name,extras:m.extras,pbrMetallicRoughness:{baseColorFactor:[.3,.3,.3,1]}}));delete doc.textures;delete doc.images;delete doc.samplers;const raw=Buffer.from(JSON.stringify(doc)),json=Buffer.alloc(Math.ceil(raw.length/4)*4,32);raw.copy(json);const bin=buffer.subarray(20+length),out=Buffer.alloc(20+json.length+bin.length);out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(json.length,12);out.writeUInt32LE(0x4e4f534a,16);json.copy(out,20);bin.copy(out,20+json.length);return (await new GLTFLoader().parseAsync(out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength),'')).scene;
}
for(const [id,l,w,h] of [['real_multigym',1.705,1.22,2.151],['real_cable_crossover',1.037,3.57,2.255]])test(id+' shares detailed geometry without changing the cached GLB source',async t=>{
 const previous=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};t.after(()=>{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;});
 const scene=await geometryOnly(id);const originals=[];scene.traverse(o=>{if(o.isMesh)originals.push([o.geometry,Buffer.from(o.geometry.index.array.buffer).toString('base64')]);});
 const model=referenceStrengthSource(scene,id);assert.notEqual(model,scene);assert.equal(referenceStrengthSource(scene,id),model);
 for(const [geometry,index] of originals)assert.equal(Buffer.from(geometry.index.array.buffer).toString('base64'),index,'shared source index unchanged');
 const b=new THREE.Box3().setFromObject(model);assert.ok(b.min.x>=-l/2-.001&&b.max.x<=l/2+.001);assert.ok(b.min.z>=-w/2-.001&&b.max.z<=w/2+.001);assert.ok(b.min.y>=-.001&&b.max.y<=h+.001);
 let triangles=0,meshes=0;model.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});assert.ok(triangles<45000&&meshes<=24);
});
test('close-up direction tracks new model faces and saved rotation',()=>{assert.ok(referenceInspectionDirection('cad_treadmill',0)[0]<0);assert.ok(referenceInspectionDirection('real_multigym',0)[0]>0);const [x,z]=referenceInspectionDirection('cad_treadmill',90);assert.ok(x<0&&z<0);assert.equal(referenceInspectionDirection('bicicleta_spinning',0),undefined);});

import {referenceModelKind} from '../../src/lib/gym-reference-identity.ts';
import {EQUIPMENT_CATALOG} from '../../src/lib/gym-catalog.ts';
test('standard and CAD variants use the approved model families without changing catalogue envelopes',()=>{
 for(const [id,kind] of [['banda_alergare','cad_treadmill'],['cad_treadmill','cad_treadmill'],['aparat_picioare','cad_leg_press'],['cad_leg_press','cad_leg_press']]){
  assert.equal(referenceModelKind(id),kind);const original=EQUIPMENT_CATALOG.find(t=>t.id===kind),target=EQUIPMENT_CATALOG.find(t=>t.id===id);const model=createEquipmentModel(kind);model.scale.set(target.length_m/original.length_m,target.height_m/original.height_m,target.width_m/original.width_m);const b=new THREE.Box3().setFromObject(model);assert.ok(b.max.x<=target.length_m/2+.001&&b.min.x>=-target.length_m/2-.001);assert.ok(b.max.z<=target.width_m/2+.001&&b.min.z>=-target.width_m/2-.001);assert.ok(b.max.y<=target.height_m+.001);model.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
 }
});
