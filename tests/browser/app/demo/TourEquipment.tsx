'use client';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import EquipmentModel from '../../../../src/components/studio/EquipmentModel';
import { Part, Rod, Wheel } from '../../../../src/components/studio/EquipmentParts';
import { EQUIPMENT_CATALOG } from '../../../../src/lib/gym-catalog';

export function TourSign({text,width=2.7}:{text:string;width?:number}){
 const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=1024;c.height=160;const ctx=c.getContext('2d')!;ctx.fillStyle='#14232b';ctx.fillRect(0,0,1024,160);ctx.strokeStyle='#b99d64';ctx.lineWidth=6;ctx.strokeRect(8,8,1008,144);ctx.fillStyle='#e6d1a2';ctx.font='600 54px sans-serif';ctx.textAlign='center';ctx.fillText(text,512,102,970);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;},[text]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <mesh><planeGeometry args={[width,width/6.4]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>;
}
function Stepmill(){return <group>
 <Part p={[0,0.5,0]} s={[1.35,1,0.85]} finish="shell" r={[0,0,-0.12]}/>
 {[0,1,2,3,4].map(i=><group key={i}><Part p={[0.55-i*0.23,0.18+i*0.21,0]} s={[0.26,0.12,0.76]} finish="rubber"/>{[-0.22,0,0.22].map(z=><Part key={z} p={[0.55-i*0.23,0.245+i*0.21,z]} s={[0.2,0.008,0.016]} finish="chrome"/>)}</group>)}
 {[-1,1].map(s=><group key={s}><Rod a={[-0.52,0.45,s*0.43]} b={[-0.52,1.9,s*0.43]} radius={0.035}/><Rod a={[-0.52,1.9,s*0.43]} b={[0.45,1.05,s*0.43]} radius={0.032} finish="rubber"/></group>)}
 <Part p={[-0.54,1.92,0]} s={[0.16,0.35,0.68]} finish="shell"/><Part p={[-0.45,1.96,0]} s={[0.01,0.23,0.43]} finish="screen"/>
 </group>;}
function Cryosauna(){return <group>
 <mesh position={[0,1.05,0]} rotation={[0,-0.4,0]}><cylinderGeometry args={[0.65,0.62,2.1,32,1,true,0,Math.PI*1.7]}/><meshStandardMaterial color="#d5dfe1" metalness={0.5} roughness={0.3} side={THREE.DoubleSide}/></mesh>
 <mesh position={[0,0.1,0]}><cylinderGeometry args={[0.65,0.65,0.2,32]}/><meshStandardMaterial color="#28373e"/></mesh>
 <mesh position={[0,2.1,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[0.62,0.045,8,32]}/><meshStandardMaterial color="#4a929d" emissive="#397e8b" emissiveIntensity={0.4}/></mesh>
 <Part p={[0.52,1.4,0.46]} s={[0.26,0.4,0.07]} finish="shell"/><Part p={[0.52,1.43,0.501]} s={[0.2,0.25,0.01]} finish="screen"/>
 <Rod a={[-0.43,0.6,0.49]} b={[-0.43,1.6,0.49]} radius={0.025} finish="chrome"/>
 <group position={[0,1.15,0.64]}><TourSign text="CRIOSAUNĂ" width={1.03}/></group>
 </group>;}
export default function TourEquipment({model}:{model:string}){
 if(model==='sauna')return <group><EquipmentModel templateId="sauna" frame="#27343c" upholstery="#916b45"/>
  {Array.from({length:13},(_,i)=><group key={i}><Part p={[-0.86+i*0.14,1.03,-0.909]} s={[0.125,1.95,0.015]} finish="wood"/><Part p={[-0.915,1.03,-0.84+i*0.14]} s={[0.015,1.95,0.125]} finish="wood"/></group>)}
  <Part p={[0.6,0.35,0.35]} s={[0.38,0.55,0.38]} finish="shell"/>{[-0.1,0,0.1].map(x=><Wheel key={x} p={[0.6+x,0.64,0.35]} radius={0.07} depth={0.12} finish="chrome"/>)}
  <Rod a={[0.23,0.8,0.99]} b={[0.23,1.3,0.99]} radius={0.018} finish="chrome"/>
  <group position={[0,1.95,1.01]}><TourSign text="SAUNĂ" width={1.2}/></group>
 </group>;
 if(EQUIPMENT_CATALOG.some(t=>t.id===model))return <EquipmentModel templateId={model} frame="#27343c" upholstery="#916b45"/>;
 if(model==='stepmill')return <Stepmill/>;
 if(model==='cryosauna')return <Cryosauna/>;
 if(model==='plant')return <group><Part p={[0,0.23,0]} s={[0.36,0.46,0.36]} finish="ceramic"/>{[-1,0,1].map(i=><mesh key={i} position={[i*0.12,0.8+Math.abs(i)*0.12,0]} rotation={[0,0,i*0.3]}><sphereGeometry args={[0.22,8,8]}/><meshStandardMaterial color="#47634c"/></mesh>)}</group>;
 if(model==='aerobic_stage')return <group><Part p={[0,0.12,0]} s={[3.4,0.24,1.2]} finish="wood"/><Part p={[0,0.25,0]} s={[3.3,0.02,1.1]} finish="rubber"/>{[-1,1].map(s=><Part key={s} p={[s*1.8,0.5,0]} s={[0.3,0.75,0.3]} finish="shell"/>)}</group>;
 if(model==='step_stack')return <group>{[0,1,2,3].map(i=><Part key={i} p={[0,0.12+i*0.17,0]} s={[0.85,0.16,0.4]} finish={i%2?'rubber':'accent'}/>)}{[-0.4,0.4].map(z=><Wheel key={z} p={[0.6,0.25,z]} radius={0.15} depth={0.05}/>)}</group>;
 return null;
}
