export interface EquipmentUsage {
  lengthMargin: number;
  widthMargin: number;
  basis: 'planning-estimate';
}

const usage: Partial<Record<string, EquipmentUsage>> = {
  cad_treadmill: { lengthMargin: 1, widthMargin: 0.6, basis: 'planning-estimate' },
  real_spin_bike: { lengthMargin: 0.6, widthMargin: 0.6, basis: 'planning-estimate' },
  cad_elliptical: { lengthMargin: 0.8, widthMargin: 0.6, basis: 'planning-estimate' },
  real_rower: { lengthMargin: 0.8, widthMargin: 0.6, basis: 'planning-estimate' },
  real_power_rack: { lengthMargin: 0.8, widthMargin: 0.8, basis: 'planning-estimate' },
  real_adjustable_bench: { lengthMargin: 0.6, widthMargin: 0.6, basis: 'planning-estimate' },
  cad_dumbbell_rack: { lengthMargin: 0.8, widthMargin: 0.6, basis: 'planning-estimate' },
  cad_leg_press: { lengthMargin: 0.8, widthMargin: 0.6, basis: 'planning-estimate' },
  real_cable_crossover: { lengthMargin: 1, widthMargin: 0.8, basis: 'planning-estimate' },
  real_multigym: { lengthMargin: 0.8, widthMargin: 0.8, basis: 'planning-estimate' },
};
export const equipmentUsage = (id: string) => usage[id];
