import {test} from 'node:test';
import assert from 'node:assert/strict';
import {referenceCameraOffset} from '../../src/lib/gym-reference-camera.ts';
import {emptySpace,insideOutline} from '../../src/lib/gym-space.ts';
test('close-up near a full-height outer wall retains distance inside the room',()=>{
 const outline=emptySpace().outline,origin={x:1.2,y:5},preferred=[-3,2,4];const [x,y,z]=referenceCameraOffset(origin,preferred,outline);assert.ok(origin.x+x>=.2);assert.ok(insideOutline({x:origin.x+x,y:origin.y+z},outline));assert.ok(Math.abs(Math.hypot(x,y,z)-Math.hypot(...preferred))<.0001);
});
test('portrait close-up of a large item in a small room lifts the camera without leaving the outline',()=>{
 const outline=emptySpace(4,3).outline,origin={x:2,y:1.5},preferred=[-8,4,9];const offset=referenceCameraOffset(origin,preferred,outline);assert.ok(insideOutline({x:origin.x+offset[0],y:origin.y+offset[2]},outline));assert.ok(Math.abs(Math.hypot(...offset)-Math.hypot(...preferred))<.0001);
});
test('L-shaped room focus avoids the cutout along the entire sightline',()=>{
 const outline=[{x:0,y:0},{x:10,y:0},{x:10,y:5},{x:5,y:5},{x:5,y:10},{x:0,y:10}],origin={x:4,y:7};const [x,,z]=referenceCameraOffset(origin,[5,2,-1],outline);for(let i=0;i<=20;i++)assert.ok(insideOutline({x:origin.x+x*i/20,y:origin.y+z*i/20},outline));
});
