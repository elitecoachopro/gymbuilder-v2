'use client';
import { isOriginalReferenceModel } from '@/lib/gym-reference-identity';
import { useMemo } from 'react';
import type { EquipmentTemplate } from '@/lib/gym-catalog';
import { assessEquipmentUsage } from '@/lib/gym-equipment-clearance';
import { pilotEquipmentEvidence } from '@/lib/gym-equipment-pilot';
import type { GymSpace, SpaceItem } from '@/lib/gym-space';

type Props = { template: EquipmentTemplate; item: SpaceItem; space: GymSpace; t: (ro: string, en: string) => string };
export default function EquipmentPlanningDetails({ template, item, space, t }: Props) {
  const evidence = isOriginalReferenceModel(template.id) ? undefined : pilotEquipmentEvidence(template.id), usage = template.usage;
  const assessment = useMemo(() => assessEquipmentUsage(space, item), [space, item]);
  const equipmentCount = assessment.conflicts.filter(c => c.kind === 'equipment').length;
  const obstructionCount = assessment.conflicts.length - equipmentCount;
  return <section aria-label={t('Dimensiuni și spațiu de utilizare', 'Dimensions and usage space')} className="rounded-lg border border-white/15 p-3 space-y-3 text-xs">
    <p className="font-medium text-gold-200">{evidence ? t('Machetă GLB măsurată · fără marcă', 'Measured GLB model · unbranded') : t('Model original · dimensiuni de încadrare', 'Original model · nominal envelope')}</p>
    {evidence && <><p>{t('Măsurat în GLB (L × l × H):', 'Measured in GLB (L × W × H):')} {evidence.modelDimensions.length_m.toFixed(3)} × {evidence.modelDimensions.width_m.toFixed(3)} × {evidence.modelDimensions.height_m.toFixed(3)} m.</p><p>{t('Licență CC0 verificată la', 'CC0 licence reviewed on')} {evidence.rightsReview.checkedOn}. {t('Nu este un produs certificat de producător.', 'This is not a manufacturer-certified product.')}</p></>}
    <p>{t('Amprentă fizică blocantă:', 'Physical blocking footprint:')} {template.length_m} × {template.width_m} m.</p>
    {usage ? <><p>{t('Estimare de utilizare:', 'Usage estimate:')} {(template.length_m + 2 * usage.lengthMargin).toFixed(2)} × {(template.width_m + 2 * usage.widthMargin).toFixed(2)} m. {t('Marje pe fiecare parte (lungime / lățime):', 'Margins on each side (length / width):')} {usage.lengthMargin} / {usage.widthMargin} m.</p><p className="text-slate-300">{t('Estimare Gym Builder pentru planificare, nu distanțe furnizate de fabricant. Se rotește împreună cu aparatul.', 'Gym Builder planning estimate, not manufacturer operating distances. Rotates with the equipment.')}</p><p role="status" className={assessment.conflicts.length ? 'text-amber-200' : 'text-slate-200'}>{assessment.conflicts.length ? `${t('Suprapuneri orientative', 'Advisory overlaps')}: ${equipmentCount} ${t('aparate', 'equipment')}, ${obstructionCount} ${t('limite/obstacole', 'bounds/obstacles')}. ${t('Avertizarea nu blochează amplasarea.', 'This warning does not block placement.')}` : t('Nu am detectat suprapuneri pentru această estimare.', 'No overlaps detected for this estimate.')}</p></> : <p role="status" className="text-slate-300">{t('Spațiu de utilizare necunoscut: nu există metadate. Consultă fișa aparatului.', 'Usage space unknown: no metadata available. Check the equipment specification.')}</p>}
  </section>;
}
