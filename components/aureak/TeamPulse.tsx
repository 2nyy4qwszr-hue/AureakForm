import { tierFromOvr } from "./PlayerCard";
import type { Tier } from "./PlayerCard";
import type { WellnessStats } from "./PlayerCard";
import type { DailyCheckinRow } from "@/lib/types";

const TIER_LABEL: Record<Tier, string> = {
  special: "Spécial",
  gold:    "Or",
  silver:  "Argent",
  bronze:  "Bronze",
  neutral: "Sans data",
};
const TIER_COLOR: Record<Tier, string> = {
  special: "#ff2e93",
  gold:    "#c9a44b",
  silver:  "#a8a8a8",
  bronze:  "#a06a3c",
  neutral: "#5a6378",
};

type Player = {
  id: string;
  ovr: number;
  todayCheckin: DailyCheckinRow | null;
  stats: WellnessStats;
  hasOpenInjury: boolean;
};

export function TeamPulse({ players }: { players: Player[] }) {
  const checkedIn = players.filter((p) => p.todayCheckin);
  const total = players.length;
  const totalCheckedIn = checkedIn.length;
  const checkinRate = total > 0 ? Math.round((totalCheckedIn / total) * 100) : 0;

  // Moyenne OVR sur les joueurs checked-in (les "neutral" sans data n'ont pas de sens dans la moyenne)
  const avgOvr = totalCheckedIn > 0
    ? Math.round(checkedIn.reduce((sum, p) => sum + p.ovr, 0) / totalCheckedIn)
    : 0;

  // Moyenne par axe wellness (uniquement sur les checked-in)
  const axes: (keyof WellnessStats)[] = ["forme", "sleep", "recovery", "physical", "mental", "regularity"];
  const avgStats: WellnessStats = axes.reduce((acc, k) => {
    acc[k] = totalCheckedIn > 0
      ? Math.round(checkedIn.reduce((s, p) => s + p.stats[k], 0) / totalCheckedIn)
      : 0;
    return acc;
  }, {} as WellnessStats);

  // Répartition par tier
  const tierCounts: Record<Tier, number> = { special: 0, gold: 0, silver: 0, bronze: 0, neutral: 0 };
  players.forEach((p) => { tierCounts[tierFromOvr(p.ovr)] += 1; });

  // Sleep moyen brut (en heures, vivant pour le coach)
  const sleeps = checkedIn.map((p) => p.todayCheckin?.sleep_hours).filter((n): n is number => typeof n === "number");
  const sleepAvg = sleeps.length > 0
    ? (sleeps.reduce((s, h) => s + h, 0) / sleeps.length)
    : null;

  // Fatigue moyenne (1-10, inversé)
  const fatigues = checkedIn.map((p) => p.todayCheckin?.fatigue).filter((n): n is number => typeof n === "number");
  const fatigueAvg = fatigues.length > 0
    ? (fatigues.reduce((s, h) => s + h, 0) / fatigues.length)
    : null;

  // RPE/charge — soreness moyenne
  const sorenesses = checkedIn.map((p) => p.todayCheckin?.muscle_soreness).filter((n): n is number => typeof n === "number");
  const sorenessAvg = sorenesses.length > 0
    ? (sorenesses.reduce((s, h) => s + h, 0) / sorenesses.length)
    : null;

  const injuredCount = players.filter((p) => p.hasOpenInjury).length;
  const bronzeCount = players.filter((p) => p.ovr > 0 && p.ovr < 60).length;

  // Axes triés du pire au meilleur (pour faire ressortir les fragilités)
  const sortedAxes = [...axes]
    .map((k) => ({ k, v: avgStats[k] }))
    .sort((a, b) => a.v - b.v);

  return (
    <section className="rounded-2xl bg-gradient-to-br from-[#131826] to-[#0e1320] border border-white/5 p-5 md:p-6 mb-6">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wider">
          FORME DU GROUPE
        </h2>
        <span className="text-[11px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)]">
          Moyennes du jour · {totalCheckedIn}/{total} check-ins
        </span>
      </div>

      <div className="grid md:grid-cols-[180px_1fr] gap-6">
        {/* OVR moyenne géant */}
        <div className="flex flex-col items-center justify-center bg-[#0a0e1a] rounded-xl border border-white/5 p-4">
          <div className="text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold">
            OVR Moyen
          </div>
          <div
            className="font-[family-name:var(--font-bebas)] leading-none mt-1"
            style={{
              fontSize: 84,
              color: avgOvr >= 75 ? "#2bd47d" : avgOvr >= 60 ? "#ffa42b" : avgOvr > 0 ? "#ff4d5e" : "#5a6378",
            }}
          >
            {avgOvr > 0 ? avgOvr : "—"}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] mt-1">
            sur {totalCheckedIn} joueur{totalCheckedIn > 1 ? "s" : ""}
          </div>
          <div className="mt-3 w-full">
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${checkinRate}%`,
                  background: checkinRate >= 75 ? "#2bd47d" : checkinRate >= 50 ? "#ffa42b" : "#ff4d5e",
                }}
              />
            </div>
            <div className="text-[10px] text-[#8b93a7] mt-1 text-center font-[family-name:var(--font-oswald)] uppercase tracking-widest">
              {checkinRate}% checké
            </div>
          </div>
        </div>

        {/* Les 6 axes en bars horizontales */}
        <div className="space-y-3">
          {sortedAxes.map(({ k, v }) => (
            <AxisBar key={k} label={STAT_LABELS[k]} short={k.toUpperCase().slice(0, 3)} value={v} />
          ))}
        </div>
      </div>

      {/* KPI brutes + répartition + alertes en 4 colonnes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <Kpi
          label="Sommeil moy"
          value={sleepAvg !== null ? `${sleepAvg.toFixed(1)}h` : "—"}
          color={sleepAvg === null ? "#5a6378" : sleepAvg >= 7 ? "#2bd47d" : sleepAvg >= 5.5 ? "#ffa42b" : "#ff4d5e"}
        />
        <Kpi
          label="Fatigue moy"
          value={fatigueAvg !== null ? `${fatigueAvg.toFixed(1)}/10` : "—"}
          color={fatigueAvg === null ? "#5a6378" : fatigueAvg <= 4 ? "#2bd47d" : fatigueAvg <= 6 ? "#ffa42b" : "#ff4d5e"}
        />
        <Kpi
          label="Douleurs moy"
          value={sorenessAvg !== null ? `${sorenessAvg.toFixed(1)}/10` : "—"}
          color={sorenessAvg === null ? "#5a6378" : sorenessAvg <= 4 ? "#2bd47d" : sorenessAvg <= 6 ? "#ffa42b" : "#ff4d5e"}
        />
        <Kpi
          label="Bobos ouverts"
          value={String(injuredCount)}
          color={injuredCount === 0 ? "#2bd47d" : injuredCount <= 2 ? "#ffa42b" : "#ff4d5e"}
        />
      </div>

      {/* Répartition par tier */}
      <div className="mt-5 pt-5 border-t border-white/5">
        <div className="text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-2">
          Répartition cartes
        </div>
        <div className="flex flex-wrap gap-2">
          {(["special", "gold", "silver", "bronze", "neutral"] as Tier[]).map((tier) => (
            <div
              key={tier}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 border"
              style={{
                background: `${TIER_COLOR[tier]}15`,
                borderColor: `${TIER_COLOR[tier]}40`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: TIER_COLOR[tier] }}
              />
              <span className="text-[11px] text-[#cfd6e6]">{TIER_LABEL[tier]}</span>
              <span
                className="font-[family-name:var(--font-bebas)] text-sm"
                style={{ color: TIER_COLOR[tier] }}
              >
                {tierCounts[tier]}
              </span>
            </div>
          ))}
        </div>
        {bronzeCount > 0 && (
          <p className="text-[12px] mt-3 text-[#ff4d5e]">
            ⚠ {bronzeCount} joueur{bronzeCount > 1 ? "s" : ""} en alerte rouge (OVR &lt; 60) — à surveiller en priorité.
          </p>
        )}
      </div>
    </section>
  );
}

const STAT_LABELS: Record<keyof WellnessStats, string> = {
  forme:      "Forme générale",
  sleep:      "Sommeil",
  recovery:   "Récupération",
  physical:   "Physique",
  mental:     "Mental",
  regularity: "Régularité 7j",
};

function AxisBar({ label, short, value }: { label: string; short: string; value: number }) {
  const color = value >= 75 ? "#2bd47d" : value >= 60 ? "#ffa42b" : value > 0 ? "#ff4d5e" : "#5a6378";
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0 flex items-baseline justify-between gap-2">
        <span className="text-[11px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold">
          {short}
        </span>
        <span className="text-[10px] text-[#8b93a7] truncate hidden md:inline">{label}</span>
      </div>
      <div className="flex-1 h-2.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <div
        className="w-10 text-right font-[family-name:var(--font-bebas)] text-xl"
        style={{ color }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#0a0e1a] border border-white/5 rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold">
        {label}
      </div>
      <div
        className="font-[family-name:var(--font-bebas)] text-2xl mt-1 leading-none"
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}
