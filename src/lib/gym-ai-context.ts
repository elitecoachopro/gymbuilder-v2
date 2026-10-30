import { z } from 'zod';
import { aiDesignSchema, type AiDesign } from './gym-ai.ts';
import { EQUIPMENT_CATALOG } from './gym-catalog.ts';
import { floorBudget, floorSpace } from './gym-building.ts';
import { spaceSchema, spaceArea, spaceBounds, validateSpace, type GymSpace } from './gym-space.ts';

const contextSchema = z.object({
  length_m: aiDesignSchema.shape.length_m, width_m: aiDesignSchema.shape.width_m,
  total_area: aiDesignSchema.shape.total_area, height_m: aiDesignSchema.shape.height_m,
  budget_eur: aiDesignSchema.shape.budget_eur,
  zone_ids: z.array(z.string().max(50)).max(10), profile: aiDesignSchema.shape.profile,
});
const gymAiInputSchema = z.object({ brief: z.string().trim().min(10).max(6000), locale: z.enum(['ro', 'en']), context: contextSchema, space: spaceSchema.optional(), target_floor: z.union([z.literal(0), z.literal(1)]).default(0), automatic_zoning: z.boolean().default(true) });

export function matchesGymAiMeasurements(design: AiDesign, space: GymSpace, height: number, budget: number | null) {
  const bounds = spaceBounds(space);
  return design.length_m !== null && design.width_m !== null && design.total_area !== null && design.height_m !== null && Math.abs(design.length_m - bounds.length) < 0.001 && Math.abs(design.width_m - bounds.width) < 0.001 && Math.abs(design.total_area - spaceArea(space)) < 0.02 && Math.abs(design.height_m - height) < 0.001 && design.budget_eur === budget;
}
export function prepareGymAiInput(value: unknown) {
  const input = gymAiInputSchema.parse(value);
  let space: GymSpace | undefined, budget = input.context.budget_eur;
  if (input.space) {
    if (input.target_floor === 1 && !input.space.upperFloor) throw Error('INVALID_BRIEF');
    space = floorSpace(input.space, input.target_floor);
    const bounds = spaceBounds(space), height = input.context.height_m;
    if (height === null || validateSpace(input.space, height, budget) || bounds.length !== input.context.length_m || bounds.width !== input.context.width_m || Math.abs(spaceArea(space) - (input.context.total_area ?? 0)) > 0.02) throw Error('INVALID_BRIEF');
    budget = floorBudget(input.space, input.target_floor, budget);
    if (budget === 0) throw Error('INVALID_BRIEF');
  } else if (input.target_floor !== 0) throw Error('INVALID_BRIEF');
  const context = { ...input.context, budget_eur: budget, project_budget_eur: input.context.budget_eur, reserved_budget_eur: input.context.budget_eur === null ? 0 : input.context.budget_eur - budget!, target_floor: { index: input.target_floor, name: input.target_floor === 0 ? 'Ground floor' : 'First floor' }, automatic_zoning: input.automatic_zoning,
    ...(space ? { fixed_architecture: { outline: space.outline, walls: space.walls, openings: space.openings, columns: space.columns, areas: space.areas, stairwell: space.stairwell ?? null, equipment: space.items.map(item => { const model = EQUIPMENT_CATALOG.find(model => model.id === item.templateId)!; return { ...item, length_m: model.length_m, width_m: model.width_m, height_m: model.height_m, price_eur: model.price_eur }; }) } } : {}),
  };
  return { input, space, budget, context };
}
