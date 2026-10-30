import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demoBuildingSpace} from '../../src/lib/gym-building.ts';
import {strengthAccentWall, buildStrengthInterior} from '../../src/lib/gym-strength-interior.ts';
import {spaceWalls} from '../../src/lib/gym-space.ts';

test('strength accent wall avoids windows, doors and stairs on each demo floor',()=>{
 const building=demoBuildingSpace();
 for(const floor of [building,building.upperFloor]){
  const wall=strengthAccentWall(floor);assert.ok(wall);
  const source=spaceWalls(floor).find(w=>w.id===wall.wallId);assert.ok(source);
  assert.ok(wall.from>=0&&wall.from+wall.length<=source.length);
  for(const o of floor.openings.filter(o=>o.wallId===wall.wallId))assert.ok(wall.from+wall.length<=o.offset||wall.from>=o.offset+o.width);
  const geometry=buildStrengthInterior(wall.length,3.5);let count=0;
  try {assert.ok(Object.keys(geometry).length<=5);for(const g of Object.values(geometry)){g.computeBoundingBox();assert.ok(g.boundingBox.min.x>=-.001);assert.ok(g.boundingBox.max.x<=wall.length+.001);assert.ok(g.boundingBox.max.y<=3.5);assert.ok([...g.attributes.position.array].every(Number.isFinite));count+=g.attributes.position.count/3;}assert.ok(count<12000);}finally{Object.values(geometry).forEach(g=>g.dispose());}
 }
});

test('an accent wall on the recessed edge of an L room faces the room interior',()=>{
 const floor=demoBuildingSpace().upperFloor;
 floor.outline=[{x:0,y:0},{x:20,y:0},{x:20,y:15},{x:10,y:15},{x:10,y:5},{x:0,y:5}];
 floor.areas=[{id:'greutati',name:'Forță',colour:'#777777',x:.2,y:3.5,w:8,d:1.3}];floor.openings=[];
 const wall=strengthAccentWall(floor);assert.equal(wall.wallId,'edge-4');
 assert.equal(wall.rotation,Math.PI);assert.ok(wall.z<5,'offset is inside the recessed edge');
});
