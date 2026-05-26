import { redirect } from "next/navigation";
import { FileDown, Mail } from "lucide-react";
import { requireStaff } from "@/lib/staff";

export const metadata = { title: "Export · Staff · AureakForm" };

export default async function StaffExportPage() {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login");

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <main className="max-w-[700px] mx-auto px-5 py-8">
      <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wider">EXPORT</h1>
      <p className="text-[#8b93a7] text-sm mt-1">
        Récap PDF de la journée · download direct ou envoi par mail au staff.
      </p>

      <section className="mt-8 space-y-4">
        <a
          href={`/api/report/daily?date=${todayStr}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#131826] p-5 hover:bg-[#1a2030] transition"
        >
          <div>
            <div className="font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest text-sm">
              PDF de la journée
            </div>
            <div className="text-xs text-[#8b93a7] mt-1">
              Squad + alertes + déclarations · {todayStr}
            </div>
          </div>
          <FileDown size={20} />
        </a>

        <form
          action="/api/report/daily/email"
          method="post"
          className="rounded-2xl border border-white/5 bg-[#131826] p-5"
        >
          <div className="font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest text-sm mb-2">
            Envoyer par mail
          </div>
          <p className="text-xs text-[#8b93a7] mb-4">
            L&apos;adresse (ou les adresses séparées par virgule) <b>STAFF_EMAIL</b> doit être
            renseignée dans .env.local et la clé <b>RESEND_API_KEY</b> doit être active.
          </p>
          <button
            type="submit"
            className="w-full rounded-xl py-3 bg-gradient-to-br from-[#00aaff] to-[#0072ff] text-white font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-sm flex items-center justify-center gap-2"
          >
            <Mail size={16} /> Envoyer maintenant
          </button>
        </form>

        <div className="rounded-2xl border border-white/5 bg-[#131826] p-5">
          <div className="font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest text-sm mb-2">
            Cron quotidien
          </div>
          <p className="text-xs text-[#8b93a7]">
            En prod (Vercel), le PDF est généré et envoyé chaque soir à 20h00 UTC
            à l&apos;adresse STAFF_EMAIL (config dans <code>vercel.json</code>).
          </p>
        </div>
      </section>
    </main>
  );
}
