import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildGymProposal } from '../../src/lib/gym-studio.ts';
import { validProjectGeometry } from '../../src/lib/gym-layout.ts';
const brief={total_area:300,length_m:20,width_m:15,height_m:3.5,budget_eur:30000,brief:'Fitness',zone_ids:['receptie','vestiare','cardio','greutati'],profile:'balanced'};
test('proposal places standard equipment and utilities within exact room, height and budget',()=>{
 const p=buildGymProposal(brief);
 assert.ok(p.equipment.some(e=>e.templateId==='desk_receptie'));
 assert.ok(p.equipment.some(e=>e.templateId==='dulap_vestiar'));
 assert.ok(p.cost_eur<=30000);
 assert.ok(p.circulation_m2>=45-0.01);
 assert.ok(validProjectGeometry({...brief,zones:p.zones.map(z=>({...z,equipment:p.equipment.filter(e=>e.zoneId===z.id)}))}));
 assert.ok(p.equipment.every(e=>e.height_m<=3.5));
});
test('requested models that exceed height, budget or available space are reported',()=>{
 const p=buildGymProposal({...brief,height_m:2,budget_eur:100},[{zoneId:'greutati',weight:100,equipment:[{templateId:'rack_squat',quantity:1},{templateId:'banca_reglabila',quantity:2}]}]);
 assert.equal(p.equipment.length,0);assert.equal(p.unplaced.reduce((n,e)=>n+e.quantity,0),3);
 assert.deepEqual(p.unplaced,[{templateId:'rack_squat',quantity:1,reason:'height'},{templateId:'banca_reglabila',quantity:2,reason:'budget'}]);
});
test('refuses inconsistent dimensions and invalid AI catalog references',()=>{
 assert.throws(()=>buildGymProposal({...brief,total_area:400}));
 assert.throws(()=>buildGymProposal(brief,[{zoneId:'cardio',weight:100,equipment:[{templateId:'invented',quantity:1}]}]));
});
test('studio saves reject catalog tampering, excess budget and low ceilings while preserving legacy layouts', async()=>{
 const { validStudioProject }=await import('../../src/lib/gym-studio.ts');
 const p=buildGymProposal(brief), configuration={version:1,height_m:brief.height_m,budget_eur:brief.budget_eur,brief:brief.brief,zone_ids:brief.zone_ids,profile:brief.profile};
 const project={...brief,configuration,zones:p.zones.map(z=>({...z,equipment:p.equipment.filter(e=>e.zoneId===z.id)}))};
 assert.equal(validStudioProject(project),true);
 assert.equal(validStudioProject({...project,configuration:{...configuration,budget_eur:1}}),false);
 assert.equal(validStudioProject({...project,configuration:{...configuration,height_m:2}}),false);
 assert.equal(validStudioProject({...project,configuration:null}),true);
});
test('AI response parser accepts complete structured designs and rejects refusal, incomplete and invented catalogs', async()=>{
 const { parseAiDesignResponse }=await import('../../src/lib/gym-ai.ts');
 const design={summary:'Plan',questions:[],length_m:20,width_m:15,total_area:300,height_m:3.5,budget_eur:30000,profile:'balanced',zones:[{zoneId:'cardio',weight:100,equipment:[{templateId:'banda_alergare',quantity:2}]}]};
 const response={status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(design)}]}]};
 assert.deepEqual(parseAiDesignResponse(response),design);
 assert.throws(()=>parseAiDesignResponse({...response,status:'incomplete'}));
 assert.throws(()=>parseAiDesignResponse({status:'completed',output:[{type:'message',content:[{type:'refusal',text:'No'}]}]}));
 assert.throws(()=>parseAiDesignResponse({...response,output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({...design,zones:[{zoneId:'fake',weight:1,equipment:[]}]})}]}]}));
});
test('applied requirements must name exactly the zones saved in the layout',async()=>{
 const { validStudioProject }=await import('../../src/lib/gym-studio.ts');
 const p=buildGymProposal(brief),configuration={version:1,height_m:brief.height_m,budget_eur:brief.budget_eur,brief:brief.brief,zone_ids:brief.zone_ids,profile:brief.profile};
 const project={...brief,configuration,zones:p.zones.map(z=>({...z,equipment:p.equipment.filter(e=>e.zoneId===z.id)}))};
 assert.equal(validStudioProject({...project,configuration:{...configuration,zone_ids:['cardio']}}),false);
});
test('AI transport sends a private structured request and handles provider HTTP failures',async t=>{
 const { requestGymAiDesign }=await import('../../src/lib/gym-ai.ts');
 const design={summary:'Plan',questions:[],length_m:20,width_m:15,total_area:300,height_m:3.5,budget_eur:30000,profile:'balanced',zones:[{zoneId:'cardio',weight:100,equipment:[{templateId:'banda_alergare',quantity:2}]}]};
 const parameters={locale:'en',brief:'A gym with two treadmills',context:{length_m:20,width_m:15,total_area:300,height_m:3.5,budget_eur:30000}};
 const fetchMock=t.mock.method(globalThis,'fetch',async(url,options)=>{
  assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(options.headers.Authorization,'Bearer test-key');
  const body=JSON.parse(options.body);assert.equal(body.model,'test-model');assert.equal(body.store,false);assert.equal(body.text.format.strict,true);assert.deepEqual(JSON.parse(body.input),parameters);
  return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(design)}]}]});
 });
 const result=await requestGymAiDesign(parameters,{apiKey:'test-key',model:'test-model'});assert.deepEqual(result,design);
 const proposal=buildGymProposal({...brief,zone_ids:['cardio']},result.zones);assert.equal(proposal.equipment.length,2);
 fetchMock.mock.mockImplementation(async()=>new Response('',{status:429}));
 assert.equal(await requestGymAiDesign(parameters,{apiKey:'test-key',model:'test-model'}),null);
});

