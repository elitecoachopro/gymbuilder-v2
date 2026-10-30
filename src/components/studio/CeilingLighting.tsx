'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { roomShape } from '@/lib/gym-room-shape';
import type { GymSpace } from '@/lib/gym-space';
import { buildCeilingFixtures, ceilingFixtures, INTERIOR_PALETTES } from '@/lib/gym-interior';

export default function CeilingLighting({ space, height }: { space: GymSpace; height: number }) {
  const style = space.visualization?.interiorStyle ?? 'minimal';
  const palette = INTERIOR_PALETTES[style];
  const { outline, columns, walls, stairwell } = space;
  const positions = useMemo(() => ceilingFixtures({ outline, columns, walls, stairwell }), [outline, columns, walls, stairwell]);
  const geometry = useMemo(() => buildCeilingFixtures(positions, height, style), [positions, height, style]);
  const shape = useMemo(() => roomShape(space, !!space.stairwell && !space.stairwell.opening), [space]);
  const colour = space.visualization?.lighting === 'evening' ? '#ffdaaa' : palette.light;
  useEffect(() => () => Object.values(geometry).forEach(part => part.dispose()), [geometry]);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, height, 0]} raycast={() => {}}><shapeGeometry args={[shape]} /><meshStandardMaterial color={palette.ceiling} side={THREE.DoubleSide} roughness={0.94} /></mesh>
    {geometry.housing && <mesh raycast={() => {}}><primitive object={geometry.housing} attach="geometry" /><meshStandardMaterial color={palette.housing} metalness={0.5} roughness={0.42} /></mesh>}
    {geometry.diffuser && <mesh raycast={() => {}}><primitive object={geometry.diffuser} attach="geometry" /><meshBasicMaterial color={colour} toneMapped={false} /></mesh>}
  </group>;
}
