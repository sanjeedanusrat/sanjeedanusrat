import { ResearchOutput, type ResearchOutputT } from "./schema.js";

const JSON_BLOCK_RE = /```json\s*([\s\S]*?)```/g;

/** Extracts the LAST fenced ```json block from the agent's final message. */
function extractLastJsonBlock(text: string): string | null {
  let lastMatch: RegExpExecArray | null = null;
  let match: RegExpExecArray | null;
  while ((match = JSON_BLOCK_RE.exec(text)) !== null) {
    lastMatch = match;
  }
  return lastMatch?.[1] ? lastMatch[1].trim() : null;
}

export function parseResearchOutput(agentText: string): ResearchOutputT {
  const jsonText = extractLastJsonBlock(agentText) ?? agentText.trim();

  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch (err) {
    const preview = agentText.slice(-2000);
    throw new Error(
      `Could not parse JSON from the research agent's output. ` +
        `Parse error: ${(err as Error).message}\n\n` +
        `Last 2000 chars of agent output:\n${preview}`
    );
  }

  const parsed = ResearchOutput.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Research agent output did not match the expected schema:\n${parsed.error.message}\n\n` +
        `Raw JSON:\n${jsonText}`
    );
  }

  return parsed.data;
}
