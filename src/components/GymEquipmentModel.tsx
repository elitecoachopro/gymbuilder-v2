'use client';

import { Instance, Instances } from '@react-three/drei';
import { importedEquipment } from '@/lib/gym-imported-equipment';
import ImportedEquipmentModel from './studio/ImportedEquipmentModel';

function Part({ p, s, color = '#464b55', rotation = 0 }: { p: [number, number, number]; s: [number, number, number]; color?: string; rotation?: number }) {
  return <Instance position={p} rotation={[0, 0, rotation]} scale={s} color={color} />;
}
function Wheel({ p, radius = 0.2 }: { p: [number, number, number]; radius?: number }) {
  return <mesh position={p} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[radius, radius, 0.12, 16]} /><meshStandardMaterial color="#22262e" metalness={0.4} roughness={0.4} /></mesh>;
}
function Barbell({ y = 0.65 }: { y?: number }) {
  return <group><Part p={[0, y, 0]} s={[0.9, 0.025, 0.035]} color="#b7c0ca" />{[-0.34, 0.34].map(x => <mesh key={x} position={[x, y, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.16, 0.16, 0.07, 12]} /><meshStandardMaterial color="#262b35" /></mesh>)}</group>;
}
function ModelParts({ templateId, accent = '#dbb44a' }: { templateId: string; accent?: string }) {
  if (templateId === 'banda_alergare') return <group>
    <Part p={[0, 0.07, 0]} s={[1, 0.14, 0.96]} /><Part p={[0.03, 0.15, 0]} s={[0.81, 0.03, 0.73]} color="#15191f" />
    {[-0.4, 0.4].map(z => <group key={z}><Part p={[-0.34, 0.49, z]} s={[0.045, 0.7, 0.045]} /><Part p={[-0.18, 0.73, z]} s={[0.4, 0.04, 0.055]} /></group>)}
    <Part p={[-0.35, 0.9, 0]} s={[0.16, 0.16, 0.65]} color={accent} /><Part p={[-0.25, 0.92, 0]} s={[0.025, 0.1, 0.25]} color="#101f2d" />
  </group>;
  if (['bicicleta_spinning', 'eliptica', 'rowing_machine'].includes(templateId)) return <group>
    <Part p={[0, 0.06, 0]} s={[0.95, 0.1, 0.7]} /><Wheel p={[-0.22, 0.3, 0]} radius={0.22} />
    <Part p={[0.1, 0.36, 0]} s={[0.055, 0.6, 0.07]} rotation={-0.35} /><Part p={[0.22, 0.65, 0]} s={[0.23, 0.06, 0.4]} color={accent} />
    <Part p={[-0.34, 0.61, 0]} s={[0.045, 0.6, 0.05]} /><Part p={[-0.34, 0.9, 0]} s={[0.08, 0.04, 0.7]} />
    {templateId === 'eliptica' && [-0.35, 0.35].map(z => <Part key={z} p={[-0.3, 0.65, z]} s={[0.04, 0.7, 0.05]} />)}
    {templateId === 'rowing_machine' && <Part p={[0.18, 0.22, 0]} s={[0.6, 0.06, 0.15]} color="#a4a9af" />}
  </group>;
  if (['rack_squat', 'rig_crossfit'].includes(templateId)) return <group>
    {[-0.4, 0.4].flatMap(x => [-0.4, 0.4].map(z => <Part key={`${x}-${z}`} p={[x, 0.5, z]} s={[0.06, 1, 0.07]} />))}
    {[-0.4, 0.4].map(z => <Part key={z} p={[0, 0.96, z]} s={[0.86, 0.04, 0.05]} color={accent} />)}
    <Part p={[0, 0.03, 0]} s={[0.97, 0.05, 0.98]} /><Barbell />
  </group>;
  if (['banca_reglabila', 'banca_vestiar'].includes(templateId)) return <group>
    {[-0.32, 0.32].map(x => <Part key={x} p={[x, 0.25, 0]} s={[0.07, 0.5, 0.7]} />)}
    <Part p={[0, 0.55, 0]} s={[0.98, 0.12, 0.9]} color={templateId === 'banca_vestiar' ? '#b08c56' : accent} />
    {templateId === 'banca_reglabila' && <Part p={[-0.22, 0.78, 0]} s={[0.6, 0.1, 0.85]} color="#232936" rotation={-0.45} />}
  </group>;
  if (templateId === 'suport_gantere') return <group>
    {[-0.42, 0.42].map(x => <Part key={x} p={[x, 0.4, 0]} s={[0.06, 0.8, 0.8]} />)}
    {[0.4, 0.75].map(y => <group key={y}><Part p={[0, y, 0]} s={[0.96, 0.04, 0.75]} />{[-0.35, -0.12, 0.12, 0.35].map(x => <group key={x}><Part p={[x, y + 0.07, 0]} s={[0.035, 0.03, 0.5]} color="#a8adb4" />{[-0.2, 0.2].map(z => <Part key={z} p={[x, y + 0.08, z]} s={[0.14, 0.12, 0.12]} color="#15191f" />)}</group>)}</group>)}
  </group>;
  if (['aparat_piept', 'aparat_picioare', 'aparat_lat'].includes(templateId)) return <group>
    <Part p={[0, 0.04, 0]} s={[0.95, 0.08, 0.96]} /><Part p={[-0.35, 0.5, 0]} s={[0.12, 1, 0.75]} />
    <Part p={[-0.28, 0.35, 0]} s={[0.16, 0.55, 0.45]} color="#1a1e27" /><Part p={[0.15, 0.3, 0]} s={[0.5, 0.12, 0.6]} color={accent} />
    <Part p={[-0.04, 0.5, 0]} s={[0.08, 0.38, 0.6]} color={accent} />
    {templateId === 'aparat_lat' ? <><Part p={[0, 0.97, 0]} s={[0.8, 0.035, 0.05]} /><Part p={[0.35, 0.87, 0]} s={[0.04, 0.025, 0.9]} /></> : <Part p={[0.37, 0.58, 0]} s={[0.07, 0.4, 0.84]} />}
  </group>;
  if (['saltea_yoga', 'saltea_stretching', 'oglinda_perete', 'box_pliometric'].includes(templateId)) return <Part p={[0, 0.5, 0]} s={[0.98, 1, 0.98]} color={templateId === 'oglinda_perete' ? '#b7d2df' : templateId === 'box_pliometric' ? '#ae8e60' : '#3f958a'} />;
  if (['desk_receptie', 'lavoar'].includes(templateId)) return <group>
    <Part p={[0, 0.42, 0]} s={[0.94, 0.84, 0.85]} color="#a27d45" /><Part p={[0, 0.86, 0]} s={[1, 0.08, 1]} color="#dfdcd4" />
    {templateId === 'desk_receptie' ? <><Part p={[0, 0.55, 0.44]} s={[0.7, 0.08, 0.02]} color={accent} /><Part p={[0, 0.95, -0.1]} s={[0.26, 0.1, 0.06]} color="#212b36" /></> : <><Part p={[0, 0.92, 0]} s={[0.65, 0.06, 0.6]} color="#a2bcc7" /><Part p={[0.25, 0.9, -0.2]} s={[0.035, 0.2, 0.04]} color="#c3c7cc" /></>}
  </group>;
  if (['canapea', 'canapea_lounge'].includes(templateId)) return <group>
    <Part p={[0, 0.35, 0]} s={[0.9, 0.45, 0.85]} color="#465b62" /><Part p={[0, 0.72, -0.35]} s={[0.96, 0.55, 0.2]} color="#536d76" />
    {[-0.44, 0.44].map(x => <Part key={x} p={[x, 0.57, 0]} s={[0.12, 0.3, 0.9]} color="#536d76" />)}
  </group>;
  if (templateId === 'dulap_vestiar') return <group>{[-0.4, -0.2, 0, 0.2, 0.4].map(x => <group key={x}><Part p={[x, 0.5, 0]} s={[0.185, 1, 0.96]} color="#596375" /><Part p={[x + 0.05, 0.5, 0.49]} s={[0.015, 0.1, 0.025]} color={accent} /><Part p={[x, 0.85, 0.49]} s={[0.1, 0.025, 0.02]} color="#1c2533" /></group>)}</group>;
  if (['dus', 'wc', 'sauna'].includes(templateId)) return <group>
    <Part p={[0, 0.02, 0]} s={[0.98, 0.04, 0.98]} color="#d5cfc2" />
    <Part p={[0, 0.5, -0.47]} s={[0.98, 1, 0.045]} color={templateId === 'sauna' ? '#bc975d' : '#bec9cc'} /><Part p={[-0.47, 0.5, 0]} s={[0.045, 1, 0.98]} color={templateId === 'sauna' ? '#bc975d' : '#bec9cc'} />
    {templateId === 'dus' ? <><Part p={[0.2, 0.55, -0.4]} s={[0.025, 0.7, 0.025]} color="#d9dde2" /><Part p={[0.2, 0.91, -0.3]} s={[0.23, 0.025, 0.25]} color="#d9dde2" /></> : templateId === 'wc' ? <><Part p={[0, 0.17, 0]} s={[0.4, 0.32, 0.55]} color="#f5f5ef" /><Part p={[0, 0.3, -0.25]} s={[0.45, 0.35, 0.15]} color="#f5f5ef" /><Part p={[0, 0.35, 0.06]} s={[0.39, 0.04, 0.46]} color="#c8d4d7" /></> : [0.25, 0.5].map(y => <Part key={y} p={[0, y, -0.22]} s={[0.8, 0.04, 0.4]} color="#a97d42" />)}
  </group>;
  return <group><Part p={[0, 0.25, 0]} s={[0.98, 0.5, 0.98]} color="#e1ddd3" /><Part p={[0, 0.51, 0]} s={[0.78, 0.02, 0.78]} color="#398a9d" />{[-0.44, 0.44].map(x => <Part key={x} p={[x, 0.6, 0]} s={[0.1, 0.2, 0.98]} color="#ece9e0" />)}</group>;
}

export default function GymEquipmentModel(props: { templateId: string; accent?: string }) {
  const imported = importedEquipment(props.templateId);
  if (imported) return <group scale={[1 / imported.length_m, 1 / imported.height_m, 1 / imported.width_m]}><ImportedEquipmentModel equipment={imported} upholstery={props.accent} /></group>;
  return <Instances limit={48} castShadow receiveShadow><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial roughness={0.55} metalness={0.3} /><ModelParts {...props} /></Instances>;
}
