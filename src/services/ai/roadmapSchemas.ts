import { z } from 'zod';

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : String(item ?? '')))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[,\n|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

const LooseStringSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : String(value ?? '').trim()),
  z.string(),
);

const LooseStringArraySchema = z.preprocess(toStringArray, z.array(z.string()));

const LessonPlanSchema = z.object({
  title: LooseStringSchema.catch(''),
  description: LooseStringSchema.catch(''),
  topic: LooseStringSchema.catch(''),
  lesson_kind: z.enum(['new_vocabulary', 'new_grammar', 'skill_practice', 'listening', 'review']).catch('skill_practice'),
  skill_type: z.enum(['vocabulary', 'grammar', 'mixed']).catch('mixed'),
  focus_label: LooseStringSchema.catch(''),
  objective: LooseStringSchema.catch(''),
  grammar_focus: LooseStringArraySchema.catch([]),
  vocabulary_focus: LooseStringArraySchema.catch([]),
});

const RoadmapUnitSchema = z.object({
  title: LooseStringSchema.catch(''),
  description: LooseStringSchema.catch(''),
  theme: LooseStringSchema.catch(''),
  grammar_focus: LooseStringArraySchema.catch([]),
  vocabulary_focus: LooseStringArraySchema.catch([]),
  can_do: LooseStringArraySchema.catch([]),
  lessons: z.preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.array(LessonPlanSchema).max(5),
  ).catch([]),
});

const RoadmapResponseSchema = z.object({
  title: LooseStringSchema.catch(''),
  summary: LooseStringSchema.catch(''),
  units: z.preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.array(RoadmapUnitSchema),
  ).catch([]),
});

export type AIRoadmapResponse = z.infer<typeof RoadmapResponseSchema>;

export function parseRoadmapResponse(raw: string): AIRoadmapResponse {
  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!objMatch) {
      throw new Error(`No JSON object found in roadmap response. Raw: ${cleaned.slice(0, 300)}`);
    }
    parsed = JSON.parse(objMatch[0]);
  }

  const result = RoadmapResponseSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `[${issue.path.join('.')}] ${issue.message}`)
      .join(', ');
    throw new Error(`Roadmap response could not be parsed: ${issues}`);
  }

  return result.data;
}
