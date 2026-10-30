import { insideOutline, spaceWalls, type GymSpace } from './gym-space.ts';
import { createEquipmentAssembly } from './gym-model-assembly.ts';

export function strengthAccentWall(space: GymSpace) {
  const zones = space.areas.filter(a => a.id === 'greutati' || a.id === 'aparate');
  const candidates = spaceWalls(space).filter(w => w.id.startsWith('edge-')).flatMap(wall => {
    const horizontal = wall.axis === 'x';
    const coordinate = horizontal ? wall.y : wall.x;
    return zones.flatMap(zone => {
      const near = horizontal ? Math.min(Math.abs(coordinate-zone.y), Math.abs(coordinate-zone.y-zone.d)) : Math.min(Math.abs(coordinate-zone.x), Math.abs(coordinate-zone.x-zone.w));
      if (near > 1.5) return [];
      const projectedStart = horizontal ? zone.x-wall.x : zone.y-wall.y;
      const start = Math.max(0, projectedStart);
      const end = Math.min(wall.length, projectedStart + (horizontal ? zone.w : zone.d));
      let spans = [[start, end]];
      for (const opening of space.openings.filter(o => o.wallId === wall.id)) {
        spans = spans.flatMap(([a,b]) => opening.offset >= b || opening.offset+opening.width <= a ? [[a,b]] : [[a,Math.min(b,opening.offset-.08)],[Math.max(a,opening.offset+opening.width+.08),b]]).filter(([a,b]) => b-a >= 3);
      }
      return spans.filter(([a,b]) => b-a >= 3).map(([from,to]) => {
        const centreX=wall.x+(horizontal ? (from+to)/2 : 0);
        const centreZ=wall.y+(horizontal ? 0 : (from+to)/2);
        const positiveSide=insideOutline({x:centreX+(horizontal ? 0 : .12),y:centreZ+(horizontal ? .12 : 0)},space.outline);
        const offset=positiveSide ? .09 : -.09;
        return {
          wallId:wall.id,from,length:to-from,
          x:centreX+(horizontal ? 0 : offset),z:centreZ+(horizontal ? offset : 0),
          rotation:horizontal ? (positiveSide ? 0 : Math.PI) : (positiveSide ? Math.PI/2 : -Math.PI/2),
        };
      });
    });
  });
  return candidates.sort((a,b)=>Number(b.z<.2)-Number(a.z<.2)||b.length-a.length)[0] ?? null;
}

export function buildStrengthInterior(length: number, height: number) {
  const {box,finish} = createEquipmentAssembly();
  const h = Math.min(height-.15,3.1), inset=.08;
  box([length/2,h/2,.012],[length,h,.025],'frame');
  const wing = Math.min(1.2,length*.2), count = Math.floor(wing/.085);
  for(const side of [0,1]) for(let i=0;i<count;i++) {
    const x=side ? length-inset-i*.085 : inset+i*.085;
    box([x,h/2,.052],[.035,h-.12,.055],'shell');
  }
  box([length/2,.09,.07],[length,.18,.06],'rubber');
  box([length/2,h-.09,.07],[length-.1,.022,.035],'accent');
  box([length/2,h*.66,.043],[Math.min(3.6,length*.57),.78,.018],'label');
  box([length/2,.21,.075],[length-.16,.012,.02],'accent');
  return finish();
}
