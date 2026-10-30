import {test} from 'node:test';import assert from 'node:assert/strict';
import {demoClassesSpace} from '../../src/lib/gym-classes-floor.ts';
import {validateSpace,spaceArea} from '../../src/lib/gym-space.ts';
test('classes floor is300sqm with independent aerobic Zumba children and CrossFit rooms and usable stair access',()=>{
 const floor=demoClassesSpace();assert.equal(spaceArea(floor),300);assert.equal(validateSpace(floor,3.5,null),null);
 assert.deepEqual(floor.areas.map(a=>a.name),['Aerobic','Zumba','Copii · mișcare și joacă','CrossFit']);
 assert.ok(floor.openings.filter(o=>o.kind==='door').length>=4);
 assert.ok(floor.items.filter(i=>i.templateId==='saltea_yoga').length>=8);
 assert.ok(floor.items.some(i=>i.templateId==='rig_crossfit'));
 assert.ok(floor.stairwell.opening);
});

test('stairs connect to all four classrooms through doors without crossing partitions or stair opening',()=>{
 const floor=demoClassesSpace(),step=.2,radius=.2;
 const blocked=(x,y)=>{
  if(x<radius||x>20-radius||y<radius||y>15-radius)return true;
  const stair=floor.stairwell;if(x>stair.x-radius&&x<stair.x+stair.w+radius&&y>stair.y-radius&&y<stair.y+stair.d+radius)return true;
  return floor.walls.some(w=>{
   const along=w.axis==='x'?x-w.x:y-w.y,across=w.axis==='x'?y-w.y:x-w.x;
   if(Math.abs(across)>radius+w.thickness/2||along< -radius||along>w.length+radius)return false;
   return !floor.openings.some(o=>o.kind==='door'&&o.wallId===w.id&&along>=o.offset+radius&&along<=o.offset+o.width-radius);
  });
 };
 const explore=()=>{
  const start=[90,33],queue=[start],seen=new Set([start.join(',')]);
  for(let i=0;i<queue.length;i++)for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){
   const[x,y]=queue[i],next=[x+dx,y+dy],key=next.join(',');
   if(!seen.has(key)&&!blocked(next[0]*step,next[1]*step)){seen.add(key);queue.push(next);}
  }
  return seen;
 };
 const rooms=[[5,4],[5,11],[13.6,3],[15,11]],seen=explore();
 for(const[x,y]of rooms)assert.ok(seen.has([Math.round(x/step),Math.round(y/step)].join(',')),`reachable room at${x},${y}`);
 floor.openings=floor.openings.filter(o=>o.id!=='classes-stair-corridor');
 const closed=explore();
 for(const[x,y]of rooms)assert.ok(!closed.has([Math.round(x/step),Math.round(y/step)].join(',')),`closed landing blocks room at${x},${y}`);
});
