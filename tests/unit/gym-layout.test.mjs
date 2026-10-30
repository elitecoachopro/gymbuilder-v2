import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutZones } from '../../src/lib/gym-layout.ts';
const input = [30, 25, 15, 10, 8, 5, 3, 2, 1, 1].map((area_m2, i) => ({ id: String(i), name: `Zone ${i}`, color: '#000', area_m2 }));
test('generated layout preserves areas and stays within the room without overlaps', () => {
  const zones = layoutZones(input, 100, 10, 10);
  for (const zone of zones) {
    assert.ok(Math.abs(zone.w * zone.h / 100 - zone.area_m2) < 1e-8);
    assert.ok(zone.x >= 0 && zone.y >= 0 && zone.x + zone.w <= 100.00001 && zone.y + zone.h <= 100.00001);
    for (const other of zones.filter(item => item.id !== zone.id)) {
      assert.ok(!(zone.x < other.x + other.w - 1e-8 && zone.x + zone.w > other.x + 1e-8 && zone.y < other.y + other.h - 1e-8 && zone.y + zone.h > other.y + 1e-8));
    }
  }
});
test('layout refuses inconsistent room dimensions, negative areas and overallocation', () => {
  assert.throws(() => layoutZones(input, 100, 5, 5));
  assert.throws(() => layoutZones([{ ...input[0], area_m2: -1 }], 100, 10, 10));
  assert.throws(() => layoutZones([{ ...input[0], area_m2: 101 }], 100, 10, 10));
});

test('equipment placement finds free space and refuses overlaps or zone overflow', async () => {
  const { findEquipmentPosition, equipmentFits, validProjectGeometry } = await import('../../src/lib/gym-layout.ts');
  const zone={ id:'cardio', name:'Cardio', color:'#000', x:0,y:0,w:100,h:100,area_m2:100 };
  const first={ instanceId:'first',zoneId:'cardio',x:0,y:0,w:20,h:10,length_m:2,width_m:1 };
  const position=findEquipmentPosition(zone,20,10,[first]);assert.ok(position);assert.ok(position.x>=20 || position.y>=10);
  assert.equal(equipmentFits({...first,instanceId:'second'},zone,[first]),false);
  assert.equal(equipmentFits({...first,x:90},zone,[]),false);
  assert.equal(findEquipmentPosition(zone,101,10,[]),null);
  const project={ total_area:100,length_m:10,width_m:10,zones:[{...zone,equipment:[first]}] };
  assert.equal(validProjectGeometry(project),true);
  assert.equal(validProjectGeometry({...project,zones:[{...zone,equipment:[{...first,x:99}]}]}),false);
});
