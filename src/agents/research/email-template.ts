import { PILLARS } from "../../config/pillars.js";
import type { ResearchOutputT } from "./schema.js";

const SUBJECT = "weekly Ideas for Sanjee talks";

function pillarLabel(pillarId: string): string {
  return PILLARS.find((p) => p.id === pillarId)?.label ?? pillarId;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildResearchEmail(output: ResearchOutputT): {
  subject: string;
  text: string;
  html: string;
} {
  const rankExample = output.ideas
    .slice(0, 3)
    .map((idea, i) => `${i + 1}. #${idea.id}`)
    .join("\n");

  const textIdeas = output.ideas
    .map(
      (idea) =>
        `#${idea.id} · ${pillarLabel(idea.pillar)}\n` +
        `${idea.title}\n` +
        `Spark: ${idea.spark}\n` +
        `Source: ${idea.source}\n` +
        `Reel angle: ${idea.reelAngle}`
    )
    .join("\n\n");

  const nudge = output.recommendedTop4?.length
    ? `\nMy nudge this week: ${output.recommendedTop4.map((id) => `#${id}`).join(", ")}\n`
    : "";

  const text = `Hey Sanjee —

Here's this week's idea pack (${output.ideas.length}). Pillars covered; mix is intentional, not equal.

Reply with your ranked top 4 like this:

${rankExample}
notes: ...

${textIdeas}
${nudge}
— Research`;

  const htmlIdeas = output.ideas
    .map(
      (idea) => `
    <div style="margin-bottom:20px;">
      <div style="font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#666;">
        #${idea.id} &middot; ${escapeHtml(pillarLabel(idea.pillar))}
      </div>
      <div style="font-size:16px;font-weight:600;margin:2px 0 6px;">${escapeHtml(idea.title)}</div>
      <div style="margin:0 0 4px;"><b>Spark:</b> ${escapeHtml(idea.spark)}</div>
      <div style="margin:0 0 4px;"><b>Source:</b> ${escapeHtml(idea.source)}</div>
      <div style="margin:0;"><b>Reel angle:</b> ${escapeHtml(idea.reelAngle)}</div>
    </div>`
    )
    .join("\n");

  const htmlNudge = output.recommendedTop4?.length
    ? `<p><b>My nudge this week:</b> ${output.recommendedTop4.map((id) => `#${id}`).join(", ")}</p>`
    : "";

  const html = `
<div style="font-family:-apple-system,Helvetica,Arial,sans-serif;color:#111;max-width:640px;">
  <p>Hey Sanjee —</p>
  <p>Here's this week's idea pack (${output.ideas.length}). Pillars covered; mix is intentional, not equal.</p>
  <p><b>Reply with your ranked top 4</b>, e.g.:</p>
  <pre style="background:#f5f5f5;padding:10px 12px;border-radius:6px;">${rankExample}
notes: ...</pre>
  <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
  ${htmlIdeas}
  <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
  ${htmlNudge}
  <p>— Research</p>
</div>`.trim();

  return { subject: SUBJECT, text, html };
}
