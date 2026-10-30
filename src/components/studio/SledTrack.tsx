'use client';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { GymSpace } from '@/lib/gym-space';

export default function SledTrack({ area }: { area: GymSpace['areas'][number] }) {
  const map = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1024;
    const context = canvas.getContext('2d')!;
    context.strokeStyle = '#eee9d6';
    context.fillStyle = '#eee9d6';
    context.lineWidth = 4;
    context.strokeRect(5, 5, 246, 1014);
    context.font = '600 28px sans-serif';
    context.textAlign = 'left';
    const metres = Math.floor(area.d);
    for (let i = 0; i <= metres; i++) {
      const y = 12 + (i / metres) * 1000;
      context.beginPath();
      context.moveTo(7, y);
      context.lineTo(44, y);
      context.moveTo(211, y);
      context.lineTo(249, y);
      context.stroke();
      if (i % 2 === 0) context.fillText(i + ' m', 50, Math.max(36, Math.min(1005, y + 9)));
    }
    context.setLineDash([18, 18]);
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(128, 10);
    context.lineTo(128, 1014);
    context.stroke();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [area.d]);
  useEffect(() => () => map.dispose(), [map]);
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[area.x + area.w / 2, 0.013, area.y + area.d / 2]}
      raycast={() => {}}
    >
      <planeGeometry args={[area.w, area.d]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
