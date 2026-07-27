export interface Pillar {
  id: string;
  label: string;
  guidance: string;
}

/**
 * Content pillars for Sanjee talks. Every idea the research agent produces
 * must map to exactly one of these. Order here is the display order in the
 * weekly email.
 */
export const PILLARS: Pillar[] = [
  {
    id: "ai-tools-demos",
    label: "AI tools / demos",
    guidance:
      "A specific tool, feature, or workflow worth showing on screen. Prefer something demoable in under a minute over a generic feature roundup.",
  },
  {
    id: "industry-news-takes",
    label: "Industry news / takes",
    guidance:
      "A real, recent news item with a point of view attached. Not just 'X happened' — the reel angle should be the take, not the recap.",
  },
  {
    id: "career-builder-lessons",
    label: "Career / builder lessons",
    guidance:
      "A concrete lesson from shipping, building, or working in tech. Anchored in a specific moment or artifact, not generic advice.",
  },
  {
    id: "explainers-non-experts",
    label: "Explainers for non-experts",
    guidance:
      "Demystifies one AI/tech concept in plain language for a general audience. Should work for someone with zero technical background.",
  },
  {
    id: "entertainment-tech-ai",
    label: "Entertainment (tech or AI-threaded)",
    guidance:
      "Funny, surprising, or watchable — but must be threaded through a real tech or AI hook. Pure entertainment with no tech/AI thread does not qualify for this pillar.",
  },
];

export const PILLAR_IDS = PILLARS.map((p) => p.id) as [string, ...string[]];
