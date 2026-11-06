import { boxPolygon, itemPolygon, polygonFits, polygonsOverlap, spaceBounds, spaceWalls, wallBox, type GymSpace } from './gym-space.ts';

export type TourPose = { position: [number, number, number]; lookAt: [number, number, number] };
type TourFrame = TourPose & { at: number };
export type GymTour = { frames: TourFrame[]; stops: Array<TourFrame & { ro: string; en: string }>; duration: number };

export function demoGymTour(space: GymSpace, height: number): GymTour | null {
  const bounds = spaceBounds(space), eye = 1.65;
  if (bounds.length !== 20 || bounds.width !== 15 || height < eye + .2 || !space.items.some(item => item.id === 'demo-desk_receptie-1')) return null;
  const obstacles = [...space.items.map(itemPolygon), ...space.columns.map(boxPolygon), ...(space.stairwell ? [boxPolygon(space.stairwell)] : [])];
  for (const wall of spaceWalls(space)) {
    let cursor = 0;
    const doors = space.openings.filter(o => o.wallId === wall.id && o.kind === 'door' && o.sill <= .05 && o.height >= eye + .1).sort((a,b) => a.offset-b.offset);
    for (const door of doors) {
      if (door.offset > cursor) obstacles.push(boxPolygon(wallBox(wall, cursor, door.offset-cursor)));
      cursor = door.offset + door.width;
    }
    if (cursor < wall.length) obstacles.push(boxPolygon(wallBox(wall, cursor, wall.length-cursor)));
  }
  const clear = (x: number, z: number) => {
    const foot = boxPolygon({ x:x-.2, y:z-.2, w:.4, d:.4 });
    return polygonFits(foot, space.outline) && obstacles.every(obstacle => !polygonsOverlap(foot, obstacle));
  };
  const frames: TourFrame[] = [], stops: GymTour['stops'] = [];
  const visit = (x: number, z: number, lookX: number, lookZ: number, label?: [string,string]) => {
    const previous = frames.at(-1), distance = previous ? Math.hypot(x-previous.position[0], z-previous.position[2]) : 0;
    if (previous) for (let i=0;i<=Math.ceil(distance/.1);i++) {
      const t = i/Math.max(1,Math.ceil(distance/.1));
      if (!clear(previous.position[0]+(x-previous.position[0])*t,previous.position[2]+(z-previous.position[2])*t)) return false;
    }
    if (!clear(x,z)) return false;
    const frame: TourFrame = { at:(previous?.at ?? 0)+distance/.95, position:[x,eye,z], lookAt:[lookX,1.15,lookZ] };
    frames.push(frame);
    if (label) { stops.push({...frame,ro:label[0],en:label[1]}); frames.push({...frame,at:frame.at+3}); }
    return true;
  };
  const itinerary: Parameters<typeof visit>[] = [
    [.8,.7,2.5,1.8,['Recepție','Reception']], [.8,3.1,2.5,1.8], [2.05,3.3,3,6.2],
    [2.05,4.6,3,6.2], [5,4.6,2.8,6.2,['Cardio','Cardio']],
    [7.95,4.6,9.2,6.1], [7.95,8.2,11.4,6.1],
    [11.6,8.2,11.4,6.1,['Forță','Strength']],
    [12.5,8.2,14.1,6.2,['Presa pentru picioare','Leg press']],
    [15.5,8.2,17.4,6.1,['Stația cu cabluri','Cable station']],
    [10.5,8.2,4.5,10.8], [10.5,9.6,4.5,10.8,['Greutăți libere','Free weights']],
    [10.5,8.2,17.4,6.1], [19.5,8.2,17.4,6.1], [19.5,12.5,15,13.6],
    [17,12.5,13,13.6,['Pistă CrossFit','CrossFit track']],
  ];
  if (!itinerary.every(point => visit(...point))) return null;
  return {frames,stops,duration:frames.at(-1)!.at};
}

export function sampleGymTour(tour: GymTour, seconds: number): TourPose {
  const time = Math.max(0,Math.min(tour.duration,seconds));
  const to = tour.frames.findIndex(frame => frame.at >= time);
  const b = tour.frames[to < 0 ? tour.frames.length-1 : to], a = tour.frames[Math.max(0,to-1)];
  const t = b.at === a.at ? 1 : (time-a.at)/(b.at-a.at);
  const lerp = (start: TourPose['position'], end: TourPose['position']): TourPose['position'] => start.map((v,i)=>v+(end[i]-v)*t) as TourPose['position'];
  return {position:lerp(a.position,b.position),lookAt:lerp(a.lookAt,b.lookAt)};
}
