import { z } from 'zod';
import { studioConfigurationSchema } from './gym-studio';

const money = z.number().finite().positive().max(99999999.99);
const category = z.enum(['cardio', 'strength', 'functional', 'accessories', 'wellness', 'lockers', 'reception']);
const imageUrl = z.string().url().max(2048).refine(value => /^https?:\/\//.test(value));
const productFields = z.object({
  name: z.string().trim().min(1).max(200), category, brand: z.string().trim().min(1).max(100),
  condition: z.enum(['new', 'used']), price_eur: money,
  description: z.string().max(10000).nullish(),
  images: z.array(imageUrl).optional(),
  images_360: z.array(imageUrl).max(36).refine(images => images.length === 0 || images.length >= 12).optional(),
  status: z.enum(['active', 'inactive', 'featured']).optional(),
});
export const productCreateInput = productFields;
export const productUpdateInput = productFields.partial().extend({ productId: z.string().uuid() });

const variantFields = z.object({
  label: z.string().trim().min(1).max(100),
  price_override: z.number().finite().nonnegative().max(99999999.99).nullish(),
  description_override: z.string().max(500).nullish(),
  image_url: z.union([z.string().url().max(2048), z.literal('')]).nullish(),
});
export const variantCreateInput = variantFields.extend({ product_id: z.string().uuid() });
export const variantUpdateInput = variantFields.partial().extend({ variant_id: z.string().uuid() });

const projectFields = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  variant: z.enum(['plan_existing', 'from_scratch']),
  total_area: z.number().finite().positive().max(1000000),
  length_m: z.number().finite().positive().max(10000),
  width_m: z.number().finite().positive().max(10000),
  zones: z.array(z.record(z.unknown())).max(100).optional(),
  configuration: studioConfigurationSchema.nullable().optional(),
  status: z.enum(['draft', 'in_progress', 'completed']).optional(),
});
export const projectCreateInput = projectFields;
export const projectUpdateInput = projectFields.partial().extend({ id: z.string().uuid() });

export const budgetEstimateInput = z.object({
  area: z.number().finite().positive().max(1000000), gymType: z.string().trim().min(1).max(100),
  selectedZones: z.array(z.string().max(100)).min(1).max(100),
  totalMin: z.number().finite().nonnegative(), totalMax: z.number().finite().nonnegative(),
  breakdown: z.array(z.record(z.unknown())).max(100),
}).refine(value => value.totalMax >= value.totalMin);
