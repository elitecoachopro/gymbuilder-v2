import { emptySpace, type GymSpace } from '../../../../src/lib/gym-space';

export interface TourItem { id:string; model:string; x:number; z:number; rotation:number; at:number; label?:string }
export const tourItems:TourItem[]=[];
function add(model:string,x:number,z:number,at:number,rotation=0,label?:string){tourItems.push({id:`tour-${tourItems.length}`,model,x,z,at,rotation,label});}
for(const [x,name] of [[14,'VESTIAR FEMEI'],[18,'VESTIAR BĂRBAȚI']] as const){
 add('dulap_vestiar',x,14.55,5,180);add('banca_vestiar',x,12.9,6.5);
 add('dus',x+1.15,11.65,8);add('lavoar',x+1.2,13.6,9);add('sign',x,11,7,0,name);
}
add('desk_receptie',11.5,9.8,13);
add('canapea',8,9.8,14.5);add('plant',9.5,10.25,15);
for(let i=0;i<5;i++)add('banda_alergare',12.8+i*1.4,8.15,18+i*0.7,90);
for(let i=0;i<2;i++)add('real_spin_bike',12.9+i*1.6,5.9,22+i*0.7,90);
for(let i=0;i<2;i++)add('stepmill',16.3+i*1.8,5.9,24+i*0.7,90);
export const musclePairs=[
 {name:'PIEPT',models:['plate_chest_press','pec_fly'],x:1.7,z:1.6},
 {name:'SPATE',models:['aparat_lat','seated_row'],x:7.5,z:1.6},
 {name:'UMERI',models:['shoulder_press','lateral_raise'],x:12.9,z:1.6},
 {name:'PICIOARE',models:['cad_leg_press','leg_extension'],x:1.7,z:4.4},
 {name:'FESIERI',models:['hip_thrust','glute_kickback'],x:7.5,z:4.4},
 {name:'BRAȚE',models:['biceps_curl','triceps_press'],x:1.7,z:7.2},
 {name:'ABDOMEN',models:['ab_crunch','torso_rotation'],x:7.5,z:7.2},
];
musclePairs.forEach((pair,i)=>pair.models.forEach((model,j)=>add(model,pair.x+j*2.8,pair.z,28+i*1.1+j*0.45,model==='real_cable_crossover'?90:0)));
for(let row=0;row<2;row++)for(let col=0;col<3;col++)add('saltea_yoga',1.3+col*1.8,10.4+row*2.1,46+(row*3+col)*0.35,90);
add('aerobic_stage',2.8,14.15,47.5);add('oglinda_perete',0.18,11.3,48,270);add('oglinda_perete',0.18,13.4,48,270);
add('step_stack',5.2,14,49);add('plant',5.35,9.65,49);
add('sauna',7.25,13.65,52,180);add('cryosauna',9.5,13.7,53.5,180);add('canapea_lounge',7.8,11.75,54.5,180);add('plant',6.4,11.55,55);

add('person_reception',11.5,8.9,15.5,0);add('person_coach',10.8,8.6,37.5,220);

