import Link from "next/link";
import { tierFromOvr } from "./PlayerCard";
import type { Position, DailyCheckinRow, PostSessionRow } from "@/lib/types";

const TIER_COLOR: Record<ReturnType<typeof tierFromOvr>, string> = {
  neutral: "#5a6378",
  bronze:  "#a06a3c",
  silver:  "#a8a8a8",
  gold:    "#c9a44b",
  special: "#ff2e93",
};

/** Texte à afficher pour un OVR (— si pas de check-in). */
const ovrText = (n: number): string => (n === 0 ? "—" : String(n));

/** Couleur d'une valeur selon échelle. */
function color(value: number | null, max: number, inverted = false): string {
  if (value === null) return "#5a6378";
  const pct = (value / max) * 100;
  const score = inverted ? 100 - pct : pct;
  if (score >= 70) return "#2bd47d";
  if (score >= 40) return "#ffa42b";
  return "#ff4d5e";
}

function timeOf(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

// ─────────────────────────────────────────────────────────────────
// MODE "MATIN" — montre les réponses brutes du daily_checkin
// ─────────────────────────────────────────────────────────────────

export type MorningRow = {
  id: string;
  first_name: string;
  last_name: string;
  position: Position | null;
  ovr: number;
  todayCheckin: DailyCheckinRow | null;
  hasOpenInjury?: boolean;
};

export function SquadListMorning({ rows }: { rows: MorningRow[] }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#131826] overflow-hidden">
      {/* Header (desktop) */}
      <div className="hidden lg:grid grid-cols-[1fr_60px_50px_56px_60px_60px_60px_60px_60px_60px_80px] gap-2 px-4 py-3 border-b border-white/5 text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold">
        <div>Joueur</div>
        <div className="text-center">Heure</div>
        <div className="text-center">OVR</div>
        <div className="text-center" title="Heures de sommeil">Sommeil</div>
        <div className="text-center" title="Qualité sommeil 1-5">Qual.</div>
        <div className="text-center" title="Fatigue 1-10 (10 = épuisé)">Fatigue</div>
        <div className="text-center" title="Douleurs musculaires 1-10">Douleur</div>
        <div className="text-center" title="Stress 1-5">Stress</div>
        <div className="text-center" title="Humeur 1-5">Humeur</div>
        <div className="text-center" title="Appétit 1-5">Appétit</div>
        <div className="text-right">Statut</div>
      </div>

      <ul>
        {rows.map((r) => {
          const tier = tierFromOvr(r.ovr);
          const c = r.todayCheckin;
          return (
            <li key={r.id} className="border-b border-white/5 last:border-b-0">
              <Link
                href={`/staff/player/${r.id}`}
                className="grid grid-cols-2 lg:grid-cols-[1fr_60px_50px_56px_60px_60px_60px_60px_60px_60px_80px] gap-2 px-4 py-3 hover:bg-white/[.03] transition-colors items-center"
              >
                {/* Joueur */}
                <div className="flex items-center gap-3 col-span-2 lg:col-span-1 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-[family-name:var(--font-bebas)] text-sm shrink-0"
                    style={{
                      background: `${TIER_COLOR[tier]}33`,
                      color: TIER_COLOR[tier],
                      border: `1px solid ${TIER_COLOR[tier]}66`,
                    }}
                  >
                    {r.first_name[0]}{r.last_name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="font-[family-name:var(--font-oswald)] font-bold uppercase text-sm truncate">
                      {r.last_name}
                    </div>
                    <div className="text-[11px] text-[#8b93a7] truncate">
                      {r.first_name} · {r.position ?? "—"}
                    </div>
                  </div>
                </div>

                {/* Mobile : tout en bas */}
                <div className="flex lg:hidden flex-col items-end col-span-2 mt-2 gap-1.5">
                  {c ? (
                    <>
                      <div className="text-[10px] text-[#8b93a7] font-[family-name:var(--font-oswald)] uppercase tracking-widest">
                        Check-in {timeOf(c.created_at)} · OVR <span style={{ color: TIER_COLOR[tier] }} className="font-bold">{ovrText(r.ovr)}</span>
                      </div>
                      <div className="grid grid-cols-7 gap-2 text-[10px] uppercase tracking-widest font-[family-name:var(--font-oswald)] w-full">
                        <Cell label="Sommeil" value={c.sleep_hours !== null ? `${c.sleep_hours}h` : "—"} col={color(c.sleep_hours, 10)} />
                        <Cell label="Qual"   value={c.sleep_quality !== null ? String(c.sleep_quality) : "—"} col={color(c.sleep_quality, 5)} />
                        <Cell label="Fat"    value={c.fatigue !== null ? String(c.fatigue) : "—"} col={color(c.fatigue, 10, true)} />
                        <Cell label="Doul"   value={c.muscle_soreness !== null ? String(c.muscle_soreness) : "—"} col={color(c.muscle_soreness, 10, true)} />
                        <Cell label="Stress" value={c.stress !== null ? String(c.stress) : "—"} col={color(c.stress, 5, true)} />
                        <Cell label="Hum"    value={c.mood !== null ? String(c.mood) : "—"} col={color(c.mood, 5)} />
                        <Cell label="App"    value={c.appetite !== null ? String(c.appetite) : "—"} col={color(c.appetite, 5)} />
                      </div>
                    </>
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest text-[#8b93a7]">⌛ Pas de check-in aujourd&apos;hui</span>
                  )}
                </div>

                {/* Desktop : 1 colonne par champ */}
                <div className="hidden lg:block text-center text-xs text-[#8b93a7]">{timeOf(c?.created_at)}</div>
                <div className="hidden lg:block text-center">
                  <span className="font-[family-name:var(--font-bebas)] text-xl" style={{ color: TIER_COLOR[tier] }}>{ovrText(r.ovr)}</span>
                </div>
                <Big hidden value={c?.sleep_hours !== null && c?.sleep_hours !== undefined ? `${c.sleep_hours}h` : "—"} col={color(c?.sleep_hours ?? null, 10)} />
                <Big hidden value={c?.sleep_quality ?? "—"} col={color(c?.sleep_quality ?? null, 5)} />
                <Big hidden value={c?.fatigue ?? "—"} col={color(c?.fatigue ?? null, 10, true)} />
                <Big hidden value={c?.muscle_soreness ?? "—"} col={color(c?.muscle_soreness ?? null, 10, true)} />
                <Big hidden value={c?.stress ?? "—"} col={color(c?.stress ?? null, 5, true)} />
                <Big hidden value={c?.mood ?? "—"} col={color(c?.mood ?? null, 5)} />
                <Big hidden value={c?.appetite ?? "—"} col={color(c?.appetite ?? null, 5)} />
                <div className="hidden lg:flex flex-col items-end gap-0.5">
                  {c ? (
                    <span className="text-[10px] uppercase tracking-widest font-[family-name:var(--font-oswald)] font-bold text-[#2bd47d]">Fait</span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest font-[family-name:var(--font-oswald)] font-bold text-[#8b93a7]">À faire</span>
                  )}
                  {r.hasOpenInjury && (
                    <span className="text-[10px] uppercase tracking-widest font-[family-name:var(--font-oswald)] font-bold text-[#ff4d5e]">Bobo</span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="px-4 py-3 border-t border-white/5 text-[11px] text-[#8b93a7]">
        Réponses brutes du check-in du matin · couleur ={" "}
        <span className="text-[#2bd47d]">good</span> /{" "}
        <span className="text-[#ffa42b]">moyen</span> /{" "}
        <span className="text-[#ff4d5e]">alerte</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MODE "SESSION" — montre les réponses brutes du dernier post-séance
// ─────────────────────────────────────────────────────────────────

export type SessionRow = {
  id: string;
  first_name: string;
  last_name: string;
  position: Position | null;
  ovr: number;
  latestSession: PostSessionRow | null;
};

export function SquadListSession({ rows }: { rows: SessionRow[] }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#131826] overflow-hidden">
      <div className="hidden md:grid grid-cols-[1fr_80px_60px_60px_60px_60px_70px_80px] gap-3 px-4 py-3 border-b border-white/5 text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold">
        <div>Joueur</div>
        <div className="text-center" title="Date séance">Date</div>
        <div className="text-center">Type</div>
        <div className="text-center" title="Minutes jouées">Min</div>
        <div className="text-center" title="Rate of Perceived Exertion (Borg CR10)">RPE</div>
        <div className="text-center" title="Plaisir / kiff 1-5">Kiff</div>
        <div className="text-center" title="Auto-évaluation perf 1-5">Perf</div>
        <div className="text-right">Heure</div>
      </div>

      <ul>
        {rows.map((r) => {
          const tier = tierFromOvr(r.ovr);
          const s = r.latestSession;
          return (
            <li key={r.id} className="border-b border-white/5 last:border-b-0">
              <Link
                href={`/staff/player/${r.id}`}
                className="grid grid-cols-2 md:grid-cols-[1fr_80px_60px_60px_60px_60px_70px_80px] gap-3 px-4 py-3 hover:bg-white/[.03] transition-colors items-center"
              >
                <div className="flex items-center gap-3 col-span-2 md:col-span-1 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-[family-name:var(--font-bebas)] text-sm shrink-0"
                    style={{
                      background: `${TIER_COLOR[tier]}33`,
                      color: TIER_COLOR[tier],
                      border: `1px solid ${TIER_COLOR[tier]}66`,
                    }}
                  >
                    {r.first_name[0]}{r.last_name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="font-[family-name:var(--font-oswald)] font-bold uppercase text-sm truncate">{r.last_name}</div>
                    <div className="text-[11px] text-[#8b93a7] truncate">{r.first_name} · {r.position ?? "—"}</div>
                  </div>
                </div>

                {/* Mobile résumé */}
                <div className="flex md:hidden flex-col items-end col-span-2 mt-2 gap-1">
                  {s ? (
                    <>
                      <div className="text-[10px] text-[#8b93a7] font-[family-name:var(--font-oswald)] uppercase tracking-widest">
                        {s.session_type === "match" ? "Match" : "Séance"} · {new Date(s.session_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} · {timeOf(s.created_at)}
                      </div>
                      <div className="flex gap-2 text-xs font-[family-name:var(--font-oswald)] uppercase tracking-widest">
                        <span><b style={{ color: color(s.rpe, 10, true) }}>{s.rpe ?? "—"}</b><span className="opacity-60">/10 RPE</span></span>
                        <span><b style={{ color: color(s.enjoyment, 5) }}>{s.enjoyment ?? "—"}</b><span className="opacity-60">/5 kiff</span></span>
                        <span><b style={{ color: color(s.self_performance, 5) }}>{s.self_performance ?? "—"}</b><span className="opacity-60">/5 perf</span></span>
                      </div>
                    </>
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest text-[#8b93a7]">Aucune séance déclarée (7j)</span>
                  )}
                </div>

                {/* Desktop columns */}
                <div className="hidden md:block text-center text-xs text-[#8b93a7]">
                  {s ? new Date(s.session_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—"}
                </div>
                <div className="hidden md:block text-center text-[11px] uppercase tracking-widest font-[family-name:var(--font-oswald)] text-[#cfd6e6]">
                  {s ? (s.session_type === "match" ? "Match" : "Séance") : "—"}
                </div>
                <div className="hidden md:block text-center text-xs text-[#cfd6e6]">
                  {s?.minutes ?? "—"}
                </div>
                <Big hidden value={s?.rpe ?? "—"} col={color(s?.rpe ?? null, 10, true)} />
                <Big hidden value={s?.enjoyment ?? "—"} col={color(s?.enjoyment ?? null, 5)} />
                <Big hidden value={s?.self_performance ?? "—"} col={color(s?.self_performance ?? null, 5)} />
                <div className="hidden md:block text-right text-[11px] text-[#8b93a7]">{timeOf(s?.created_at)}</div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="px-4 py-3 border-t border-white/5 text-[11px] text-[#8b93a7]">
        Dernière post-séance déclarée (7 derniers jours) — <b>RPE</b> Borg CR10 (10 = max) · <b>Kiff</b> 1-5 · <b>Perf</b> auto-évaluation 1-5
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Petits helpers
// ─────────────────────────────────────────────────────────────────

function Cell({ label, value, col }: { label: string; value: string; col: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-[family-name:var(--font-bebas)] text-sm" style={{ color: col }}>
        {value}
      </span>
      <span className="opacity-60 text-[9px]">{label}</span>
    </div>
  );
}

function Big({ value, col, hidden }: { value: string | number; col: string; hidden?: boolean }) {
  return (
    <div className={`text-center ${hidden ? "hidden lg:flex md:flex" : ""} items-baseline justify-center`}>
      <span className="font-[family-name:var(--font-bebas)] text-lg" style={{ color: col }}>{value}</span>
    </div>
  );
}
