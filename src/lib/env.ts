function sanitize(value: string): string {
  // Strip BOM / zero-width / line-separator chars that hitchhike in when
  // secrets are pasted from browsers or Google Cloud consoles.
  return value
    .replace(/[\u200B-\u200D\u2028\u2029\uFEFF]/g, "")
    .trim();
}

function required(name: string): string {
  const value = process.env[name];
  if (!value || sanitize(value) === "") {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example for the full list.`
    );
  }
  return sanitize(value);
}

function optional(name: string, fallback?: string): string | undefined {
  const value = process.env[name];
  if (!value || sanitize(value) === "") return fallback;
  return sanitize(value);
}

export function loadResearchEnv() {
  return {
    cursorApiKey: required("CURSOR_API_KEY"),
    researchModelId: optional("RESEARCH_MODEL_ID"),

    repoUrl: optional(
      "RESEARCH_REPO_URL",
      "https://github.com/sanjeedanusrat/sanjeedanusrat"
    )!,
    repoRef: optional("RESEARCH_REPO_REF", "main")!,

    gmailClientId: required("GMAIL_CLIENT_ID"),
    gmailClientSecret: required("GMAIL_CLIENT_SECRET"),
    gmailRefreshToken: required("GMAIL_REFRESH_TOKEN"),

    emailTo: optional("RESEARCH_EMAIL_TO", "sanjeedanusrat@gmail.com")!,
    emailFrom: optional("RESEARCH_EMAIL_FROM", "sanjeedanusrat@gmail.com")!,

    newsletterQuery: optional(
      "GMAIL_NEWSLETTER_QUERY",
      "newer_than:7d (category:promotions OR category:updates OR label:newsletters)"
    )!,
  };
}

export type ResearchEnv = ReturnType<typeof loadResearchEnv>;
