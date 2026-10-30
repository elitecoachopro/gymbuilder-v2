'use client';

import GymEquipmentModel from './GymEquipmentModel';
import { EQUIPMENT_CATALOG } from '@/lib/gym-catalog';
import { useUiText } from '@/i18n/useUiText';

import { useMemo, useEffect, useRef, Component, type ReactNode } from 'react';
import { gymCameraDistance } from '@/lib/gym-camera';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, TransformControls } from '@react-three/drei';
import * as THREE from 'three';

interface ZoneData {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
}

interface GymScene3DProps {
  heightM?: number;
  lengthM: number;
  widthM: number;
  zones: ZoneData[];
  equipment?: Array<{ instanceId: string; zoneId: string; x: number; y: number; w: number; h: number; templateId?: string; rotation?: number }>;
  selectedEquipment?: string | null;
  onSelectEquipment?: (id: string) => void;
  onMoveEquipment?: (id: string, x: number, y: number) => boolean;
}

const WALL_THICKNESS = 0.12;
const WALL_COLOR = '#2a2a2a';
const FLOOR_COLOR = '#1a1a1a';

function Floor({ length, width }: { length: number; width: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[length / 2, 0, width / 2]} receiveShadow>
      <planeGeometry args={[length, width]} />
      <meshStandardMaterial color={FLOOR_COLOR} roughness={0.8} />
    </mesh>
  );
}

function Walls({ length, width, height }: { length: number; width: number; height: number }) {
  return (
    <group>
      {/* Back wall (z=0) */}
      <mesh position={[length / 2, height / 2, 0]}>
        <boxGeometry args={[length, height, WALL_THICKNESS]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.6} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Front wall (z=width) - more transparent so user can see inside */}
      <mesh position={[length / 2, height / 2, width]}>
        <boxGeometry args={[length, height, WALL_THICKNESS]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.6} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      {/* Left wall (x=0) */}
      <mesh position={[0, height / 2, width / 2]}>
        <boxGeometry args={[WALL_THICKNESS, height, width]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.6} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Right wall (x=length) - more transparent */}
      <mesh position={[length, height / 2, width / 2]}>
        <boxGeometry args={[WALL_THICKNESS, height, width]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.6} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function ZoneMesh({ zone, totalLength, totalWidth }: { zone: ZoneData; totalLength: number; totalWidth: number }) {
  const ui = useUiText();
  const zoneX = (zone.x / 100) * totalLength;
  const zoneZ = (zone.y / 100) * totalWidth;
  const zoneW = (zone.width / 100) * totalLength;
  const zoneD = (zone.height / 100) * totalWidth;

  const centerX = zoneX + zoneW / 2;
  const centerZ = zoneZ + zoneD / 2;

  return (
    <group>
      {/* Zone floor surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.02, centerZ]} receiveShadow>
        <planeGeometry args={[Math.max(0.01, zoneW - 0.05), Math.max(0.01, zoneD - 0.05)]} />
        <meshStandardMaterial color={zone.color} roughness={0.4} transparent opacity={0.6} />
      </mesh>

      {/* Zone border edge */}
      <mesh position={[centerX, 0.03, centerZ]}>
        <boxGeometry args={[zoneW, 0.06, zoneD]} />
        <meshStandardMaterial color={zone.color} roughness={0.3} transparent opacity={0.2} />
      </mesh>

      <ZoneLabel name={ui(zone.name)} area={zone.area} position={[centerX, 0.2, centerZ]} width={Math.max(1.2, Math.min(zoneW * 0.9, 4))} />
    </group>
  );
}

function ZoneLabel({ name, area, position, width }: { name: string; area: number; position: [number, number, number]; width: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 180;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.shadowColor = '#000'; context.shadowBlur = 8;
    context.fillStyle = '#fff';
    let size = 42;
    do { context.font = `600 ${size}px "Inter Variable", system-ui, sans-serif`; size -= 2; } while (context.measureText(name).width > 480 && size > 18);
    context.fillText(name, 256, 65);
    context.fillStyle = '#ddd'; context.font = '32px "Inter Variable", system-ui, sans-serif';
    context.fillText(`${area.toFixed(0)} m²`, 256, 120);
    return new THREE.CanvasTexture(canvas);
  }, [name, area]);
  useEffect(() => () => { texture?.dispose(); }, [texture]);
  if (!texture) return null;
  return <sprite position={position} scale={[width, width * 180 / 512, 1]}><spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} /></sprite>;
}

function SimpleGrid({ length, width }: { length: number; width: number }) {
  const size = Math.max(length, width) * 1.2;
  const divisions = Math.min(200, Math.max(2, Math.round(size)));
  return (
    <gridHelper
      args={[size, divisions, '#333333', '#222222']}
      position={[length / 2, -0.01, width / 2]}
    />
  );
}



