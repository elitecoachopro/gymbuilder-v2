import manifest from '../../public/models/gym/pilot/manifest.json' with { type: 'json' };

export const EQUIPMENT_PILOT_IDS: readonly string[] = [
  'cad_treadmill', 'real_spin_bike', 'cad_elliptical', 'real_rower',
  'real_power_rack', 'real_adjustable_bench', 'cad_dumbbell_rack',
  'cad_leg_press', 'real_cable_crossover', 'real_multigym',
];

export function pilotEquipmentUrl(id: string) {
  return EQUIPMENT_PILOT_IDS.includes(id) ? `/models/gym/pilot/${id}.glb` : undefined;
}

export const pilotEquipmentEvidence = (id: string) => manifest.find(entry => entry.id === id);

export function pilotPublicationError(entry: Partial<typeof manifest[number]>): string | null {
  if (!entry.id || !EQUIPMENT_PILOT_IDS.includes(entry.id) || entry.url !== `/models/gym/pilot/${entry.id}.glb`) return 'Pilot identity is invalid.';
  const review = entry.rightsReview;
  if (entry.license !== 'CC0-1.0' || review?.license !== 'CC0-1.0' || review.status !== 'verified-cc0' || review.id !== entry.id || review.sourceUrl !== entry.sourceUrl || review.termsUrl !== 'https://www.innerscene.com/tools/library/terms' || !/^\d{4}-\d{2}-\d{2}$/.test(review.checkedOn)) return 'Commercial-use evidence is missing or mismatched.';
  if (entry.manufacturerCertified !== false || entry.dimensionBasis !== 'measured-model-bounds') return 'The pilot must remain an unbranded measured model.';
  const measured = entry.modelDimensions, nominal = entry.catalogueDimensions;
  if (!measured || !nominal) return 'Model measurements are missing.';
  for (const key of ['length_m', 'width_m', 'height_m'] as const) if (!Number.isFinite(measured[key]) || !Number.isFinite(nominal[key]) || measured[key] <= 0 || Math.abs(measured[key] - nominal[key]) >= 0.002) return 'Model dimensions do not match the catalogue.';
  if (!entry.bytes || entry.bytes > 2600000 || !entry.triangles || entry.triangles > 40000 || !entry.drawCalls || entry.drawCalls > 20 || entry.validation?.errors !== 0 || entry.validation?.warnings !== 0) return 'Model validation or rendering budget failed.';
  return null;
}