export const tourSpace:GymSpace={...emptySpace(20,15),finishes:{floor:'tartan',wall:'#dfdfd7',frame:'#27343c',upholstery:'#916b45'},
 walls:[
  {id:'locker-front',x:12,y:11,length:8,axis:'x',thickness:0.12},
  {id:'locker-divider',x:16,y:11,length:3.9,axis:'y',thickness:0.12},
  {id:'locker-left',x:12,y:11,length:3.9,axis:'y',thickness:0.12},
  {id:'aerobic-right',x:5.9,y:9.2,length:5.7,axis:'y',thickness:0.12},
  {id:'aerobic-front',x:0.1,y:9.2,length:5.8,axis:'x',thickness:0.12},
  {id:'recovery-front',x:6,y:11,length:4.6,axis:'x',thickness:0.12},
  {id:'recovery-right',x:10.6,y:11,length:3.9,axis:'y',thickness:0.12},
 ],stairwell:{x:16.6,y:0.3,w:3,d:4.8,opening:false},openings:[
  {id:'cardio-window',wallId:'edge-1',kind:'window',offset:4.8,width:5.5,height:2.5,sill:0.35},
  {id:'west-window',wallId:'edge-3',kind:'window',offset:1,width:6.5,height:2.5,sill:0.35},
  {id:'north-left',wallId:'edge-0',kind:'window',offset:0.5,width:5.2,height:2.5,sill:0.35},
  {id:'north-right',wallId:'edge-0',kind:'window',offset:12.3,width:6.8,height:2.5,sill:0.35},
  {id:'entry',wallId:'edge-2',kind:'door',offset:10.7,width:1.2,height:2.5,sill:0},
  {id:'locker-women-door',wallId:'locker-front',kind:'door',offset:0.55,width:1.1,height:2.2,sill:0},
  {id:'locker-men-door',wallId:'locker-front',kind:'door',offset:4.55,width:1.1,height:2.2,sill:0},
  {id:'aerobic-door',wallId:'aerobic-front',kind:'door',offset:3.35,width:1.1,height:2.2,sill:0},
  {id:'recovery-door',wallId:'recovery-front',kind:'door',offset:3.05,width:1.1,height:2.2,sill:0},
 ],areas:[
  {id:'aparate',name:'Forță · Imperial Gym',colour:'#6a7475',x:.3,y:.3,w:15.8,d:8.5},
  {id:'vestiare',name:'Vestiare · femei / bărbați',colour:'#b39d75',x:12,y:11,w:8,d:4},
  {id:'receptie',name:'Recepție',colour:'#d6b778',x:6,y:9.2,w:6,d:1.7},
  {id:'cardio',name:'Cardio · 5 benzi / 2 biciclete / 2 trepte',colour:'#a8bac3',x:12,y:4.6,w:7.8,d:5.9},
  {id:'studio',name:'Aerobic · clase de grup',colour:'#b79873',x:0.1,y:9.2,w:5.8,d:5.7},
  {id:'stretching',name:'Refacere · saună / criosaună',colour:'#94afa2',x:6,y:11,w:4.6,d:4},
 ],items:[]};
export function tourChapter(t:number){
 if(t<5)return ['01 · DE LA ZERO','Intrăm în Imperial Gym · 20 × 15 m / 300 m²'];
 if(t<13)return ['02 · VESTIARE ÎN DREAPTA','Două încăperi separate · dulapuri, bănci, dușuri'];
 if(t<18)return ['03 · RECEPȚIE','Puțin mai în față · primire și așteptare'];
 if(t<28)return ['04 · CARDIO ÎN DREAPTA','5 benzi · 2 biciclete GLB · 2 aparate de trepte'];
 if(t<40)return ['05 · FORȚĂ · 14 APARATE','2 / grupă: piept · spate · umeri · picioare · fesieri · brațe · abdomen'];
 if(t<46)return ['06 · TURUL SĂLII','Avansăm prin zona de antrenament'];
 if(t<52)return ['07 · AEROBIC ÎN STÂNGA','Studio separat · 6 locuri pentru clasele de grup'];
 if(t<57)return ['08 · REFACERE','Încăpere separată · saună și criosaună'];
 if(t<64)return ['09 · UN NOU NIVEL','Scară interioară · etaj de încă 300 m²'];
 if(t<72)return ['10 · ZONA DE FORȚĂ IMPERIAL','Modele GLB · mecanisme detaliate · metal satinat · tapițerie conturată'];
 if(t<84)return ['11 · PISTĂ CROSSFIT · 10 m','Antrenor și elev fictivi · împingere sanie cu discuri'];
 if(t<90)return ['12 · ETAJUL CLASELOR · 300 m²','Al treilea nivel · aerobic, Zumba, copii și CrossFit'];
 if(t<96)return ['13 · AEROBIC','Pardoseală din lemn · saltele, stepuri și podium pentru instructor'];
 if(t<102)return ['14 · ZUMBA','Studio pentru dans · oglinzi, podium și spațiu liber'];
 if(t<108)return ['15 · CLASE PENTRU COPII','Mișcare și joacă · saltele și module moi · instructor'];
 if(t<114)return ['16 · CROSSFIT','Rig, aparat de vâslit, boxuri pliometrice și mingi medicinale'];
 return ['IMPERIAL GYM · 3 NIVELURI','Parter + fitness + clase · 3 × 300 m² · vedere explodată conceptuală'];
}
