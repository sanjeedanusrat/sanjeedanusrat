import { z } from "zod";
import { PILLAR_IDS } from "../../config/pillars.js";

export const ResearchIdea = z.object({
  id: z.number().int().min(1),
  pillar: z.enum(PILLAR_IDS),
  title: z.string().min(1),
  spark: z.string().min(1),
  source: z.string().min(1),
  reelAngle: z.string().min(1),
});

export const ResearchOutput = z.object({
  weekOf: z.string().min(1),
  ideas: z.array(ResearchIdea).min(10).max(12),
  recommendedTop4: z.array(z.number().int()).length(4).optional(),
});

export type ResearchIdeaT = z.infer<typeof ResearchIdea>;
export type ResearchOutputT = z.infer<typeof ResearchOutput>;
