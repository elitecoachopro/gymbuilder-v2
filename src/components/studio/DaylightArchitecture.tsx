'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { windowDaylights } from '@/lib/gym-daylight';
import type { GymSpace } from '@/lib/gym-space';

function createDaylightMaps(evening: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d')!;
  const sky = context.createLinearGradient(0, 0, 0, 256);
  sky.addColorStop(0, evening ? '#536981' : '#90bcd0');
  sky.addColorStop(0.64, evening ? '#c8ac8d' : '#e5ecdf');
  sky.addColorStop(1, '#667d65');
  context.fillStyle = sky;
  context.fillRect(0, 0, 512, 256);
  context.fillStyle = 'rgba(255,255,255,0.5)';
  for (const [x, y, width] of [[42, 48, 105], [250, 32, 150], [380, 82, 100]]) {
    context.beginPath();
    context.ellipse(x, y, width, 12, 0, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = '#71876a';
  for (let i = 0; i < 24; i++) {
    context.beginPath();
    context.ellipse(i * 24, 212 + Math.sin(i * 1.7) * 7, 25, 17 + Math.sin(i) * 8, 0, 0, Math.PI * 2);
    context.fill();
  }
  const view = new THREE.CanvasTexture(canvas);
  view.colorSpace = THREE.SRGBColorSpace;

  const poolCanvas = document.createElement('canvas');
  poolCanvas.width = poolCanvas.height = 128;
  const poolContext = poolCanvas.getContext('2d')!;
  const gradient = poolContext.createRadialGradient(64, 64, 15, 64, 64, 70);
  gradient.addColorStop(0, 'rgba(255,246,207,0.24)');
  gradient.addColorStop(0.65, 'rgba(255,246,207,0.1)');
  gradient.addColorStop(1, 'rgba(255,246,207,0)');
  poolContext.fillStyle = gradient;
  poolContext.fillRect(0, 0, 128, 128);
  const pool = new THREE.CanvasTexture(poolCanvas);
  pool.colorSpace = THREE.SRGBColorSpace;
  return { view, pool };
}

export default function DaylightArchitecture({ space }: { space: GymSpace }) {
  const lights = useMemo(() => windowDaylights(space), [space]);
  const evening = space.visualization?.lighting === 'evening';
  const { invalidate } = useThree();
  const patches = useRef<THREE.InstancedMesh>(null!);
  const maps = useMemo(() => createDaylightMaps(evening), [evening]);
  useEffect(() => () => {
    maps.view.dispose();
    maps.pool.dispose();
  }, [maps]);
  const floorLights = useMemo(() => lights.flatMap(light => light.patch ? [light.patch] : []), [lights]);
  useEffect(() => {
    if (!patches.current) return;
    const transform = new THREE.Object3D();
    floorLights.forEach((patch, index) => {
      transform.position.set(patch.x, 0.014, patch.y);
      transform.rotation.set(-Math.PI / 2, 0, 0);
      transform.scale.set(patch.w, patch.d, 1);
      transform.updateMatrix();
      patches.current.setMatrixAt(index, transform.matrix);
    });
    patches.current.instanceMatrix.needsUpdate = true;
    patches.current.computeBoundingSphere();
    invalidate();
  }, [floorLights, invalidate]);
  return <group>
    {lights.map(light => <mesh key={light.id} position={[light.x, light.elevation, light.y]} rotation={[0, light.rotation, 0]} raycast={() => {}}>
      <planeGeometry args={[light.width, light.height]} />
      <meshBasicMaterial map={maps.view} toneMapped={false} />
    </mesh>)}
    {floorLights.length > 0 && <instancedMesh key={floorLights.length} ref={patches} args={[undefined, undefined, floorLights.length]} raycast={() => {}}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={maps.pool} transparent depthWrite={false} opacity={evening ? 0.35 : 0.8} />
    </instancedMesh>}
  </group>;
}
