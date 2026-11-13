import { equipmentUsage, type EquipmentUsage } from './gym-equipment-usage.ts';
import { STRENGTH_VARIANTS } from './gym-strength-catalog.ts';
export const ZONE_DEFINITIONS = [
  { id: 'receptie', name: 'Recepție', en: 'Reception', color: '#F59E0B', defaultPercent: 5 },
  { id: 'vestiare', name: 'Vestiare', en: 'Changing rooms', color: '#8B5CF6', defaultPercent: 12 },
  { id: 'cardio', name: 'Zona de cardio', en: 'Cardio zone', color: '#EF4444', defaultPercent: 15 },
  { id: 'aparate', name: 'Zona de forță', en: 'Strength zone', color: '#10B981', defaultPercent: 15 },
  { id: 'greutati', name: 'Zona de forță · greutăți libere', en: 'Strength zone · free weights', color: '#3B82F6', defaultPercent: 15 },
  { id: 'functional', name: 'Zona de antrenament funcțional / CrossFit', en: 'Functional training / CrossFit zone', color: '#F97316', defaultPercent: 12 },
  { id: 'studio', name: 'Sala pentru clase', en: 'Group classes room', color: '#EC4899', defaultPercent: 8 },
  { id: 'spa', name: 'Zona de recuperare', en: 'Recovery zone', color: '#84CC16', defaultPercent: 7 },
  { id: 'stretching', name: 'Zona de recuperare · stretching', en: 'Recovery zone · stretching', color: '#06B6D4', defaultPercent: 6 },
  { id: 'auxiliare', name: 'Spații auxiliare', en: 'Support spaces', color: '#64748B', defaultPercent: 5 },
  { id: 'lounge', name: 'Spații auxiliare · lounge', en: 'Support spaces · lounge', color: '#A855F7', defaultPercent: 5 },
];

export const STUDIO_ZONES = ZONE_DEFINITIONS.filter(zone => !['greutati', 'stretching', 'lounge'].includes(zone.id));

export function zoneGroup(id: string) {
  if (id === 'greutati') return 'aparate';
  if (id === 'stretching') return 'spa';
  if (id === 'lounge') return 'auxiliare';
  return id;
}

export function areaZoneId(area: { id: string; zoneId?: string }) {
  if (area.zoneId) return area.zoneId;
  if (area.id.startsWith('vestiare-')) return 'vestiare';
  if (['rig', 'classes-crossfit'].includes(area.id)) return 'functional';
  if (['aerobic', 'zumba', 'children'].includes(area.id)) return 'studio';
  return area.id;
}

export function equipmentMatchesZone(template: EquipmentTemplate, zoneId: string) {
  return template.zone === zoneId || (zoneId === 'cardio' && ['rowing_machine', 'real_rower'].includes(template.id));
}

export function equipmentMatchesArea(template: EquipmentTemplate, area: { id: string; zoneId?: string }) {
  const id = areaZoneId(area);
  return equipmentMatchesZone(template, id) || (id === zoneGroup(id) && id === zoneGroup(template.zone));
}

const legacyZoneNames: Record<string, string[]> = {
  cardio: ['Cardio'],
  aparate: ['Aparate Forță', 'Forță'],
  greutati: ['Greutăți Libere', 'Greutăți libere'],
  functional: ['Functional/Crossfit', 'CrossFit'],
  studio: ['Studio'],
  spa: ['Spa'],
  stretching: ['Stretching'],
  lounge: ['Lounge'],
};

export function studioAreaName(area: { id: string; zoneId?: string; name: string }, locale: string, translate: (name: string) => string) {
  const type = areaZoneId(area);
  if (area.id === 'vestiare-femei') return locale === 'en' ? 'Women’s changing room' : 'Vestiar femei';
  if (area.id === 'vestiare-barbati') return locale === 'en' ? 'Men’s changing room' : 'Vestiar bărbați';
  if (area.id === 'circulatie') return locale === 'en' ? 'Main circulation' : 'Circulație principală';
  const standard = ZONE_DEFINITIONS.find(zone => zone.id === type);
  if (standard && (area.name === standard.name || (!area.zoneId && legacyZoneNames[type]?.includes(area.name)))) {
    return locale === 'en' ? standard.en : standard.name;
  }
  if (area.zoneId) return area.name;
  return translate(area.name);
}

