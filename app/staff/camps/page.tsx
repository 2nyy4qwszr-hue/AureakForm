import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarRange, ChevronRight, Plus, Users } from "lucide-react";
import { requireStaff } from "@/lib/staff";
import { listCamps } from "@/lib/camp";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateCampForm } from "./CreateCampForm";
import { DeleteCampButton } from "./DeleteCampButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Camps · Staff · AureakForm" };

const FR_LONG = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

function daysBetween(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
}

export default async function CampsPage() {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login?error=not_staff");

  const camps = await listCamps(ctx.staff.selection_id);

  // Compteurs de convoqués par camp (1 requête)
  const admin = createAdminClient();
  const { data: cpRows } = camps.length > 0
    ? await admin.from("camp_players").select("camp_id").in("camp_id", camps.map((c) => c.id))
    : { data: [] as { camp_id: string }[] };
  const countByCamp = new Map<string, number>();
  (cpRows ?? []).forEach((r) => {
    countByCamp.set(r.camp_id, (countByCamp.get(r.camp_id) ?? 0) + 1);
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="max-w-[1100px] mx-auto px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wider flex items-center gap-3">
            <CalendarRange size={32} className="text-[#c9a44b]" /> CAMPS
          </h1>
          <p className="text-[#8b93a7] text-sm mt-1">
            Stages de la sélection · filtre les vues sur les joueurs convoqués et la période choisie.
          </p>
        </div>
      </div>

      <CreateCampForm />

      <div className="mt-6 rounded-2xl border border-white/5 bg-[#131826] overflow-hidden">
        {camps.length === 0 ? (
          <div className="p-10 text-center text-[#8b93a7]">
            <div className="text-sm">Aucun camp créé pour le moment.</div>
            <div className="text-xs mt-1">Crée ton premier stage ci-dessus.</div>
          </div>
        ) : (
          <ul>
            {camps.map((c) => {
              const count = countByCamp.get(c.id) ?? 0;
              const days = daysBetween(c.start_date, c.end_date);
              const isPast = c.end_date < today;
              const isFuture = c.start_date > today;
              const isOngoing = !isPast && !isFuture;
              return (
                <li
                  key={c.id}
                  className="border-b border-white/5 last:border-b-0 hover:bg-white/[.02] transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-4 p-4">
                    <Link href={`/staff/camps/${c.id}`} className="flex-1 min-w-0 flex items-center gap-3">
                      <div className={`shrink-0 w-2 h-12 rounded-full ${
                        isOngoing ? "bg-[#2bd47d]" : isFuture ? "bg-[#c9a44b]" : "bg-[#8b93a7]/30"
                      }`} />
                      <div className="min-w-0 flex-1">
                        <div className="font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide text-sm flex items-center gap-2">
                          {c.name}
                          {isOngoing && (
                            <span className="rounded px-1.5 py-0.5 text-[9px] tracking-widest bg-[#2bd47d]/20 text-[#2bd47d] border border-[#2bd47d]/40">
                              EN COURS
                            </span>
                          )}
                          {isFuture && (
                            <span className="rounded px-1.5 py-0.5 text-[9px] tracking-widest bg-[#c9a44b]/20 text-[#c9a44b] border border-[#c9a44b]/40">
                              À VENIR
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#8b93a7] mt-0.5 flex items-center gap-3">
                          <span>{FR_LONG(c.start_date)} → {FR_LONG(c.end_date)}</span>
                          <span>·</span>
                          <span>{days} jours</span>
                          <span>·</span>
                          <span className="flex items-center gap-1"><Users size={11} /> {count} convoqués</span>
                        </div>
                      </div>
                    </Link>
                    <Link
                      href={`/staff/camps/${c.id}`}
                      className="rounded-lg px-3 py-2 text-xs uppercase tracking-widest font-[family-name:var(--font-oswald)] font-bold bg-[#c9a44b]/15 text-[#c9a44b] border border-[#c9a44b]/30 hover:bg-[#c9a44b]/25 transition flex items-center gap-1.5"
                    >
                      Gérer <ChevronRight size={14} />
                    </Link>
                    <DeleteCampButton id={c.id} name={c.name} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-6 text-xs text-[#8b93a7]">
        💡 Active un camp via le sélecteur <Plus size={11} className="inline" /> en haut à droite : toutes les vues
        (squad, alertes, demandes, export) filtreront automatiquement sur les joueurs convoqués et la période choisie.
      </div>
    </main>
  );
}
