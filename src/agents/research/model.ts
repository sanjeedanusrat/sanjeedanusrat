import { Cursor, type ModelSelection } from "@cursor/sdk";

/**
 * Business rule (non-negotiable): the research agent must run on Claude Opus
 * 4.8 or higher. Research quality/provenance depends on it — do not relax
 * this to save cost.
 */
const MIN_OPUS_VERSION = 4.8;

interface DiscoveredModel {
  id: string;
  displayName: string;
  version: number | null;
}

function extractOpusVersion(model: {
  id: string;
  displayName: string;
}): number | null {
  const haystack = `${model.id} ${model.displayName}`.toLowerCase();
  if (!haystack.includes("opus")) return null;

  const match = haystack.match(/opus[^0-9]*(\d+(?:\.\d+)?)/);
  const versionText = match?.[1];
  if (!versionText) return null;

  const version = Number.parseFloat(versionText);
  return Number.isFinite(version) ? version : null;
}

/**
 * Resolves the model id to use for the research agent.
 *
 * - If `RESEARCH_MODEL_ID` is set, it is used as-is (explicit operator
 *   override), but we still warn if we can't confirm it meets the Opus 4.8+
 *   requirement from the catalog.
 * - Otherwise, discovers models via `Cursor.models.list()` and picks the
 *   highest-versioned Opus model that is >= 4.8. Throws if none qualify —
 *   silently downgrading the research agent to a weaker model is worse than
 *   failing the run.
 */
export async function resolveResearchModel(options: {
  apiKey: string;
  overrideModelId?: string;
}): Promise<ModelSelection> {
  const models = await Cursor.models.list({ apiKey: options.apiKey });

  if (options.overrideModelId) {
    const overrideModelId = options.overrideModelId;
    const match = models.find((m) => m.id === overrideModelId);
    const version = match ? extractOpusVersion(match) : null;
    if (version !== null && version < MIN_OPUS_VERSION) {
      throw new Error(
        `RESEARCH_MODEL_ID="${overrideModelId}" resolves to Opus ${version}, ` +
          `which is below the required minimum of Opus ${MIN_OPUS_VERSION}. ` +
          `Unset RESEARCH_MODEL_ID to auto-discover a qualifying model, or pick a newer one.`
      );
    }
    if (!match) {
      console.warn(
        `[research-agent] RESEARCH_MODEL_ID="${options.overrideModelId}" was not found in ` +
          `Cursor.models.list() for this account — using it anyway, but its Opus version ` +
          `could not be verified against the >= ${MIN_OPUS_VERSION} requirement.`
      );
    }
    return { id: options.overrideModelId };
  }

  const opusCandidates: DiscoveredModel[] = models
    .map((m) => ({
      id: m.id,
      displayName: m.displayName,
      version: extractOpusVersion(m),
    }))
    .filter((m): m is DiscoveredModel => m.version !== null);

  const qualifying = opusCandidates
    .filter((m) => (m.version as number) >= MIN_OPUS_VERSION)
    .sort((a, b) => (b.version as number) - (a.version as number));

  const best = qualifying[0];
  if (!best) {
    const seen = opusCandidates.map((m) => `${m.id} (opus ${m.version})`).join(", ") || "none";
    throw new Error(
      `No available model meets the research agent's minimum of Opus ${MIN_OPUS_VERSION}. ` +
        `Opus models visible to this API key: ${seen}. ` +
        `Check the account's model access, or set RESEARCH_MODEL_ID to override explicitly.`
    );
  }

  console.log(
    `[research-agent] Using model "${best.id}" (${best.displayName}, Opus ${best.version})`
  );
  return { id: best.id };
}
