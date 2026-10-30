import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gymCameraDistance, initialGymCameraView } from '../../src/lib/gym-camera.ts';

test('portrait and landscape cameras contain the complete room bounding sphere', () => {
  for (const aspect of [0.5, 0.62, 1, 1.6, 2.2]) {
    const distance = gymCameraDistance(20, 15, aspect);
    const halfAngle = Math.min(25 * Math.PI / 180, Math.atan(Math.tan(25 * Math.PI / 180) * aspect));
    assert.ok(distance * Math.sin(halfAngle) > Math.hypot(10, 7.5, 3));
  }
  assert.ok(gymCameraDistance(20, 15, 0.5) > gymCameraDistance(20, 15, 1.6));
});


test('mobile automatic interior view never starts outside the narrow arm of an L-shaped room', () => {
  const narrowL = [{x:0,y:0},{x:20,y:0},{x:20,y:10},{x:2,y:10},{x:2,y:15},{x:0,y:15}];
  assert.equal(initialGymCameraView(narrowL), 'orbit');
  assert.equal(initialGymCameraView([{x:0,y:0},{x:20,y:0},{x:20,y:15},{x:0,y:15}]), 'inside');
});
