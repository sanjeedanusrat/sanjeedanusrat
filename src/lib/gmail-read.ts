import { google } from "googleapis";
import type { GmailAuthClient } from "./gmail-auth.js";

export interface NewsletterEntry {
  from: string;
  subject: string;
  date: string;
  snippet: string;
}

function header(
  headers: { name?: string | null; value?: string | null }[] | undefined,
  name: string
): string {
  const found = headers?.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase()
  );
  return found?.value ?? "";
}

/**
 * Pulls a lightweight digest of recent newsletter-ish email so the research
 * agent has real inbox context without needing direct Gmail access itself.
 */
export async function fetchNewsletterDigest(
  auth: GmailAuthClient,
  query: string,
  maxResults = 40
): Promise<NewsletterEntry[]> {
  const gmail = google.gmail({ version: "v1", auth });

  const list = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults,
  });

  const messages = list.data.messages ?? [];
  const entries: NewsletterEntry[] = [];

  for (const message of messages) {
    if (!message.id) continue;

    const full = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
      format: "metadata",
      metadataHeaders: ["From", "Subject", "Date"],
    });

    const headers = full.data.payload?.headers;
    entries.push({
      from: header(headers, "From"),
      subject: header(headers, "Subject"),
      date: header(headers, "Date"),
      snippet: full.data.snippet ?? "",
    });
  }

  return entries;
}

export function formatNewsletterDigest(entries: NewsletterEntry[]): string {
  if (entries.length === 0) {
    return "(No newsletter-ish email found for this window — rely on web research instead.)";
  }

  return entries
    .map(
      (e, i) =>
        `${i + 1}. From: ${e.from}\n   Subject: ${e.subject}\n   Date: ${e.date}\n   Snippet: ${e.snippet}`
    )
    .join("\n\n");
}
