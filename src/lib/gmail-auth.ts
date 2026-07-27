import { google } from "googleapis";

export interface GmailCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

/** Loopback redirect used only during the one-time `gmail:setup` flow. */
export const GMAIL_SETUP_REDIRECT_URI = "http://localhost:53682/callback";

export function getOAuth2Client(creds: GmailCredentials) {
  const client = new google.auth.OAuth2(
    creds.clientId,
    creds.clientSecret,
    GMAIL_SETUP_REDIRECT_URI
  );
  client.setCredentials({ refresh_token: creds.refreshToken });
  return client;
}

/**
 * Derived from `getOAuth2Client`'s own return type (rather than importing
 * `google-auth-library`'s `OAuth2Client` directly) because `googleapis` and
 * a standalone `google-auth-library` install can resolve to structurally
 * incompatible duplicate types even at the same semver.
 */
export type GmailAuthClient = ReturnType<typeof getOAuth2Client>;
