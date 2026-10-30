'use client';
import { useEffect, useMemo } from 'react';
import { buildCardioModel, type CardioModel } from '@/lib/gym-cardio-model';
import type { EquipmentFinish } from '@/lib/gym-model-assembly';
import { useEquipmentMaterials } from './EquipmentParts';

export default function CardioEquipment({ type }: { type: CardioModel }) {
 const materials=useEquipmentMaterials();
 const surfaces=useMemo(()=>buildCardioModel(type),[type]);
 useEffect(()=>()=>Object.values(surfaces).forEach(surface=>surface.dispose()),[surfaces]);
 return <group>{Object.entries(surfaces).map(([finish,geometry])=><mesh key={finish} geometry={geometry} material={materials[finish as EquipmentFinish]} castShadow receiveShadow dispose={null} />)}</group>;
}
