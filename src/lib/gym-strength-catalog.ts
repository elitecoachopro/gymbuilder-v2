export const STRENGTH_VARIANTS = [
  { id: 'plate_chest_press', name: 'Presă piept cu discuri · brațe independente', en: 'Plate-loaded independent chest press', length_m: 2, width_m: 1.5, height_m: 1.65, price_eur: 3900 },
  { id: 'pec_fly', name: 'Pec deck · fluturări', en: 'Pec deck · chest fly', length_m: 1.8, width_m: 1.2, height_m: 1.95, price_eur: 3100 },
  { id: 'seated_row', name: 'Ramat cu sprijin pentru piept', en: 'Chest-supported seated row', length_m: 1.8, width_m: 1.2, height_m: 1.95, price_eur: 2900 },
  { id: 'shoulder_press', name: 'Presă pentru umeri', en: 'Shoulder press', length_m: 1.8, width_m: 1.2, height_m: 2.1, price_eur: 3100 },
  { id: 'lateral_raise', name: 'Ridicări laterale pentru umeri', en: 'Lateral raise', length_m: 1.8, width_m: 1.2, height_m: 1.95, price_eur: 2700 },
  { id: 'leg_extension', name: 'Extensii pentru cvadricepși', en: 'Seated leg extension', length_m: 1.8, width_m: 1.2, height_m: 1.95, price_eur: 2900 },
  { id: 'hip_thrust', name: 'Hip thrust · extensia șoldului', en: 'Hip thrust · glute drive', length_m: 2.1, width_m: 1.2, height_m: 1.95, price_eur: 3200 },
  { id: 'glute_kickback', name: 'Extensii înapoi pentru fesieri', en: 'Standing glute kickback', length_m: 2, width_m: 1.2, height_m: 1.95, price_eur: 2900 },
  { id: 'biceps_curl', name: 'Flexii biceps la pupitru', en: 'Preacher biceps curl', length_m: 1.8, width_m: 1.2, height_m: 1.95, price_eur: 2600 },
  { id: 'triceps_press', name: 'Presă pentru triceps', en: 'Seated triceps press', length_m: 1.8, width_m: 1.2, height_m: 1.95, price_eur: 2600 },
  { id: 'ab_crunch', name: 'Flexii abdominale la aparat', en: 'Seated abdominal crunch', length_m: 1.8, width_m: 1.2, height_m: 1.95, price_eur: 2700 },
  { id: 'torso_rotation', name: 'Rotații pentru trunchi', en: 'Rotary torso', length_m: 1.8, width_m: 1.2, height_m: 1.95, price_eur: 2800 },
] as const;
export type SpecialisedStrengthModel = typeof STRENGTH_VARIANTS[number]['id'];
