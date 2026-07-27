const PST_OFFSET_HOURS = 8;

/**
 * The product spec is "always PST" (fixed UTC-8), not Pacific local time with
 * DST. This intentionally does NOT use Intl timezone APIs, which would shift
 * to PDT (UTC-7) in summer. GitHub Actions cron is UTC-only, so pairing a
 * fixed cron time with this fixed offset keeps "6am" meaning the same thing
 * every week of the year.
 */
export function nowInPst(): Date {
  const now = new Date();
  return new Date(now.getTime() - PST_OFFSET_HOURS * 60 * 60 * 1000);
}

export function formatPstDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Stable id for this run, used for the state file and email references. */
export function currentWeekId(): string {
  return formatPstDate(nowInPst());
}
