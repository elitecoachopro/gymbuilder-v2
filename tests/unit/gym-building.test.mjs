import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptySpace,validateSpace,spaceCost} from '../../src/lib/gym-space.ts';
import {floorSpace,replaceFloorSpace,buildingArea,demoBuildingSpace} from '../../src/lib/gym-building.ts';
import {studioConfigurationSchema,validStudioProject} from '../../src/lib/gym-studio.ts';

test('two storeys round-trip in the existing project format with total area and independent edits',()=>{
 const building={...emptySpace(),upperFloor:emptySpace()};
 assert.equal(buildingArea(building),600);
 const upper={...floorSpace(building,1),finishes:{...building.finishes,wall:'#334455'}};
 const next=replaceFloorSpace(building,upper,1);
 assert.equal(next.finishes.wall,building.finishes.wall);
 assert.equal(next.upperFloor.finishes.wall,'#334455');
 const config={version:1,height_m:3.5,budget_eur:null,brief:'',zone_ids:['cardio'],profile:'balanced',space:next};
 const restored=studioConfigurationSchema.parse(JSON.parse(JSON.stringify(config)));
 assert.equal(restored.space.upperFloor.finishes.wall,'#334455');
 assert.ok(validStudioProject({total_area:600,length_m:20,width_m:15,zones:[],configuration:config}));
 assert.ok(!validStudioProject({total_area:300,length_m:20,width_m:15,zones:[],configuration:config}));
});
test('an invalid upper floor is rejected and the equipment budget covers both levels',()=>{
 const building=demoBuildingSpace();
 assert.equal(validateSpace(building,3.5,null),null);
 assert.equal(validateSpace({...building,upperFloor:{...building.upperFloor,items:[{id:'bad',templateId:'real_power_rack',x:0,y:0,rotation:0}]}},3.5,null),'Etajul conține date incompatibile.');
 const total=spaceCost(building);assert.ok(total>spaceCost(floorSpace(building,0)));
 assert.ok(validateSpace(building,3.5,total-1));
});
test('campus demo includes a receptionist, coach/student sled scene and additional fitness equipment upstairs',()=>{
 const building=demoBuildingSpace();
 assert.equal(buildingArea(building),600);
 assert.ok(building.items.some(i=>i.templateId==='person_reception'));
 for(const id of ['sled_training','person_coach','real_power_rack','real_cable_crossover'])assert.ok(building.upperFloor.items.some(i=>i.templateId===id),id);
 const track=building.upperFloor.areas.find(a=>a.id==='functional');
 assert.ok(track.d>=10&&track.w>=2);
});

test('AI floor allowance reserves the budget spent on the inactive storey',async()=>{
 const {floorBudget}=await import('../../src/lib/gym-building.ts');
 const building=demoBuildingSpace();
 assert.equal(floorBudget(building,0,null),null);
 const total=spaceCost(building);
 assert.equal(floorBudget(building,0,total),spaceCost(floorSpace(building,0)));
 assert.equal(floorBudget(building,1,total),spaceCost(building.upperFloor));
 assert.equal(floorBudget(building,1,spaceCost(floorSpace(building,0))),0);
 assert.equal(floorBudget(building,0,1),0);
});

test('automatic equipment placement avoids the reserved stairwell',async()=>{
 const {findSpacePosition,itemFitsSpace}=await import('../../src/lib/gym-space.ts');
 const space={...emptySpace(),stairwell:{x:0.2,y:0.2,w:3,d:4.8,opening:false}};
 const item=findSpacePosition(space,'real_spin_bike',3.5);
 assert.ok(item);
 assert.ok(itemFitsSpace(space,item,3.5));
 assert.equal(validateSpace({...space,items:[item]},3.5,null),null);
});

test('two-floor JSON and recovery retain tartan, independent visualization and the aggregate budget', async () => {
 const {readEditorDraft}=await import('../../src/lib/gym-editor-draft.ts');
 const space=demoBuildingSpace();
 space.finishes.floor='tartan';space.upperFloor.finishes.floor='oak';
 space.visualization={lighting:'studio',eyeHeight:1.65,fov:45,snap:0.05,dimensions:true,interiorStyle:'minimal'};
 space.upperFloor.visualization={...space.visualization,lighting:'evening',snap:0.1};
 const document={name:'Imperial Gym U6',height:3.5,budget:spaceCost(space)+1000,brief:'Two independent levels',space};
 const exported=JSON.parse(JSON.stringify({format:'gymbuilder-space',version:2,...document}));
 const configuration=studioConfigurationSchema.parse({version:1,height_m:exported.height,budget_eur:exported.budget,brief:exported.brief,zone_ids:['cardio'],profile:'balanced',space:exported.space});
 assert.deepEqual(configuration.space,space);
 assert.equal(validateSpace(configuration.space,configuration.height_m,configuration.budget_eur),null);
 const recovered=readEditorDraft(JSON.parse(JSON.stringify({version:1,owner:'fixture-u6',projectId:'fixture-project',savedFingerprint:'',updatedAt:1,storey:1,document})), 'fixture-u6');
 assert.deepEqual(recovered.document,document);assert.equal(recovered.storey,1);
 assert.ok(validStudioProject({total_area:600,length_m:20,width_m:15,zones:[],configuration}));
 assert.equal(validStudioProject({total_area:600,length_m:20,width_m:15,zones:[],configuration:{...configuration,budget_eur:spaceCost(space)-1}}),false);
});
