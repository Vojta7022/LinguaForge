import { z } from 'zod';

const LessonPlanSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(8),
  topic: z.string().min(2),
  lesson_kind: z.enum(['new_vocabulary', 'new_grammar', 'skill_practice', 'review']),
  skill_type: z.enum(['vocabulary', 'grammar', 'mixed']),
  focus_label: z.string().min(2),
  objective: z.string().min(8),
  grammar_focus: z.array(z.string().min(2)).min(1),
  vocabulary_focus: z.array(z.string().min(2)).min(1),
});

const RoadmapUnitSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(8),
  theme: z.string().min(2),
  grammar_focus: z.array(z.string().min(2)).min(1),
  vocabulary_focus: z.array(z.string().min(2)).min(1),
  can_do: z.array(z.string().min(6)).min(2),
  lessons: z.array(LessonPlanSchema).length(4),
});

const RoadmapResponseSchema = z.object({
  title: z.string().min(2),
  summary: z.string().min(8),
  units: z.array(RoadmapUnitSchema).length(10),
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

  return RoadmapResponseSchema.parse(parsed);
}