export interface EquipmentTemplate {
  id: string; name: string; zone: string; length_m: number; width_m: number; label: string;
  height_m: number; price_eur: number; usage?: EquipmentUsage;
}
export const EQUIPMENT_CATALOG: EquipmentTemplate[] = [
  // Cardio (3)
  { id: 'banda_alergare', name: 'Bandă Alergare', zone: 'cardio', length_m: 2.0, width_m: 0.8, label: 'Bandă alergare — 2m × 0.8m', height_m: 1.5, price_eur: 3500 },
  { id: 'bicicleta_spinning', name: 'Bicicletă Spinning', zone: 'cardio', length_m: 1.2, width_m: 0.6, label: 'Bicicletă spinning — 1.2m × 0.6m', height_m: 1.3, price_eur: 1100 },
  { id: 'scara_cardio', name: 'Aparat cu trepte', zone: 'cardio', length_m: 1.55, width_m: 0.85, height_m: 2.25, price_eur: 4300, label: 'Aparat cu trepte' },
  { id: 'eliptica', name: 'Eliptică', zone: 'cardio', length_m: 1.8, width_m: 0.7, label: 'Eliptică — 1.8m × 0.7m', height_m: 1.8, price_eur: 2400 },
  // Greutăți Libere (3)
  { id: 'rack_squat', name: 'Rack Squat', zone: 'greutati', length_m: 1.2, width_m: 1.2, label: 'Rack Squat — 1.2m × 1.2m', height_m: 2.3, price_eur: 1800 },
  { id: 'banca_reglabila', name: 'Bancă Reglabilă', zone: 'greutati', length_m: 1.2, width_m: 0.5, label: 'Bancă reglabilă — 1.2m × 0.5m', height_m: 1.1, price_eur: 450 },
  { id: 'suport_gantere', name: 'Suport Gantere', zone: 'greutati', length_m: 2.0, width_m: 0.6, label: 'Suport gantere — 2m × 0.6m', height_m: 1.1, price_eur: 2100 },
  // Aparate Forță (3)
  { id: 'aparat_piept', name: 'Aparat Piept (Chest Press)', zone: 'aparate', length_m: 1.5, width_m: 1.2, label: 'Chest Press — 1.5m × 1.2m', height_m: 1.6, price_eur: 2900 },
  { id: 'aparat_picioare', name: 'Aparat Picioare (Leg Press)', zone: 'aparate', length_m: 2.2, width_m: 1.0, label: 'Leg Press — 2.2m × 1m', height_m: 1.6, price_eur: 3200 },
  { id: 'aparat_lat', name: 'Lat Pulldown', zone: 'aparate', length_m: 1.4, width_m: 1.0, label: 'Lat Pulldown — 1.4m × 1m', height_m: 2.3, price_eur: 2800 },
  ...STRENGTH_VARIANTS.map(({ en: _en, ...model }) => ({ ...model, zone: 'aparate', label: model.name })),
  // Functional/Crossfit (3)
  { id: 'kettlebell', name: 'Kettlebell', zone: 'functional', length_m: 0.25, width_m: 0.2, height_m: 0.3, price_eur: 45, label: 'Kettlebell' },
  { id: 'rig_crossfit', name: 'Rig Crossfit', zone: 'functional', length_m: 3.0, width_m: 1.8, label: 'Rig Crossfit — 3m × 1.8m', height_m: 2.8, price_eur: 4500 },
  { id: 'box_pliometric', name: 'Box Pliometric', zone: 'functional', length_m: 0.6, width_m: 0.5, label: 'Box pliometric — 0.6m × 0.5m', height_m: 0.6, price_eur: 120 },
  { id: 'rowing_machine', name: 'Rowing Machine', zone: 'functional', length_m: 2.4, width_m: 0.6, label: 'Rowing machine — 2.4m × 0.6m', height_m: 1.1, price_eur: 1200 },
  // Studio (2)
  { id: 'oglinda_perete', name: 'Oglindă Perete', zone: 'studio', length_m: 2.0, width_m: 0.1, label: 'Oglindă perete — 2m × 0.1m', height_m: 2, price_eur: 350 },
  { id: 'step_aerobic', name: 'Platformă aerobic', zone: 'studio', length_m: 0.9, width_m: 0.35, height_m: 0.2, price_eur: 65, label: 'Platformă aerobic' },
  { id: 'saltea_yoga', name: 'Saltea Yoga', zone: 'studio', length_m: 1.8, width_m: 0.6, label: 'Saltea yoga — 1.8m × 0.6m', height_m: 0.04, price_eur: 35 },
  // Spa
  { id: 'masa_masaj', name: 'Masă de masaj', zone: 'spa', length_m: 1.9, width_m: 0.72, height_m: 0.8, price_eur: 540, label: 'Masă de masaj' },
  { id: 'cryosauna', name: 'Criosaună', zone: 'spa', length_m: 1.5, width_m: 1.5, label: 'Criosaună — model conceptual, 1.5m × 1.5m', height_m: 2.2, price_eur: 30000 },
  { id: 'sauna', name: 'Cabină Saună', zone: 'spa', length_m: 2.0, width_m: 2.0, label: 'Cabină saună — 2m × 2m', height_m: 2.2, price_eur: 6000 },
  { id: 'jacuzzi', name: 'Jacuzzi', zone: 'spa', length_m: 2.2, width_m: 2.2, label: 'Jacuzzi — 2.2m × 2.2m', height_m: 1, price_eur: 7000 },
  // Recepție (2)
  { id: 'desk_receptie', name: 'Desk Recepție', zone: 'receptie', length_m: 2.0, width_m: 0.7, label: 'Desk recepție — 2m × 0.7m', height_m: 1.1, price_eur: 1600 },
  { id: 'canapea', name: 'Canapea Așteptare', zone: 'receptie', length_m: 1.8, width_m: 0.8, label: 'Canapea — 1.8m × 0.8m', height_m: 0.85, price_eur: 750 },
  // Vestiare (2) - intentionally not in the "stretching" zone since stretching uses studio items
  { id: 'dulap_vestiar', name: 'Dulap Vestiar (x5)', zone: 'vestiare', length_m: 2.5, width_m: 0.5, label: 'Dulapuri vestiar (5) — 2.5m × 0.5m', height_m: 1.9, price_eur: 1100 },
  { id: 'banca_vestiar', name: 'Bancă Vestiar', zone: 'vestiare', length_m: 1.5, width_m: 0.4, label: 'Bancă vestiar — 1.5m × 0.4m', height_m: 0.45, price_eur: 220 },

  { id: 'dus', name: 'Cabină duș', zone: 'vestiare', length_m: 1.0, width_m: 1.0, label: 'Duș', height_m: 2.2, price_eur: 900 },
  { id: 'wc', name: 'Cabină WC', zone: 'vestiare', length_m: 1.5, width_m: 1.2, label: 'WC', height_m: 2.2, price_eur: 800 },
  { id: 'lavoar', name: 'Lavoar', zone: 'vestiare', length_m: 0.6, width_m: 0.5, label: 'Lavoar', height_m: 0.85, price_eur: 180 },
  { id: 'saltea_stretching', name: 'Saltea stretching', zone: 'stretching', length_m: 1.8, width_m: 0.6, label: 'Stretching', height_m: 0.04, price_eur: 35 },
  { id: 'raft_depozitare', name: 'Raft depozitare', zone: 'auxiliare', length_m: 1.2, width_m: 0.45, height_m: 1.8, price_eur: 280, label: 'Raft depozitare' },
  { id: 'canapea_lounge', name: 'Canapea lounge', zone: 'lounge', length_m: 1.8, width_m: 0.8, label: 'Lounge', height_m: 0.85, price_eur: 750 },
  { id: 'person_reception', name: 'Personaj fictiv · recepție', zone: 'receptie', length_m: 0.75, width_m: 0.65, height_m: 1.72, price_eur: 0, label: 'Recepționer' },
  { id: 'person_coach', name: 'Personaj fictiv · antrenor', zone: 'functional', length_m: 0.85, width_m: 0.75, height_m: 1.83, price_eur: 0, label: 'Antrenor' },
  { id: 'sled_training', name: 'Sanie cu discuri', zone: 'functional', length_m: 1.3, width_m: 2.8, height_m: 1.75, price_eur: 550, label: 'Sanie cu discuri' },
  ...IMPORTED_EQUIPMENT.map(model => ({ ...model, usage: equipmentUsage(model.id) })),
  ...REAL_EQUIPMENT.map(model => ({ ...model, usage: equipmentUsage(model.id) })),
];

import { IMPORTED_EQUIPMENT } from './gym-imported-equipment.ts';


import { REAL_EQUIPMENT } from './gym-real-equipment.ts';
