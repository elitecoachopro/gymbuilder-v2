'use client';
import DetailedPerson from '../../../../src/components/studio/DetailedPerson';
import {FictionalPerson} from '../../../../src/components/studio/FitnessPeople';
import EquipmentModel from '../../../../src/components/studio/EquipmentModel';
import {Part} from '../../../../src/components/studio/EquipmentParts';
import {TourSign} from './TourEquipment';
import TourEquipment from './TourEquipment';
import {demoClassesSpace} from '../../../../src/lib/gym-classes-floor';

export const classesFloor=demoClassesSpace();
export default function ClassesFloor(){
 return <group>
  {classesFloor.items.map(item=><group key={item.id} position={[item.x,.025,item.y]} rotation={[0,-item.rotation*Math.PI/180,0]}><EquipmentModel templateId={item.templateId} frame={classesFloor.finishes.frame} upholstery={classesFloor.finishes.upholstery}/></group>)}
  {[[4.7,.4,'AEROBIC'],[4.7,7.65,'ZUMBA'],[13.1,.35,'COPII · MIȘCARE'],[15.2,7.65,'CROSSFIT']].map(([x,z,label])=><group key={label} position={[Number(x),2.7,Number(z)]}><TourSign text={String(label)} width={3.5}/></group>)}
  <group position={[4.7,0,1]}><TourEquipment model="aerobic_stage"/><group position={[0,.27,0]}><FictionalPerson pose="coach"/></group></group>
  <group position={[4.7,0,8.35]}><TourEquipment model="aerobic_stage"/><group position={[0,.27,0]}><FictionalPerson pose="coach"/></group></group>
  {[2,4.5,7].map(x=><group key={x} position={[x,.025,6.5]}><TourEquipment model="step_stack"/></group>)}
  <group position={[12,0,2.4]} rotation={[0,1.2,0]}><FictionalPerson pose="coach"/></group>
  {[12.8,14.7].map(x=><group key={x} position={[x,.025,3.2]} rotation={[0,.1,0]}><DetailedPerson pose="child" fallback={<group scale={.72}><FictionalPerson pose="coach"/></group>}/></group>)}
  {['#5399bc','#e4b84e','#d77969','#72a89a'].map((colour,i)=><group key={colour} position={[11.8+i*1.05,.02,5.4]}>
   <mesh position={[0,.12,0]}><boxGeometry args={[.65,.24,.65]}/><meshStandardMaterial color={colour} roughness={.9}/></mesh>
   <mesh position={[0,.31,0]}><cylinderGeometry args={[.1,.22,.17,16]}/><meshStandardMaterial color={colour} roughness={.9}/></mesh>
  </group>)}
  <Part p={[13.8,.7,1.05]} s={[3.4,1.4,.45]} finish="wood"/>
  {Array.from({length:6},(_,i)=><Part key={i} p={[12.4+i*.55,.95,1.3]} s={[.48,.65,.02]} finish={i%2?'accent':'shell'}/>)}
  <group position={[17.3,0,10.5]} rotation={[0,-.6,0]}><FictionalPerson pose="coach"/></group>
  <Part p={[18.9,.15,10]} s={[.65,.3,2.1]} finish="rubber"/>
  {[9.3,9.7,10.1,10.5].map(z=><mesh key={z} position={[18.9,.4,z]}><sphereGeometry args={[.18,12,8]}/><meshStandardMaterial color="#597e84" roughness={.9}/></mesh>)}
 </group>;
}
