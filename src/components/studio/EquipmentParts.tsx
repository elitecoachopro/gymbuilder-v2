'use client';

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import { useSurfaceTextures } from './SurfaceMaterials';
import { EQUIPMENT_FINISH } from '@/lib/gym-pbr-textures';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type Vector = [number, number, number];
type Finish = 'frame' | 'chrome' | 'rubber' | 'pad' | 'accent' | 'shell' | 'screen' | 'light' | 'wood' | 'ceramic' | 'glass' | 'label';
type Materials = Record<Finish, THREE.MeshStandardMaterial>;
const MaterialsContext = createContext<Materials | null>(null);
const rounded = new RoundedBoxGeometry(1, 1, 1, 2, 0.08);
const cube = new THREE.BoxGeometry(1, 1, 1);
const cylinder = new THREE.CylinderGeometry(1, 1, 1, 20);
const sphere = new THREE.SphereGeometry(1, 12, 8);

export function EquipmentMaterials({ frame, upholstery, children }: { frame: string; upholstery: string; children: ReactNode }) {
  const textures = useSurfaceTextures();
  const materials = useMemo<Materials>(() => ({
    label: new THREE.MeshStandardMaterial({ color: '#ffffff', map: textures?.instruction, roughness: 0.8 }),
    frame: new THREE.MeshStandardMaterial({ color: frame, ...EQUIPMENT_FINISH.paint, roughnessMap: textures?.paint, bumpMap: textures?.paint }),
    chrome: new THREE.MeshStandardMaterial({ color: '#cad3db', ...EQUIPMENT_FINISH.steel, roughnessMap: textures?.steel, bumpMap: textures?.steel }),
    rubber: new THREE.MeshStandardMaterial({ color: '#141a21', ...EQUIPMENT_FINISH.rubber, roughnessMap: textures?.rubber, bumpMap: textures?.rubber }),
    pad: new THREE.MeshStandardMaterial({ color: upholstery, ...EQUIPMENT_FINISH.upholstery, roughnessMap: textures?.upholstery, bumpMap: textures?.upholsteryNormal ? null : textures?.upholstery, normalMap: textures?.upholsteryNormal ?? null, normalScale: new THREE.Vector2(.18, .18) }),
    accent: new THREE.MeshStandardMaterial({ color: '#c2a365', roughness: 0.35, metalness: 0.65 }),
    shell: new THREE.MeshStandardMaterial({ color: '#303c46', roughness: 0.42, metalness: 0.3 }),
    screen: new THREE.MeshStandardMaterial({ color: '#ffffff', map: textures?.panel, emissive: '#ffffff', emissiveMap: textures?.panel, emissiveIntensity: 0.35, roughness: 0.3 }),
    light: new THREE.MeshStandardMaterial({ color: '#a7e8ea', emissive: '#61b8c5', emissiveIntensity: 0.6 }),
    wood: new THREE.MeshStandardMaterial({ color: '#aa8157', roughness: 0.65 }),
    ceramic: new THREE.MeshStandardMaterial({ color: '#e7e9e3', roughness: 0.22 }),
    glass: new THREE.MeshStandardMaterial({ color: '#b8d9df', transparent: true, opacity: 0.22, depthWrite: false, roughness: 0.12, metalness: 0.15 }),
  }), [frame, upholstery, textures]);
  useEffect(() => () => Object.values(materials).forEach(material => material.dispose()), [materials]);
  return <MaterialsContext.Provider value={materials}>{children}</MaterialsContext.Provider>;
}
export function useEquipmentMaterials() { return useContext(MaterialsContext)!; }
function useMaterial(finish: Finish) { return useEquipmentMaterials()[finish]; }

export function Part({ p, s, finish = 'frame', r = [0, 0, 0], sharp = false }: { p: Vector; s: Vector; finish?: Finish; r?: Vector; sharp?: boolean }) {
  return <mesh geometry={sharp ? cube : rounded} material={useMaterial(finish)} position={p} scale={s} rotation={r} castShadow receiveShadow dispose={null} />;
}
export function Rod({ a, b, radius = 0.025, finish = 'frame' }: { a: Vector; b: Vector; radius?: number; finish?: Finish }) {
  const transform = useMemo(() => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
    return { p: start.add(end).multiplyScalar(0.5), length: delta.length(), q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()) };
  }, [a, b]);
  return <mesh geometry={cylinder} material={useMaterial(finish)} position={transform.p} quaternion={transform.q} scale={[radius, transform.length, radius]} castShadow dispose={null} />;
}
export function Wheel({ p, radius, depth = 0.055, finish = 'rubber', axis = 'z', hub = true }: { p: Vector; radius: number; depth?: number; finish?: Finish; axis?: 'x' | 'z'; hub?: boolean }) {
  const material = useMaterial(finish), chrome = useMaterial('chrome');
  return <group position={p} rotation={axis === 'x' ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]}>
    <mesh geometry={cylinder} material={material} scale={[radius, depth, radius]} castShadow dispose={null} />
    {hub && [-1, 1].map(side => <mesh key={side} geometry={cylinder} material={chrome} position={[0, side * (depth / 2 + 0.002), 0]} scale={[radius * 0.17, 0.008, radius * 0.17]} dispose={null} />)}
  </group>;
}
export function Ball({ p, s, finish = 'rubber' }: { p: Vector; s: Vector; finish?: Finish }) {
  return <mesh geometry={sphere} material={useMaterial(finish)} position={p} scale={s} castShadow dispose={null} />;
}
export function Foot({ x, z, width = 0.5 }: { x: number; z: number; width?: number }) {
  return <><Part p={[x, 0.055, z]} s={[0.1, 0.075, width]} />{[-1, 1].map(side => <Part key={side} p={[x, 0.025, z + side * (width / 2 - 0.045)]} s={[0.15, 0.05, 0.1]} finish="rubber" />)}</>;
}
export function Pad({ p, s, r }: { p: Vector; s: Vector; r?: Vector }) {
  return <group position={p} rotation={r}><Part p={[0, -s[1] * 0.16, 0]} s={s} finish="rubber" /><Part p={[0, s[1] * 0.13, 0]} s={[s[0] * 0.97, s[1] * 0.82, s[2] * 0.96]} finish="pad" /></group>;
}
