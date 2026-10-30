import {emptySpace,type GymSpace} from './gym-space.ts';

export function demoClassesSpace():GymSpace{
 const floor=emptySpace(20,15);
 floor.finishes={floor:'rubber',wall:'#e5e1d8',frame:'#29343a',upholstery:'#637d76'};
 floor.stairwell={x:16.6,y:.3,w:3,d:4.8,opening:true};
 floor.walls=[
  {id:'classes-corridor',x:9.8,y:.1,length:14.8,axis:'y',thickness:.12},
  {id:'classes-left-divider',x:.1,y:7.4,length:9.7,axis:'x',thickness:.12},
  {id:'classes-east-corridor',x:11.2,y:.1,length:14.8,axis:'y',thickness:.12},
  {id:'children-front',x:11.2,y:5.8,length:5.2,axis:'x',thickness:.12},
  {id:'children-stair-separator',x:16.4,y:.1,length:5.7,axis:'y',thickness:.12},
  {id:'classes-right-divider',x:11.2,y:7.4,length:8.7,axis:'x',thickness:.12},
 ];
 floor.openings=[
  {id:'classes-stair-corridor',wallId:'classes-east-corridor',kind:'door',offset:5.9,width:1.2,height:2.3,sill:0},
  {id:'aerobic-door',wallId:'classes-corridor',kind:'door',offset:5.5,width:1.2,height:2.3,sill:0},
  {id:'zumba-door',wallId:'classes-corridor',kind:'door',offset:8.1,width:1.2,height:2.3,sill:0},
  {id:'children-door',wallId:'classes-east-corridor',kind:'door',offset:2.2,width:1.2,height:2.3,sill:0},
  {id:'crossfit-access',wallId:'classes-east-corridor',kind:'door',offset:9,width:1.2,height:2.3,sill:0},
  {id:'classes-window-a',wallId:'edge-0',kind:'window',offset:.6,width:8,height:2.4,sill:.4},
  {id:'classes-window-b',wallId:'edge-3',kind:'window',offset:1,width:12,height:2.4,sill:.4},
 ];
 floor.areas=[
  {id:'aerobic',name:'Aerobic',colour:'#c3a67e',x:.2,y:.2,w:9.4,d:7},
  {id:'zumba',name:'Zumba',colour:'#c4a67c',x:.2,y:7.6,w:9.4,d:7.2},
  {id:'children',name:'Copii · mișcare și joacă',colour:'#61a5b5',x:11.4,y:.2,w:4.8,d:5.4},
  {id:'classes-crossfit',name:'CrossFit',colour:'#4f6267',x:11.4,y:7.6,w:8.3,d:7.2},
 ];
 const items:Array<[string,number,number,number?]>=[];
 for(const x of [2,4.5,7])for(const y of [2.4,5.1])items.push(['saltea_yoga',x,y,90]);
 for(const y of [1.5,4.2])items.push(['oglinda_perete',9.68,y,90]);
 for(const x of [2,4.5,7])items.push(['oglinda_perete',x,7.55]);
 for(const x of [12.2,14.6])items.push(['saltea_yoga',x,4.5,90]);
 items.push(['rig_crossfit',15,9.6],['real_rower',14,13],['box_pliometric',17.6,12.8],['box_pliometric',18.6,12.8]);
 floor.items=items.map(([templateId,x,y,rotation=0],i)=>({id:'classes-'+i,templateId,x,y,rotation}));
 return floor;
}
