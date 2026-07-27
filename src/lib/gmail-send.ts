import { google } from "googleapis";
import type { GmailAuthClient } from "./gmail-auth.js";
// @ts-expect-error - nodemailer ships MailComposer without its own type entrypoint
import MailComposer from "nodemailer/lib/mail-composer/index.js";

export interface OutgoingEmail {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

function toBase64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function buildRawMessage(email: OutgoingEmail): Promise<string> {
  const composer = new MailComposer({
    from: email.from,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });

  const message: Buffer = await new Promise((resolve, reject) => {
    composer.compile().build((err: Error | null, msg: Buffer) => {
      if (err) reject(err);
      else resolve(msg);
    });
  });

  return toBase64Url(message);
}

export async function sendEmail(
  auth: GmailAuthClient,
  email: OutgoingEmail
): Promise<{ id: string | null | undefined }> {
  const gmail = google.gmail({ version: "v1", auth });
  const raw = await buildRawMessage(email);

  const result = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  return { id: result.data.id };
}
