'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
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
  lengthM: number;
  widthM: number;
  zones: ZoneData[];
}

const WALL_HEIGHT = 3;
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

function Walls({ length, width }: { length: number; width: number }) {
  return (
    <group>
      {/* Back wall (z=0) */}
      <mesh position={[length / 2, WALL_HEIGHT / 2, 0]}>
        <boxGeometry args={[length, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.6} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Front wall (z=width) - more transparent so user can see inside */}
      <mesh position={[length / 2, WALL_HEIGHT / 2, width]}>
        <boxGeometry args={[length, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.6} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      {/* Left wall (x=0) */}
      <mesh position={[0, WALL_HEIGHT / 2, width / 2]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, width]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.6} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Right wall (x=length) - more transparent */}
      <mesh position={[length, WALL_HEIGHT / 2, width / 2]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, width]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.6} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function ZoneMesh({ zone, totalLength, totalWidth }: { zone: ZoneData; totalLength: number; totalWidth: number }) {
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
        <planeGeometry args={[zoneW - 0.05, zoneD - 0.05]} />
        <meshStandardMaterial color={zone.color} roughness={0.4} transparent opacity={0.6} />
      </mesh>

      {/* Zone border edge */}
      <mesh position={[centerX, 0.03, centerZ]}>
        <boxGeometry args={[zoneW, 0.06, zoneD]} />
        <meshStandardMaterial color={zone.color} roughness={0.3} transparent opacity={0.2} />
      </mesh>

      {/* Zone label using Html overlay (no font loading issues) */}
      <Html
        position={[centerX, 0.1, centerZ]}
        center
        distanceFactor={Math.max(totalLength, totalWidth) * 0.8}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          textAlign: 'center',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}>
          <div style={{
            color: 'white',
            fontSize: '12px',
            fontWeight: 600,
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            lineHeight: 1.2,
          }}>
            {zone.name}
          </div>
          <div style={{
            color: '#ccc',
            fontSize: '10px',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          }}>
            {zone.area.toFixed(0)} m²
          </div>
        </div>
      </Html>
    </group>
  );
}

function SimpleGrid({ length, width }: { length: number; width: number }) {
  const size = Math.max(length, width) * 1.2;
  const divisions = Math.round(size);
  return (
    <gridHelper
      args={[size, divisions, '#333333', '#222222']}
      position={[length / 2, -0.01, width / 2]}
    />
  );
}

// Invalidate on orbit for demand frameloop
function Invalidator() {
  const ref = useRef(0);
  useFrame(({ invalidate }) => {
    if (ref.current < 3) {
      invalidate();
      ref.current++;
    }
  });
  return null;
}

export default function GymScene3D({ lengthM, widthM, zones }: GymScene3DProps) {
  const cameraDistance = Math.max(lengthM, widthM) * 1.2;

  return (
    <div className="w-full h-[500px] sm:h-[600px] rounded-xl overflow-hidden border border-anthracite-700" style={{ background: '#0a0a0f' }}>
      <Canvas
        shadows
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        frameloop="always"
        onCreated={({ gl }) => {
          gl.setClearColor('#0a0a0f');
        }}
      >
        <PerspectiveCamera
          makeDefault
          position={[lengthM * 0.7, cameraDistance * 0.6, widthM * 1.3]}
          fov={50}
          near={0.1}
          far={200}
        />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[lengthM / 2, WALL_HEIGHT * 3, widthM / 2]}
          intensity={0.7}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
        />
        <pointLight position={[lengthM * 0.25, WALL_HEIGHT - 0.5, widthM * 0.25]} intensity={0.2} />
        <pointLight position={[lengthM * 0.75, WALL_HEIGHT - 0.5, widthM * 0.75]} intensity={0.2} />

        {/* Scene */}
        <Floor length={lengthM} width={widthM} />
        <Walls length={lengthM} width={widthM} />
        <SimpleGrid length={lengthM} width={widthM} />

        {/* Zones */}
        {zones.map((zone) => (
          <ZoneMesh
            key={zone.id}
            zone={zone}
            totalLength={lengthM}
            totalWidth={widthM}
          />
        ))}

        {/* Controls */}
        <OrbitControls
          target={[lengthM / 2, 0, widthM / 2]}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={2}
          maxDistance={cameraDistance * 2.5}
          enableDamping
          dampingFactor={0.1}
        />
      </Canvas>
    </div>
  );
}
