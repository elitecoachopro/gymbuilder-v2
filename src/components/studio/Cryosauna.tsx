'use client';

import * as THREE from 'three';
import { Part, Rod } from './EquipmentParts';

export default function Cryosauna() {
  return <group>
    <mesh position={[0, 1.05, 0]} rotation={[0, -0.4, 0]}>
      <cylinderGeometry args={[0.65, 0.62, 2.1, 32, 1, true, 0, Math.PI * 1.7]} />
      <meshStandardMaterial color="#d5dfe1" metalness={0.5} roughness={0.3} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.65, 0.65, 0.2, 32]} /><meshStandardMaterial color="#28373e" /></mesh>
    <mesh position={[0, 2.1, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.62, 0.045, 8, 32]} /><meshStandardMaterial color="#4a929d" emissive="#397e8b" emissiveIntensity={0.4} /></mesh>
    <Part p={[0.52, 1.4, 0.46]} s={[0.26, 0.4, 0.07]} finish="shell" />
    <Part p={[0.52, 1.43, 0.501]} s={[0.2, 0.25, 0.01]} finish="screen" />
    <Rod a={[-0.43, 0.6, 0.49]} b={[-0.43, 1.6, 0.49]} radius={0.025} finish="chrome" />
  </group>;
}
