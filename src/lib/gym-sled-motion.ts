import {boxPolygon,doorBox,itemPolygon,polygonFits,polygonsOverlap,spaceWalls,wallBox,type GymSpace,type SpaceItem} from './gym-space.ts';
import {SLED_SPEED} from './gym-athlete-motion.ts';
export type SledPushRoute = {itemId:string;distance:number;duration:number;dx:number;dy:number;cameraOffset?:[number,number]};
export function sledPushRoute(space:GymSpace,item:SpaceItem):SledPushRoute|null {
 if(item.templateId!=='sled_training'||item.rotation%90!==0)return null;
 const footprint=itemPolygon(item),area=space.areas.find(a=>a.id==='functional'&&polygonFits(footprint,boxPolygon(a)));
 if(!area)return null;
 const angle=item.rotation*Math.PI/180,dx=Math.round(-Math.sin(angle)),dy=Math.round(Math.cos(angle));
 const xs=footprint.map(p=>p.x),ys=footprint.map(p=>p.y);
 const distance=(dx<0?Math.min(...xs)-area.x:dx>0?area.x+area.w-Math.max(...xs):dy<0?Math.min(...ys)-area.y:area.y+area.d-Math.max(...ys))-.1;
 if(distance<1)return null;
 const sweep=boxPolygon({x:Math.min(...xs)+Math.min(0,dx*distance),y:Math.min(...ys)+Math.min(0,dy*distance),w:Math.max(...xs)-Math.min(...xs)+Math.abs(dx*distance),d:Math.max(...ys)-Math.min(...ys)+Math.abs(dy*distance)});
 const walls=spaceWalls(space);
 const obstacles=[...space.items.filter(i=>i.id!==item.id).map(itemPolygon),...space.columns.map(boxPolygon),...walls.map(w=>boxPolygon(wallBox(w,0,w.length))),...space.openings.filter(o=>o.kind==='door').map(o=>boxPolygon(doorBox(walls.find(w=>w.id===o.wallId)!,o))),...(space.stairwell?[boxPolygon(space.stairwell)]:[])];
 if(!polygonFits(sweep,space.outline)||obstacles.some(o=>polygonsOverlap(sweep,o)))return null;
 const cameraOffset = [-1,1].map(side=>[-dx*1.8-dy*4.2*side,-dy*1.8+dx*4.2*side] as [number,number]).find(([x,y])=>{
  const cameraSweep=boxPolygon({x:item.x+x+Math.min(0,dx*distance)-.15,y:item.y+y+Math.min(0,dy*distance)-.15,w:.3+Math.abs(dx*distance),d:.3+Math.abs(dy*distance)});
  return polygonFits(cameraSweep,space.outline)&&!obstacles.some(o=>polygonsOverlap(cameraSweep,o));
 });
 return {itemId:item.id,distance,duration:distance/SLED_SPEED,dx,dy,cameraOffset};
}
export function sampleSledPush(route:SledPushRoute,seconds:number){
 const time=Math.max(0,Math.min(route.duration,seconds)),localZ=time*SLED_SPEED;
 return {time,localZ,x:route.dx*localZ,y:route.dy*localZ};
}
