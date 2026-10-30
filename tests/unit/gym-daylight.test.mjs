import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptySpace,insideOutline} from '../../src/lib/gym-space.ts';
import {windowDaylights} from '../../src/lib/gym-daylight.ts';

test('window scenery and low-cost floor light stay attached to exterior windows and inside the outline',()=>{
 const space=emptySpace(20,15);
 space.openings=[0,1,2,3].map(i=>({id:'w'+i,wallId:'edge-'+i,kind:'window',offset:3,width:4,height:2.3,sill:0.5}));
 const lights=windowDaylights(space);assert.equal(lights.length,4);
 for(const light of lights){assert.equal(light.width,4);assert.equal(light.height,2.3);assert.equal(light.elevation,1.65);const p=light.patch;assert.ok(p);for(const x of [-1,1])for(const y of [-1,1])assert.ok(insideOutline({x:p.x+x*p.w/2,y:p.y+y*p.d/2},space.outline));}
 assert.ok(lights[0].y<0);assert.ok(lights[1].x>20);assert.ok(lights[2].y>15);assert.ok(lights[3].x<0);
 space.walls=[{id:'partition',axis:'x',x:3,y:5,length:8,thickness:0.1}];
 space.openings.push({id:'inner',wallId:'partition',kind:'window',offset:1,width:2,height:1,sill:1},{id:'door',wallId:'edge-0',kind:'door',offset:10,width:1,height:2,sill:0});
 assert.equal(windowDaylights(space).length,4);
});

test('all six L-shape exterior segments place scenery outside and light patches inside in either winding',()=>{
 const outline=[{x:0,y:0},{x:20,y:0},{x:20,y:10},{x:15,y:10},{x:15,y:15},{x:0,y:15}];
 for(const points of [outline,[...outline].reverse()]){
  const space={...emptySpace(),outline:points};
  space.openings=points.map((_,i)=>({id:'l'+i,wallId:'edge-'+i,kind:'window',offset:1,width:2,height:2,sill:0.5}));
  const lights=windowDaylights(space);assert.equal(lights.length,6);
  for(const light of lights){
   assert.equal(insideOutline({x:light.x,y:light.y},points),false);
   assert.ok(insideOutline({x:light.x+Math.sin(light.rotation)*0.2,y:light.y+Math.cos(light.rotation)*0.2},points));
   if(light.patch){const p=light.patch;for(const x of [-1,1])for(const y of [-1,1])assert.ok(insideOutline({x:p.x+x*p.w/2,y:p.y+y*p.d/2},points));}
  }
 }
});
