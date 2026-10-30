'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EQUIPMENT_CATALOG } from '@/lib/gym-catalog';
import type { GymSpace } from '@/lib/gym-space';
import { INTERIOR_PALETTES } from '@/lib/gym-interior';
import type { InteriorStyle, GymVisualization } from '@/lib/gym-visualization';

export function EconomicReflections({ style = 'minimal', lighting = 'daylight' }: { style?: InteriorStyle; lighting?: GymVisualization['lighting'] }) {
  const { scene, invalidate } = useThree();
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 128);
    gradient.addColorStop(0, INTERIOR_PALETTES[style].ceiling); gradient.addColorStop(0.28, '#dce1e5'); gradient.addColorStop(0.48, '#a4adb5'); gradient.addColorStop(0.55, '#45515f'); gradient.addColorStop(1, '#222a2e');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 128);
    for (const x of [12, 144]) {
      const panel = ctx.createLinearGradient(x, 0, x + 84, 0);
      const colour = lighting === 'evening' ? '255,218,170' : '245,248,255';
      panel.addColorStop(0, `rgba(${colour},0.15)`); panel.addColorStop(0.3, `rgba(${colour},0.95)`); panel.addColorStop(0.7, `rgba(${colour},0.95)`); panel.addColorStop(1, `rgba(${colour},0.15)`);
      ctx.fillStyle = panel; ctx.fillRect(x, 14, 84, 24);
    }
    ctx.fillStyle = '#dfe9ec'; ctx.fillRect(32,32,38,32); ctx.fillRect(176,32,38,32);
    ctx.fillStyle = '#63717a'; ctx.fillRect(49,32,3,32); ctx.fillRect(193,32,3,32);
    ctx.fillStyle = '#e0f3fa'; ctx.fillRect(100, 42, 10, 36); ctx.fillRect(224, 42, 10, 36);
    const map = new THREE.CanvasTexture(canvas); map.mapping = THREE.EquirectangularReflectionMapping; map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [style, lighting]);
  useEffect(() => {
    const previous = scene.environment, intensity = scene.environmentIntensity;
    scene.environment = texture; scene.environmentIntensity = INTERIOR_PALETTES[style].reflection; invalidate();
    return () => { scene.environment = previous; scene.environmentIntensity = intensity; texture.dispose(); };
  }, [scene, texture, invalidate, style]);
  return null;
}

export function EquipmentContactShadows({ space }: { space: GymSpace }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const { invalidate } = useThree();
  const map = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 5, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(0,0,0,0.45)'); gradient.addColorStop(0.55, 'rgba(0,0,0,0.24)'); gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }, []);
  useEffect(() => () => map.dispose(), [map]);
  useEffect(() => {
    if (!ref.current) return;
    const transform = new THREE.Object3D();
    space.items.forEach((item, index) => {
      const template = EQUIPMENT_CATALOG.find(t => t.id === item.templateId)!;
      transform.position.set(item.x, 0.019, item.y);
      transform.rotation.set(-Math.PI / 2, 0, item.rotation * Math.PI / 180);
      transform.scale.set(template.length_m * 1.25, template.width_m * 1.25, 1);
      transform.updateMatrix(); ref.current.setMatrixAt(index, transform.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true; ref.current.computeBoundingSphere(); invalidate();
  }, [space.items, invalidate]);
  return space.items.length > 0 ? <instancedMesh key={space.items.length} ref={ref} args={[undefined, undefined, space.items.length]} raycast={() => {}}>
    <planeGeometry args={[1, 1]} /><meshBasicMaterial map={map} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
  </instancedMesh> : null;
}
