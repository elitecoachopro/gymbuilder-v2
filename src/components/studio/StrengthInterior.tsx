'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { GymSpace } from '@/lib/gym-space';
import { buildStrengthInterior, strengthAccentWall } from '@/lib/gym-strength-interior';
import { INTERIOR_PALETTES } from '@/lib/gym-interior';
import type { InteriorStyle } from '@/lib/gym-visualization';

function AccentWall({ wall, height, style }: { wall: NonNullable<ReturnType<typeof strengthAccentWall>>; height: number; style: InteriorStyle }) {
  const palette = INTERIOR_PALETTES[style];
  const geometry = useMemo(()=>buildStrengthInterior(wall.length,height),[wall.length,height]);
  const materials = useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
    const ctx=canvas.getContext('2d')!;
    ctx.fillStyle='#202525';ctx.fillRect(0,0,1024,256);
    ctx.fillStyle='#e4cf9c';ctx.textAlign='center';ctx.font='500 83px sans-serif';ctx.fillText('IMPERIAL GYM',512,125);
    ctx.fillStyle='#b4bcb8';ctx.font='25px sans-serif';ctx.fillText('S T R E N G T H   &   P E R F O R M A N C E',512,191);
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
    return {
      frame:new THREE.MeshStandardMaterial({color:palette.panel,roughness:.92}),
      shell:new THREE.MeshStandardMaterial({color:palette.slats,roughness:.75,metalness:style === 'industrial' ? .5 : 0}),
      rubber:new THREE.MeshStandardMaterial({color:'#141a1b',roughness:.83}),
      accent:new THREE.MeshBasicMaterial({color:palette.light,toneMapped:false}),
      label:new THREE.MeshStandardMaterial({map,roughness:.8,emissive:'#dcc69b',emissiveMap:map,emissiveIntensity:.16}),
    };
  },[palette,style]);
  useEffect(()=>()=>Object.values(geometry).forEach(g=>g.dispose()),[geometry]);
  useEffect(()=>()=>{materials.label.map?.dispose();Object.values(materials).forEach(m=>m.dispose());},[materials]);
  return <group position={[wall.x,0,wall.z]} rotation={[0,wall.rotation,0]}>
    <pointLight position={[0,Math.min(height-.35,3.1),2.8]} color={palette.light} intensity={16} distance={12} decay={2}/>
    <group position={[-wall.length/2,0,0]}>{Object.entries(geometry).map(([key,g])=><mesh key={key} geometry={g} material={materials[key as keyof typeof materials]} raycast={()=>{}} dispose={null}/>)}</group>
  </group>;
}
export default function StrengthInterior({space,height}:{space:GymSpace;height:number}) {
  const wall=useMemo(()=>strengthAccentWall(space),[space]);
  return wall ? <AccentWall wall={wall} height={height} style={space.visualization?.interiorStyle ?? 'warm'}/> : null;
}
