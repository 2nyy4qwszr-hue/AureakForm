import { NextResponse } from "next/server";
import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import { timingSafeEqual } from "node:crypto";
import { buildDailyReportData } from "@/lib/report";
import { DailyReport } from "@/lib/pdf/DailyReport";
import { requireStaff } from "@/lib/staff";

export const dynamic = "force-dynamic";

function safeBearerEquals(header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Échappe les caractères HTML dangereux dans les valeurs venant de la DB.
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * POST /api/report/daily/email
 *
 * Génère le PDF du jour et l'envoie à STAFF_EMAIL via Resend.
 * Utilisé par : le bouton "Envoyer maintenant" du dashboard staff
 * ET le cron quotidien Vercel (via /api/cron/daily-report).
 *
 * Auth : staff session OU header Authorization: Bearer ${CRON_SECRET}.
 */
export async function POST(req: Request) {
  // Auth : soit le cron interne (Bearer CRON_SECRET), soit un staff connecté.
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const isCron = !!cronSecret && safeBearerEquals(auth, cronSecret);
  if (!isCron) {
    const ctx = await requireStaff();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toRaw = process.env.STAFF_EMAIL;
  const from = process.env.RESEND_FROM ?? "AureakForm <onboarding@resend.dev>";

  if (!apiKey || !toRaw) {
    return NextResponse.json(
      {
        error:
          "RESEND_API_KEY ou STAFF_EMAIL absent. Configure-les dans .env.local (ou Vercel env).",
      },
      { status: 400 }
    );
  }

  // STAFF_EMAIL accepte 1 ou plusieurs emails séparés par virgule.
  // Ex: "coach@aureak.be,medic@aureak.be,j.devriendt@aureak.be"
  const to = toRaw
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e.length > 0);

  if (to.length === 0) {
    return NextResponse.json(
      { error: "STAFF_EMAIL ne contient aucune adresse valide." },
      { status: 400 }
    );
  }

  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  let selection: Awaited<ReturnType<typeof buildDailyReportData>>["selection"];
  let players: Awaited<ReturnType<typeof buildDailyReportData>>["players"];
  let injuries: Awaited<ReturnType<typeof buildDailyReportData>>["injuries"];
  try {
    const data = await buildDailyReportData({ date });
    selection = data.selection;
    players = data.players;
    injuries = data.injuries;
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }

  // JSX construite hors du try/catch (cf. eslint react-hooks/error-boundaries) :
  // renderToBuffer est async, donc les erreurs de rendu sont quand même
  // remontées par le await ci-dessous.
  const reportElement = (
    <DailyReport
      date={date}
      selection={selection.name}
      players={players}
      injuries={injuries}
    />
  );

  try {
    const pdfBuffer = await renderToBuffer(reportElement);

    const resend = new Resend(apiKey);
    const alerts = players.filter((p) => p.ovr !== null && p.ovr < 60).length;
    const checked = players.filter((p) => p.checkedIn).length;

    const result = await resend.emails.send({
      from,
      to,
      subject: `AureakForm — ${selection.name} — ${date} (${checked}/${players.length} check-ins, ${alerts} alertes, ${injuries.length} bobos)`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">
          <h1 style="font-family:'Bebas Neue',Helvetica,sans-serif;letter-spacing:2px;font-size:28px;margin:0">AUREAKFORM</h1>
          <p style="color:#666">${esc(selection.name)} — ${new Date(date).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" })}</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <tr><td style="padding:10px;background:#f5f5f5;border-radius:6px">
              <b>${checked}/${players.length}</b> check-ins ·
              <b style="color:${alerts > 0 ? "#ff4d5e" : "#16a34a"}">${alerts}</b> alertes ·
              <b style="color:${injuries.length > 0 ? "#ff4d5e" : "#16a34a"}">${injuries.length}</b> blessures ouvertes
            </td></tr>
          </table>
          <p>Le récap PDF est en pièce jointe.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#999;font-size:12px">Envoyé automatiquement par AureakForm. Pour consulter le dashboard live : <a href="${url.origin}/staff">${url.origin}/staff</a></p>
        </div>
      `,
      attachments: [
        {
          filename: `aureakform-${date}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 });
    }

    // Redirect back to staff/export on success (for the form submission case)
    if (req.headers.get("accept")?.includes("text/html")) {
      return NextResponse.redirect(new URL("/staff/export?sent=1", url.origin));
    }
    return NextResponse.json({ ok: true, id: result.data?.id });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
