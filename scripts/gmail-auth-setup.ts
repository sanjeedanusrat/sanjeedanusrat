import { createServer } from "node:http";
import { google } from "googleapis";
import { GMAIL_SETUP_REDIRECT_URI } from "../src/lib/gmail-auth.js";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
];

function requireArg(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET before running this.`);
    process.exit(1);
  }
  return value;
}

async function main() {
  const clientId = requireArg("GMAIL_CLIENT_ID");
  const clientSecret = requireArg("GMAIL_CLIENT_SECRET");

  const client = new google.auth.OAuth2(clientId, clientSecret, GMAIL_SETUP_REDIRECT_URI);

  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  console.log("\n1. Open this URL, sign in with sanjeedanusrat@gmail.com, and approve access:\n");
  console.log(authUrl);
  console.log("\n2. Waiting for the redirect on http://localhost:53682/callback ...\n");

  const code = await new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      if (!req.url?.startsWith("/callback")) {
        res.writeHead(404).end();
        return;
      }
      const url = new URL(req.url, GMAIL_SETUP_REDIRECT_URI);
      const authCode = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        error
          ? "<h1>Auth failed</h1><p>You can close this tab.</p>"
          : "<h1>Success</h1><p>You can close this tab and go back to the terminal.</p>"
      );
      server.close();

      if (error) reject(new Error(error));
      else if (authCode) resolve(authCode);
      else reject(new Error("No code or error in callback."));
    });
    server.listen(53682);
  });

  const { tokens } = await client.getToken(code);

  if (!tokens.refresh_token) {
    console.error(
      "\nNo refresh_token returned. This usually means you've already granted consent before. " +
        "Revoke access at https://myaccount.google.com/permissions and re-run this script."
    );
    process.exit(1);
  }

  console.log("\nSuccess. Add this to your .env (and to the GitHub Actions secret GMAIL_REFRESH_TOKEN):\n");
  console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
