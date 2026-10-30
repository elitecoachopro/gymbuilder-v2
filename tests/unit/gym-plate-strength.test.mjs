import {test} from 'node:test';import assert from 'node:assert/strict';
import {buildStrengthModel} from '../../src/lib/gym-strength-model.ts';
test('plate-loaded chest press has bounded geometry, padded support and independent plate arms',()=>{
 const model=buildStrengthModel('plate_chest_press');
 try{let triangles=0;for(const g of Object.values(model)){g.computeBoundingBox();const{min,max}=g.boundingBox;assert.ok(min.x>=-1.001&&max.x<=1.001&&min.z>=-.751&&max.z<=.751&&max.y<=1.651);triangles+=g.attributes.position.count/3;}
 assert.ok(triangles<24000);assert.ok(model.pad?.attributes.position.count>0);assert.ok(model.chrome?.attributes.position.count>0);assert.ok(model.label?.attributes.position.count>0);
 const p=model.rubber.attributes.position;let left=false,right=false;for(let i=0;i<p.count;i++){if(p.getY(i)>.8&&p.getZ(i)>.5)left=true;if(p.getY(i)>.8&&p.getZ(i)<-.5)right=true;}assert.ok(left&&right,'both plate-loaded arms');
 }finally{Object.values(model).forEach(g=>g.dispose());}
});
