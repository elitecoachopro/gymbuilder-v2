'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createPersonGeometry,
  type PersonPose,
  type PersonSurface,
} from '@/lib/gym-people-geometry';
import { Part, Rod, Wheel } from './EquipmentParts';
import DetailedPerson from './DetailedPerson';
import DetailedAthlete from './DetailedAthlete';

function ProceduralPerson({
  pose = 'coach',
  gait = 0,
}: {
  pose?: PersonPose;
  gait?: number;
}) {
  const geometry = useMemo(() => {
    const base = createPersonGeometry(pose);
    if (pose === 'push') {
      const alternate = createPersonGeometry(pose, true);
      for (const key of Object.keys(base) as PersonSurface[]) {
        base[key]!.morphAttributes.position = [alternate[key]!.getAttribute('position')];
        base[key]!.morphAttributes.normal = [alternate[key]!.getAttribute('normal')];
        alternate[key]!.dispose();
      }
    }
    return base;
  }, [pose]);
  const meshes = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  useEffect(() => {
    meshes.current?.traverse((object) => {
      if (object instanceof THREE.Mesh && object.morphTargetInfluences)
        object.morphTargetInfluences[0] = gait;
    });
    invalidate();
  }, [gait, invalidate]);
  const materials = useMemo(() => {
    const colours = {
      skin: '#ffffff',
      shirt: pose === 'push' ? '#934338' : pose === 'reception' ? '#243a4c' : '#263536',
      trousers: '#243039',
      hair: '#302821',
      shoes: '#242729',
      eyes: '#252628',
      trim: '#b5bdc0',
    };
    return Object.fromEntries(
      Object.entries(colours).map(([key, color]) => [
        key,
        new THREE.MeshStandardMaterial({ color, vertexColors: key === 'skin', roughness: key === 'skin' ? 0.64 : 0.9 }),
      ])
    ) as Record<PersonSurface, THREE.MeshStandardMaterial>;
  }, [pose]);
  useEffect(
    () => () => {
      Object.values(geometry).forEach((g) => g.dispose());
      Object.values(materials).forEach((m) => m.dispose());
    },
    [geometry, materials]
  );
  const scale = pose === 'coach' ? 1.01 : pose === 'reception' ? 0.94 : 1;
  return (
    <group ref={meshes} scale={scale}>
      {(Object.keys(geometry) as PersonSurface[]).map((key) => (
        <mesh key={key} args={[geometry[key], materials[key]]} dispose={null} />
      ))}
    </group>
  );
}
export function FictionalPerson({pose='coach',gait=0,time=0}:{pose?:PersonPose;gait?:number;time?:number}) {
  const fallback=<ProceduralPerson pose={pose} gait={gait}/>;
  return pose==='push'?<DetailedAthlete time={time} fallback={fallback}/>:<DetailedPerson pose={pose} fallback={fallback}/>;
}
export function SledTraining({ time = 0 }: { time?: number }) {
  return (
    <group position={[0, 0, 0.74]}>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Part p={[side * 0.43, 0.075, 0]} s={[0.1, 0.12, 1.2]} finish="rubber" />
          <Rod a={[side * 0.43, 0.15, -0.52]} b={[side * 0.43, 0.15, 0.52]} radius={0.035} />
          <Rod a={[side * 0.34, 0.15, -0.4]} b={[side * 0.34, 1.1, -0.4]} radius={0.026} />
          <Rod
            a={[side * 0.34, 0.95, -0.4]}
            b={[side * 0.34, 1.13, -0.4]}
            radius={0.031}
            finish="rubber"
          />
        </group>
      ))}
      <Part p={[0, 0.14, 0]} s={[0.9, 0.07, 0.62]} />
      <Rod a={[0, 0.16, 0.12]} b={[0, 0.78, 0.12]} radius={0.025} finish="chrome" />
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[0, 0.22 + i * 0.065, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <Wheel p={[0, 0, 0]} radius={0.225} depth={0.055} finish="rubber" hub={false} />
        </group>
      ))}
      <group position={[0, 0, -1.3]}>
        <FictionalPerson pose="push" time={time} gait={(Math.sin(time*Math.PI*2.2)+1)/2} />
      </group>
    </group>
  );
}
