import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoSpace, itemPolygon, boxPolygon, polygonsOverlap, polygonFits } from '../../src/lib/gym-space.ts';
import { demoGymTour, sampleGymTour } from '../../src/lib/gym-walkthrough.ts';

test('the demonstration tour stays at eye level and outside equipment and columns throughout its route', () => {
  const space = demoSpace(), tour = demoGymTour(space, 3.5);
  assert.ok(tour && tour.stops.length >= 5);
  assert.ok(tour.duration > 30 && tour.duration < 120);
  for (let seconds = 0; seconds <= tour.duration; seconds += .1) {
    const pose = sampleGymTour(tour, seconds);
    assert.equal(pose.position[1], 1.65);
    const [x, , y] = pose.position, footprint = boxPolygon({ x:x-.2, y:y-.2, w:.4, d:.4 });
    assert.ok(polygonFits(footprint, space.outline));
    assert.ok(space.items.every(item => !polygonsOverlap(footprint, itemPolygon(item))), `equipment at ${seconds}s`);
    assert.ok(space.columns.every(column => !polygonsOverlap(footprint, boxPolygon(column))), `column at ${seconds}s`);
    assert.ok([...pose.position, ...pose.lookAt].every(Number.isFinite));
  }
  assert.deepEqual(sampleGymTour(tour, tour.duration + 10), sampleGymTour(tour, tour.duration));
});

test('the demonstration tour does not run through a moved obstacle or a closed reception door', () => {
  const space = demoSpace();
  space.columns.push({ id:'blocked-tour', x:1.7, y:4.2, w:.8, d:.8 });
  assert.equal(demoGymTour(space, 3.5), null);
  const closed = demoSpace();
  closed.openings = closed.openings.filter(opening => opening.id !== 'room-door-0');
  assert.equal(demoGymTour(closed, 3.5), null);
  const small = demoSpace(); small.outline = [{x:0,y:0},{x:4,y:0},{x:4,y:4},{x:0,y:4}];
  assert.equal(demoGymTour(small, 3.5), null);
});

test('tour poses are independent of sampling frequency and do not modify the project', () => {
  const space = demoSpace(), snapshot = JSON.stringify(space), tour = demoGymTour(space, 2.5);
  assert.ok(tour);
  const expected = sampleGymTour(tour, 17.5);
  for (let i=0;i<100;i++) sampleGymTour(tour, i/10);
  assert.deepEqual(sampleGymTour(tour,17.5),expected);
  assert.equal(JSON.stringify(space),snapshot);
});
