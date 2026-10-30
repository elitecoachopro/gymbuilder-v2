'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { spaceWalls, type GymSpace } from '@/lib/gym-space';
import { useUiText } from '@/i18n/useUiText';
import { FLOOR_SURFACES } from '@/lib/gym-visualization';
import { createFloorMaps, type FloorFinish } from '@/lib/gym-pbr-textures';
import { loadOakFloorPixels } from '@/lib/gym-floor-photography';
import SledTrack from './SledTrack';
import { useThree } from '@react-three/fiber';
import { strengthAccentWall } from '@/lib/gym-strength-interior';
import { buildWallFinish, INTERIOR_PALETTES } from '@/lib/gym-interior';
import type { InteriorStyle } from '@/lib/gym-visualization';

export function useFloorMaps(mode: FloorFinish, repeatX: number, repeatY: number) {
  const { invalidate } = useThree();
  const maps = useMemo(() => createFloorMaps(mode), [mode]);
  useEffect(() => {
    Object.values(maps).forEach(map => map.repeat.set(repeatX, repeatY));
    invalidate();
  }, [maps, repeatX, repeatY, invalidate]);
  useEffect(() => {
    if (mode !== 'oak') return;
    let cancelled = false;
    loadOakFloorPixels().then(pixels => {
      if (cancelled) return;
      for (const key of ['map', 'bumpMap', 'roughnessMap'] as const) {
        maps[key].image = pixels[key];
        maps[key].needsUpdate = true;
      }
      invalidate();
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [mode, maps, invalidate]);
  useEffect(() => () => Object.values(maps).forEach(map => map.dispose()), [maps]);
  return maps;
}
const areaFinishes: Record<string, 'rubber' | 'oak' | 'concrete' | 'turf'> = {
  aerobic: 'oak', zumba: 'oak', children: 'rubber', 'classes-crossfit': 'rubber',
  functional: 'turf', receptie: 'oak', vestiare: 'oak', stretching: 'concrete',
};
function AreaSurface({ area }: { area: GymSpace['areas'][number] }) {
  const ui = useUiText();
  const mode = areaFinishes[area.id] ?? 'rubber';
  const maps = useFloorMaps(mode, area.w / FLOOR_SURFACES[mode].tileMetres, area.d / FLOOR_SURFACES[mode].tileMetres);
  const label = String(ui(area.name));
  const labelTexture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 96;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = mode === 'concrete' || mode === 'oak' ? '#293c3b' : '#e2d5b8'; ctx.font = '600 42px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(label.toLocaleUpperCase(), 384, 62, 740);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
  }, [label, mode]);
  useEffect(() => () => labelTexture.dispose(), [labelTexture]);
  const labelWidth = Math.min(3.5, area.w * 0.85);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[area.x + area.w / 2, 0.008, area.y + area.d / 2]} receiveShadow>
      <planeGeometry args={[area.w, area.d]} /><meshStandardMaterial {...maps} bumpScale={FLOOR_SURFACES[mode].bumpScale} roughness={FLOOR_SURFACES[mode].roughness} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[area.x + area.w / 2, 0.015, area.y + area.d - 0.18]}>
      <planeGeometry args={[labelWidth, labelWidth / 8]} /><meshBasicMaterial map={labelTexture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
    {area.id === 'functional' && area.d >= 8 && <SledTrack area={area}/>}
    {area.id === 'functional' && area.d < 8 && [0, 1, 2, 3].map(i => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[area.x + 0.2 + i * (area.w - 0.4) / 3, 0.012, area.y + area.d / 2]}>
      <planeGeometry args={[0.025, area.d - 0.25]} /><meshStandardMaterial color="#bfcbb7" roughness={1} />
    </mesh>)}
  </group>;
}
function WallPanel({ x, z, width, height, rotation, style }: { x: number; z: number; width: number; height: number; rotation: number; style: InteriorStyle }) {
  const geometry = useMemo(() => style === 'minimal' ? null : buildWallFinish(width, height, style), [width, height, style]);
  const palette = INTERIOR_PALETTES[style];
  useEffect(() => () => { if (geometry) Object.values(geometry).forEach(part => part.dispose()); }, [geometry]);
  const branding = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#19262c'; ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = '#c9af77'; ctx.font = '500 84px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Imperial Gym', 512, 140);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  }, []);
  useEffect(() => () => branding.dispose(), [branding]);
  return <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
    {geometry && <>
      <mesh raycast={() => {}}><primitive object={geometry.backing} attach="geometry" /><meshStandardMaterial color={palette.panel} roughness={0.88} /></mesh>
      {geometry.ribs && <mesh raycast={() => {}}><primitive object={geometry.ribs} attach="geometry" /><meshStandardMaterial color={palette.slats} roughness={style === 'warm' ? 0.8 : 0.48} metalness={style === 'industrial' ? 0.5 : 0} /></mesh>}
    </>}
    <mesh position={[0, height * 0.64, 0.065]}><planeGeometry args={[style === 'minimal' ? width : width * 0.7, Math.min(height * 0.4, width / 4)]} /><meshStandardMaterial map={branding} roughness={0.75} /></mesh>
    <mesh position={[0, height - 0.18, 0.035]}><boxGeometry args={[width, 0.018, 0.025]} /><meshBasicMaterial color={palette.light} toneMapped={false} /></mesh>
  </group>;
}
export default function RoomAtmosphere({ space, height, cutaway }: { space: GymSpace; height: number; cutaway: boolean }) {
  const style = space.visualization?.interiorStyle ?? 'minimal';
  const accentWall = useMemo(() => strengthAccentWall(space), [space]);
  const walls = spaceWalls(space), wall = walls.find(w => w.id.startsWith('edge-') && w.axis === 'x' && w.y === 0);
  const spans = wall ? space.openings.filter(o => o.wallId === wall.id).sort((a, b) => a.offset - b.offset).reduce<Array<[number, number]>>((result, opening) => {
    const last = result[result.length - 1];
    if (opening.offset > last[0]) result.splice(result.length - 1, 1, [last[0], opening.offset], [opening.offset + opening.width, wall.length]);
    else last[0] = Math.max(last[0], opening.offset + opening.width);
    return result;
  }, [[0, wall.length]]) : [];
  const span = spans.filter(([start, end]) => end - start >= 3).sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]))[0];
  return <group>
    {space.finishes.floor === 'rubber' && space.areas.map(area => <AreaSurface key={area.id} area={area} />)}
    {space.finishes.floor === 'tartan' && space.areas.filter(area => area.id === 'functional').map(area => <AreaSurface key={area.id} area={area} />)}
    {wall && span && accentWall?.wallId !== wall.id && <WallPanel x={wall.x + (span[0] + span[1]) / 2} z={wall.y + wall.thickness / 2 + 0.04} width={Math.min(5.5, span[1] - span[0] - 0.3)} height={height} rotation={0} style={style} />}
    {space.columns.map(column => <mesh key={column.id} position={[column.x + column.w / 2, 0.28, column.y + column.d / 2]}>
      <boxGeometry args={[column.w + 0.015, 0.56, column.d + 0.015]} /><meshStandardMaterial color={space.finishes.frame} roughness={0.55} metalness={0.4} />
    </mesh>)}
    {!cutaway && walls.filter(w => w.id.startsWith('edge-')).map(w => <mesh key={w.id} position={[w.x + (w.axis === 'x' ? w.length / 2 : 0), height - 0.16, w.y + (w.axis === 'y' ? w.length / 2 : 0)]}>
      <boxGeometry args={w.axis === 'x' ? [w.length, 0.025, w.thickness + 0.025] : [w.thickness + 0.025, 0.025, w.length]} /><meshBasicMaterial color="#f1dfb8" toneMapped={false} />
    </mesh>)}
  </group>;
}