function RoomCamera({ length, width, height }: { length: number; width: number; height: number }) {
  const { size } = useThree();
  const distance = gymCameraDistance(length, width, size.width / Math.max(size.height, 1), 50, height);
  const direction = new THREE.Vector3(0.45, 0.7, 1).normalize().multiplyScalar(distance);
  return <>
    <PerspectiveCamera makeDefault position={[length / 2 + direction.x, direction.y, width / 2 + direction.z]} fov={50} near={0.1} far={Math.max(200, distance * 10)} />
    <OrbitControls makeDefault target={[length / 2, 0, width / 2]} maxPolarAngle={Math.PI / 2.05} minDistance={2} maxDistance={distance * 2.5} enableDamping dampingFactor={0.1} />
  </>;
}

function SceneEquipment({ item, length, width, selected, onSelect, onMove }: {
  item: NonNullable<GymScene3DProps['equipment']>[number]; length: number; width: number; selected: boolean;
  onSelect?: (id: string) => void; onMove?: GymScene3DProps['onMoveEquipment'];
}) {
  const ref = useRef<THREE.Group>(null!);
  const template = EQUIPMENT_CATALOG.find(t => t.id === item.templateId);
  const rotated = item.rotation === 90 || item.rotation === 270;
  const x = item.w * length / 100, z = item.h * width / 100;
  const position: [number, number, number] = [(item.x + item.w / 2) * length / 100, 0.08, (item.y + item.h / 2) * width / 100];
  const model = <group ref={ref} position={position} onClick={event => { event.stopPropagation(); onSelect?.(item.instanceId); }}>
    <group rotation={[0, -(item.rotation || 0) * Math.PI / 180, 0]} scale={[rotated ? z : x, template?.height_m || 0.9, rotated ? x : z]}>
      {template ? <GymEquipmentModel templateId={template.id} accent={selected ? '#ffd54f' : '#c5a45a'} /> : <mesh position={[0, 0.5, 0]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#9ca3af" /></mesh>}
    </group>
    {selected && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}><planeGeometry args={[x + 0.1, z + 0.1]} /><meshBasicMaterial color="#f6cf53" transparent opacity={0.6} /></mesh>}
  </group>;
  if (!selected || !onMove) return model;
  return <>{model}<TransformControls object={ref} mode="translate" showY={false} translationSnap={0.1} size={0.8} onMouseUp={() => {
    if (!ref.current) return;
    const accepted = onMove(item.instanceId, ref.current.position.x / length * 100 - item.w / 2, ref.current.position.z / width * 100 - item.h / 2);
    if (!accepted) ref.current.position.set(...position);
  }} /></>;
}

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function GymScene3D({ lengthM, widthM, heightM = 3, zones, equipment = [], selectedEquipment, onSelectEquipment, onMoveEquipment }: GymScene3DProps) {

  const ui = useUiText();
  const hasCirculationStrip = zones.length > 0 && Math.abs(Math.max(...zones.map(z => z.x + z.width)) - 85) < 0.001 && Math.abs(zones.reduce((sum, z) => sum + z.area, 0) - lengthM * widthM * 0.85) < 0.02;
  return (
    <div className="w-full h-[clamp(260px,65dvh,600px)] rounded-xl overflow-hidden border border-anthracite-700" style={{ background: '#0a0a0f' }}>
      <SceneBoundary fallback={<p role="alert" className="p-6 text-anthracite-200">{ui('Scena 3D nu este disponibilă pe acest dispozitiv. Folosește planul 2D.')}</p>}><Canvas
        shadows
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        frameloop="demand"
        onCreated={({ gl }) => {
          gl.setClearColor('#11151d');
        }}
      >
        <RoomCamera length={lengthM} width={widthM} height={heightM} />

        {/* Lighting */}
        <ambientLight intensity={1.1} />
        <hemisphereLight args={['#e5efff', '#786448', 1.4]} />
        <directionalLight
          position={[lengthM / 2, heightM * 3, widthM / 2]}
          intensity={2.2}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
        />
        <pointLight position={[lengthM * 0.25, heightM - 0.5, widthM * 0.25]} intensity={0.2} />
        <pointLight position={[lengthM * 0.75, heightM - 0.5, widthM * 0.75]} intensity={0.2} />

        {/* Scene */}
        <Floor length={lengthM} width={widthM} />
        <Walls length={lengthM} width={widthM} height={heightM} />
        <SimpleGrid length={lengthM} width={widthM} />

        {hasCirculationStrip && <ZoneMesh zone={{ id: 'circulation', name: 'Circulație', color: '#737b87', x: 85, y: 0, width: 15, height: 100, area: lengthM * widthM * 0.15 }} totalLength={lengthM} totalWidth={widthM} />}
        {/* Zones */}
        {zones.map((zone) => (
          <ZoneMesh
            key={zone.id}
            zone={zone}
            totalLength={lengthM}
            totalWidth={widthM}
          />
        ))}

        {equipment.map(item => <SceneEquipment key={item.instanceId} item={item} length={lengthM} width={widthM} selected={selectedEquipment === item.instanceId} onSelect={onSelectEquipment} onMove={onMoveEquipment} />)}


      </Canvas></SceneBoundary>
    </div>
  );
}
