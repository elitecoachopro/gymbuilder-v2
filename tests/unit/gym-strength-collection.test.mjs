import {test} from 'node:test';
import assert from 'node:assert/strict';
import {STRENGTH_VARIANTS} from '../../src/lib/gym-strength-catalog.ts';
import {buildStrengthModel} from '../../src/lib/gym-strength-model.ts';
import {EQUIPMENT_CATALOG} from '../../src/lib/gym-catalog.ts';
import {createFloorMaps} from '../../src/lib/gym-pbr-textures.ts';
import {demoBuildingSpace} from '../../src/lib/gym-building.ts';

test('each specialised strength station is available in the editor and fits its advertised dimensions',()=>{
 assert.equal(STRENGTH_VARIANTS.length,12);
 const signatures=new Set();
 for(const model of STRENGTH_VARIANTS){
  const entry=EQUIPMENT_CATALOG.find(e=>e.id===model.id);assert.ok(entry,model.id);
  const geometry=buildStrengthModel(model.id);let triangles=0,signature='';
  try{
   assert.ok(Object.keys(geometry).length<=8);
   for(const [finish,g] of Object.entries(geometry)){
    assert.ok([...g.attributes.position.array,...g.attributes.normal.array].every(Number.isFinite));g.computeBoundingBox();const {min,max}=g.boundingBox;
    assert.ok(min.x>=-entry.length_m/2-.001&&max.x<=entry.length_m/2+.001,`${model.id} length ${min.x}..${max.x}`);
    assert.ok(min.z>=-entry.width_m/2-.001&&max.z<=entry.width_m/2+.001,`${model.id} width ${min.z}..${max.z}`);
    assert.ok(min.y>=0&&max.y<=entry.height_m+.001,`${model.id} height`);
    triangles+=g.index?g.index.count/3:g.attributes.position.count/3;signature+=finish+g.attributes.position.count+max.x+max.y;
   }
   assert.ok(triangles>3000&&triangles<28000,`${model.id}: ${triangles} triangles`);signatures.add(signature);
  }finally{Object.values(geometry).forEach(g=>g.dispose());}
 }
 assert.equal(signatures.size,STRENGTH_VARIANTS.length,'each exercise has a distinct assembly');
});
test('black tartan has neutral dark granules and keeps the mobile texture budget',()=>{
 const maps=createFloorMaps('tartan');
 try{
  const data=maps.map.image.data;let mean=0,min=255,max=0;
  for(let i=0;i<data.length;i+=4){mean+=data[i];min=Math.min(min,data[i]);max=Math.max(max,data[i]);assert.equal(data[i],data[i+1]);assert.equal(data[i],data[i+2]);}
  mean/=data.length/4;assert.ok(mean<32);assert.ok(max-min>10);
  assert.ok(Object.values(maps).reduce((n,t)=>n+t.image.data.byteLength,0)<=3*256*256*4);
 }finally{Object.values(maps).forEach(t=>t.dispose());}
 const building=demoBuildingSpace();assert.equal(building.finishes.floor,'tartan');assert.equal(building.upperFloor.finishes.floor,'tartan');
});
