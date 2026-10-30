import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GYM_GRAPHICS, INITIAL_GYM_VIEW, watchGraphicsContext, INITIAL_GYM_GRAPHICS, gymRenderDpr } from '../../src/lib/gym-graphics.ts';
import { LIGHTING_PRESETS, FLOOR_SURFACES } from '../../src/lib/gym-visualization.ts';

test('studio starts without a GPU context and the low profile reduces render cost', () => {
  assert.equal(INITIAL_GYM_VIEW, '2d');
  assert.equal(GYM_GRAPHICS.low.dpr, 1);
  assert.equal(GYM_GRAPHICS.low.antialias, false);
  assert.equal(GYM_GRAPHICS.low.shadows, false);
  assert.equal(GYM_GRAPHICS.low.environment, false);
  assert.ok(GYM_GRAPHICS.low.dpr < GYM_GRAPHICS.standard.dpr);
});

test('daylight and studio fill reveal dark materials with the same bounded light rig', () => {
  for (const mode of ['daylight', 'studio']) {
    const light = LIGHTING_PRESETS[mode];
    assert.ok(light.ambient >= 0.2 && light.ambient <= 0.4);
    assert.ok(light.hemisphere >= 1 && light.hemisphere <= 1.3);
    assert.ok(light.exposure >= 1 && light.exposure <= 1.2);
    assert.ok(light.strength <= 2.6 && light.fillStrength <= 1.7);
  }
  assert.equal(FLOOR_SURFACES.tartan.tileMetres, 0.5);
  assert.equal(FLOOR_SURFACES.turf.tileMetres, 1);
  assert.deepEqual(GYM_GRAPHICS.low, { dpr: 1, antialias: false, shadows: false, environment: false });
});

test('lost or failed WebGL context triggers one recovery and removes its listeners', () => {
  for (const type of ['webglcontextlost', 'webglcontextcreationerror']) {
    const canvas = new EventTarget();
    let recoveries = 0;
    const dispose = watchGraphicsContext(canvas, () => { recoveries++; });
    const event = new Event(type, { cancelable: true });
    canvas.dispatchEvent(event);
    assert.equal(event.defaultPrevented, true);
    canvas.dispatchEvent(new Event(type));
    assert.equal(recoveries, 1);
    dispose();
    canvas.dispatchEvent(new Event(type));
    assert.equal(recoveries, 1);
  }
});

test('unmount removes graphics listeners without falsely reporting a failure', () => {
  const canvas = new EventTarget();
  let recoveries = 0;
  const dispose = watchGraphicsContext(canvas, () => { recoveries++; });
  dispose();
  canvas.dispatchEvent(new Event('webglcontextlost'));
  assert.equal(recoveries, 0);
});


test('automatic clarity uses a sharper still image without enabling expensive scene effects', () => {
  assert.equal(INITIAL_GYM_GRAPHICS, 'low');
  assert.equal(GYM_GRAPHICS.auto.antialias, true);
  assert.equal(GYM_GRAPHICS.auto.shadows, false);
  assert.equal(GYM_GRAPHICS.auto.environment, false);
  const still = gymRenderDpr('auto', 333, 445, false);
  const moving = gymRenderDpr('auto', 333, 445, true);
  assert.equal(still, 2);
  assert.ok(moving >= 1 && moving < still);
  assert.equal(gymRenderDpr('low', 333, 445, false), 1);
});

test('automatic clarity sharpens a stationary scene while retaining the moving and economic budgets', () => {
  for (const [width, height] of [[333,445],[700,340],[1700,850],[2400,1600]]) {
    const still = gymRenderDpr('auto', width, height, false);
    const moving = gymRenderDpr('auto', width, height, true);
    assert.ok(still >= moving && still <= 2);
    assert.ok(width * height * still * still <= Math.max(2000000, width * height) + 1);
    assert.ok(width * height * moving * moving <= Math.max(1200000, width * height) + 1);
    assert.equal(gymRenderDpr('low',width,height,false),1);
  }
  assert.ok(gymRenderDpr('auto',1000,800,false)>1.5,'stationary close-up is sharper than the prior 1.2MP ceiling');
});
