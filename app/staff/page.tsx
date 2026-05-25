import Link from "next/link";
import { redirect } from "next/navigation";
import { PlayerCard } from "@/components/aureak/PlayerCard";
import { SquadListMorning, SquadListSession } from "@/components/aureak/SquadList";
import { ViewToggle } from "@/components/aureak/ViewToggle";
import { FilterTabs } from "@/components/aureak/FilterTabs";
import { TeamPulse } from "@/components/aureak/TeamPulse";
import { SortToggle } from "@/components/aureak/SortToggle";
import { statsFromCheckin, readinessOvr, regularity7d } from "@/lib/readiness";
import { requireStaff } from "@/lib/staff";
import type { DailyCheckinRow, PlayerRow, Position, PostSessionRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Squad · Staff · AureakForm" };

type Loaded = PlayerRow & {
  todayCheckin: DailyCheckinRow | null;
  ovr: number;
  regularity: number;
  hasOpenInjury: boolean;
};

export default async function StaffSquadPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; filter?: string; sort?: string }>;
}) {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login");
  const { supabase, staff } = ctx;

  const sp = await searchParams;
  const view: "grid" | "list" = sp.view === "list" ? "list" : "grid";
  const filter: "morning" | "session" = sp.filter === "session" ? "session" : "morning";
  const sort: "alert" | "position" = sp.sort === "position" ? "position" : "alert";

  const todayStr = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("selection_id", staff.selection_id);

  const playerList = (players ?? []) as PlayerRow[];
  const playerIds = playerList.map((p) => p.id);

  // ── 4 queries seulement (au lieu de 4 × N) ──
  // Quand playerIds est vide, on évite de fire les queries pour pas surcharger.
  const safeIds = playerIds.length ? playerIds : ["00000000-0000-0000-0000-000000000000"];

  const [{ data: todayCheckins }, { data: recentDates }, { data: openInjuries }, { data: recentSessions }] =
    await Promise.all([
      supabase
        .from("daily_checkins")
        .select("*")
        .in("player_id", safeIds)
        .eq("date", todayStr),
      supabase
        .from("daily_checkins")
        .select("player_id,date")
        .in("player_id", safeIds)
        .gte("date", sevenDaysAgoStr),
      supabase
        .from("injuries")
        .select("player_id")
        .in("player_id", safeIds)
        .is("resolved_at", null),
      supabase
        .from("post_session")
        .select("*")
        .in("player_id", safeIds)
        .gte("session_date", sevenDaysAgoStr)
        .order("created_at", { ascending: false }),
    ]);

  // ── Bucketing par player_id côté Node ──
  const todayByPlayer = new Map<string, DailyCheckinRow>();
  ((todayCheckins ?? []) as DailyCheckinRow[]).forEach((c) => todayByPlayer.set(c.player_id, c));

  const datesByPlayer = new Map<string, string[]>();
  (recentDates ?? []).forEach((r) => {
    const arr = datesByPlayer.get(r.player_id as string) ?? [];
    arr.push(r.date as string);
    datesByPlayer.set(r.player_id as string, arr);
  });

  const injuredPlayers = new Set((openInjuries ?? []).map((i) => i.player_id as string));

  const latestSessionByPlayer = new Map<string, PostSessionRow>();
  ((recentSessions ?? []) as PostSessionRow[]).forEach((s) => {
    if (!latestSessionByPlayer.has(s.player_id)) latestSessionByPlayer.set(s.player_id, s);
  });

  const loaded: (Loaded & { latestSession: PostSessionRow | null })[] = playerList.map((p) => {
    const today = todayByPlayer.get(p.id) ?? null;
    const regularity = regularity7d(datesByPlayer.get(p.id) ?? []);
    const ovr = today
      ? today.readiness_score ?? readinessOvr(today, regularity)
      : 0; // 0 = pas de check-in → tier "neutral" géré côté UI
    return {
      ...p,
      todayCheckin: today,
      ovr,
      regularity,
      hasOpenInjury: injuredPlayers.has(p.id),
      latestSession: latestSessionByPlayer.get(p.id) ?? null,
    };
  });

  // Tri : alertes bronze (1-59) en premier, puis ordre croissant des checked,
  // puis les "no data" (ovr = 0) à la fin (= pas encore de check-in du jour).
  const sorted = [...loaded].sort((a, b) => {
    const aNoData = a.ovr === 0;
    const bNoData = b.ovr === 0;
    if (aNoData && !bNoData) return 1;
    if (!aNoData && bNoData) return -1;
    return a.ovr - b.ovr;
  });
  // Vrai compte d'alertes : on exclut les "pas encore checké" (ovr = 0)
  const bronzeCount = sorted.filter((p) => p.ovr > 0 && p.ovr < 60).length;
  const checkedInCount = sorted.filter((p) => p.todayCheckin).length;

  // Précalcul des stats pour chaque joueur (utilisé dans les 2 vues)
  const enriched = sorted.map((p) => {
    const stats = p.todayCheckin
      ? statsFromCheckin(p.todayCheckin, p.regularity)
      : { forme: 50, sleep: 50, recovery: 50, physical: 50, mental: 50, regularity: p.regularity };
    return { ...p, stats };
  });

  return (
    <main className="max-w-[1400px] mx-auto px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wider">
            SQUAD DU JOUR
          </h1>
          <p className="text-[#8b93a7] text-sm mt-1">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long", day: "2-digit", month: "long",
            })} · {sorted.length} joueurs
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <FilterTabs current={filter} baseHref="/staff" preserve={{ view: sp.view, sort: sp.sort }} />
          <SortToggle current={sort} baseHref="/staff" preserve={{ view: sp.view, filter: sp.filter }} />
          <ViewToggle current={view} baseHref="/staff" />
          <div className="rounded-xl bg-[#131826] border border-white/5 px-4 py-3 text-center">
            <div className="text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)]">Check-ins</div>
            <div className="font-[family-name:var(--font-bebas)] text-2xl">
              {checkedInCount}/{sorted.length}
            </div>
          </div>
          <div className={`rounded-xl border px-4 py-3 text-center ${
            bronzeCount > 0
              ? "bg-[#ff4d5e]/10 border-[#ff4d5e]/30"
              : "bg-[#131826] border-white/5"
          }`}>
            <div className="text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)]">Alertes</div>
            <div className={`font-[family-name:var(--font-bebas)] text-2xl ${bronzeCount > 0 ? "text-[#ff4d5e]" : ""}`}>
              {bronzeCount}
            </div>
          </div>
        </div>
      </div>

      {enriched.length > 0 && (
        <TeamPulse
          players={enriched.map((p) => ({
            id: p.id,
            ovr: p.ovr,
            todayCheckin: p.todayCheckin,
            stats: p.stats,
            hasOpenInjury: p.hasOpenInjury,
          }))}
        />
      )}

      {enriched.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#131826] p-12 text-center text-[#8b93a7]">
          Aucun joueur n&apos;a encore créé sa carte sur cette sélection.
        </div>
      ) : sort === "position" ? (
        <>
          {POSITION_ORDER.map((pos) => {
            const group = enriched.filter((p) => (p.position ?? "MIL") === pos);
            if (group.length === 0) return null;
            return (
              <section key={pos} className="mb-6">
                <h2 className="font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest text-xs text-[#c9a44b] mb-3 flex items-center gap-2">
                  <span>{POSITION_LABEL[pos]}</span>
                  <span className="text-[#8b93a7] font-normal">({group.length})</span>
                  <span className="flex-1 h-px bg-white/5 ml-2" />
                </h2>
                {view === "list" ? (
                  filter === "session" ? (
                    <SquadListSession
                      rows={group.map((p) => ({
                        id: p.id, first_name: p.first_name, last_name: p.last_name,
                        position: p.position, ovr: p.ovr, latestSession: p.latestSession,
                      }))}
                    />
                  ) : (
                    <SquadListMorning
                      rows={group.map((p) => ({
                        id: p.id, first_name: p.first_name, last_name: p.last_name,
                        position: p.position, ovr: p.ovr, todayCheckin: p.todayCheckin,
                        hasOpenInjury: p.hasOpenInjury,
                      }))}
                    />
                  )
                ) : (
                  <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(170px,1fr))]">
                    {group.map((p) => (
                      <PlayerCardLink key={p.id} p={p} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </>
      ) : view === "list" ? (
        filter === "session" ? (
          <SquadListSession
            rows={enriched.map((p) => ({
              id: p.id, first_name: p.first_name, last_name: p.last_name,
              position: p.position, ovr: p.ovr, latestSession: p.latestSession,
            }))}
          />
        ) : (
          <SquadListMorning
            rows={enriched.map((p) => ({
              id: p.id, first_name: p.first_name, last_name: p.last_name,
              position: p.position, ovr: p.ovr, todayCheckin: p.todayCheckin,
              hasOpenInjury: p.hasOpenInjury,
            }))}
          />
        )
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(170px,1fr))]">
          {enriched.map((p) => <PlayerCardLink key={p.id} p={p} />)}
        </div>
      )}
    </main>
  );
}

const POSITION_ORDER: Position[] = ["GK", "DEF", "MIL", "ATT"];
const POSITION_LABEL: Record<Position, string> = {
  GK:  "Gardiens",
  DEF: "Défenseurs",
  MIL: "Milieux",
  ATT: "Attaquants",
};

// Sous-composant pour éviter la duplication entre vue groupée et vue plate
function PlayerCardLink({ p }: { p: { id: string; first_name: string; last_name: string; position: Position | null; ovr: number; stats: import("@/components/aureak/PlayerCard").WellnessStats; todayCheckin: DailyCheckinRow | null; hasOpenInjury: boolean } }) {
  return (
    <Link href={`/staff/player/${p.id}`} className="block hover:scale-[1.02] transition-transform">
      <PlayerCard
        ovr={p.ovr}
        name={p.last_name}
        firstName={p.first_name}
        position={(p.position ?? "MIL") as Position}
        stats={p.stats}
        compact
        style={{ maxWidth: "100%" }}
      />
      <div className="text-center mt-2 text-[11px] text-[#8b93a7] font-[family-name:var(--font-oswald)] uppercase tracking-widest">
        {p.todayCheckin ? "✓ Check-in" : "Pas encore"}
        {p.hasOpenInjury && <span className="text-[#ff4d5e]"> · 🩹</span>}
      </div>
    </Link>
  );
}
