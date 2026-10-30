import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, fixtureUser, cleanupUsers, signedCookie } from './helpers.mjs';
import { buildGymProposal } from '../../src/lib/gym-studio.ts';
// Persistence fixtures use real signed sessions; login throttling is covered by the auth suite.
const session = user => signedCookie({ userId: user.id, version: 0, exp: Date.now() + 300000 });
const configuration={version:1,height_m:3.5,budget_eur:30000,brief:'A gym with reception, showers and cardio',zone_ids:['receptie','vestiare','cardio','greutati'],profile:'balanced'};
const brief={...configuration,total_area:300,length_m:20,width_m:15};
test('new studio configuration and standard models survive save, update and reopening', async t=>{
 const user=await fixtureUser();t.after(()=>cleanupUsers([user]));const cookie=session(user),proposal=buildGymProposal(brief);
 const body={...brief,name:'Studio fixture',variant:'from_scratch',configuration,zones:proposal.zones.map(z=>({...z,equipment:proposal.equipment.filter(e=>e.zoneId===z.id)}))};
 const response=await api('/api/gym-projects',{cookie,body});assert.equal(response.status,201);const saved=(await response.json()).project;
 assert.deepEqual(saved.configuration,configuration);
 const update=await api('/api/gym-projects',{cookie,body:{id:saved.id,name:'Updated studio'}});assert.equal(update.status,200);assert.deepEqual((await update.json()).project.configuration,configuration);
 const opened=(await (await api('/api/client/gym-projects',{cookie})).json()).projects.find(p=>p.id===saved.id);
 assert.deepEqual(opened.zones,body.zones);assert.deepEqual(opened.configuration,configuration);
 assert.equal((await api('/api/gym-projects',{cookie,body:{id:saved.id,configuration:{...configuration,budget_eur:1}}})).status,400);
 assert.equal((await api('/api/gym-projects',{cookie,body:{id:saved.id,configuration:{...configuration,height_m:2}}})).status,400);
});
test('AI endpoint requires authentication and clearly reports an unconfigured provider',async t=>{
 assert.equal((await api('/api/configurator/ai',{body:{}})).status,401);
 const status=await (await api('/api/configurator/ai')).json();assert.equal(typeof status.configured,'boolean');
 if(!status.configured){const user=await fixtureUser();t.after(()=>cleanupUsers([user]));const response=await api('/api/configurator/ai',{cookie:session(user),body:{}});assert.equal(response.status,503);assert.equal((await response.json()).error,'AI_NOT_CONFIGURED');}
});

test('metre-based space projects preserve complete architecture, models and finishes through create, update and reopen', async t => {
  const { demoSpace, spaceArea, spaceBounds, validateSpace } = await import('../../src/lib/gym-space.ts');
  const user = await fixtureUser(); t.after(() => cleanupUsers([user]));
  const other = await fixtureUser(); t.after(() => cleanupUsers([other]));
  const cookie = session(user), otherCookie = session(other);
  const space = demoSpace(), bounds = spaceBounds(space);
  assert.equal(validateSpace(space, 3.5, null), null);
  const configuration = { version: 1, height_m: 3.5, budget_eur: null, brief: 'Verificare sală de 300 m², pereți, vestiare și aparate.', zone_ids: ['cardio'], profile: 'balanced', space };
  const body = { name: 'Spațiu 300 m² — verificare', variant: 'plan_existing', total_area: spaceArea(space), length_m: bounds.length, width_m: bounds.width, zones: [], configuration, status: 'in_progress' };
  const response = await api('/api/gym-projects', { cookie, body });
  const result = await response.json(); assert.equal(response.status, 201, JSON.stringify(result));
  const saved = result.project;
  assert.deepEqual(saved.configuration, configuration);
  assert.equal(Number(saved.total_area), 300);
  const changed = structuredClone(configuration);
  changed.space.visualization = { lighting: 'evening', eyeHeight: 1.72, fov: 37, snap: 0.05, dimensions: false };
  changed.space.finishes.floor = 'oak'; changed.space.finishes.upholstery = '#445566';
  changed.brief = 'Updated requirements preserved on reopen.';
  changed.space.items = changed.space.items.slice(1);
  const update = await api('/api/gym-projects', { cookie, body: { id: saved.id, name: 'Updated space', configuration: changed } });
  assert.equal(update.status, 200, JSON.stringify(await update.clone().json()));
  const reopened = (await (await api('/api/client/gym-projects', { cookie })).json()).projects.find(p => p.id === saved.id);
  assert.deepEqual(reopened.configuration, changed);
  assert.equal(reopened.name, 'Updated space'); assert.deepEqual(reopened.zones, []);
  assert.equal((await (await api('/api/gym-projects', { cookie: otherCookie })).json()).projects.some(p => p.id === saved.id), false);
  assert.equal((await api('/api/gym-projects', { cookie: otherCookie, body: { id: saved.id, name: 'Not mine' } })).status, 404);
  for (const configuration of [{ ...changed, space: { ...changed.space, visualization: { ...changed.space.visualization, fov: 120 } } }, { ...changed, budget_eur: 1 }, { ...changed, height_m: 2 }, { ...changed, space: { ...changed.space, items: [...changed.space.items, { ...changed.space.items[0], id: 'collision' }] } }]) {
    assert.equal((await api('/api/gym-projects', { cookie, body: { id: saved.id, configuration } })).status, 400);
  }
  const afterInvalid = (await (await api('/api/gym-projects', { cookie })).json()).projects.find(p => p.id === saved.id);
  assert.deepEqual(afterInvalid.configuration, changed);
});

