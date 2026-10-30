import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createSledRigPose,SLED_SPEED} from '../../src/lib/gym-athlete-motion.ts';
function rig(){
 const b=fs.readFileSync(new URL('../../public/models/people/athlete.glb',import.meta.url));
 const g=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));
 const nodes=g.nodes.map(n=>{const o=new THREE.Object3D();o.name=n.name??'';if(n.matrix)o.applyMatrix4(new THREE.Matrix4().fromArray(n.matrix));else{if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);if(n.scale)o.scale.fromArray(n.scale);}return o;});
 g.nodes.forEach((n,i)=>n.children?.forEach(c=>nodes[i].add(nodes[c])));
 const scene=new THREE.Group();g.scenes[g.scene??0].nodes.forEach(i=>scene.add(nodes[i]));return scene;
}
test('textured sled athlete keeps hands on handles and alternates planted feet without sliding',()=>{
 const scene=rig(),pose=createSledRigPose(scene),point=name=>scene.getObjectByName(name).getWorldPosition(new THREE.Vector3());
 let lastFoot;
 for(const t of [0,.05,.1,.15]){
  pose(t);const hand=point('hand_l');assert.ok(hand.distanceTo(new THREE.Vector3(.34,1.08,.8))<.035,'hand contact');
  const foot=point('foot_l');assert.ok(Math.abs(foot.y-.075)<.002,'stance foot planted');
  const globalZ=foot.z+t*SLED_SPEED;if(lastFoot!==undefined)assert.ok(Math.abs(globalZ-lastFoot)<.002,'world foot does not skate');lastFoot=globalZ;
 }
 pose(0);
 const hip=point('pelvis'), shoulder=point('upperarm_l');
 assert.ok((shoulder.z-hip.z)/(shoulder.y-hip.y)>1.2,'strong forward drive instead of upright walker posture');
 assert.ok(Math.abs(point('foot_l').z-point('foot_r').z)>.25,'staggered drive stance');
 pose(.8);assert.ok(point('foot_l').y>.09,'swing foot clears turf');
 pose(0);const first=point('head').toArray();pose(1);assert.deepEqual(point('head').toArray(),first,'seamless cycle');
 const parent=new THREE.Group();parent.position.set(12,3.9,7);parent.rotation.y=.6;parent.add(scene);pose(.2);
 assert.ok(point('head').toArray().every(Number.isFinite));
});
