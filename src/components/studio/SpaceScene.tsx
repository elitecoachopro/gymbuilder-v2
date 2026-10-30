'use client';

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { spaceBounds, spaceWalls, type GymSpace, type SpaceItem, type SpaceWall } from '@/lib/gym-space';
import { referenceCameraOffset } from '@/lib/gym-reference-camera';
import { gymCameraDistance } from '@/lib/gym-camera';
import { GYM_GRAPHICS, gymRenderDpr, watchGraphicsContext, type GymGraphicsProfile } from '@/lib/gym-graphics';
import { EQUIPMENT_CATALOG } from '@/lib/gym-catalog';
import EquipmentModel from './EquipmentModel';
import CeilingLighting from './CeilingLighting';
import DaylightArchitecture from './DaylightArchitecture';
import { SurfaceMaterials, useSurfaceTextures } from './SurfaceMaterials';
import { EconomicReflections, EquipmentContactShadows } from './StudioLighting';
import { INTERIOR_PALETTES } from '@/lib/gym-interior';
import { EquipmentMaterials } from './EquipmentParts';
import RoomAtmosphere, { useFloorMaps } from './RoomAtmosphere';
import SpaceDimensions from './SpaceDimensions';
import StrengthInterior from './StrengthInterior';
import StairArchitecture from './StairArchitecture';
import { roomShape } from '@/lib/gym-room-shape';
import { DEFAULT_VISUALIZATION, FLOOR_SURFACES, LIGHTING_PRESETS } from '@/lib/gym-visualization';