test('L-shaped rooms preserve their actual area and geometry after saving and reopening', async t => {
  const { emptySpace, spaceArea, populateSpace } = await import('../../src/lib/gym-space.ts');
  const user = await fixtureUser(); t.after(() => cleanupUsers([user])); const cookie = session(user);
  const room = emptySpace(); room.outline = [{x:0,y:0},{x:20,y:0},{x:20,y:10},{x:15,y:10},{x:15,y:15},{x:0,y:15}];
  const space = populateSpace(room, [{zoneId:'cardio',equipment:[{templateId:'banda_alergare',quantity:2}]}], 3.5, 10000).space;
  assert.equal(spaceArea(space), 275);
  const configuration = {version:1,height_m:3.5,budget_eur:10000,brief:'L-shaped gym',zone_ids:['cardio'],profile:'balanced',space};
  const response = await api('/api/gym-projects', {cookie,body:{name:'L-shaped space',variant:'plan_existing',total_area:275,length_m:20,width_m:15,zones:[],configuration}});
  assert.equal(response.status,201,JSON.stringify(await response.clone().json()));
  const saved=(await response.json()).project;
  const reopened=(await (await api('/api/gym-projects',{cookie})).json()).projects.find(p=>p.id===saved.id);
  assert.deepEqual(reopened.configuration,configuration);assert.equal(Number(reopened.total_area),275);
  assert.equal((await api('/api/gym-projects',{cookie,body:{id:saved.id,total_area:300}})).status,400);
});

test('project endpoint rejects invalid JSON and null bodies without an internal error', async () => {
  const user = await fixtureUser();
  try {
    const cookie = session(user);
    for (const body of ['null', '{']) {
      const response = await fetch(`${(await import('./helpers.mjs')).origin}/api/gym-projects`, {method:'POST',headers:{cookie,'content-type':'application/json'},body});
      assert.equal(response.status,400, `Request body ${body} must be rejected as a client error`);
    }
  } finally { await cleanupUsers([user]); }
});

test('two-floor tartan projects retain all geometry and optional fields after update, failures and reopening', async t => {
  const { demoBuildingSpace, buildingArea } = await import('../../src/lib/gym-building.ts');
  const { spaceBounds, spaceCost } = await import('../../src/lib/gym-space.ts');
  const user = await fixtureUser(); t.after(() => cleanupUsers([user]));
  const other = await fixtureUser(); t.after(() => cleanupUsers([other]));
  const cookie = session(user), otherCookie = session(other);
  const space = demoBuildingSpace();
  space.finishes.floor = 'tartan'; space.upperFloor.finishes.floor = 'tartan';
  space.visualization = { lighting: 'studio', eyeHeight: 1.65, fov: 45, snap: 0.05, dimensions: true, interiorStyle: 'minimal' };
  space.upperFloor.visualization = { ...space.visualization, lighting: 'evening', snap: 0.1 };
  const configuration = { version: 1, height_m: 3.5, budget_eur: spaceCost(space) + 10000, brief: 'Two-floor U6 persistence fixture', zone_ids: ['cardio'], profile: 'balanced', space };
  const bounds = spaceBounds(space);
  const body = { name: 'U6 two floors', variant: 'plan_existing', total_area: buildingArea(space), length_m: bounds.length, width_m: bounds.width, zones: [], configuration };
  const created = await api('/api/gym-projects', { cookie, body });
  assert.equal(created.status, 201, JSON.stringify(await created.clone().json()));
  const saved = (await created.json()).project;
  assert.deepEqual(saved.configuration, configuration);
  const changed = structuredClone(configuration);
  changed.space.upperFloor.items = changed.space.upperFloor.items.slice(1);
  changed.space.finishes.upholstery = '#335577';
  changed.space.upperFloor.finishes.wall = '#dfdbd4';
  const updated = await api('/api/gym-projects', { cookie, body: { id: saved.id, configuration: changed } });
  assert.equal(updated.status, 200);
  for (const [attemptCookie, expected] of [[otherCookie,404],[signedCookie({ userId: user.id, version: 0, exp: Date.now() - 60000 }),401]]) {
    assert.equal((await api('/api/gym-projects', { cookie: attemptCookie, body: { id: saved.id, name: 'Rejected overwrite' } })).status, expected);
  }
  assert.equal((await api('/api/gym-projects', { cookie, body: { id: saved.id, configuration: { ...changed, budget_eur: 1 } } })).status, 400);
  for (const path of ['/api/gym-projects','/api/client/gym-projects']) {
    const opened = (await (await api(path, { cookie })).json()).projects.find(project => project.id === saved.id);
    assert.deepEqual(opened.configuration, changed);
    assert.equal(Number(opened.total_area), 600);
    assert.equal(opened.name, body.name);
  }
  assert.equal((await (await api('/api/gym-projects', { cookie: otherCookie })).json()).projects.some(project => project.id === saved.id), false);
});
