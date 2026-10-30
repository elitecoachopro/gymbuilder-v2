import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {demoBuildingSpace} from '../../src/lib/gym-building.ts';
import {roomShape} from '../../src/lib/gym-room-shape.ts';
import {createPersonGeometry} from '../../src/lib/gym-people-geometry.ts';

test('the upper slab reserves the stair opening instead of covering the staircase',()=>{
 const building=demoBuildingSpace(),floor=building.upperFloor;
 const shape=roomShape(floor,true);assert.equal(shape.holes.length,1);
 const geometry=new THREE.ShapeGeometry(shape);const p=geometry.getAttribute('position'),index=geometry.index;let area=0;
 for(let i=0;i<index.count;i+=3){const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2);area+=Math.abs((p.getX(b)-p.getX(a))*(p.getY(c)-p.getY(a))-(p.getY(b)-p.getY(a))*(p.getX(c)-p.getX(a)))/2;}
 assert.ok(Math.abs(area-(300-floor.stairwell.w*floor.stairwell.d))<.001);geometry.dispose();
});
test('fictional characters have finite geometry within a bounded static rendering cost and compatible walking targets',()=>{
 for(const pose of ['reception','coach','push']){
  const surfaces=createPersonGeometry(pose),alternate=pose==='push'?createPersonGeometry(pose,true):null;let triangles=0;
  for(const [key,g]of Object.entries(surfaces)){
   const p=g.getAttribute('position');triangles+=p.count/3;
   for(const n of p.array)assert.ok(Number.isFinite(n));
   g.computeBoundingBox();assert.ok(g.boundingBox.max.y<1.84);assert.ok(g.boundingBox.min.y>=0);
   if(alternate)assert.equal(p.count,alternate[key].getAttribute('position').count);
  }
  assert.ok(triangles<40000);assert.ok(Object.keys(surfaces).length<=7);
  Object.values(surfaces).forEach(g=>g.dispose());if(alternate)Object.values(alternate).forEach(g=>g.dispose());
 }
});

test('human faces use skin shading and eye whites without additional material batches',()=>{
 const surfaces=createPersonGeometry('coach');
 try{
  const colours=surfaces.skin.getAttribute('color');assert.ok(colours,'skin and eye-white vertex colours');
  assert.equal(colours.count,surfaces.skin.getAttribute('position').count);
  let white=false,variation=false;for(let i=0;i<colours.count;i++){const r=colours.getX(i),g=colours.getY(i),b=colours.getZ(i);assert.ok([r,g,b].every(Number.isFinite));if(r>.85&&g>.85&&b>.8)white=true;if(r>g+.05)variation=true;}
  assert.ok(white,'natural eye whites');assert.ok(variation,'warm skin tones');
  assert.ok(Object.keys(surfaces).length<=7);
 }finally{Object.values(surfaces).forEach(g=>g.dispose());}
});
