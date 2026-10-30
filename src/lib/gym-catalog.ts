import { equipmentUsage, type EquipmentUsage } from './gym-equipment-usage.ts';
import { STRENGTH_VARIANTS } from './gym-strength-catalog.ts';
export const ZONE_DEFINITIONS = [
  { id: 'receptie', name: 'Recepție', color: '#F59E0B', defaultPercent: 5 },
  { id: 'vestiare', name: 'Vestiare', color: '#8B5CF6', defaultPercent: 12 },
  { id: 'cardio', name: 'Cardio', color: '#EF4444', defaultPercent: 15 },
  { id: 'greutati', name: 'Greutăți Libere', color: '#3B82F6', defaultPercent: 15 },
  { id: 'aparate', name: 'Aparate Forță', color: '#10B981', defaultPercent: 15 },
  { id: 'functional', name: 'Functional/Crossfit', color: '#F97316', defaultPercent: 12 },
  { id: 'studio', name: 'Studio', color: '#EC4899', defaultPercent: 8 },
  { id: 'stretching', name: 'Stretching', color: '#06B6D4', defaultPercent: 6 },
  { id: 'spa', name: 'Spa', color: '#84CC16', defaultPercent: 7 },
  { id: 'lounge', name: 'Lounge', color: '#A855F7', defaultPercent: 5 },
];

export interface EquipmentTemplate {
  id: string; name: string; zone: string; length_m: number; width_m: number; label: string;
  height_m: number; price_eur: number; usage?: EquipmentUsage;
}
export const EQUIPMENT_CATALOG: EquipmentTemplate[] = [
  // Cardio (3)
  { id: 'banda_alergare', name: 'Bandă Alergare', zone: 'cardio', length_m: 2.0, width_m: 0.8, label: 'Bandă alergare — 2m × 0.8m', height_m: 1.5, price_eur: 3500 },
  { id: 'bicicleta_spinning', name: 'Bicicletă Spinning', zone: 'cardio', length_m: 1.2, width_m: 0.6, label: 'Bicicletă spinning — 1.2m × 0.6m', height_m: 1.3, price_eur: 1100 },
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
  { id: 'rig_crossfit', name: 'Rig Crossfit', zone: 'functional', length_m: 3.0, width_m: 1.8, label: 'Rig Crossfit — 3m × 1.8m', height_m: 2.8, price_eur: 4500 },
  { id: 'box_pliometric', name: 'Box Pliometric', zone: 'functional', length_m: 0.6, width_m: 0.5, label: 'Box pliometric — 0.6m × 0.5m', height_m: 0.6, price_eur: 120 },
  { id: 'rowing_machine', name: 'Rowing Machine', zone: 'functional', length_m: 2.4, width_m: 0.6, label: 'Rowing machine — 2.4m × 0.6m', height_m: 1.1, price_eur: 1200 },
  // Studio (2)
  { id: 'oglinda_perete', name: 'Oglindă Perete', zone: 'studio', length_m: 2.0, width_m: 0.1, label: 'Oglindă perete — 2m × 0.1m', height_m: 2, price_eur: 350 },
  { id: 'saltea_yoga', name: 'Saltea Yoga', zone: 'studio', length_m: 1.8, width_m: 0.6, label: 'Saltea yoga — 1.8m × 0.6m', height_m: 0.04, price_eur: 35 },
  // Spa (2)
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
  { id: 'canapea_lounge', name: 'Canapea lounge', zone: 'lounge', length_m: 1.8, width_m: 0.8, label: 'Lounge', height_m: 0.85, price_eur: 750 },
  { id: 'person_reception', name: 'Personaj fictiv · recepție', zone: 'receptie', length_m: 0.75, width_m: 0.65, height_m: 1.72, price_eur: 0, label: 'Recepționer' },
  { id: 'person_coach', name: 'Personaj fictiv · antrenor', zone: 'functional', length_m: 0.85, width_m: 0.75, height_m: 1.83, price_eur: 0, label: 'Antrenor' },
  { id: 'sled_training', name: 'Sanie cu discuri și elev', zone: 'functional', length_m: 1.3, width_m: 2.8, height_m: 1.75, price_eur: 550, label: 'Sanie · elev în împingere' },
  ...IMPORTED_EQUIPMENT.map(model => ({ ...model, usage: equipmentUsage(model.id) })),
  ...REAL_EQUIPMENT.map(model => ({ ...model, usage: equipmentUsage(model.id) })),
];

import { IMPORTED_EQUIPMENT } from './gym-imported-equipment.ts';


import { REAL_EQUIPMENT } from './gym-real-equipment.ts';
