import { NextResponse } from "next/server";

/**
 * Cron quotidien Vercel.
 * Programmé via vercel.json (par défaut 20h UTC = 22h Bujumbura).
 * Protégé par CRON_SECRET (header "Authorization: Bearer ...").
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error("[cron/daily-report] Invalid CRON_SECRET header");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Forward to the email route on same origin
  const origin = new URL(req.url).origin;
  const date = new Date().toISOString().slice(0, 10);

  const res = await fetch(`${origin}/api/report/daily/email?date=${date}`, {
    method: "POST",
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
