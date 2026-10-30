'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { loadReferenceNormals } from '@/lib/gym-reference-surfaces';
import { createEquipmentRelief } from '@/lib/gym-pbr-textures';

type Textures = Record<'paint' | 'upholstery' | 'rubber' | 'steel' | 'display' | 'panel' | 'instruction', THREE.Texture> & { strengthInstructions: Map<string, THREE.Texture>; upholsteryNormal?: THREE.Texture | null; rubberNormal?: THREE.Texture | null };
const SurfaceContext = createContext<Textures | null>(null);
export const useSurfaceTextures = () => useContext(SurfaceContext);

function consoleTexture(flipY = false) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle='#07171d';ctx.fillRect(0,0,512,256);
  ctx.fillStyle='#a6c8cb';ctx.font='600 18px sans-serif';ctx.fillText('IMPERIAL GYM',22,31);
  ctx.fillStyle='#5dd0c1';ctx.font='bold 48px sans-serif';ctx.fillText('0.0',22,94);
  ctx.fillStyle='#d5e4e2';ctx.font='30px monospace';ctx.fillText('00:00',288,91);
  ctx.font='14px sans-serif';ctx.fillText('KM / H',24,119);ctx.fillText('TIME',291,119);
  ctx.strokeStyle='#203a44';ctx.lineWidth=1;ctx.strokeRect(22,143,468,64);
  ctx.strokeStyle='#70c9c0';ctx.lineWidth=3;ctx.beginPath();
  for(let i=0;i<16;i++){const x=25+i*30,y=193-Math.sin(i*.6)*12-i*1.5;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
  ctx.fillStyle='#263e48';ctx.fillRect(22,221,468,17);ctx.fillStyle='#b4c9c9';ctx.font='12px sans-serif';ctx.fillText('QUICK START',206,234);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = flipY;
  return texture;
}
function instructionTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#e1e5e2'; ctx.fillRect(0,0,256,256);
  ctx.fillStyle = '#23343d'; ctx.fillRect(0,0,256,44);
  ctx.fillStyle = '#d6bb7c'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('Imperial Gym',16,29);
  ctx.strokeStyle = '#425963'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  for (const x of [65,180]) {
    ctx.beginPath(); ctx.arc(x,83,12,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x,101); ctx.lineTo(x,154); ctx.lineTo(x+25,154); ctx.lineTo(x+25,192);
    ctx.moveTo(x,119); ctx.lineTo(x+28,105); ctx.stroke();
    ctx.fillStyle = '#b9a06b'; ctx.fillRect(x-18,161,45,7);
  }
  ctx.fillStyle = '#52666e'; ctx.font = 'bold 19px sans-serif'; ctx.fillText('01',51,231); ctx.fillText('02',166,231);
  ctx.beginPath(); ctx.moveTo(112,123); ctx.lineTo(140,123); ctx.lineTo(132,115); ctx.moveTo(140,123); ctx.lineTo(132,131); ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
export function SurfaceMaterials({ children }: { children: ReactNode }) {
  const { invalidate } = useThree();
  const [normalMaps, setNormalMaps] = useState<Awaited<ReturnType<typeof loadReferenceNormals>> | null>(null);
  useEffect(() => {
    let active = true;
    void loadReferenceNormals().then(maps => {
      if (!active) { maps.upholsteryNormal?.dispose(); maps.rubberNormal?.dispose(); return; }
      setNormalMaps(maps); invalidate();
    });
    return () => { active = false; };
  }, [invalidate]);
  useEffect(() => () => { normalMaps?.upholsteryNormal?.dispose(); normalMaps?.rubberNormal?.dispose(); }, [normalMaps]);
  const textures = useMemo<Textures>(() => ({ paint: createEquipmentRelief('paint'), upholstery: createEquipmentRelief('upholstery'), rubber: createEquipmentRelief('rubber'), steel: createEquipmentRelief('steel'), display: consoleTexture(), panel: consoleTexture(true), instruction: instructionTexture(), strengthInstructions: new Map<string, THREE.Texture>() }), []);
  useEffect(() => () => Object.values(textures).forEach(value => { if (value instanceof Map) value.forEach(texture => texture.dispose()); else value?.dispose(); }), [textures]);
  const value = useMemo(() => ({...textures, ...normalMaps}), [textures, normalMaps]);
  return <SurfaceContext.Provider value={value}>{children}</SurfaceContext.Provider>;
}
