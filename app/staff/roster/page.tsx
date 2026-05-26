import { redirect } from "next/navigation";
import { requireStaff, type StaffRole } from "@/lib/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { listAllAuthUsers } from "@/lib/auth-users";
import { RosterRow } from "./RosterRow";
import { AddPlayerForm } from "./AddPlayerForm";
import type { PlayerRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Roster · Staff · AureakForm" };

const POSITION_ORDER = ["GK", "DEF", "MIL", "ATT"] as const;
const POSITION_LABEL: Record<string, string> = {
  GK: "Gardiens", DEF: "Défenseurs", MIL: "Milieux", ATT: "Attaquants",
};

export default async function RosterPage() {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login");

  const admin = createAdminClient();
  const isAdmin = ctx.staff.role === "admin";

  // Récupère tous les players de la sélection
  const { data: players } = await admin
    .from("players")
    .select("id, first_name, last_name, position, user_id")
    .eq("selection_id", ctx.staff.selection_id)
    .order("last_name");
  const list = (players ?? []) as PlayerRow[];

  // Récupère les emails depuis auth.users (paginé, robuste à >50 comptes)
  const users = await listAllAuthUsers(admin);
  const emailById = new Map(users.map((u) => [u.id, u.email ?? null]));

  // Récupère les rôles staff (user_id → role) de la sélection courante
  const { data: staffRows } = await admin
    .from("staff")
    .select("user_id, role")
    .eq("selection_id", ctx.staff.selection_id);
  const staffRoleById = new Map<string, StaffRole>(
    (staffRows ?? []).map((s) => [s.user_id as string, s.role as StaffRole])
  );

  const enriched = list.map((p) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    position: p.position,
    email: p.user_id ? emailById.get(p.user_id) ?? null : null,
    staffRole: p.user_id ? staffRoleById.get(p.user_id) ?? null : null,
    isSelf: p.user_id === ctx.user.id,
  }));

  const linkedCount = enriched.filter((p) => p.email).length;

  return (
    <main className="max-w-[1100px] mx-auto px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wider">
            ROSTER · COMPTES
          </h1>
          <p className="text-[#8b93a7] text-sm mt-1">
            Ajoute des joueurs · lie un email · génère un lien magique à envoyer par WhatsApp/SMS.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="rounded-xl bg-[#131826] border border-white/5 px-4 py-3 text-center">
            <div className="text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)]">Joueurs</div>
            <div className="font-[family-name:var(--font-bebas)] text-2xl">{enriched.length}</div>
          </div>
          <div className="rounded-xl bg-[#131826] border border-white/5 px-4 py-3 text-center">
            <div className="text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)]">Comptes liés</div>
            <div className="font-[family-name:var(--font-bebas)] text-2xl">{linkedCount}/{enriched.length}</div>
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      <div className="mb-6">
        <AddPlayerForm />
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#131826]">
        {POSITION_ORDER.map((pos) => {
          const group = enriched.filter((p) => p.position === pos);
          if (group.length === 0) return null;
          return (
            <section key={pos}>
              <div className="px-4 py-2 bg-[#0a0e1a]/60 border-b border-white/5 sticky top-0 z-10">
                <h2 className="font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest text-xs text-[#c9a44b] flex items-center gap-2">
                  <span>{POSITION_LABEL[pos]}</span>
                  <span className="text-[#8b93a7] font-normal">
                    {group.filter((p) => p.email).length}/{group.length} liés
                  </span>
                </h2>
              </div>
              <ul>
                {group.map((p) => <RosterRow key={p.id} player={p} viewerIsAdmin={isAdmin} />)}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="mt-6 text-xs text-[#8b93a7] space-y-1">
        <p>
          💡 <b>Comment ça marche</b> : tu tapes un email + Save → le compte est créé côté Supabase (sans email envoyé) + lié au joueur.
          Puis tu cliques <b>Lien</b> pour générer un lien magique d&apos;1 heure, copie-le, envoie-le par WhatsApp/SMS au joueur.
          Quand il clique, il atterrit directement sur sa carte FIFA — pas besoin de mot de passe.
        </p>
        <p>
          📧 Pour faire envoyer les liens magiques <b>directement par email</b> par Supabase, configure un SMTP custom dans
          Authentication &gt; Email Settings (Resend recommandé, voir <code>docs/</code>).
        </p>
      </div>
    </main>
  );
}
