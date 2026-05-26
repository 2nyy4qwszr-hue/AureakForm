import Link from "next/link";
import { redirect } from "next/navigation";
import { Sunrise, Dumbbell, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PlayerCard } from "@/components/aureak/PlayerCard";
import { BottomTabBar } from "@/components/aureak/BottomTabBar";
import { statsFromCheckin, readinessOvr, regularity7d } from "@/lib/readiness";
import type { DailyCheckinRow, PlayerRow, Position, RequestRow, PostSessionRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Staff d'abord : un admin/coach/kiné va direct sur /staff
  const { data: staffRow } = await supabase
    .from("staff")
    .select("user_id")
    .eq("user_id", user.id)
    .limit(1);
  if (staffRow && staffRow.length > 0) redirect("/staff");

  // .limit(1) + first element : résistant aux éventuels doublons historiques
  const { data: playerRows } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);
  const player = (playerRows?.[0] ?? null) as PlayerRow | null;

  if (!player) {
    redirect("/onboarding");
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  // Fetch en parallèle : check-in du jour + 7j historique + demandes actives + post-sessions récentes
  const [{ data: todayCheckin }, { data: recent }, { data: activeReqs }, { data: recentSessions }] = await Promise.all([
    supabase
      .from("daily_checkins")
      .select("*")
      .eq("player_id", player.id)
      .eq("date", todayStr)
      .maybeSingle<DailyCheckinRow>(),
    supabase
      .from("daily_checkins")
      .select("date,readiness_score,sleep_hours")
      .eq("player_id", player.id)
      .gte("date", sevenDaysAgo.toISOString().slice(0, 10))
      .order("date", { ascending: false }),
    supabase
      .from("requests")
      .select("*")
      .eq("selection_id", player.selection_id ?? "00000000-0000-0000-0000-000000000000")
      .eq("active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("post_session")
      .select("created_at")
      .eq("player_id", player.id)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false }),
  ]);

  // Pour chaque demande active, déterminer si le joueur a déjà répondu
  // (= a fait le check-in ou la post-session APRÈS la création de la demande)
  const reqs = (activeReqs ?? []) as RequestRow[];
  const myPostSessions = (recentSessions ?? []) as Pick<PostSessionRow, "created_at">[];

  const pendingRequests = reqs.map((r) => {
    const since = r.created_at;
    const done = r.kind === "morning_checkin"
      ? !!todayCheckin && todayCheckin.created_at >= since
      : myPostSessions.some((s) => s.created_at >= since);
    return { ...r, done };
  });
  const openCount = pendingRequests.filter((r) => !r.done).length;

  const regularity = regularity7d(
    (recent ?? []).map((r) => r.date as string)
  );

  // Build the card data from today's checkin (or a "neutral" state if none yet)
  const baseStats = todayCheckin
    ? statsFromCheckin(todayCheckin, regularity)
    : { forme: 50, sleep: 50, recovery: 50, physical: 50, mental: 50, regularity };

  const ovr = todayCheckin
    ? (todayCheckin.readiness_score ??
       readinessOvr(todayCheckin, regularity))
    : Math.round(regularity * 0.5);

  // Forme 7j (moy. readiness sur les derniers check-ins disponibles)
  const validScores = (recent ?? [])
    .map((r) => r.readiness_score as number | null)
    .filter((n): n is number => typeof n === "number");
  const forme7j = validScores.length
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : ovr;

  // Sommeil moy
  const validSleep = (recent ?? [])
    .map((r) => r.sleep_hours as number | null)
    .filter((n): n is number => typeof n === "number");
  const sleepAvg = validSleep.length
    ? (validSleep.reduce((a, b) => a + b, 0) / validSleep.length).toFixed(1)
    : "—";

  const delta = forme7j - ovr;
  const hasCheckedIn = !!todayCheckin;

  const dayLabel = new Date()
    .toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })
    .toUpperCase();

  return (
    <main className="flex-1 flex flex-col px-5 pt-7 pb-28 max-w-md mx-auto w-full">
      {/* Greeting */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm text-[#8b93a7] font-medium">
          {hasCheckedIn ? "Bien joué" : "Bonjour"}
        </h2>
        <span className="font-[family-name:var(--font-oswald)] text-xs text-[#c9a44b] uppercase tracking-widest">
          {hasCheckedIn ? "Check-in ✓" : dayLabel}
        </span>
      </div>
      <div className="font-[family-name:var(--font-bebas)] text-3xl tracking-wider mb-5">
        {player.first_name.toUpperCase()}
      </div>

      {/* The player card */}
      <PlayerCard
        ovr={ovr}
        name={player.last_name}
        firstName={player.first_name}
        position={(player.position ?? "MIL") as Position}
        stats={baseStats}
        photoUrl={player.photo_url}
        streak={validScores.length}
        xp={validScores.length * 50 + ovr}
        footerLeft={
          !hasCheckedIn
            ? "À faire aujourd'hui"
            : ovr >= 88
            ? "★ TEAM OF THE WEEK"
            : ovr < 60
            ? "⚠ FATIGUE"
            : `🔥 ${validScores.length} JOURS`
        }
        style={{ maxWidth: 240, marginTop: 8 }}
      />

      {/* Demandes du staff (toujours en premier si présentes) */}
      {openCount > 0 && (
        <div className="mt-5 mb-1 px-1 text-[10px] uppercase tracking-widest text-[#c9a44b] font-[family-name:var(--font-oswald)] font-bold">
          🔔 Le coach te demande
        </div>
      )}
      {pendingRequests
        .filter((r) => !r.done)
        .map((r) => {
          const isMorning = r.kind === "morning_checkin";
          const href = isMorning ? "/checkin" : "/post-session";
          const Icon = isMorning ? Sunrise : Dumbbell;
          const ctx = (r.context ?? {}) as Record<string, unknown>;
          const opp = typeof ctx.opponent === "string" ? ctx.opponent : null;
          const min = typeof ctx.minutes === "number" ? ctx.minutes : null;
          const subtitle = isMorning
            ? "30 secondes, 7 questions"
            : `${ctx.session_type === "match" ? "Match" : "Séance"}${opp ? ` vs ${opp}` : ""}${min ? ` · ${min} min` : ""}`;
          return (
            <Link
              key={r.id}
              href={href}
              className={`mt-2 w-full rounded-2xl px-5 py-4 flex items-center gap-4 shadow-lg active:scale-[.98] transition ${
                isMorning
                  ? "bg-gradient-to-br from-[#f6e3a1] via-[#c9a44b] to-[#806224] text-[#1c1206]"
                  : "bg-gradient-to-br from-[#00aaff] to-[#0072ff] text-white"
              }`}
            >
              <Icon size={28} />
              <div className="flex-1 min-w-0">
                <div className="font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-base leading-tight">
                  {r.title ?? (isMorning ? "Check-in du matin" : "Post-séance")}
                </div>
                <div className="text-xs opacity-80 mt-0.5">{subtitle}</div>
                {r.message && (
                  <div className="text-[11px] opacity-80 mt-1 italic">« {r.message} »</div>
                )}
              </div>
              <ChevronRight size={24} />
            </Link>
          );
        })}

      {/* CTA secondaire : check-in du matin (toujours dispo si pas demandé par staff) */}
      {!pendingRequests.some((r) => r.kind === "morning_checkin" && !r.done) && (
        !hasCheckedIn ? (
          <Link
            href="/checkin"
            className="mt-5 w-full flex justify-between items-center rounded-2xl px-5 py-5 bg-gradient-to-br from-[#2bd47d] to-[#16a35e] text-[#04150b] font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-base shadow-lg active:scale-[.98] transition"
          >
            Check-in du matin
            <span className="text-2xl">›</span>
          </Link>
        ) : (
          <div className="mt-5 w-full flex justify-between items-center rounded-2xl px-5 py-5 bg-[#1a2030] text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-base">
            Check-in déjà fait ✓
            <span>✓</span>
          </div>
        )
      )}

      {/* CTA secondaire post-séance (seulement si pas demandé) */}
      {!pendingRequests.some((r) => r.kind === "post_session" && !r.done) && (
        <Link
          href="/post-session"
          className="mt-3 w-full flex justify-between items-center rounded-2xl px-5 py-5 bg-[#131826] border border-white/5 text-[#cfd6e6] font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-base hover:bg-[#1a2030] transition"
        >
          + Post-séance libre
          <span className="text-2xl">›</span>
        </Link>
      )}

      {/* Pills */}
      <div className="flex gap-2.5 mt-4">
        <div className="flex-1 bg-[#131826] border border-white/5 rounded-2xl px-4 py-3.5">
          <div className="text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)]">
            Forme 7j
          </div>
          <div className="font-[family-name:var(--font-bebas)] text-2xl mt-1 flex items-baseline gap-1.5">
            {forme7j}
            {delta !== 0 && (
              <span
                className={`text-xs ${delta > 0 ? "text-[#2bd47d]" : "text-[#ff4d5e]"}`}
              >
                {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 bg-[#131826] border border-white/5 rounded-2xl px-4 py-3.5">
          <div className="text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)]">
            Sommeil moy.
          </div>
          <div className="font-[family-name:var(--font-bebas)] text-2xl mt-1">
            {sleepAvg}{sleepAvg !== "—" ? "h" : ""}
          </div>
        </div>
      </div>

      <BottomTabBar />
    </main>
  );
}
