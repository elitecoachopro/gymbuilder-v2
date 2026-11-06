import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demoSpace,boxPolygon,itemPolygon,polygonFits} from '../../src/lib/gym-space.ts';
import {sledPushRoute,sampleSledPush} from '../../src/lib/gym-sled-motion.ts';
test('demo sled and athlete stay on the turf for the complete push and stop at its end',()=>{
 const space=demoSpace(),item=space.items.find(i=>i.templateId==='sled_training');assert.ok(item);
 const route=sledPushRoute(space,item);assert.ok(route&&route.distance>5);
 assert.ok(route.cameraOffset);
 const area=space.areas.find(a=>a.id==='functional');
 for(let t=0;t<=route.duration+2;t+=.1){const p=sampleSledPush(route,t);assert.ok(polygonFits(itemPolygon({...item,x:item.x+p.x,y:item.y+p.y}),boxPolygon(area)));}
 assert.deepEqual(sampleSledPush(route,route.duration+5),sampleSledPush(route,route.duration));
 assert.equal(sampleSledPush(route,0).localZ,0);
 assert.equal(sampleSledPush(route,1).localZ,.6);
 assert.equal(sampleSledPush(route,1).x,-.6);
 assert.ok(Math.abs(sampleSledPush(route,20).localZ-5.7)<1e-9);
});
test('a blocked or off-track sled cannot start its demonstration',()=>{
 const space=demoSpace(),item=space.items.find(i=>i.templateId==='sled_training');
 space.columns.push({id:'lane-obstacle',x:14,y:13.1,w:.4,d:.4});assert.equal(sledPushRoute(space,item),null);
 space.columns=[];assert.equal(sledPushRoute(space,{...item,x:18}),null,'exit remains clear');assert.equal(sledPushRoute(space,{...item,y:10}),null);
});

test('push remains available without camera-follow when the adjacent camera path is obstructed',()=>{
 const space=demoSpace(),item=space.items.find(i=>i.templateId==='sled_training');
 space.columns.push({id:'camera-obstacle',x:16,y:9.2,w:.4,d:.4});
 const route=sledPushRoute(space,item);assert.ok(route);assert.equal(route.cameraOffset,undefined);
});
