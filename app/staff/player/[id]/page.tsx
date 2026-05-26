import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PlayerCard } from "@/components/aureak/PlayerCard";
import { StatsRadar } from "@/components/aureak/StatsRadar";
import { EvolutionChart } from "@/components/aureak/EvolutionChart";
import { DailyCheckinList, PostSessionList } from "@/components/aureak/CheckinHistory";
import { statsFromCheckin, readinessOvr, regularity7d } from "@/lib/readiness";
import { requireStaff } from "@/lib/staff";
import type {
  DailyCheckinRow,
  InjuryRow,
  PlayerRow,
  Position,
  PostSessionRow,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StaffPlayerDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login");
  const { supabase, staff } = ctx;

  const { id } = await params;

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .eq("selection_id", staff.selection_id) // RLS ceinture + bretelles
    .maybeSingle<PlayerRow>();

  if (!player) notFound();

  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthAgoStr = monthAgo.toISOString().slice(0, 10);

  const [{ data: history }, { data: sessions }, { data: injuries }] =
    await Promise.all([
      supabase
        .from("daily_checkins")
        .select("*")
        .eq("player_id", player.id)
        .gte("date", monthAgoStr)
        .order("date", { ascending: true }),
      supabase
        .from("post_session")
        .select("*")
        .eq("player_id", player.id)
        .gte("session_date", monthAgoStr)
        .order("session_date", { ascending: true }),
      supabase
        .from("injuries")
        .select("*")
        .eq("player_id", player.id)
        .order("declared_at", { ascending: false })
        .limit(10),
    ]);

  const checkins = (history ?? []) as DailyCheckinRow[];
  const postSessions = (sessions ?? []) as PostSessionRow[];
  const last = checkins[checkins.length - 1] ?? null;
  const regularity = regularity7d(checkins.map((c) => c.date));
  const stats = last
    ? statsFromCheckin(last, regularity)
    : { forme: 50, sleep: 50, recovery: 50, physical: 50, mental: 50, regularity };
  const ovr = last
    ? last.readiness_score ?? readinessOvr(last, regularity)
    : Math.round(regularity * 0.5);

  const chartData = checkins.map((c) => ({
    date: c.date,
    value: c.readiness_score ?? 0,
  }));
  const rpeData = postSessions.map((s) => ({
    date: s.session_date as string,
    value: s.rpe ?? 0,
  }));

  const openInjuries = (injuries ?? []).filter((i) => !i.resolved_at) as InjuryRow[];

  return (
    <main className="max-w-[1100px] mx-auto px-5 py-8">
      <Link href="/staff" className="text-xs text-[#8b93a7] hover:text-white">
        ← retour squad
      </Link>

      <div className="mt-4 grid gap-6 md:grid-cols-[260px_1fr] items-start">
        {/* Card */}
        <div>
          <PlayerCard
            ovr={ovr}
            name={player.last_name}
            firstName={player.first_name}
            position={(player.position ?? "MIL") as Position}
            staffRole={player.staff_role}
            stats={stats}
            photoUrl={player.photo_url}
            photoScale={2.4}
            streak={checkins.length}
            footerLeft={ovr < 60 ? "⚠ FATIGUE" : `${checkins.length} check-ins`}
            style={{ maxWidth: 240, margin: "0 auto" }}
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div>
            <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wider">
              {player.first_name.toUpperCase()} {player.last_name.toUpperCase()}
            </h1>
            <p className="text-[#8b93a7] text-sm mt-1">
              {player.position} · inscrit le{" "}
              {new Date(player.created_at).toLocaleDateString("fr-FR", {
                day: "2-digit", month: "long", year: "numeric",
              })}
            </p>
          </div>

          {openInjuries.length > 0 && (
            <div className="rounded-xl border border-[#ff4d5e]/30 bg-[#ff4d5e]/10 p-4">
              <div className="text-xs uppercase tracking-widest text-[#ff4d5e] font-[family-name:var(--font-oswald)] font-bold mb-2">
                ⚠ {openInjuries.length} blessure{openInjuries.length > 1 ? "s" : ""} ouverte{openInjuries.length > 1 ? "s" : ""}
              </div>
              <ul className="text-sm space-y-1.5">
                {openInjuries.map((inj) => (
                  <li key={inj.id} className="flex justify-between">
                    <span>{inj.body_part}{inj.body_side !== "center" ? ` ${inj.body_side === "left" ? "gauche" : "droite"}` : ""}</span>
                    <span className="font-[family-name:var(--font-bebas)] text-[#ff4d5e]">{inj.intensity}/10</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl bg-[#131826] border border-white/5 p-4">
            <h3 className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-2">
              Profil radar
            </h3>
            <StatsRadar stats={stats} />
          </div>
        </div>
      </div>

      {/* ━━━ Réponses brutes : ce que le joueur a déclaré ━━━ */}
      <section className="mt-8 rounded-2xl bg-[#131826] border border-white/5 p-4">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-xs uppercase tracking-widest text-[#c9a44b] font-[family-name:var(--font-oswald)] font-bold">
            Check-ins déclarés ({checkins.length})
          </h3>
          <span className="text-[11px] text-[#8b93a7]">Du plus récent au plus ancien · 30 jours</span>
        </div>
        <DailyCheckinList checkins={checkins} />
      </section>

      {postSessions.length > 0 && (
        <section className="mt-6 rounded-2xl bg-[#131826] border border-white/5 p-4">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-xs uppercase tracking-widest text-[#00aaff] font-[family-name:var(--font-oswald)] font-bold">
              Post-séances déclarées ({postSessions.length})
            </h3>
            <span className="text-[11px] text-[#8b93a7]">Effort perçu, kiff, perf auto-éval</span>
          </div>
          <PostSessionList sessions={postSessions} />
        </section>
      )}

      <section className="mt-6 rounded-2xl bg-[#131826] border border-white/5 p-4">
        <h3 className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-2">
          Readiness OVR — 30 derniers jours
        </h3>
        {chartData.length > 0 ? (
          <EvolutionChart data={chartData} color="#c9a44b" label="OVR" />
        ) : (
          <div className="text-center py-12 text-[#8b93a7] text-sm">
            Pas de check-in sur 30 jours.
          </div>
        )}
      </section>

      {rpeData.length > 0 && (
        <section className="mt-6 rounded-2xl bg-[#131826] border border-white/5 p-4">
          <h3 className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-2">
            Charge — RPE Borg ({rpeData.length} séances/matchs)
          </h3>
          <EvolutionChart data={rpeData} color="#00aaff" label="RPE" />
        </section>
      )}

      <section className="mt-6 rounded-2xl bg-[#131826] border border-white/5 p-4">
        <h3 className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-3">
          Historique blessures
        </h3>
        {!injuries || injuries.length === 0 ? (
          <p className="text-sm text-[#8b93a7]">Aucune blessure historisée.</p>
        ) : (
          <div className="space-y-2">
            {(injuries as InjuryRow[]).map((inj) => (
              <div
                key={inj.id}
                className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-[#0a0e1a]/60 border border-white/5"
              >
                <span>
                  <b>{inj.body_part}</b>
                  {inj.body_side !== "center" ? ` ${inj.body_side === "left" ? "G" : "D"}` : ""} · {inj.type ?? "—"}
                </span>
                <span className="text-[#8b93a7] text-xs">
                  {new Date(inj.declared_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  {inj.resolved_at && " ✓"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
