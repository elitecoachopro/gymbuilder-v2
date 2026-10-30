import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sledRunAt} from '../browser/app/demo/sled-run.ts';
import {demoBuildingSpace} from '../../src/lib/gym-building.ts';
import {EQUIPMENT_CATALOG} from '../../src/lib/gym-catalog.ts';
test('entire sled footprint remains on the green track throughout the film run',()=>{
 const track=demoBuildingSpace().upperFloor.areas.find(a=>a.id==='functional');
 const sled=EQUIPMENT_CATALOG.find(a=>a.id==='sled_training');
 for(let t=72;t<=84;t+=.1){const run=sledRunAt(t);assert.ok(run.y-sled.width_m/2>=track.y-1e-6);assert.ok(run.y+sled.width_m/2<=track.y+track.d+1e-6,'sled stays on green turf');}
 assert.equal(sledRunAt(0).time,0);assert.equal(sledRunAt(120).time,12);
});
