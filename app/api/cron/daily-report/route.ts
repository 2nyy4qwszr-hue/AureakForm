import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

/**
 * Cron quotidien Vercel.
 * Programmé via vercel.json (par défaut 20h UTC = 22h Bujumbura).
 * Protégé par CRON_SECRET (header "Authorization: Bearer ...").
 */
export const dynamic = "force-dynamic";

function safeBearerEquals(header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/daily-report] CRON_SECRET non configuré — route refusée");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (!safeBearerEquals(auth, secret)) {
    console.error("[cron/daily-report] Invalid Authorization header");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Forward to the email route on same origin.
  // On passe le CRON_SECRET en Authorization pour que l'endpoint email l'accepte
  // (il valide soit une session staff, soit ce header).
  const origin = new URL(req.url).origin;
  const date = new Date().toISOString().slice(0, 10);

  const res = await fetch(`${origin}/api/report/daily/email?date=${date}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  // On préserve le body brut si le JSON ne parse pas, pour ne pas
  // masquer une 500 / une page HTML d'erreur derrière un cron "OK".
  const raw = await res.text();
  let downstream: unknown;
  try {
    downstream = JSON.parse(raw);
  } catch {
    downstream = { rawBody: raw.slice(0, 500) };
  }
  if (!res.ok) {
    console.error("[cron/daily-report] downstream error", res.status, downstream);
  }
  return NextResponse.json({ triggered: true, date, downstream }, { status: res.status });
}