export type StudioView = 'orbit' | 'top' | 'inside';
export type CameraCommand = { kind: 'fit' | 'in' | 'out'; id: number } | { kind: 'focus'; id: number; target: { x: number; y: number; length: number; width: number; height: number; direction?: [number, number] } };
const floorExtrusion = { depth: 0.25, bevelEnabled: false };
interface Props {
  space: GymSpace; height: number; selected: string | null; view: StudioView; cutaway: boolean; showAreas: boolean;
  onSelect: (id: string | null) => void; onMove: (id: string, x: number, y: number) => boolean;
  onCaptureReady: (capture: (() => string) | null) => void;
  fallback: string;
  profile: GymGraphicsProfile;
  navigation: 'orbit' | 'pan'; cameraCommand: CameraCommand;
  onFailure: () => void;
}
function GraphicsMonitor({ onFailure }: Pick<Props, 'onFailure'>) {
  const { gl } = useThree();
  useEffect(() => watchGraphicsContext(gl.domElement, onFailure), [gl, onFailure]);
  return null;
}
function CameraRig({ space, view, height, onCaptureReady, navigation, cameraCommand, onNavigate }: Pick<Props, 'space' | 'view' | 'height' | 'onCaptureReady' | 'navigation' | 'cameraCommand'> & { onNavigate: (moving: boolean) => void }) {
  const { camera, size, gl, scene, invalidate } = useThree();
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const { length, width } = spaceBounds(space);
  const { eyeHeight, fov } = space.visualization ?? DEFAULT_VISUALIZATION;
  const handledCommand = useRef(cameraCommand.kind === 'focus' ? cameraCommand.id - 1 : cameraCommand.id);
  useEffect(() => {
    const isCommand = handledCommand.current !== cameraCommand.id;
    handledCommand.current = cameraCommand.id;
    if (camera instanceof THREE.PerspectiveCamera) { camera.fov = fov; camera.updateProjectionMatrix(); }
    if (isCommand && cameraCommand.kind === 'focus' && cameraCommand.target && controls.current) {
      const item = cameraCommand.target;
      const target = new THREE.Vector3(item.x, item.height * 0.45, item.y);
      const distance = gymCameraDistance(item.length + 0.4, item.width + 0.4, size.width / Math.max(1, size.height), fov, item.height / 2);
      const preferred = new THREE.Vector3(item.direction?.[0] ?? 0.7, 0.55, item.direction?.[1] ?? 1).normalize().multiplyScalar(distance);
      camera.position.copy(target).add(new THREE.Vector3(...referenceCameraOffset({x:item.x,y:item.y}, preferred.toArray(), space.outline)));
      controls.current.target.copy(target); controls.current.update(); invalidate(); return;
    }
    if (isCommand && (cameraCommand.kind === 'in' || cameraCommand.kind === 'out') && controls.current) {
      const target = controls.current.target;
      const offset = camera.position.clone().sub(target);
      const distance = THREE.MathUtils.clamp(offset.length() * (cameraCommand.kind === 'in' ? 0.8 : 1.25), 0.6, 600);
      camera.position.copy(target).add(offset.setLength(distance));
      controls.current.update(); invalidate(); return;
    }
    const distance = gymCameraDistance(length, width, size.width / Math.max(1, size.height), fov, height);
    const centre = new THREE.Vector3(length / 2, height * 0.16, width / 2);
    if (view === 'inside') {
      const eye = Math.min(eyeHeight, height - 0.2);
      camera.position.set(length * 0.12, eye, width * 0.88);
      controls.current?.target.set(length * 0.65, eye, width * 0.3);
    } else {
      const direction = view === 'top' ? new THREE.Vector3(0, 1, 0.001) : new THREE.Vector3(0.55, 1.1, 1);
      camera.position.copy(centre).add(direction.normalize().multiplyScalar(distance * 0.85));
      controls.current?.target.copy(centre);
    }
    controls.current?.update(); invalidate();
  }, [camera, length, width, view, height, size.width, size.height, invalidate, cameraCommand, eyeHeight, fov, space.outline]);
  useEffect(() => {
    onCaptureReady(() => { gl.render(scene, camera); return gl.domElement.toDataURL('image/png'); });
    return () => onCaptureReady(null);
  }, [gl, scene, camera, onCaptureReady]);
  return <OrbitControls ref={controls} makeDefault onStart={() => onNavigate(true)} onEnd={() => onNavigate(false)} screenSpacePanning touches={{ ONE: navigation === 'pan' ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }} mouseButtons={{ LEFT: navigation === 'pan' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }} enableDamping minDistance={0.6} maxDistance={600} maxPolarAngle={view === 'inside' ? Math.PI / 2 : Math.PI / 2 - 0.01} />;
}
function Floor({ space }: { space: GymSpace }) {
  const shape = useMemo(() => roomShape(space, !!space.stairwell?.opening), [space]);
  const surface = FLOOR_SURFACES[space.finishes.floor];
  const textures = useSurfaceTextures();
  const normalMap = space.finishes.floor === 'rubber' ? textures?.rubberNormal : null;
  const maps = useFloorMaps(space.finishes.floor, 1 / surface.tileMetres, 1 / surface.tileMetres);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.26, 0]} receiveShadow castShadow><extrudeGeometry args={[shape, floorExtrusion]} /><meshStandardMaterial color="#b7bab3" roughness={0.85} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><shapeGeometry args={[shape]} /><meshStandardMaterial {...maps} bumpMap={normalMap ? null : maps.bumpMap} normalMap={normalMap} normalScale={new THREE.Vector2(.28, .28)} bumpScale={surface.bumpScale} roughness={surface.roughness} side={THREE.DoubleSide} /></mesh>
  </group>;
}
function Wall({ wall, space, height, cutaway }: { wall: SpaceWall; space: GymSpace; height: number; cutaway: boolean }) {
  const textures = useSurfaceTextures();
  const outer = wall.id.startsWith('edge-'), bounds = spaceBounds(space);
  const near = outer && (Math.abs(wall.y - bounds.width) < 0.01 || Math.abs(wall.x - bounds.length) < 0.01);
  const h = cutaway ? near ? 0.12 : outer ? height : 1.15 : height;
  const openings = space.openings.filter(o => o.wallId === wall.id).sort((a, b) => a.offset - b.offset);
  const segments: Array<{ from: number; length: number; y: number; h: number }> = [];
  let cursor = 0;
  for (const o of openings) {
    if (o.offset > cursor) segments.push({ from: cursor, length: o.offset - cursor, y: 0, h });
    if (o.sill > 0) segments.push({ from: o.offset, length: o.width, y: 0, h: Math.min(o.sill, h) });
    if (h > o.sill + o.height) segments.push({ from: o.offset, length: o.width, y: o.sill + o.height, h: h - o.sill - o.height });
    cursor = o.offset + o.width;
  }
  if (cursor < wall.length) segments.push({ from: cursor, length: wall.length - cursor, y: 0, h });
  return <group position={[wall.x, 0, wall.y]} rotation={[0, wall.axis === 'y' ? -Math.PI / 2 : 0, 0]}>
    {segments.filter(s => s.length > 0.001 && s.h > 0.001).map((s, i) => <group key={i}>
      <mesh position={[s.from + s.length / 2, s.y + s.h / 2, 0]} castShadow receiveShadow><boxGeometry args={[s.length, s.h, wall.thickness]} /><meshStandardMaterial color={space.finishes.wall} roughness={0.92} bumpMap={textures?.paint} bumpScale={0.0005} /></mesh>
      {s.y === 0 && <mesh position={[s.from + s.length / 2, 0.045, 0]}><boxGeometry args={[s.length, 0.09, wall.thickness + 0.015]} /><meshStandardMaterial color={space.finishes.frame} roughness={0.5} /></mesh>}
      <mesh position={[s.from + s.length / 2, s.y + s.h + 0.006, 0]}><boxGeometry args={[s.length, 0.012, wall.thickness + 0.015]} /><meshStandardMaterial color="#c5c8c0" roughness={0.6} /></mesh>
    </group>)}
    {openings.filter(o => o.sill < h).map(o => {
      const visibleHeight = Math.min(o.height, h - o.sill);
      return <group key={o.id} position={[o.offset, o.sill, 0]}>
        {[0, o.width].map(x => <mesh key={x} position={[x, visibleHeight / 2, 0]}><boxGeometry args={[0.035, visibleHeight, wall.thickness + 0.025]} /><meshStandardMaterial color={space.finishes.frame} metalness={0.6} roughness={0.35} /></mesh>)}
        {visibleHeight >= o.height && <mesh position={[o.width / 2, visibleHeight, 0]}><boxGeometry args={[o.width + 0.035, 0.035, wall.thickness + 0.025]} /><meshStandardMaterial color={space.finishes.frame} metalness={0.6} roughness={0.35} /></mesh>}
        {o.kind === 'window' ? <>
          <mesh position={[o.width / 2, 0, 0]}><boxGeometry args={[o.width, 0.035, wall.thickness + 0.025]} /><meshStandardMaterial color={space.finishes.frame} /></mesh>
          <mesh position={[o.width / 2, visibleHeight / 2, 0]}><boxGeometry args={[o.width, visibleHeight, 0.02]} /><meshPhysicalMaterial color="#b4d5dc" transparent opacity={0.2} roughness={0.1} metalness={0.1} depthWrite={false} /></mesh>
        </> : <mesh rotation={[-Math.PI / 2, 0, 0]} position={[o.width / 2, 0.015, 0]}><planeGeometry args={[o.width, wall.thickness + 0.1]} /><meshStandardMaterial color="#b59862" metalness={0.6} roughness={0.3} /></mesh>}
      </group>;
    })}
  </group>;
}
function Item({ item, space, selected, onSelect, onMove }: { item: SpaceItem; space: GymSpace; selected: boolean; onSelect: Props['onSelect']; onMove: Props['onMove'] }) {
  const ref = useRef<THREE.Group>(null!);
  const t = EQUIPMENT_CATALOG.find(t => t.id === item.templateId)!;
  const model = <group ref={ref} position={[item.x, 0.025, item.y]} onClick={e => { e.stopPropagation(); onSelect(item.id); }}>
    <group rotation={[0, -item.rotation * Math.PI / 180, 0]}><EquipmentModel templateId={item.templateId} frame={space.finishes.frame} upholstery={space.finishes.upholstery} />{selected && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}><planeGeometry args={[t.length_m + 0.08, t.width_m + 0.08]} /><meshBasicMaterial color="#d6b16d" transparent opacity={0.45} depthWrite={false} /></mesh>}</group>
  </group>;
  return <>{model}{selected && <TransformControls object={ref} showY={false} mode="translate" translationSnap={(space.visualization ?? DEFAULT_VISUALIZATION).snap} size={0.7} onMouseUp={() => { if (!onMove(item.id, ref.current.position.x, ref.current.position.z)) ref.current.position.set(item.x, 0.025, item.y); }} />}</>;
}
export function StudioRoom({ space, height, cutaway, showAreas, view }: Pick<Props, 'space' | 'height' | 'cutaway' | 'showAreas' | 'view'>) {
  return <group>
    <Floor space={space} />{spaceWalls(space).map(wall => <Wall key={wall.id} wall={wall} space={space} height={height} cutaway={cutaway} />)}
    {view === 'inside' && !cutaway && <CeilingLighting space={space} height={height} />}
    <EquipmentMaterials frame={space.finishes.frame} upholstery={space.finishes.upholstery}><StairArchitecture space={space}/></EquipmentMaterials>
    <RoomAtmosphere space={space} height={height} cutaway={cutaway} />
    <StrengthInterior space={space} height={height} />
    <DaylightArchitecture space={space} />
    {showAreas && space.areas.map(area => <mesh key={area.id} rotation={[-Math.PI / 2, 0, 0]} position={[area.x + area.w / 2, 0.012, area.y + area.d / 2]}><planeGeometry args={[area.w, area.d]} /><meshStandardMaterial color={area.colour} transparent opacity={0.2} depthWrite={false} /></mesh>)}
    {space.columns.map(c => <mesh key={c.id} position={[c.x + c.w / 2, height / 2, c.y + c.d / 2]} castShadow><boxGeometry args={[c.w, height, c.d]} /><meshStandardMaterial color="#a4a6a3" roughness={0.9} /></mesh>)}
  </group>;
}
class Boundary extends Component<{ children: ReactNode; fallback: string; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? <p className="p-8 text-white" role="alert">{this.props.fallback}</p> : this.props.children; }
}
export default function SpaceScene(props: Props) {
  const [moving, setMoving] = useState(false);
  const { space, height, selected, cutaway, showAreas } = props;
  const bounds = spaceBounds(space);
  const quality = GYM_GRAPHICS[props.profile];
  const visualization = space.visualization ?? DEFAULT_VISUALIZATION;
  const light = LIGHTING_PRESETS[visualization.lighting];
  const interior = INTERIOR_PALETTES[visualization.interiorStyle ?? 'minimal'];
  return <Boundary fallback={props.fallback} onFailure={props.onFailure}><Canvas key={props.profile} shadows={quality.shadows} dpr={1} frameloop="demand" camera={{ fov: 45, near: 0.05, far: 1000 }} gl={{ antialias: quality.antialias, powerPreference: 'low-power', preserveDrawingBuffer: false, toneMapping: THREE.ACESFilmicToneMapping }} fallback={<p role="status" className="p-8 text-white">{props.fallback}</p>} onPointerMissed={() => props.onSelect(null)}>
    <RenderResolution profile={props.profile} moving={moving} />
    <GraphicsMonitor onFailure={props.onFailure} />
    {!quality.environment && <EconomicReflections style={visualization.interiorStyle} lighting={visualization.lighting} />}
    <SceneExposure value={light.exposure} />
    <color attach="background" args={[light.background]} /><ambientLight intensity={light.ambient} /><hemisphereLight args={[light.sky, light.ground, light.hemisphere]} />
    {quality.environment && <Environment key={`${visualization.lighting}-${visualization.interiorStyle ?? 'minimal'}`} resolution={128} frames={1} environmentIntensity={interior.reflection * 0.7}>
      <Lightformer position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[12, 8, 1]} intensity={2} color={interior.light} />
      <Lightformer position={[-8, 4, -4]} rotation={[0, Math.PI / 2, 0]} scale={[8, 5, 1]} intensity={3} color={light.fill} />
      <Lightformer position={[8, 3, 2]} rotation={[0, -Math.PI / 2, 0]} scale={[6, 3, 1]} intensity={2} color={light.sun} />
    </Environment>}
    <directionalLight position={[bounds.length * light.sunX, light.sunHeight, bounds.width * light.sunZ]} intensity={light.strength} color={light.sun} castShadow={quality.shadows} shadow-mapSize={[1024, 1024]} shadow-camera-far={300} shadow-camera-left={-bounds.length} shadow-camera-right={bounds.length} shadow-camera-top={bounds.width} shadow-camera-bottom={-bounds.width} shadow-normalBias={0.025} shadow-bias={-0.0001} />
    <directionalLight position={[bounds.length, 8, -4]} intensity={light.fillStrength} color={light.fill} />
    <CameraRig onNavigate={setMoving} navigation={props.navigation} cameraCommand={props.cameraCommand} space={space} view={props.view} height={height} onCaptureReady={props.onCaptureReady} />
    <SurfaceMaterials><StudioRoom space={space} height={height} cutaway={cutaway} showAreas={showAreas} view={props.view} />
    <EquipmentContactShadows space={space} />
    {visualization.dimensions && <SpaceDimensions space={space} selected={selected} />}
    <EquipmentMaterials frame={space.finishes.frame} upholstery={space.finishes.upholstery}>
      {space.items.map(item => <Item key={item.id} item={item} space={space} selected={selected === item.id} onMove={props.onMove} onSelect={props.onSelect} />)}
    </EquipmentMaterials></SurfaceMaterials>
  </Canvas></Boundary>;
}

function RenderResolution({ profile, moving }: { profile: GymGraphicsProfile; moving: boolean }) {
  const { size, viewport, setDpr, invalidate } = useThree();
  useEffect(() => {
    const next = gymRenderDpr(profile, size.width, size.height, moving);
    if (next !== viewport.dpr) setDpr(next);
    invalidate();
  }, [profile, moving, size.width, size.height, viewport.dpr, setDpr, invalidate]);
  return null;
}

function SceneExposure({ value }: { value: number }) {
  const { gl, invalidate } = useThree();
  useEffect(() => { const previous = gl.toneMappingExposure; gl.toneMappingExposure = value; invalidate(); return () => { gl.toneMappingExposure = previous; }; }, [gl, value, invalidate]);
  return null;
}
