import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildZonedGymProposal } from '../../src/lib/gym-zoning.ts';
import { emptySpace, itemPolygon, validateSpace, spaceArea } from '../../src/lib/gym-space.ts';
import { EQUIPMENT_CATALOG } from '../../src/lib/gym-catalog.ts';
const zones = [
 {zoneId:'receptie',weight:8,equipment:[{templateId:'desk_receptie',quantity:1},{templateId:'canapea',quantity:1}]},
 {zoneId:'vestiare',weight:28,equipment:[{templateId:'dulap_vestiar',quantity:4},{templateId:'banca_vestiar',quantity:4},{templateId:'dus',quantity:4},{templateId:'wc',quantity:2},{templateId:'lavoar',quantity:2}]},
 {zoneId:'cardio',weight:25,equipment:[{templateId:'banda_alergare',quantity:3},{templateId:'bicicleta_spinning',quantity:2},{templateId:'eliptica',quantity:1}]},
 {zoneId:'greutati',weight:23,equipment:[{templateId:'rack_squat',quantity:1},{templateId:'banca_reglabila',quantity:2},{templateId:'suport_gantere',quantity:1}]},
 {zoneId:'aparate',weight:16,equipment:[{templateId:'aparat_piept',quantity:1},{templateId:'aparat_picioare',quantity:1},{templateId:'aparat_lat',quantity:1}]},
];
const within=(item,area)=>itemPolygon(item).every(p=>p.x>=area.x && p.x<=area.x+area.w && p.y>=area.y && p.y<=area.y+area.d);
test('a complete 200 m² gym generates separate reception and changing rooms with usable doors and distributed training zones',()=>{
 const original=emptySpace(20,10), p=buildZonedGymProposal(original,zones,3.5,null);
 assert.ok(p.space.walls.length>=3,'reception and both changing rooms need real partition walls');
 assert.equal(p.space.openings.filter(o=>o.kind==='door').length,4);
 assert.equal(validateSpace(p.space,3.5,null),null);
 assert.equal(spaceArea(p.space),200);assert.equal(original.areas.length,0);
 assert.equal(p.omitted.length,0,JSON.stringify(p.omitted));
 assert.equal(p.space.items.length,zones.flatMap(z=>z.equipment).reduce((n,e)=>n+e.quantity,0));
 for(const zone of ['receptie','cardio','greutati','aparate']){
  const area=p.space.areas.find(a=>a.id===zone);assert.ok(area,zone);
  for(const item of p.space.items.filter(i=>EQUIPMENT_CATALOG.find(t=>t.id===i.templateId).zone===zone)) assert.ok(within(item,area),item.templateId);
 }
 for(const id of ['vestiare-femei','vestiare-barbati']){
  const room=p.space.areas.find(a=>a.id===id);assert.ok(room,id);
  const items=p.space.items.filter(i=>within(i,room));
  assert.equal(items.filter(i=>i.templateId==='dus').length,2,id);
  assert.equal(items.filter(i=>i.templateId==='wc').length,1,id);
  assert.ok(items.some(i=>i.templateId==='dulap_vestiar'));
 }
 const corridor=p.space.areas.find(a=>a.id==='circulatie');assert.ok(corridor.d>=1.2);
 for(const i of p.space.items) assert.ok(!within(i,corridor),'main corridor stays empty');
 assert.ok(Math.max(...p.space.items.flatMap(itemPolygon).map(p=>p.y))>8,'training equipment must reach the back of the room');
});
test('automatic room planning works in portrait orientation and keeps every door valid',()=>{
 const p=buildZonedGymProposal(emptySpace(10,20),zones,3.5,null);
 assert.equal(validateSpace(p.space,3.5,null),null);assert.equal(p.omitted.length,0);
 assert.ok(p.space.areas.some(a=>a.id==='vestiare-femei'));assert.equal(p.space.openings.length,4);
});
test('regeneration preserves existing architecture and still splits changing-room equipment between both rooms',()=>{
 const first=buildZonedGymProposal(emptySpace(20,10),zones,3.5,null);
 const second=buildZonedGymProposal(first.space,zones,3.5,null);
 for(const key of ['outline','walls','openings','columns','areas']) assert.deepEqual(second.space[key],first.space[key]);
 assert.equal(validateSpace(second.space,3.5,null),null);assert.equal(second.omitted.length,0);
});
test('custom geometry is preserved, automatic layout can be disabled, and omissions respect height and budget',()=>{
 const room=emptySpace();room.walls=[{id:'custom',x:10,y:1,length:4,axis:'y',thickness:0.12}];
 const fixed=buildZonedGymProposal(room,zones,3.5,null);assert.deepEqual(fixed.space.walls,room.walls);assert.deepEqual(fixed.space.areas,[]);
 const off=buildZonedGymProposal(emptySpace(20,10),zones,3.5,null,false);assert.deepEqual(off.space.walls,[]);
 const constrained=buildZonedGymProposal(emptySpace(20,10),zones,2,100);
 assert.equal(validateSpace(constrained.space,2,100),null);assert.ok(constrained.omitted.some(o=>o.reason==='height'));assert.ok(constrained.omitted.some(o=>o.reason==='budget'));
});

test('a partially zoned manual room retains the previous placement fallback without deleting its area',()=>{
 const room=emptySpace(20,10);room.areas=[{id:'cardio',name:'Cardio manual',colour:'#ff0000',x:0.3,y:0.3,w:5,d:4}];
 const p=buildZonedGymProposal(room,[zones[2],zones[3]],3.5,null);
 assert.equal(p.omitted.length,0);assert.deepEqual(p.space.areas,room.areas);assert.deepEqual(p.space.walls,[]);
 assert.ok(p.space.items.some(i=>i.templateId==='rack_squat'));assert.equal(validateSpace(p.space,3.5,null),null);
});

test('the shared corridor and both changing-room centre access strips stay free of every equipment footprint',()=>{
 const {space}=buildZonedGymProposal(emptySpace(20,10),zones,3.5,null);
 const reserved=[space.areas.find(a=>a.id==='circulatie'),...space.areas.filter(a=>a.id.startsWith('vestiare-')||a.id==='receptie').map(a=>({x:a.x+a.w/2-0.5,y:a.y,w:1,d:a.d}))];
 for(const item of space.items){const p=itemPolygon(item);const box={x:Math.min(...p.map(p=>p.x)),y:Math.min(...p.map(p=>p.y)),right:Math.max(...p.map(p=>p.x)),bottom:Math.max(...p.map(p=>p.y))};for(const r of reserved)assert.ok(!(box.x<r.x+r.w-0.001 && box.right>r.x+0.001 && box.y<r.y+r.d-0.001 && box.bottom>r.y+0.001),item.templateId);}
});
