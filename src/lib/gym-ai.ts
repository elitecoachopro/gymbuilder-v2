import { z } from 'zod';
import { EQUIPMENT_CATALOG, ZONE_DEFINITIONS } from './gym-catalog.ts';

const nullableDimension = z.number().finite().positive().max(10000).nullable();
export const aiDesignSchema = z.object({
  summary: z.string().max(3000), questions: z.array(z.string().max(500)).max(8),
  length_m: nullableDimension, width_m: nullableDimension,
  total_area: z.number().finite().positive().max(1000000).nullable(),
  height_m: z.number().finite().min(2).max(30).nullable(),
  budget_eur: z.number().finite().positive().max(99999999).nullable(),
  profile: z.enum(['balanced', 'strength', 'boutique']),
  zones: z.array(z.object({
    zoneId: z.string().refine(id => ZONE_DEFINITIONS.some(z => z.id === id)),
    weight: z.number().finite().positive().max(1000),
    equipment: z.array(z.object({ templateId: z.string().refine(id => EQUIPMENT_CATALOG.some(t => t.id === id)), quantity: z.number().int().min(0).max(30) }).strict()).max(30),
  }).strict()).min(1).max(10),
}).strict();
export type AiDesign = z.infer<typeof aiDesignSchema>;

const object = (properties: Record<string, unknown>) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const numberOrNull = { type: ['number', 'null'] };
export const aiDesignJsonSchema = object({
  summary: { type: 'string' }, questions: { type: 'array', items: { type: 'string' } },
  length_m: numberOrNull, width_m: numberOrNull, total_area: numberOrNull, height_m: numberOrNull, budget_eur: numberOrNull,
  profile: { type: 'string', enum: ['balanced', 'strength', 'boutique'] },
  zones: { type: 'array', items: object({
    zoneId: { type: 'string', enum: ZONE_DEFINITIONS.map(z => z.id) }, weight: { type: 'number' },
    equipment: { type: 'array', items: object({ templateId: { type: 'string', enum: EQUIPMENT_CATALOG.map(t => t.id) }, quantity: { type: 'integer' } }) },
  }) },
});

export function parseAiDesignResponse(value: unknown): AiDesign {
  const response = z.object({ status: z.literal('completed'), output: z.array(z.object({
    type: z.string(), content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional(),
  })) }).parse(value);
  const text = response.output.filter(o => o.type === 'message').flatMap(o => o.content || []).filter(c => c.type === 'output_text').map(c => c.text || '').join('');
  return aiDesignSchema.parse(JSON.parse(text));
}

export async function requestGymAiDesign(parameters: { locale: 'ro' | 'en'; brief: string; context: Record<string, unknown> }, credentials: { apiKey: string; model: string }): Promise<AiDesign | null> {
  const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', signal: AbortSignal.timeout(45000),
      headers: { Authorization: `Bearer ${credentials.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: credentials.model, store: false, max_output_tokens: 6000,
        instructions: `You prepare conceptual fitness facility requirements. Return only the schema. Reply in ${parameters.locale === 'en' ? 'English' : 'Romanian'}. Extract explicit measurements and budget from the user text, otherwise preserve the provided context. Never invent missing dimensions, height or budget: use null. The questions array blocks applying the proposal in the UI: use it only for missing or conflicting measurements needed to place equipment (length, width, area, clear height), or contradictory explicit requirements. If those measurements are complete and consistent, return questions: [] and provide a usable conceptual proposal. A null budget means no spending cap. Put optional follow-up topics such as capacity, installation, transport, accessibility and building services in summary as assumptions or limitations, never in questions. Do not ask to reconfirm a budget explicitly stated for equipment. When context.fixed_architecture is supplied, preserve the measured outline, dimensions, height, and budget from context. Its total_area is the polygon area and may be smaller than length_m * width_m; this is not a conflict. Only select equipment and quantities for context.target_floor. context.budget_eur is the available equipment cap after reserving context.reserved_budget_eur for the other floor; never spend that reserved amount. fixed_architecture.stairwell is an obstacle that must remain accessible. fixed_architecture.equipment lists the current inventory: your quantities describe its complete replacement on the target floor, not additions. Only select equipment and quantities for that fixed space. When context.automatic_zoning is true and the room is an empty rectangle, a deterministic layout engine creates requested reception and two separate changing rooms with partition walls, doors and a 1.2 m shared corridor, and allocates training zones. Do not ask the user to manually draw those partitions. Existing architecture is preserved. Choose quantities appropriate for the actual area: allow roughly one third of the floor for requested reception/changing rooms, plus circulation and equipment access. A complete 200 square metre gym should have a practical initial selection, not quantities for a much larger gym. Only include requested functional zones: do not add functional/CrossFit, stretching, studio, spa, lounge or decorative people unless the user explicitly requested them. Prioritize the requested reception, changing rooms, cardio and strength equipment over optional additions. Include showers, toilets and washbasins in changing rooms when requested. Zone weights guide training-zone allocation; the returned geometric proposal is authoritative for actual zone areas, counts and omissions. Do not state that a circulation percentage or a changing-room area has already been drawn in the plan. Otherwise total_area must equal length_m * width_m; if the user supplies inconsistent dimensions, ask for clarification and set missing/conflicting measurements to null. Choose applicable zones and catalog equipment, integer quantities 0..30; every model must belong to its catalog zone. Respect explicit user equipment requests, even if they do not fit: the placement engine reports omissions. Only infer an initial balanced selection when no quantities are given. Weight is the relative share of a zone, excluding a 15% circulation reserve. Explain assumptions and limitations; do not claim statutory compliance or architectural approval. Do not provide coordinates. Catalog with indicative EUR costs and metres: ${JSON.stringify(EQUIPMENT_CATALOG.map(({ id, name, zone, length_m, width_m, height_m, price_eur }) => ({ id, name, zone, length_m, width_m, height_m, price_eur })))}`,
        input: JSON.stringify(parameters), text: { format: { type: 'json_schema', name: 'gym_design_requirements', strict: true, schema: aiDesignJsonSchema } },
      }),
    });
  if (!response.ok) return null;
  return parseAiDesignResponse(await response.json());
}
