import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sledTrackLayout} from '../../src/lib/gym-sled-track.ts';
import {demoSpace,itemPolygon,boxPolygon,polygonsOverlap} from '../../src/lib/gym-space.ts';
test('demo has a clear long green track, without deleting equipment',()=>{
 const space=demoSpace(),area=space.areas.find(a=>a.id==='functional');
 assert.ok(area&&Math.max(area.w,area.d)>=9);
 assert.equal(space.items.length,40);
 const lane=boxPolygon(area);
 for(const item of space.items.filter(i=>i.templateId!=='sled_training'))assert.ok(!polygonsOverlap(lane,itemPolygon(item)),item.id);
});
test('metre marks retain true spacing in either orientation and fractional lengths',()=>{
 for(const [w,d] of [[9.3,1.6],[2,12.4],[.8,.7]]){
  const layout=sledTrackLayout(w,d);
  assert.equal(layout.horizontal,w>d);
  assert.equal(layout.length,Math.max(w,d));
  for(const [i,mark]of layout.marks.entries()){
   assert.equal(mark.metres,i);assert.ok(mark.offset>=0&&mark.offset<=layout.length);
   if(i)assert.ok(Math.abs(mark.offset-layout.marks[i-1].offset-1)<1e-10);
  }
 }
});

test('numbered tracks on both demo floors stay outside the stairwell',async()=>{
 const {demoBuildingSpace}=await import('../../src/lib/gym-building.ts');
 const building=demoBuildingSpace();
 for(const floor of [building,building.upperFloor]){
  const track=floor.areas.find(a=>a.id==='functional');
  assert.ok(Math.max(track.w,track.d)>=6);
  assert.ok(!polygonsOverlap(boxPolygon(track),boxPolygon(floor.stairwell)));
 }
});
