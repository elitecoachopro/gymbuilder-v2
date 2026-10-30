import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCardioModel } from '../../src/lib/gym-cardio-model.ts';
const cases=[['banda_alergare',2,0.8,1.5],['bicicleta_spinning',1.2,0.6,1.3],['eliptica',1.8,0.7,1.8]];
for(const [type,length,width,height] of cases) test(`${type}: detailed cardio fits its catalog dimensions and has bounded batches`,()=>{
 const model=buildCardioModel(type);
 try {
  assert.ok(Object.keys(model).length<=8);
  let triangles=0;
  for(const geometry of Object.values(model)) {
   geometry.computeBoundingBox();const {min,max}=geometry.boundingBox;
   assert.ok(min.x>=-length/2-0.001&&max.x<=length/2+0.001,`length ${min.x}..${max.x}`);
   assert.ok(min.z>=-width/2-0.001&&max.z<=width/2+0.001,`width ${min.z}..${max.z}`);
   assert.ok(min.y>=-0.001&&max.y<=height+0.001,`height ${min.y}..${max.y}`);
   assert.ok([...geometry.attributes.position.array,...geometry.attributes.normal.array].every(Number.isFinite));
   triangles+=geometry.attributes.position.count/3;
  }
  assert.ok(triangles>2500&&triangles<24000,`triangles ${triangles}`);
  assert.ok(model.screen.attributes.position.count>0,'console display');
  const p=model.rubber.attributes.position; let found=false;
  for(let i=0;i<p.count;i++) {
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
   if(type==='banda_alergare'&&x>0.4&&y>0.2&&y<0.3&&Math.abs(z)<0.25)found=true;
   if(type==='bicicleta_spinning'&&x>0.17&&y>0.96)found=true;
   if(type==='eliptica'&&Math.abs(z)>0.16&&y>0.23&&y<0.31&&x>0.05)found=true;
  }
  assert.ok(found,'defining belt, saddle or elliptical foot platforms');
 }finally{Object.values(model).forEach(g=>g.dispose());}
});
