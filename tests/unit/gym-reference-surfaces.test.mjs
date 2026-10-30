import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {loadReferenceNormals} from '../../src/lib/gym-reference-surfaces.ts';
for(const failed of [[false,false],[true,false],[false,true],[true,true]])test('reference normals handle optional failures '+failed,async t=>{
 const maps=[new THREE.Texture(),new THREE.Texture()];let call=0;t.mock.method(THREE.TextureLoader.prototype,'loadAsync',()=>{const i=call++;return failed[i]?Promise.reject(Error('404')):Promise.resolve(maps[i]);});const result=await loadReferenceNormals();assert.equal(result.upholsteryNormal,failed[0]?null:maps[0]);assert.equal(result.rubberNormal,failed[1]?null:maps[1]);if(result.upholsteryNormal){assert.equal(result.upholsteryNormal.colorSpace,THREE.NoColorSpace);assert.deepEqual(result.upholsteryNormal.repeat.toArray(),[3,3]);}maps.forEach(m=>m.dispose());
});
test('late normal maps are disposed after bounded fallback',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});let resolve;t.mock.method(THREE.TextureLoader.prototype,'loadAsync',()=>new Promise(done=>{resolve=done;}));const pending=loadReferenceNormals();t.mock.timers.tick(3000);const result=await pending;assert.equal(result.upholsteryNormal,null);assert.equal(result.rubberNormal,null);const late=new THREE.Texture();let disposed=false;late.addEventListener('dispose',()=>{disposed=true;});resolve(late);await Promise.resolve();assert.equal(disposed,true);
});
