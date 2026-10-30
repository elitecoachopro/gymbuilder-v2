'use client';

import { Component, Suspense, useEffect, useMemo, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { equipmentSurface } from '@/lib/gym-surface';
import { EQUIPMENT_FINISH } from '@/lib/gym-pbr-textures';
import { useSurfaceTextures } from './SurfaceMaterials';
import { importedEquipment } from '@/lib/gym-imported-equipment';
import { referenceStrengthSource } from '@/lib/gym-reference-assets';
import { useClientLocale } from '@/i18n/client';

const paintLevels = new WeakMap<THREE.Texture, number>();
function frameColour(material: THREE.MeshStandardMaterial, colour: string) {
 material.color.set(colour);
 if (!material.map) return;
 let level = paintLevels.get(material.map);
 if (level === undefined) {
  try {
   const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
   const ctx = canvas.getContext('2d', {willReadFrequently: true});
   if (!ctx) return;
   ctx.drawImage(material.map.image, 0, 0, 32, 32);
   const pixels = ctx.getImageData(0, 0, 32, 32).data; let total = 0;
   for (let i = 0; i < pixels.length; i += 4) {
    const v = (pixels[i] * .2126 + pixels[i + 1] * .7152 + pixels[i + 2] * .0722) / 255;
    total += v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);
   }
   level = Math.max(.018, total / (pixels.length / 4));
  } catch { level = 1; }
  paintLevels.set(material.map, level);
 }
 material.color.multiplyScalar(1 / level);
 material.color.r = Math.min(2, material.color.r); material.color.g = Math.min(2, material.color.g); material.color.b = Math.min(2, material.color.b);
}

type ImportedEquipment = NonNullable<ReturnType<typeof importedEquipment>>;
interface Props { equipment: ImportedEquipment; frame?: string; upholstery?: string }

function AssetPlaceholder({ equipment, failed = false }: { equipment: ImportedEquipment; failed?: boolean }) {
  const locale = useClientLocale();
  const message = failed ? locale === 'en' ? '3D model unavailable' : 'Model 3D indisponibil' : locale === 'en' ? 'Loading CAD model…' : 'Se încarcă modelul CAD…';
  const label = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 64;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.fillStyle = '#101820'; context.fillRect(0, 0, 512, 64);
    context.fillStyle = '#fff'; context.font = '24px sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(message, 256, 32);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [message]);
  useEffect(() => () => label?.dispose(), [label]);
  return <group>
    <mesh position={[0, 0.15, 0]}><boxGeometry args={[equipment.length_m, 0.3, equipment.width_m]} /><meshBasicMaterial color={failed ? '#d6a36b' : '#748b97'} wireframe /></mesh>
    {label && <sprite position={[0, 0.45, 0]} scale={[2, 0.25, 1]}><spriteMaterial map={label} depthTest={false} /></sprite>}
  </group>;
}
class AssetBoundary extends Component<{ children: ReactNode; equipment: ImportedEquipment }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <AssetPlaceholder equipment={this.props.equipment} failed /> : this.props.children; }
}
function LoadedAsset({ equipment, frame, upholstery }: Props) {
  const { scene } = useGLTF(equipment.asset.url, false, false);
  const source = referenceStrengthSource(scene, equipment.id);
  return <StyledEquipmentAsset scene={source} frame={frame} upholstery={upholstery} />;
}
export function StyledEquipmentAsset({ scene, frame, upholstery }: { scene: THREE.Object3D; frame?: string; upholstery?: string }) {
  const textures = useSurfaceTextures();
  const { instance, ownedMaterials } = useMemo(() => {
    const instance = scene.clone(true);
    const ownedMaterials = new Map<THREE.Material, THREE.MeshStandardMaterial>();
    instance.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = object.receiveShadow = true;
      const recolour = (material: THREE.Material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return material;
        let role = equipmentSurface(material.name);
        const authoredRole = material.userData.gymbuilderSurface;
        if (['paint', 'upholstery', 'rubber', 'steel'].includes(authoredRole)) role = authoredRole;
        if (role === 'original') {
          if (material.userData.gymbuilderFinish === 'frame') role = 'paint';
          else if (material.userData.gymbuilderFinish === 'upholstery') role = 'upholstery';
        }
        if (role === 'original') return material;
        let owned = ownedMaterials.get(material);
        if (!owned) {
          owned = material.clone();
          if (role === 'paint' || role === 'upholstery' || role === 'rubber' || role === 'steel') {
            Object.assign(owned, EQUIPMENT_FINISH[role]);
            owned.roughnessMap = textures?.[role] ?? null;
            owned.bumpMap = material.normalMap ? null : textures?.[role] ?? null;
            if (role === 'paint' && frame) frameColour(owned, frame);
            if (role === 'upholstery') {
              if (upholstery) owned.color.set(upholstery);
              if (textures?.upholsteryNormal) { owned.normalMap = textures.upholsteryNormal; owned.normalScale.set(.18, .18); owned.bumpMap = null; }
            }
          }
          if (role === 'display' && textures && !owned.map) { owned.color.set('#ffffff'); owned.map = textures.display; owned.emissive.set('#ffffff'); owned.emissiveMap = textures.display; owned.emissiveIntensity = 0.35; owned.roughness = 0.35; owned.metalness = 0; }
          if (role === 'control') { owned.roughness = 0.5; owned.metalness = 0; }
          ownedMaterials.set(material, owned);
        }
        return owned;
      };
      object.material = Array.isArray(object.material) ? object.material.map(recolour) : recolour(object.material);
    });
    return { instance, ownedMaterials };
  }, [scene, frame, upholstery, textures]);
  useEffect(() => () => ownedMaterials.forEach(material => material.dispose()), [ownedMaterials]);
  return <primitive object={instance} dispose={null} />;
}
export default function ImportedEquipmentModel(props: Props) {
  return <AssetBoundary key={props.equipment.asset.url} equipment={props.equipment}><Suspense fallback={<AssetPlaceholder equipment={props.equipment} />}><LoadedAsset {...props} /></Suspense></AssetBoundary>;
}
