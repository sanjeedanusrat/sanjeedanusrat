import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Agent, CursorAgentError } from "@cursor/sdk";

import { loadResearchEnv } from "../../lib/env.js";
import { currentWeekId } from "../../lib/week.js";
import { getOAuth2Client } from "../../lib/gmail-auth.js";
import { fetchNewsletterDigest, formatNewsletterDigest } from "../../lib/gmail-read.js";
import { sendEmail } from "../../lib/gmail-send.js";
import { resolveResearchModel } from "./model.js";
import { buildResearchPrompt } from "./prompt.js";
import { parseResearchOutput } from "./parse.js";
import { buildResearchEmail } from "./email-template.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../../");
const SKILL_PATH = path.join(REPO_ROOT, "skills", "research-quality.md");
const STATE_DIR = path.join(REPO_ROOT, "state", "weeks");

async function readQualitySkill(): Promise<string | null> {
  try {
    return await readFile(SKILL_PATH, "utf-8");
  } catch {
    return null;
  }
}

async function main() {
  const env = loadResearchEnv();
  const weekOf = currentWeekId();

  console.log(`[research-agent] Starting run for week of ${weekOf}`);

  const oauthClient = getOAuth2Client({
    clientId: env.gmailClientId,
    clientSecret: env.gmailClientSecret,
    refreshToken: env.gmailRefreshToken,
  });

  console.log("[research-agent] Fetching newsletter digest from Gmail...");
  const newsletterEntries = await fetchNewsletterDigest(
    oauthClient,
    env.newsletterQuery
  );
  const newsletterDigest = formatNewsletterDigest(newsletterEntries);
  console.log(`[research-agent] Found ${newsletterEntries.length} newsletter-ish emails.`);

  const qualitySkill = await readQualitySkill();
  if (!qualitySkill) {
    console.warn(
      `[research-agent] No skill found at skills/research-quality.md — running with default judgment only.`
    );
  }

  const model = await resolveResearchModel({
    apiKey: env.cursorApiKey,
    overrideModelId: env.researchModelId,
  });

  const prompt = buildResearchPrompt({
    weekOf,
    newsletterDigest,
    qualitySkill,
  });

  console.log(`[research-agent] Launching cloud agent against ${env.repoUrl}@${env.repoRef}...`);

  let resultText: string;
  try {
    const result = await Agent.prompt(prompt, {
      apiKey: env.cursorApiKey,
      model,
      cloud: {
        repos: [{ url: env.repoUrl, startingRef: env.repoRef }],
      },
    });

    if (result.status === "error") {
      console.error(`[research-agent] Run finished with an error: run id ${result.id}`);
      console.error(result.error);
      process.exit(2);
    }

    resultText = result.result ?? "";
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.error(
        `[research-agent] Run failed to start: ${err.message} (retryable=${err.isRetryable})`
      );
      process.exit(1);
    }
    throw err;
  }

  console.log("[research-agent] Parsing and validating agent output...");
  const output = parseResearchOutput(resultText);

  await mkdir(STATE_DIR, { recursive: true });
  const statePath = path.join(STATE_DIR, `${weekOf}.json`);
  await writeFile(
    statePath,
    JSON.stringify(
      {
        weekOf,
        generatedAt: new Date().toISOString(),
        model,
        newsletterEntryCount: newsletterEntries.length,
        output,
      },
      null,
      2
    )
  );
  console.log(`[research-agent] Wrote state to ${path.relative(REPO_ROOT, statePath)}`);

  const email = buildResearchEmail(output);
  console.log(`[research-agent] Sending email to ${env.emailTo}...`);
  const sent = await sendEmail(oauthClient, {
    from: env.emailFrom,
    to: env.emailTo,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
  console.log(`[research-agent] Email sent (message id: ${sent.id}).`);
}

main().catch((err) => {
  console.error("[research-agent] Fatal error:", err);
  process.exit(1);
});
