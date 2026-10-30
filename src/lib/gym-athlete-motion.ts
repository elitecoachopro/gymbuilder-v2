import * as THREE from 'three';

export const SLED_SPEED = .6;
const FREQUENCY = 1, STANCE = .68;
const v = (x:number,y:number,z:number) => new THREE.Vector3(x,y,z);
function worldQuaternion(object:THREE.Object3D,value:THREE.Quaternion){
 const parent=object.parent!.getWorldQuaternion(new THREE.Quaternion()).invert();
 object.quaternion.copy(parent.multiply(value));object.updateWorldMatrix(false,true);
}
function worldPosition(object:THREE.Object3D,value:THREE.Vector3){
 object.position.copy(object.parent!.worldToLocal(value.clone()));object.updateWorldMatrix(false,true);
}
function aim(object:THREE.Object3D,end:THREE.Object3D,target:THREE.Vector3){
 const origin=object.getWorldPosition(new THREE.Vector3());
 const current=end.getWorldPosition(new THREE.Vector3()).sub(origin).normalize();
 const desired=target.clone().sub(origin).normalize();
 const rotation=new THREE.Quaternion().setFromUnitVectors(current,desired).multiply(object.getWorldQuaternion(new THREE.Quaternion()));
 worldQuaternion(object,rotation);
}
function solveLimb(upper:THREE.Object3D,lower:THREE.Object3D,end:THREE.Object3D,target:THREE.Vector3,pole:THREE.Vector3){
 const a=upper.getWorldPosition(new THREE.Vector3()),b=lower.getWorldPosition(new THREE.Vector3()),c=end.getWorldPosition(new THREE.Vector3());
 const l1=a.distanceTo(b),l2=b.distanceTo(c),delta=target.clone().sub(a),distance=Math.min(l1+l2-.0001,Math.max(Math.abs(l1-l2)+.0001,delta.length()));
 const direction=delta.normalize(),along=(l1*l1-l2*l2+distance*distance)/(2*distance);
 const bend=pole.clone().sub(a);bend.addScaledVector(direction,-bend.dot(direction)).normalize();
 const joint=a.clone().addScaledVector(direction,along).addScaledVector(bend,Math.sqrt(Math.max(0,l1*l1-along*along)));
 aim(upper,lower,joint);aim(lower,end,target);
}
export function createSledRigPose(scene:THREE.Object3D){
 const bone=(name:string)=>{const found=scene.getObjectByName(name);if(!found)throw Error('Missing athlete joint: '+name);return found;};
 scene.updateWorldMatrix(true,true);
 const pelvis=bone('pelvis'),spine=bone('spine_02'),head=bone('head');
 const names=['pelvis','spine_02','head','upperarm_l','lowerarm_l','upperarm_r','lowerarm_r','thigh_l','calf_l','thigh_r','calf_r','foot_l','foot_r'];
 const fingerNames=['l','r'].flatMap(side=>['index','middle','ring','pinky'].flatMap(finger=>['01','02','03'].map(joint=>finger+'_'+joint+'_'+side)).concat('thumb_02_'+side));
 const fingers=fingerNames.map(bone);
 const rest=[...names,...fingerNames].map(name=>{const object=bone(name);return{object,p:object.position.clone(),q:object.quaternion.clone()};});
 const feet=['l','r'].map(side=>{
  const foot=bone('foot_'+side),calf=bone('calf_'+side),end=new THREE.Object3D();
  end.position.copy(calf.worldToLocal(foot.getWorldPosition(new THREE.Vector3())));calf.add(end);
  const q=scene.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(foot.getWorldQuaternion(new THREE.Quaternion()));
  return{side,foot,calf,end,q,thigh:bone('thigh_'+side),upperarm:bone('upperarm_'+side),lowerarm:bone('lowerarm_'+side),hand:bone('hand_'+side)};
 });
 return(time:number)=>{
  for(const r of rest){r.object.position.copy(r.p);r.object.quaternion.copy(r.q);}
  scene.updateWorldMatrix(true,true);
  const phase=((time*FREQUENCY)%1+1)%1,bob=.004*(1-Math.cos(phase*Math.PI*4));
  const originQ=scene.getWorldQuaternion(new THREE.Quaternion());
  const tilt=(object:THREE.Object3D,angle:number)=>{
   const axis=v(1,0,0).applyQuaternion(originQ);
   worldQuaternion(object,new THREE.Quaternion().setFromAxisAngle(axis,angle).multiply(object.getWorldQuaternion(new THREE.Quaternion())));
  };
  worldPosition(pelvis,scene.localToWorld(v(0,.84+bob,-.04)));tilt(pelvis,1.02);tilt(spine,.04);tilt(head,-.32);
  for(const {side,foot,calf,end,q,thigh,upperarm,lowerarm,hand} of feet){
   const sign=side==='l'?1:-1,u=(phase+(side==='r'?.5:0))%1;
   const swing=Math.max(0,(u-STANCE)/(1-STANCE));
   const stride=SLED_SPEED*STANCE/FREQUENCY;
   const z=u<STANCE?.03-stride*u/STANCE:.03-stride+stride*(swing*swing*(3-2*swing));
   const lift=.15*Math.sin(swing*Math.PI),target=scene.localToWorld(v(sign*.17,.075+lift,z));
   solveLimb(thigh,calf,end,target,scene.localToWorld(v(sign*.18,.45,.55)));
   worldPosition(foot,target);worldQuaternion(foot,originQ.clone().multiply(q));
   solveLimb(upperarm,lowerarm,hand,scene.localToWorld(v(sign*.34,1.08,.8)),scene.localToWorld(v(sign*.48,1.1,.48)));
  }
  for(const finger of fingers){
   const angle=finger.name.startsWith('thumb')?.7:finger.name.includes('_01_')?.65:finger.name.includes('_02_')?1.1:.9;
   finger.rotateX(angle);
  }
  scene.updateWorldMatrix(false,true);
 };
}
