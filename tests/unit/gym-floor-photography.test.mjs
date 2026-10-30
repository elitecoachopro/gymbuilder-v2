import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createFloorMaps} from '../../src/lib/gym-pbr-textures.ts';
import {loadOakFloorPixels} from '../../src/lib/gym-floor-photography.ts';

test('photographic floor pixels match already allocated procedural GPU texture dimensions and satin roughness',async()=>{
 const originalDocument=globalThis.document;
 const originalLoad=THREE.TextureLoader.prototype.loadAsync;
 const maps=createFloorMaps('oak');
 let disposals=0;
 THREE.TextureLoader.prototype.loadAsync=async()=>({image:{},dispose(){disposals++;}});
 globalThis.document={createElement(){return {getContext(){return {drawImage(){},getImageData(x,y,w,h){const data=new Uint8ClampedArray(w*h*4);data.fill(100);return {data};}};}};}};
 try{
  const result=await loadOakFloorPixels();
  for(const key of ['map','bumpMap','roughnessMap']){
   assert.equal(result[key].width,maps[key].image.width);
   assert.equal(result[key].height,maps[key].image.height);
   assert.equal(result[key].data.length,maps[key].image.data.length);
  }
  assert.equal(disposals,3);
  assert.ok(result.roughnessMap.data[1]>=190);
  assert.equal(result.map.data[1],100);
 }finally{
  THREE.TextureLoader.prototype.loadAsync=originalLoad;
  if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;
  Object.values(maps).forEach(map=>map.dispose());
 }
});
