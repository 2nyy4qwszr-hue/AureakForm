import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { DispatchForm } from "./DispatchForm";
import { RequestRow } from "./RequestRow";
import type { RequestRow as Req } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Demandes · Staff · AureakForm" };

export default async function DispatchPage() {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login");
  const admin = createAdminClient();

  // Tous les joueurs de la sélection (pour calculer le taux de réponse)
  const { data: players } = await admin
    .from("players")
    .select("id")
    .eq("selection_id", ctx.staff.selection_id);
  const playerIds = (players ?? []).map((p) => p.id as string);
  const totalPlayers = playerIds.length;

  // Demandes des 30 derniers jours
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const { data: requests } = await admin
    .from("requests")
    .select("*")
    .eq("selection_id", ctx.staff.selection_id)
    .gte("created_at", monthAgo.toISOString())
    .order("created_at", { ascending: false });

  const reqList = (requests ?? []) as Req[];

  // Pour chaque demande, compter combien de joueurs ont répondu
  // (= ont créé un check-in / post-session après le created_at de la demande)
  const reqWithCounts = await Promise.all(
    reqList.map(async (r) => {
      if (totalPlayers === 0) return { ...r, responseCount: 0 };
      const since = r.created_at;
      const table = r.kind === "morning_checkin" ? "daily_checkins" : "post_session";
      const { data: responders } = await admin
        .from(table)
        .select("player_id")
        .in("player_id", playerIds)
        .gte("created_at", since);
      const uniq = new Set((responders ?? []).map((x) => x.player_id as string));
      return { ...r, responseCount: uniq.size };
    })
  );

  const active = reqWithCounts.filter((r) => r.active);
  const closed = reqWithCounts.filter((r) => !r.active);

  return (
    <main className="max-w-[1000px] mx-auto px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wider">
            DEMANDES
          </h1>
          <p className="text-[#8b93a7] text-sm mt-1">
            Envoie une demande à toute la sélection. Les joueurs la voient sur leur home.
          </p>
        </div>
      </div>

      {/* Formulaire d'envoi */}
      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-widest text-[#c9a44b] font-[family-name:var(--font-oswald)] font-bold mb-3">
          Nouvelle demande
        </h2>
        <DispatchForm />
      </section>

      {/* Demandes actives */}
      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-[#2bd47d] font-[family-name:var(--font-oswald)] font-bold mb-3 flex items-center gap-2">
            Demandes ouvertes
            <span className="text-[#8b93a7] font-normal">({active.length})</span>
          </h2>
          <ul className="space-y-3">
            {active.map((r) => (
              <RequestRow
                key={r.id}
                request={r}
                responseCount={r.responseCount}
                totalPlayers={totalPlayers}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Historique fermées */}
      {closed.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-3">
            Historique (30j) · {closed.length}
          </h2>
          <ul className="space-y-3">
            {closed.map((r) => (
              <RequestRow
                key={r.id}
                request={r}
                responseCount={r.responseCount}
                totalPlayers={totalPlayers}
              />
            ))}
          </ul>
        </section>
      )}

      {reqWithCounts.length === 0 && (
        <div className="rounded-2xl border border-white/5 bg-[#131826] p-12 text-center text-[#8b93a7] text-sm">
          Aucune demande envoyée pour l&apos;instant. Crée-en une ci-dessus pour démarrer.
        </div>
      )}
    </main>
  );
}
