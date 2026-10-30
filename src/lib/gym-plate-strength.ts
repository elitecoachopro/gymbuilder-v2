import {createEquipmentAssembly} from './gym-model-assembly.ts';
import type {StrengthFinish} from './gym-strength-model.ts';
import type * as THREE from 'three';

export function buildPlateChestPress():Record<StrengthFinish,THREE.BufferGeometry>{
 const{box,rod,disc,bolt,finish}=createEquipmentAssembly();
 for(const x of [-.72,.75]){
  box([x,.095,0],[.15,.12,1.27]);
  for(const side of [-1,1]){box([x,.04,side*.57],[.22,.08,.17],'rubber');bolt([x,.16,side*.55]);}
 }
 box([0,.18,0],[1.65,.13,.16]);
 rod([-.72,.17,0],[-.58,1.43,0],.055);
 box([-.57,1.4,0],[.16,.13,1.16]);
 rod([.2,.2,0],[.11,.6,0],.045,'chrome');
 box([.15,.59,0],[.47,.1,.46],'pad');
 box([-.25,1.01,0],[.14,.72,.46],'pad',[0,0,-.14]);
 box([-.25,1.01,0],[.16,.77,.49],'rubber',[0,0,-.14]);
 box([-.24,1.02,.006],[.155,.72,.46],'pad',[0,0,-.14]);
 box([.22,.43,.12],[.05,.035,.15],'accent');
 for(const side of [-1,1]){
  const z=side*.49;
  disc([-.57,1.4,z],.105,.12,'shell');disc([-.57,1.4,z+side*.075],.07,.025,'chrome');
  rod([-.57,1.4,z],[.43,1.08,side*.4],.045);
  rod([.43,1.08,side*.4],[.58,.95,side*.27],.024,'chrome');
  rod([.58,.95,side*.27],[.58,.95,side*.12],.028,'rubber');
  rod([-.2,1.27,z],[-.2,1.27,side*.71],.025,'chrome');
  for(const offset of [0,.065]){
   const plateZ=side*(.57+offset);
   disc([-.2,1.27,plateZ],.235,.055,'rubber');disc([-.2,1.27,plateZ+side*.03],.045,.008,'chrome');
   for(const angle of [0,Math.PI*2/3,Math.PI*4/3])box([-.2+Math.sin(angle)*.14,1.27+Math.cos(angle)*.14,plateZ+side*.032],[.055,.08,.005],'shell',[0,0,-angle]);
  }
  for(const y of [.39,.73]){
   rod([-.65,y,z],[-.65,y,side*.72],.025,'chrome');disc([-.65,y,side*.62],.17,.05,'rubber');
  }
  rod([-.72,.18,side*.49],[-.57,1.4,z],.043);bolt([-.57,1.4,z+side*.1]);
 }
 box([-.49,1.04,0],[.018,.28,.25],'label');
 box([.67,.13,0],[.24,.09,.46],'rubber');
 return finish() as Record<StrengthFinish,THREE.BufferGeometry>;
}
