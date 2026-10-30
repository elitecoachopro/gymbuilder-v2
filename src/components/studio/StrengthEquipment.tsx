'use client';

import * as THREE from 'three';
import { STRENGTH_VARIANTS } from '@/lib/gym-strength-catalog';
import { useEffect, useMemo } from 'react';
import { buildStrengthModel, type StrengthModel, type StrengthFinish } from '@/lib/gym-strength-model';
import { useEquipmentMaterials } from './EquipmentParts';
import { useSurfaceTextures } from './SurfaceMaterials';

export default function StrengthEquipment({ type }: { type: StrengthModel }) {
  const materials = useEquipmentMaterials();
  const surfaces = useSurfaceTextures()!;
  const instruction = useMemo(() => {
    let texture = surfaces.strengthInstructions.get(type);
    if (!texture) {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
      const ctx = canvas.getContext('2d')!; ctx.scale(2,2);
      const title = STRENGTH_VARIANTS.find(model => model.id === type)?.en ?? ({aparat_piept:'Chest press',aparat_lat:'Lat pulldown',aparat_picioare:'Leg press'} as Record<string,string>)[type];
      ctx.fillStyle='#e5e8e2';ctx.fillRect(0,0,256,256);ctx.fillStyle='#192a34';ctx.fillRect(0,0,256,44);
      ctx.fillStyle='#d8bf86';ctx.font='bold 20px sans-serif';ctx.fillText('IMPERIAL GYM',15,29);
      ctx.fillStyle='#243b45';ctx.font='bold 21px sans-serif';
      const words=title.split(' ');let line='',row=76;
      for(const word of words){const next=line ? line+' '+word:word;if(ctx.measureText(next).width>224&&line){ctx.fillText(line,16,row);row+=26;line=word;}else line=next;}
      ctx.fillText(line,16,row);ctx.fillStyle='#788b8f';ctx.fillRect(16,143,224,2);
      ctx.font='17px sans-serif';['01  SET POSITION','02  SELECT LOAD','03  CONTROL MOTION'].forEach((text,i)=>ctx.fillText(text,16,174+i*29));
      texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
      surfaces.strengthInstructions.set(type,texture);
    }
    const material=materials.label.clone();material.map=texture;
    return {material};
  },[type,materials.label,surfaces]);
  useEffect(()=>()=>{instruction.material.dispose();},[instruction]);
  const geometry = useMemo(() => buildStrengthModel(type), [type]);
  useEffect(() => () => Object.values(geometry).forEach(surface => surface.dispose()), [geometry]);
  return <group>{(Object.keys(geometry) as StrengthFinish[]).map(finish => <mesh key={finish} geometry={geometry[finish]} material={finish === 'label' ? instruction.material : materials[finish]} castShadow receiveShadow dispose={null} />)}</group>;
}
