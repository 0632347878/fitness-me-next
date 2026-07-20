import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const waitlistSchema = z.object({
  email: z.string().email(),
});

/**
 * Presale waitlist capture.
 *
 * This is intentionally infra-light: it does NOT write to Postgres (that would
 * require a new Prisma model + migration in fitness-app-backend). Instead it
 * forwards each signup to a webhook URL you control, set via the
 * WAITLIST_WEBHOOK_URL env var — point it at:
 *   - a Zapier/Make "Catch Hook" step that appends to a Google Sheet, or
 *   - Resend's contacts API, or
 *   - a simple Airtable/Sheety endpoint.
 *
 * Without that env var set, it just logs the email server-side so the form
 * still works end-to-end while you wire up real storage.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = waitlistSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid email" }, { status: 400 });
  }

  const { email } = parsed.data;
  const webhookUrl = process.env.WAITLIST_WEBHOOK_URL;

  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "repwise-presale", ts: new Date().toISOString() }),
      });
    } catch (err) {
      // Don't fail the signup for the user just because the webhook is down —
      // log it so you can backfill, but still confirm to the visitor.
      console.error("[waitlist] webhook forward failed:", err);
    }
  } else {
    console.log("[waitlist] signup (no WAITLIST_WEBHOOK_URL configured):", email);
  }

  return NextResponse.json({ ok: true });
}
