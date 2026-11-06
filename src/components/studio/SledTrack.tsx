'use client';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { sledTrackLayout } from '@/lib/gym-sled-track';
import type { GymSpace } from '@/lib/gym-space';

export default function SledTrack({ area }: { area: GymSpace['areas'][number] }) {
  const {length,breadth,horizontal,marks} = useMemo(() => sledTrackLayout(area.w,area.d), [area.w,area.d]);
  const map = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 2048;
    const context = canvas.getContext('2d')!;
    context.strokeStyle = '#f4f1df'; context.fillStyle = '#f4f1df';
    context.lineWidth = 4;
    context.strokeRect(8, 8, 240, 2032);
    context.font = '700 44px sans-serif'; context.textAlign = 'center';
    for (const mark of marks) {
      const y = (mark.offset / length) * canvas.height;
      context.beginPath(); context.moveTo(10,y); context.lineTo(246,y); context.stroke();
      context.fillText(String(mark.metres),128,Math.max(48,Math.min(2010,y+52)));
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [length,marks]);
  useEffect(() => () => map.dispose(), [map]);
  return <group position={[area.x+area.w/2,0.017,area.y+area.d/2]} rotation={[0,horizontal ? Math.PI/2 : 0,0]}>
    <mesh rotation={[-Math.PI/2,0,0]} raycast={() => {}}>
      <planeGeometry args={[breadth,length]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  </group>;
}
