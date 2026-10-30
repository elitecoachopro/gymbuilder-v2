import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type EquipmentFinish = 'frame' | 'chrome' | 'rubber' | 'pad' | 'accent' | 'shell' | 'label' | 'screen';
export type EquipmentSurfaces = Partial<Record<EquipmentFinish, THREE.BufferGeometry>>;
export type ModelPoint = [number,number,number];

export function createEquipmentAssembly() {
  const parts: Partial<Record<EquipmentFinish,THREE.BufferGeometry[]>> = {};
  const rounded = new RoundedBoxGeometry(1,1,1,1,0.09);
  const cylinderSource = new THREE.CylinderGeometry(1,1,1,16), boltSource = new THREE.CylinderGeometry(1,1,1,6);
  const cylinder=cylinderSource.toNonIndexed(), fastener=boltSource.toNonIndexed();
  cylinderSource.dispose(); boltSource.dispose();
  const transform = new THREE.Object3D();
  function add(source: THREE.BufferGeometry,p: ModelPoint,scale: ModelPoint,finish: EquipmentFinish,rotation: ModelPoint=[0,0,0]) {
    transform.position.set(...p); transform.rotation.set(...rotation); transform.scale.set(...scale); transform.updateMatrix();
    (parts[finish]??=[]).push(source.clone().applyMatrix4(transform.matrix));
  }
  const box=(p: ModelPoint,scale: ModelPoint,finish: EquipmentFinish='frame',rotation?: ModelPoint)=>add(rounded,p,scale,finish,rotation);
  function rod(a: ModelPoint,b: ModelPoint,radius: number,finish: EquipmentFinish='frame') {
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),direction=end.clone().sub(start);
    transform.position.copy(start).add(end).multiplyScalar(0.5); transform.rotation.set(0,0,0);
    transform.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize()); transform.scale.set(radius,direction.length(),radius); transform.updateMatrix();
    (parts[finish]??=[]).push(cylinder.clone().applyMatrix4(transform.matrix));
  }
  const disc=(p: ModelPoint,radius: number,depth: number,finish: EquipmentFinish='shell')=>add(cylinder,p,[radius,depth,radius],finish,[Math.PI/2,0,0]);
  const bolt=(p: ModelPoint)=>add(fastener,p,[0.012,0.01,0.012],'chrome',[Math.PI/2,0,0]);
  function finish(): EquipmentSurfaces {
    const result: EquipmentSurfaces={};
    for(const key of Object.keys(parts) as EquipmentFinish[]) {
      const pieces=parts[key]!;
      result[key]=mergeGeometries(pieces,false)!; pieces.forEach(g=>g.dispose());
    }
    rounded.dispose(); cylinder.dispose(); fastener.dispose();
    return result;
  }
  return {add,box,rod,disc,bolt,finish};
}
