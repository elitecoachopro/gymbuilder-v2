import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { api, fixtureUser, cleanupUsers, login } from './helpers.mjs';
import { demoSpace, emptySpace, validateSpace, spaceArea, spaceBounds, spaceCost } from '../../src/lib/gym-space.ts';
const enabled = process.env.RUN_LIVE_GYM_AI === '1';
const evidence = [];

for (const locale of ['ro', 'en']) test(`live AI ${locale}: fixed architecture survives generation, authenticated save and reopening`, { skip: !enabled }, async t => {
  const user = await fixtureUser(); t.after(() => cleanupUsers([user])); const cookie = await login(user);
  let space = demoSpace(); space.items = [];
  let height = 3.5, budget = 30000;
  let brief = 'Sala are exact 300 m², 20 × 15 m și înălțime 3,5 m. Păstrează toți pereții, stâlpii, ușile, ferestrele și zonele. Bugetul pentru dotări este 30.000 EUR. Vreau recepție, vestiare cu dușuri și WC, trei benzi de alergare, două biciclete spinning, două rackuri squat și două bănci reglabile. Include toate cantitățile solicitate în propunere; motorul de amplasare va raporta ce nu încape în buget sau spațiu.';
  if (locale === 'en') {
    space = emptySpace(); space.outline = [{x:0,y:0},{x:20,y:0},{x:20,y:10},{x:15,y:10},{x:15,y:15},{x:0,y:15}];
    space.columns = [{id:'test-column',x:8,y:6,w:0.5,d:0.5}];
    space.walls = [{id:'test-partition',x:5,y:1,length:5,axis:'y',thickness:0.12}];
    space.openings = [{id:'test-door',wallId:'edge-5',kind:'door',offset:1,width:1.2,height:2,sill:0}];
    height=2;budget=12000;
    brief='Keep the existing L-shaped 275 m² outline, 20 by 15 m bounding dimensions, the column, partition wall and door. Clear height is exactly 2 metres and the equipment budget is EUR 12,000. Request exactly two squat racks, three treadmills, one spinning bicycle and one reception desk. Include every requested quantity even when it exceeds height or budget; the placement engine will report omissions. Do not redesign the architecture.';
  }
  assert.equal(validateSpace(space,height,budget),null);
  const bounds=spaceBounds(space), architecture=structuredClone({...space,items:[]});
  const start=Date.now();
  const response=await api('/api/configurator/ai',{cookie,body:{locale,brief,space,context:{length_m:bounds.length,width_m:bounds.width,total_area:spaceArea(space),height_m:height,budget_eur:budget,zone_ids:['receptie','vestiare','cardio','greutati'],profile:'balanced'}}});
  const payload=await response.json();
  evidence.push({locale,httpStatus:response.status,elapsedMs:Date.now()-start,design:payload.design||null,omitted:payload.spaceProposal?.omitted||null});
  fs.writeFileSync('/tmp/gymbuilder-space-live-evidence.json',JSON.stringify(evidence,null,2),{mode:0o600});
  assert.equal(response.status,200,JSON.stringify(payload));
  assert.deepEqual(payload.design.questions,[],JSON.stringify(payload.design.questions));
  assert.ok(payload.spaceProposal,'Complete fixed geometry must produce an executable proposal');
  const proposed=payload.spaceProposal.space;
  assert.deepEqual({...proposed,items:[]},architecture);
  assert.equal(validateSpace(proposed,height,budget),null);
  assert.ok(proposed.items.length>0);assert.ok(spaceCost(proposed)<=budget);
  const requested=locale==='ro'?[['banda_alergare',3],['bicicleta_spinning',2],['rack_squat',2],['banca_reglabila',2]]:[['rack_squat',2],['banda_alergare',3],['bicicleta_spinning',1],['desk_receptie',1]];
  for(const [templateId,quantity] of requested) assert.equal(proposed.items.filter(i=>i.templateId===templateId).length+payload.spaceProposal.omitted.filter(i=>i.templateId===templateId).reduce((n,i)=>n+i.quantity,0),quantity,`AI must preserve explicit quantity for ${templateId}`);
  if(locale==='en')assert.ok(payload.spaceProposal.omitted.some(i=>i.templateId==='rack_squat'&&i.reason==='height'&&i.quantity===2));
  const configuration={version:1,height_m:height,budget_eur:budget,brief,zone_ids:payload.design.zones.map(z=>z.zoneId),profile:payload.design.profile,space:proposed};
  const saved=await api('/api/gym-projects',{cookie,body:{name:`AI space verification ${locale}`,variant:'plan_existing',total_area:spaceArea(proposed),length_m:bounds.length,width_m:bounds.width,zones:[],configuration}});
  assert.equal(saved.status,201,JSON.stringify(await saved.clone().json()));
  const project=(await saved.json()).project;
  const reopened=(await (await api('/api/gym-projects',{cookie})).json()).projects.find(p=>p.id===project.id);
  assert.deepEqual(reopened.configuration,configuration);
  evidence[evidence.length-1].savedAndReopened=true;
  evidence[evidence.length-1].placed=proposed.items.length;evidence[evidence.length-1].costEur=spaceCost(proposed);
  fs.writeFileSync('/tmp/gymbuilder-space-live-evidence.json',JSON.stringify(evidence,null,2),{mode:0o600});
});