test('oversized requested models are reported as space omissions',()=>{
 const p=buildGymProposal({...brief,total_area:1,length_m:1,width_m:1,budget_eur:null,zone_ids:['cardio']},[{zoneId:'cardio',weight:1,equipment:[{templateId:'banda_alergare',quantity:1}]}]);
 assert.equal(p.equipment.length,0);assert.deepEqual(p.unplaced,[{templateId:'banda_alergare',quantity:1,reason:'space'}]);
});

test('metre-based demo and L-shaped proposals validate and keep fixed architecture', async () => {
 const { demoSpace, emptySpace, populateSpace, validateSpace, spaceArea } = await import('../../src/lib/gym-space.ts');
 const demo = demoSpace(); assert.equal(validateSpace(demo,3.5,null),null);assert.equal(demo.items.length,39);
 const room=emptySpace();room.outline=[{x:0,y:0},{x:20,y:0},{x:20,y:10},{x:15,y:10},{x:15,y:15},{x:0,y:15}];
 room.columns=[{id:'column',x:4,y:4,w:0.5,d:0.5}];
 const result=populateSpace(room,[{zoneId:'cardio',equipment:[{templateId:'banda_alergare',quantity:3}]},{zoneId:'greutati',equipment:[{templateId:'rack_squat',quantity:2}]}],2,8000);
 assert.equal(spaceArea(result.space),275);assert.deepEqual({...result.space,items:[]},room);assert.equal(validateSpace(result.space,2,8000),null);
 assert.deepEqual(result.omitted,[{templateId:'banda_alergare',quantity:1,reason:'budget'},{templateId:'rack_squat',quantity:2,reason:'height'}]);
});

test('AI placement never reuses an identifier already owned by architecture', async () => {
 const { emptySpace, populateSpace, validateSpace } = await import('../../src/lib/gym-space.ts');
 const room=emptySpace();room.columns=[{id:'design-1',x:10,y:10,w:0.5,d:0.5}];
 assert.equal(validateSpace(room,3.5,null),null);
 const result=populateSpace(room,[{zoneId:'cardio',equipment:[{templateId:'banda_alergare',quantity:2}]}],3.5,null);
 assert.equal(validateSpace(result.space,3.5,null),null);
 assert.equal(new Set([...result.space.items,...result.space.columns].map(v=>v.id)).size,3);
});

test('metre-based saving rejects overlapping equipment, blocked doors and incorrect reported area', async () => {
 const { demoSpace } = await import('../../src/lib/gym-space.ts');
 const { validStudioProject } = await import('../../src/lib/gym-studio.ts');
 const space=demoSpace();const configuration={version:1,height_m:3.5,budget_eur:null,brief:'Test space',zone_ids:['cardio'],profile:'balanced',space};
 const project={total_area:300,length_m:20,width_m:15,zones:[],configuration};assert.equal(validStudioProject(project),true);
 assert.equal(validStudioProject({...project,total_area:299}),false);
 const collided=structuredClone(configuration);collided.space.items[1]={...collided.space.items[0],id:collided.space.items[1].id};assert.equal(validStudioProject({...project,configuration:collided}),false);
 const blocked=structuredClone(configuration);blocked.space.items[0]={...blocked.space.items[0],templateId:'saltea_yoga',x:2,y:14.6,rotation:0};assert.equal(validStudioProject({...project,configuration:blocked}),false);
});
