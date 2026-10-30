import { createEquipmentAssembly, type EquipmentSurfaces } from './gym-model-assembly.ts';
export type CardioModel = 'banda_alergare' | 'bicicleta_spinning' | 'eliptica';

export function buildCardioModel(type: CardioModel): EquipmentSurfaces {
 const {box,rod,disc,bolt,finish}=createEquipmentAssembly();
 function consoleAt(x:number,y:number,width:number) {
  const height=width>.5?.31:.23;
  box([x,y,0],[0.12,height,width],'shell',[0,0,-0.16]);
  box([x+0.068,y+0.025,0],[0.012,height*.76,width*.86],'screen',[0,0,-0.16]);
  box([x+0.077,y-height*.38,0],[0.018,0.026,0.06],'accent');
  for(const side of [-1,1]) {
   box([x+0.08,y-0.065,side*width*0.36],[0.025,0.025,0.045],'chrome');
   box([x+0.035,y+0.09,side*width*0.44],[0.02,0.055,0.015],'rubber');
  }
 }
 if(type==='banda_alergare') {
  box([0,0.135,0],[1.98,0.18,0.77]);
  box([0.13,0.237,0],[1.48,0.028,0.54],'rubber');
  box([-0.78,0.25,0],[0.38,0.2,0.69],'shell',[0,0,-0.08]);
  for(let i=0;i<7;i++) box([-0.88+i*0.028,0.354,0],[0.009,0.006,0.38],'rubber');
  for(const side of [-1,1]) {
   box([0.1,0.25,side*0.335],[1.65,0.045,0.085],'chrome');
   for(let i=0;i<19;i++) box([-0.61+i*0.071,0.274,side*0.335],[0.025,0.006,0.065],'rubber');
   box([-0.58,0.7,side*0.31],[0.105,1.04,0.09],'frame',[0,0,-0.22]);
   box([-0.47,0.73,side*0.312],[0.018,0.68,0.05],'chrome',[0,0,-0.22]);
   rod([-0.48,1.12,side*0.3],[0.13,1.05,side*0.3],0.027,'rubber');
   rod([-0.1,1.076,side*0.3],[0.02,1.062,side*0.3],0.029,'chrome');
   box([-0.56,1.15,side*0.3],[0.19,0.035,0.14],'shell');
   box([-0.56,1.175,side*0.3],[0.09,0.01,0.08],'rubber');
   for(const x of [-0.82,0.82]) {box([x,0.045,side*0.31],[0.18,0.085,0.13],'rubber');bolt([x,0.15,side*0.39]);}
   disc([0.8,0.115,side*0.345],0.065,0.035,'rubber');
   box([0.89,0.22,side*0.33],[0.15,0.09,0.1],'shell');
   box([.16,.275,side*.295],[1.36,.008,.009],'accent');
   for(const x of [-.31,-.2,-.09])box([x,1.105,side*.3],[.045,.012,.022],'shell');
  }
  consoleAt(-0.47,1.33,0.64);
  box([-0.375,1.2,0],[0.04,0.025,0.045],'accent');
  rod([-0.36,1.19,0],[-0.26,1.07,0],0.004,'rubber');
 } else if(type==='bicicleta_spinning') {
  for(const x of [-0.46,0.46]) {
   box([x,0.07,0],[0.12,0.09,0.53]);
   for(const side of [-1,1]) {box([x,0.035,side*0.23],[0.16,0.065,0.12],'rubber');bolt([x,0.105,side*0.2]);}
  }
  disc([-0.29,0.37,0],0.27,0.09,'chrome');disc([-0.29,0.37,0],0.21,0.103,'shell');
  disc([-0.29,0.37,0],0.055,0.115,'accent');
  rod([-0.46,0.11,0],[0.14,0.72,0],0.045);
  rod([0.46,0.11,0],[0.14,0.72,0],0.045);
  box([-0.02,0.39,0],[0.56,0.17,0.12],'shell',[0,0,-0.05]);
  disc([0.12,0.38,0],0.11,0.13,'shell');
  rod([0.14,0.65,0],[0.19,1.01,0],0.025,'chrome');
  box([0.21,1.055,0],[0.28,0.07,0.19],'rubber');box([0.17,1.08,0],[0.19,0.03,0.16],'pad');
  box([0.18,0.84,0],[0.07,0.1,0.075]);box([0.18,0.84,0.06],[0.04,0.025,0.06],'accent');
  rod([-0.43,0.45,0],[-0.35,1.1,0],0.027,'chrome');
  box([-0.37,0.92,0],[0.07,0.18,0.07]);
  for(const side of [-1,1]) {
   rod([-0.35,1.1,0],[-0.2,1.18,side*0.24],0.022,'rubber');
   rod([-0.2,1.18,side*0.24],[-0.05,1.12,side*0.24],0.022,'rubber');
   rod([0.12,0.38,side*0.075],[0.12+side*0.12,0.38-side*0.12,side*0.18],0.014,'chrome');
   box([0.12+side*0.12,0.38-side*0.12,side*0.22],[0.15,0.04,0.12],'rubber');
   box([0.12+side*0.12,0.42-side*0.12,side*0.22],[0.06,0.045,0.11],'shell');
   disc([-0.46,0.09,side*0.23],0.045,0.04,'rubber');
   bolt([-0.29,0.37,side*0.065]);
  }
  box([-0.06,0.69,0],[0.055,0.08,0.055],'accent');
  rod([-.21,.72,0],[-.15,.84,0],.023,'shell');
  rod([-.15,.84,0],[-.22,.94,0],.017,'chrome');
  box([-.21,.87,0],[.09,.12,.09],'rubber');
  consoleAt(-0.28,1.15,0.2);
 } else {
  for(const x of [-0.74,0.66]) {box([x,0.065,0],[0.13,0.09,0.61]);for(const side of [-1,1])box([x,0.033,side*0.26],[0.17,0.06,0.13],'rubber');}
  box([0.42,0.42,0],[0.78,0.64,0.29],'shell');
  disc([0.49,0.42,0],0.255,0.3,'shell');disc([0.49,0.42,0],0.18,0.312,'chrome');disc([0.49,0.42,0],0.08,0.32,'accent');
  box([-0.54,0.77,0],[0.1,1.38,0.1],'frame',[0,0,-0.1]);
  box([-0.485,0.84,0],[0.016,0.76,0.065],'chrome',[0,0,-0.1]);
  for(const side of [-1,1]) {
   rod([-0.78,0.15,side*0.25],[0.71,0.15,side*0.25],0.024,'chrome');
   rod([-0.7,0.25,side*0.24],[0.51,0.42,side*0.24],0.025);
   box([0.08,0.27,side*0.23],[0.42,0.055,0.19],'rubber');
   box([0.08,0.294,side*0.23],[0.35,0.014,0.15],'shell');
   for(let i=0;i<6;i++)box([-0.055+i*0.05,0.303,side*0.23],[0.012,0.006,0.13],'rubber');
   rod([-0.65,0.32,side*0.24],[-0.44,1.2,side*0.25],0.027);
   rod([-0.44,1.2,side*0.25],[-0.19,1.67,side*0.25],0.024,'rubber');
   rod([-0.19,1.67,side*0.25],[-0.08,1.61,side*0.25],0.024,'rubber');
   disc([-0.44,1.2,side*0.28],0.052,0.025,'chrome');bolt([-0.44,1.2,side*0.3]);
   rod([-0.5,1.15,0],[-0.28,1.13,side*0.18],0.022,'rubber');
  }
  consoleAt(-0.44,1.53,0.31);
 }
 return finish();
}
