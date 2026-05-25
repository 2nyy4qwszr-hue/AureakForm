import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, HeartPulse } from "lucide-react";
import { requireStaff } from "@/lib/staff";
import type { InjuryRow, PlayerRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Alertes · Staff · AureakForm" };

export default async function StaffAlertsPage() {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login");
  const { supabase, staff } = ctx;

  const todayStr = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get all players of the selection
  const { data: players } = await supabase
    .from("players")
    .select("id,first_name,last_name,position")
    .eq("selection_id", staff.selection_id);
  const playerMap = new Map(
    (players ?? []).map((p) => [p.id as string, p as PlayerRow])
  );
  const playerIds = (players ?? []).map((p) => p.id as string);

  // Low readiness check-ins today
  const { data: lowReadiness } = await supabase
    .from("daily_checkins")
    .select("*")
    .in("player_id", playerIds.length ? playerIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("date", todayStr)
    .lt("readiness_score", 60)
    .order("readiness_score", { ascending: true });

  // Open injuries (resolved_at NULL) in last 7 days
  const { data: openInjuries } = await supabase
    .from("injuries")
    .select("*")
    .in("player_id", playerIds.length ? playerIds : ["00000000-0000-0000-0000-000000000000"])
    .is("resolved_at", null)
    .gte("declared_at", sevenDaysAgo.toISOString())
    .order("declared_at", { ascending: false });

  const noShow = (players ?? []).filter((p) => {
    return !(lowReadiness ?? []).find((c) => c.player_id === p.id);
  });

  return (
    <main className="max-w-[1100px] mx-auto px-5 py-8">
      <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wider">
        ALERTES DU JOUR
      </h1>
      <p className="text-[#8b93a7] text-sm mt-1">
        {new Date().toLocaleDateString("fr-FR", {
          weekday: "long", day: "2-digit", month: "long",
        })}
      </p>

      {/* Open injuries */}
      <section className="mt-8">
        <h2 className="text-xs uppercase tracking-widest text-[#ff4d5e] font-[family-name:var(--font-oswald)] font-bold mb-3 flex items-center gap-2">
          <HeartPulse size={14} /> Blessures ouvertes ({(openInjuries ?? []).length})
        </h2>
        {(!openInjuries || openInjuries.length === 0) ? (
          <div className="rounded-xl border border-white/5 bg-[#131826] p-4 text-sm text-[#8b93a7]">
            ✅ Aucune blessure déclarée sur les 7 derniers jours.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {(openInjuries as InjuryRow[]).map((inj) => {
              const p = playerMap.get(inj.player_id);
              return (
                <Link
                  key={inj.id}
                  href={p ? `/staff/player/${p.id}` : "#"}
                  className="rounded-xl border border-[#ff4d5e]/20 bg-[#ff4d5e]/5 p-4 hover:bg-[#ff4d5e]/10 transition"
                >
                  <div className="flex justify-between items-baseline">
                    <span className="font-[family-name:var(--font-oswald)] font-bold uppercase text-lg">
                      {p ? `${p.first_name} ${p.last_name}` : "—"}
                    </span>
                    <span className="text-2xl font-[family-name:var(--font-bebas)] text-[#ff4d5e]">
                      {inj.intensity}/10
                    </span>
                  </div>
                  <div className="text-sm text-[#cfd6e6] mt-1">
                    <b>{inj.body_part}</b>{inj.body_side !== "center" ? ` ${inj.body_side === "left" ? "gauche" : "droite"}` : ""} · {inj.type ?? "—"}
                  </div>
                  <div className="text-[11px] text-[#8b93a7] mt-1">
                    Déclaré le {new Date(inj.declared_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                  {inj.comment && (
                    <p className="text-xs text-[#cfd6e6] mt-2 italic">« {inj.comment} »</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Low readiness */}
      <section className="mt-10">
        <h2 className="text-xs uppercase tracking-widest text-[#ffa42b] font-[family-name:var(--font-oswald)] font-bold mb-3 flex items-center gap-2">
          <AlertTriangle size={14} /> Readiness bas aujourd&apos;hui ({(lowReadiness ?? []).length})
        </h2>
        {(!lowReadiness || lowReadiness.length === 0) ? (
          <div className="rounded-xl border border-white/5 bg-[#131826] p-4 text-sm text-[#8b93a7]">
            ✅ Aucun joueur en alerte (readiness &lt; 60).
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {lowReadiness.map((c) => {
              const p = playerMap.get(c.player_id as string);
              return (
                <Link
                  key={c.id as string}
                  href={p ? `/staff/player/${p.id}` : "#"}
                  className="rounded-xl border border-[#ffa42b]/30 bg-[#ffa42b]/5 p-4 hover:bg-[#ffa42b]/10 transition"
                >
                  <div className="flex justify-between items-baseline">
                    <span className="font-[family-name:var(--font-oswald)] font-bold uppercase text-lg">
                      {p ? `${p.first_name} ${p.last_name}` : "—"}
                    </span>
                    <span className="text-2xl font-[family-name:var(--font-bebas)] text-[#ffa42b]">
                      {c.readiness_score as number}
                    </span>
                  </div>
                  <div className="text-xs text-[#8b93a7] mt-1">
                    Fatigue {c.fatigue}/10 · Douleurs {c.muscle_soreness}/10 · Sommeil {c.sleep_hours}h
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* No check-in yet */}
      {noShow.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-3">
            ⌛ Pas encore de check-in ({noShow.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {noShow.map((p) => (
              <Link
                key={p.id}
                href={`/staff/player/${p.id}`}
                className="rounded-full px-3 py-1.5 bg-[#131826] border border-white/10 text-xs hover:border-white/30"
              >
                {p.first_name} {p.last_name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
