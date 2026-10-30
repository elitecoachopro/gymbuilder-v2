'use client';
import {StyledEquipmentAsset} from './ImportedEquipmentModel';
import {EQUIPMENT_CATALOG} from '@/lib/gym-catalog';
import {referenceModelKind} from '@/lib/gym-reference-identity';
import {originalReferenceSource} from '@/lib/gym-reference-assets';
export default function ReferenceEquipmentModel({ templateId, frame, upholstery }: { templateId: string; frame: string; upholstery: string }) {
 const kind = referenceModelKind(templateId)!;
 const source = originalReferenceSource(kind);
 const target = EQUIPMENT_CATALOG.find(item => item.id === templateId)!;
 const original = EQUIPMENT_CATALOG.find(item => item.id === kind)!;
 return <group scale={[target.length_m / original.length_m, target.height_m / original.height_m, target.width_m / original.width_m]}><StyledEquipmentAsset scene={source} frame={frame} upholstery={upholstery} /></group>;
}
