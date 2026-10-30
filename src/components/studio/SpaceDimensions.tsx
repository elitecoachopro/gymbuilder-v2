'use client';

import { useEffect, useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { itemPolygon, type GymSpace } from '@/lib/gym-space';
import { sceneDimensions } from '@/lib/gym-visualization';

function DimensionLabel({ value, position, compact }: { value: number; position: [number, number, number]; compact: boolean }) {
  const text = `${value.toFixed(2)} m`;
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
    const context = canvas.getContext('2d')!;
    context.fillStyle = 'rgba(255,255,255,0.94)'; context.fillRect(0, 0, 256, 64);
    context.fillStyle = '#263947'; context.font = '600 32px sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(text, 128, 32);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <sprite position={position} scale={compact ? [0.6, 0.15, 1] : [1.2, 0.3, 1]} renderOrder={10} raycast={() => {}}><spriteMaterial map={texture} transparent depthTest={false} toneMapped={false} /></sprite>;
}

export default function SpaceDimensions({ space, selected }: { space: GymSpace; selected: string | null }) {
  const item = space.items.find(item => item.id === selected);
  const dimensions = sceneDimensions(space.outline, item ? itemPolygon(item) : undefined);
  return <group>
    {dimensions.map((dimension, index) => <group key={index}>
      <Line points={[[dimension.start.x, 0.07, dimension.start.y], [dimension.end.x, 0.07, dimension.end.y]]} color="#425a68" lineWidth={1.2} raycast={() => {}} />
      <DimensionLabel compact={index >= space.outline.length} value={dimension.length} position={[dimension.label.x, 0.1, dimension.label.y]} />
    </group>)}
  </group>;
}
