'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, PerspectiveCamera } from '@react-three/drei';
import { useMemo } from 'react';
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
const CEILING_OPACITY = 0;

// Convert hex color to a slightly lighter version for 3D
function hexToThreeColor(hex: string): string {
  return hex;
}

function Floor({ length, width }: { length: number; width: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[length / 2, 0, width / 2]} receiveShadow>
      <planeGeometry args={[length, width]} />
      <meshStandardMaterial color={FLOOR_COLOR} roughness={0.8} />
    </mesh>
  );
}

function Walls({ length, width }: { length: number; width: number }) {
  const wallMaterial = useMemo(() => (
    <meshStandardMaterial color={WALL_COLOR} roughness={0.6} side={THREE.DoubleSide} />
  ), []);

  return (
    <group>
      {/* Back wall (z=0) */}
      <mesh position={[length / 2, WALL_HEIGHT / 2, 0]}>
        <boxGeometry args={[length, WALL_HEIGHT, WALL_THICKNESS]} />
        {wallMaterial}
      </mesh>
      {/* Front wall (z=width) */}
      <mesh position={[length / 2, WALL_HEIGHT / 2, width]}>
        <boxGeometry args={[length, WALL_HEIGHT, WALL_THICKNESS]} />
        {wallMaterial}
      </mesh>
      {/* Left wall (x=0) */}
      <mesh position={[0, WALL_HEIGHT / 2, width / 2]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, width]} />
        {wallMaterial}
      </mesh>
      {/* Right wall (x=length) */}
      <mesh position={[length, WALL_HEIGHT / 2, width / 2]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, width]} />
        {wallMaterial}
      </mesh>
    </group>
  );
}

function ZoneMesh({ zone, totalLength, totalWidth }: { zone: ZoneData; totalLength: number; totalWidth: number }) {
  // Convert zone percentages to actual meters
  const zoneX = (zone.x / 100) * totalLength;
  const zoneZ = (zone.y / 100) * totalWidth;
  const zoneW = (zone.width / 100) * totalLength;
  const zoneD = (zone.height / 100) * totalWidth;

  const centerX = zoneX + zoneW / 2;
  const centerZ = zoneZ + zoneD / 2;

  return (
    <group>
      {/* Zone floor surface (slightly above main floor) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, 0.01, centerZ]}
        receiveShadow
      >
        <planeGeometry args={[zoneW - 0.05, zoneD - 0.05]} />
        <meshStandardMaterial
          color={hexToThreeColor(zone.color)}
          roughness={0.4}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Zone border (thin raised edge) */}
      <mesh position={[centerX, 0.02, centerZ]}>
        <boxGeometry args={[zoneW, 0.04, zoneD]} />
        <meshStandardMaterial
          color={hexToThreeColor(zone.color)}
          roughness={0.3}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Zone label */}
      <Text
        position={[centerX, 0.05, centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={Math.min(zoneW, zoneD) * 0.12}
        maxWidth={zoneW * 0.9}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="black"
      >
        {zone.name}
      </Text>

      {/* Area label */}
      <Text
        position={[centerX, 0.05, centerZ + Math.min(zoneD * 0.25, 0.8)]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={Math.min(zoneW, zoneD) * 0.08}
        color="#cccccc"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="black"
      >
        {zone.area.toFixed(1)} m²
      </Text>
    </group>
  );
}

function GridHelper({ length, width }: { length: number; width: number }) {
  const size = Math.max(length, width);
  return (
    <gridHelper
      args={[size * 1.5, Math.round(size * 1.5), '#333333', '#222222']}
      position={[length / 2, -0.01, width / 2]}
    />
  );
}

export default function GymScene3D({ lengthM, widthM, zones }: GymScene3DProps) {
  const cameraDistance = Math.max(lengthM, widthM) * 1.2;

  return (
    <div className="w-full h-[500px] sm:h-[600px] rounded-xl overflow-hidden border border-anthracite-700 bg-anthracite-950">
      <Canvas
        shadows
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        frameloop="demand"
      >
        <PerspectiveCamera
          makeDefault
          position={[lengthM * 0.7, cameraDistance * 0.6, widthM * 1.3]}
          fov={50}
          near={0.1}
          far={200}
        />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[lengthM / 2, WALL_HEIGHT * 2, widthM / 2]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[lengthM * 0.25, WALL_HEIGHT - 0.5, widthM * 0.25]} intensity={0.3} />
        <pointLight position={[lengthM * 0.75, WALL_HEIGHT - 0.5, widthM * 0.75]} intensity={0.3} />

        {/* Scene */}
        <Floor length={lengthM} width={widthM} />
        <Walls length={lengthM} width={widthM} />
        <GridHelper length={lengthM} width={widthM} />

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
          makeDefault
        />
      </Canvas>
    </div>
  );
}
