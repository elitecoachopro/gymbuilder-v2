'use client';

import { memo } from 'react';
import { FictionalPerson, SledTraining } from './FitnessPeople';
import { EQUIPMENT_CATALOG } from '@/lib/gym-catalog';
import { Ball, Foot, Pad, Part, Rod, Wheel } from './EquipmentParts';
import ReferenceEquipmentModel from './ReferenceEquipmentModel';
import { isOriginalReferenceModel } from '@/lib/gym-reference-identity';
import ImportedEquipmentModel from './ImportedEquipmentModel';
import StrengthEquipment from './StrengthEquipment';
import { STRENGTH_VARIANTS } from '@/lib/gym-strength-catalog';
import CardioEquipment from './CardioEquipment';
import { importedEquipment } from '@/lib/gym-imported-equipment';

function Console({ x, y, width = 0.62 }: { x: number; y: number; width?: number }) {
  return <group position={[x, y, 0]} rotation={[0, 0, -0.16]}>
    <Part p={[0, 0, 0]} s={[0.17, 0.31, width]} finish="shell" />
    <Part p={[0.09, 0.035, 0]} s={[0.012, 0.19, width * 0.55]} finish="screen" />
    {[0, 1, 2].map(i => <Part key={i} p={[0.098, 0.08 - i * 0.045, -width * 0.12]} s={[0.006, 0.012, width * (0.23 - i * 0.035)]} finish="light" sharp />)}
    {[-1, 1].map(side => <Wheel key={side} p={[0.09, -0.085, side * width * 0.34]} radius={0.025} depth={0.012} axis="x" finish="accent" hub={false} />)}
  </group>;
}
function Rower() {
  return <group>
    <Wheel p={[-0.85, 0.37, 0]} radius={0.3} depth={0.22} finish="shell" />
    <Wheel p={[-0.85, 0.37, 0]} radius={0.23} depth={0.23} finish="rubber" />
    {Array.from({ length: 10 }, (_, i) => <Rod key={i} a={[-0.85, 0.37, 0.125]} b={[-0.85 + Math.cos(i * Math.PI / 5) * 0.21, 0.37 + Math.sin(i * Math.PI / 5) * 0.21, 0.125]} radius={0.006} finish="chrome" />)}
    <Foot x={-0.8} z={0} /><Foot x={0.99} z={0} />
    <Part p={[0.16, 0.23, 0]} s={[1.9, 0.1, 0.08]} finish="chrome" />
    <Pad p={[0.3, 0.36, 0]} s={[0.29, 0.1, 0.32]} />
    <Rod a={[-0.78, 0.5, 0]} b={[-0.37, 0.66, 0]} radius={0.005} finish="rubber" />
    <Rod a={[-0.37, 0.66, -0.2]} b={[-0.37, 0.66, 0.2]} radius={0.018} finish="rubber" />
    {[-1, 1].map(side => <Part key={side} p={[-0.48, 0.28, side * 0.19]} s={[0.25, 0.05, 0.15]} r={[0, 0, 0.5]} finish="rubber" />)}
    <Rod a={[-0.85, 0.6, 0]} b={[-0.55, 0.95, 0]} radius={0.015} />
    <Console x={-0.54} y={0.9} width={0.16} />
  </group>;
}
function Bench() {
  return <group>
    <Foot x={-0.42} z={0} width={0.47} /><Foot x={0.43} z={0} width={0.47} />
    <Rod a={[-0.42, 0.08, 0]} b={[-0.1, 0.38, 0]} radius={0.035} />
    <Rod a={[0.43, 0.08, 0]} b={[0.25, 0.37, 0]} radius={0.035} />
    <Rod a={[-0.45, 0.29, 0]} b={[0.45, 0.29, 0]} radius={0.032} />
    <Pad p={[-0.17, 0.59, 0]} s={[0.78, 0.095, 0.3]} r={[0, 0, -0.52]} />
    <Pad p={[0.37, 0.405, 0]} s={[0.3, 0.095, 0.3]} />
    <Rod a={[-0.32, 0.3, 0]} b={[-0.36, 0.68, 0]} radius={0.018} finish="chrome" />
    <Part p={[-0.12, 0.34, 0.09]} s={[0.52, 0.035, 0.035]} finish="accent" r={[0, 0, 0.25]} />
    <Wheel p={[0.2, 0.4, 0]} radius={0.035} depth={0.36} finish="accent" />
    {[-1, 1].map(side => <Wheel key={side} p={[-0.47, 0.075, side * 0.18]} radius={0.055} depth={0.04} hub={false} />)}
  </group>;
}
function Rack({ rig = false }: { rig?: boolean }) {
  const half = rig ? 1.32 : 0.48, depth = rig ? 0.72 : 0.47, height = rig ? 2.7 : 2.22;
  return <group>
    {[-half, half].flatMap(x => [-depth, depth].map(z => <group key={`${x}-${z}`}>
      <Part p={[x, 0.03, z]} s={[0.18, 0.06, 0.18]} finish="rubber" />
      <Part p={[x, height / 2 + 0.04, z]} s={[0.07, height, 0.07]} />
      {Array.from({ length: 12 }, (_, i) => <Part key={i} p={[x, 0.45 + i * 0.115, z + 0.036]} s={[0.018, 0.018, 0.004]} finish="rubber" sharp />)}
      <Wheel p={[x, 0.14, z + 0.041]} radius={0.018} depth={0.012} finish="chrome" hub={false} />
    </group>))}
    {[-depth, depth].map(z => <Rod key={z} a={[-half, height, z]} b={[half, height, z]} radius={0.025} />)}
    {[-half, half].map(x => <group key={x}><Part p={[x, 0.25, 0]} s={[0.06, 0.06, depth * 2]} /><Rod a={[x, 1.2, -depth]} b={[x, 1.2, depth]} radius={0.022} finish="chrome" /></group>)}
    {!rig && <><Rod a={[-0.585, 1.35, 0]} b={[0.585, 1.35, 0]} radius={0.014} finish="chrome" />{[-1, 1].map(side => <group key={side}>
      <Wheel p={[side * 0.52, 1.35, 0]} radius={0.215} depth={0.045} axis="x" />
      <Wheel p={[side * 0.56, 1.35, 0]} radius={0.17} depth={0.025} axis="x" />
      <Part p={[side * 0.48, 1.31, 0]} s={[0.08, 0.07, 0.15]} finish="accent" />
    </group>)}</>}
    {rig && [-0.65, 0.65].map(x => <group key={x}><Rod a={[x, height, 0]} b={[x, 1.8, 0]} radius={0.008} finish="rubber" />{[-0.1, 0.1].map(z => <Wheel key={z} p={[x, 1.68, z]} radius={0.11} depth={0.025} finish="wood" hub={false} />)}</group>)}
  </group>;
}
function Dumbbells() {
  return <group>
    {[-0.84, 0.84].map(x => <group key={x}><Foot x={x} z={0} width={0.55} /><Rod a={[x, 0.08, -0.22]} b={[x, 0.98, 0.12]} radius={0.03} /></group>)}
    {[0.43, 0.85].map(y => <group key={y}><Part p={[0, y, 0]} s={[1.93, 0.045, 0.43]} />{Array.from({ length: 6 }, (_, i) => <group key={i}>
      <Rod a={[-0.77 + i * 0.3, y + 0.09, -0.13]} b={[-0.77 + i * 0.3, y + 0.09, 0.13]} radius={0.014} finish="chrome" />
      {[-1, 1].map(side => <Wheel key={side} p={[-0.77 + i * 0.3, y + 0.09, side * 0.14]} radius={0.065 + i * 0.005} depth={0.075} />)}
    </group>)}</group>)}
  </group>;
}
function Reception() {
  return <group>
    <Part p={[0, 0.48, 0]} s={[1.94, 0.96, 0.61]} finish="wood" />
    <Part p={[0, 1.04, 0]} s={[2, 0.1, 0.7]} finish="ceramic" />
    {Array.from({ length: 20 }, (_, i) => <Part key={i} p={[-0.92 + i * 0.097, 0.51, 0.315]} s={[0.025, 0.84, 0.025]} finish="wood" sharp />)}
    <Part p={[0, 0.09, 0.32]} s={[1.8, 0.025, 0.012]} finish="accent" />
    <Part p={[0.5, 0.92, -0.13]} s={[0.04, 0.22, 0.3]} finish="screen" />
    <Rod a={[0.5, 0.8, -0.13]} b={[0.5, 0.86, -0.13]} radius={0.02} finish="chrome" />
  </group>;
}
function Sofa() {
  return <group>
    {[-0.72, 0.72].flatMap(x => [-0.28, 0.28].map(z => <Rod key={`${x}-${z}`} a={[x, 0.01, z]} b={[x, 0.17, z]} radius={0.025} finish="chrome" />))}
    <Part p={[0, 0.25, 0]} s={[1.73, 0.21, 0.73]} finish="pad" />
    {[-0.4, 0.4].map(x => <Pad key={x} p={[x, 0.43, 0.05]} s={[0.77, 0.18, 0.57]} />)}
    <Pad p={[0, 0.64, -0.29]} s={[1.69, 0.39, 0.21]} />
    {[-0.81, 0.81].map(x => <Pad key={x} p={[x, 0.5, 0]} s={[0.15, 0.4, 0.77]} />)}
  </group>;
}
function Lockers() {
  return <group><Part p={[0, 0.95, 0]} s={[2.48, 1.9, 0.42]} />{[-1, -0.5, 0, 0.5, 1].map(x => <group key={x}>
    <Part p={[x, 0.96, 0.215]} s={[0.475, 1.82, 0.02]} finish="wood" />
    <Rod a={[x + 0.16, 0.85, 0.237]} b={[x + 0.16, 1.01, 0.237]} radius={0.008} finish="chrome" />
    <Wheel p={[x + 0.16, 1.04, 0.23]} radius={0.012} depth={0.01} finish="accent" hub={false} />
    {[1.52, 1.56, 1.6].map(y => <Part key={y} p={[x, y, 0.228]} s={[0.17, 0.008, 0.006]} finish="rubber" sharp />)}
  </group>)}</group>;
}
function Shower() {
  return <group><Part p={[0, 0.04, 0]} s={[0.98, 0.08, 0.98]} finish="ceramic" /><Part p={[0, 1.13, -0.47]} s={[0.96, 2.1, 0.035]} finish="ceramic" />
    <Part p={[-0.47, 1.13, 0]} s={[0.02, 2.1, 0.94]} finish="glass" sharp />
    <Rod a={[0.16, 0.75, -0.43]} b={[0.16, 2.03, -0.43]} radius={0.014} finish="chrome" />
    <Rod a={[0.16, 2.03, -0.43]} b={[0.16, 2.03, -0.14]} radius={0.014} finish="chrome" />
    <Part p={[0.16, 2.02, -0.1]} s={[0.2, 0.025, 0.2]} finish="chrome" />
    <Wheel p={[0.16, 1.02, -0.42]} radius={0.035} depth={0.02} finish="chrome" />
    <Part p={[0, 0.086, 0]} s={[0.1, 0.005, 0.1]} finish="chrome" />
  </group>;
}
function Toilet() {
  return <group>
    <Part p={[0, 1.1, -0.57]} s={[1.45, 2.2, 0.035]} finish="ceramic" />
    <Part p={[-0.72, 1.1, 0]} s={[0.035, 2.2, 1.16]} finish="shell" />
    <Part p={[0.1, 0.66, -0.37]} s={[0.39, 0.7, 0.17]} finish="ceramic" />
    <Ball p={[0.1, 0.36, -0.13]} s={[0.23, 0.12, 0.3]} finish="ceramic" />
    <Ball p={[0.1, 0.47, -0.13]} s={[0.18, 0.015, 0.23]} finish="rubber" />
    <Ball p={[0.1, 0.3, -0.15]} s={[0.17, 0.26, 0.2]} finish="ceramic" />
    <Part p={[0.1, 1.02, -0.37]} s={[0.05, 0.01, 0.04]} finish="chrome" />
  </group>;
}
function Basin() {
  return <group>
    <Part p={[0, 0.37, 0]} s={[0.55, 0.72, 0.43]} finish="wood" />
    <Part p={[0, 0.76, 0]} s={[0.6, 0.1, 0.5]} finish="ceramic" />
    <Ball p={[0, 0.815, 0.01]} s={[0.19, 0.007, 0.14]} finish="shell" />
    <Rod a={[0, 0.79, -0.17]} b={[0, 0.85, -0.17]} radius={0.014} finish="chrome" />
    <Rod a={[0, 0.85, -0.17]} b={[0, 0.85, -0.05]} radius={0.014} finish="chrome" />
  </group>;
}
function Model({ templateId }: { templateId: string }) {
  const strength = STRENGTH_VARIANTS.find(model => model.id === templateId);
  if (strength) return <StrengthEquipment type={strength.id} />;
  switch (templateId) {
    case 'person_reception': return <FictionalPerson pose="reception"/>;
    case 'person_coach': return <FictionalPerson pose="coach"/>;
    case 'sled_training': return <SledTraining/>;
    case 'banda_alergare': case 'bicicleta_spinning': case 'eliptica': return <CardioEquipment type={templateId} />;
    case 'rowing_machine': return <Rower />;
    case 'banca_reglabila': return <Bench />;
    case 'rack_squat': return <Rack />;
    case 'rig_crossfit': return <Rack rig />;
    case 'suport_gantere': return <Dumbbells />;
    case 'aparat_piept': case 'aparat_lat': case 'aparat_picioare': return <StrengthEquipment type={templateId} />;
    case 'desk_receptie': return <Reception />;
    case 'canapea': case 'canapea_lounge': return <Sofa />;
    case 'dulap_vestiar': return <Lockers />;
    case 'banca_vestiar': return <group><Foot x={-0.58} z={0} width={0.35} /><Foot x={0.58} z={0} width={0.35} />{[-0.135, -0.045, 0.045, 0.135].map(z => <Part key={z} p={[0, 0.42, z]} s={[1.5, 0.06, 0.08]} finish="wood" />)}<Rod a={[-0.58, 0.07, 0]} b={[-0.58, 0.4, 0]} /><Rod a={[0.58, 0.07, 0]} b={[0.58, 0.4, 0]} /></group>;
    case 'dus': return <Shower />;
    case 'wc': return <Toilet />;
    case 'lavoar': return <Basin />;
    case 'saltea_yoga': case 'saltea_stretching': return <group><Part p={[0, 0.02, 0]} s={[1.8, 0.04, 0.6]} finish="pad" />{[-0.76, 0.76].map(x => <Part key={x} p={[x, 0.041, 0]} s={[0.008, 0.001, 0.5]} finish="accent" sharp />)}</group>;
    case 'box_pliometric': return <group><Part p={[0, 0.3, 0]} s={[0.6, 0.6, 0.5]} finish="wood" />{[-1, 1].map(side => <Part key={side} p={[side * 0.302, 0.37, 0]} s={[0.002, 0.055, 0.15]} finish="rubber" />)}<Part p={[0, 0.604, 0]} s={[0.51, 0.008, 0.41]} finish="rubber" /></group>;
    case 'oglinda_perete': return <group><Part p={[0, 1, 0]} s={[2, 2, 0.08]} /><Part p={[0, 1, 0.045]} s={[1.93, 1.93, 0.008]} finish="chrome" /></group>;
    case 'sauna': return <group><Part p={[0, 1.1, -0.96]} s={[2, 2.2, 0.08]} finish="wood" />{[-0.96, 0.96].map(x => <Part key={x} p={[x, 1.1, 0]} s={[0.08, 2.2, 2]} finish="wood" />)}<Part p={[0, 2.15, 0]} s={[2, 0.1, 2]} finish="wood" /><Part p={[0, 1.05, 0.96]} s={[1.9, 2.1, 0.02]} finish="glass" sharp /><Part p={[0, 0.45, -0.6]} s={[1.8, 0.09, 0.5]} finish="wood" /></group>;
    case 'jacuzzi': return <group><Part p={[0, 0.48, 0]} s={[2.2, 0.96, 2.2]} finish="wood" /><Part p={[0, 0.97, 0]} s={[2.1, 0.06, 2.1]} finish="ceramic" /><Part p={[0, 0.985, 0]} s={[1.75, 0.01, 1.75]} finish="screen" /></group>;
    default: return null;
  }
}
export default memo(function EquipmentModel({ templateId, frame, upholstery }: { templateId: string; frame: string; upholstery: string }) {
  if (isOriginalReferenceModel(templateId)) return <ReferenceEquipmentModel templateId={templateId} frame={frame} upholstery={upholstery} />;
  const imported = importedEquipment(templateId);
  if (imported) return <ImportedEquipmentModel equipment={imported} frame={frame} upholstery={upholstery} />;
  if (!EQUIPMENT_CATALOG.some(template => template.id === templateId)) return null;
  return <Model templateId={templateId} />;
});
