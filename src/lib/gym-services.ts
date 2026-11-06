import { z } from 'zod';

export const SERVICE_CATEGORIES = [
  { id: 'repairs', ro: 'Reparații aparate fitness', en: 'Fitness equipment repairs' },
  { id: 'preventive', ro: 'Mentenanță preventivă și revizii', en: 'Preventive maintenance and inspections' },
  { id: 'installation', ro: 'Montaj și punere în funcțiune', en: 'Installation and commissioning' },
  { id: 'relocation', ro: 'Demontare și relocare', en: 'Dismantling and relocation' },
  { id: 'upholstery', ro: 'Retapițare și recondiționare', en: 'Reupholstery and refurbishment' },
  { id: 'parts', ro: 'Piese de schimb și consumabile', en: 'Spare parts and consumables' },
] as const;
export type ServiceCategory = typeof SERVICE_CATEGORIES[number]['id'];
export type ProviderBusinessType = 'equipment' | 'service' | 'both';
const serviceCategoryIds = SERVICE_CATEGORIES.map(category => category.id) as [ServiceCategory, ...ServiceCategory[]];
export const hasServices = (businessType: string | null | undefined) => businessType === 'service' || businessType === 'both';

const publicText = z.string().max(500).transform(value => value.replace(/<[^>]*>/g, '').replace(/\0/g, '').trim());
export const serviceProfileSchema = z.object({
  businessType: z.enum(['equipment', 'service', 'both']).default('equipment'),
  serviceCategories: z.array(z.enum(serviceCategoryIds)).max(6).default([]).transform(items => [...new Set(items)]),
  serviceAreas: publicText.default(''),
  serviceBrands: publicText.default(''),
}).strict().superRefine((value, ctx) => {
  if (hasServices(value.businessType) && (!value.serviceCategories.length || value.serviceAreas.length < 2)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selectează serviciile și completează zona de acoperire.' });
  }
}).transform(value => hasServices(value.businessType) ? value : { businessType: value.businessType, serviceCategories: [], serviceAreas: '', serviceBrands: '' });
export type ServiceProfileValues = z.output<typeof serviceProfileSchema>;
export function serviceProfileValuesFromRow(row: { business_type: ProviderBusinessType; service_categories: ServiceCategory[]; service_areas: string; service_brands: string }): ServiceProfileValues {
  return { businessType: row.business_type, serviceCategories: row.service_categories, serviceAreas: row.service_areas, serviceBrands: row.service_brands };
}
export function serviceProfileColumns(value: ServiceProfileValues) {
  return { business_type: value.businessType, service_categories: value.serviceCategories, service_areas: value.serviceAreas, service_brands: value.serviceBrands };
}
