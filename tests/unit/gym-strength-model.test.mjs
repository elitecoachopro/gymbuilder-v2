import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildStrengthModel } from '../../src/lib/gym-strength-model.ts';

for (const [type, length, width, height] of [['aparat_piept',1.5,1.2,1.6],['aparat_lat',1.4,1,2.3],['aparat_picioare',2.2,1,1.6]]) {
  test(`${type}: detailed assembly fits nominal footprint and batches its finishes`, () => {
    const surfaces = buildStrengthModel(type);
    assert.ok(Object.keys(surfaces).length <= 8);
    let triangles=0;
    for (const geometry of Object.values(surfaces)) {
      geometry.computeBoundingBox();
      const {min,max} = geometry.boundingBox;
      assert.ok(min.x >= -length/2-0.001 && max.x <= length/2+0.001, `length ${min.x}..${max.x}`);
      assert.ok(min.z >= -width/2-0.001 && max.z <= width/2+0.001, `width ${min.z}..${max.z}`);
      assert.ok(min.y >= -0.001 && max.y <= height+0.001, `height ${min.y}..${max.y}`);
      assert.ok([...geometry.attributes.position.array,...geometry.attributes.normal.array].every(Number.isFinite));
      triangles += geometry.index ? geometry.index.count/3 : geometry.attributes.position.count/3;
      geometry.dispose();
    }
    assert.ok(triangles > 2000 && triangles < 28000, `bounded geometry ${triangles} triangles`);
  });
}

function containsVertex(geometry, region) {
  const positions=geometry.getAttribute('position');
  for (let i=0;i<positions.count;i++) if (region(positions.getX(i),positions.getY(i),positions.getZ(i))) return true;
  return false;
}
for (const [type,finish,region,feature] of [
  ['aparat_piept','rubber',(x,y,z)=>x>0.47 && y>0.8 && y<1 && Math.abs(z)>0.3,'forward press handles'],
  ['aparat_lat','chrome',(x,y,z)=>x>0.3 && x<0.4 && y>1.79 && y<1.85 && Math.abs(z)>0.25,'wide overhead pull bar'],
  ['aparat_picioare','shell',(x,y,z)=>x>0.7 && y>1 && Math.abs(z)>0.3,'inclined foot platform'],
]) {
  test(`${type} defines its ${feature}`,()=>{
    const model=buildStrengthModel(type);
    try { assert.ok(containsVertex(model[finish],region),feature); }
    finally { Object.values(model).forEach(g=>g.dispose()); }
  });
}
