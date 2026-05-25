import type { DailyCheckinRow, PostSessionRow } from "@/lib/types";

/** Couleur d'une réponse selon sa valeur et son sens (inversed = haut = mauvais). */
function colorFor(value: number | null, max: number, inverted = false): string {
  if (value === null) return "#8b93a7";
  const pct = (value / max) * 100;
  const score = inverted ? 100 - pct : pct;
  if (score >= 70) return "#2bd47d";
  if (score >= 40) return "#ffa42b";
  return "#ff4d5e";
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" }),
    time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export function DailyCheckinList({ checkins }: { checkins: DailyCheckinRow[] }) {
  if (checkins.length === 0) {
    return (
      <p className="text-sm text-[#8b93a7] text-center py-6">
        Aucun check-in enregistré sur les 30 derniers jours.
      </p>
    );
  }

  // Sort descending (most recent first)
  const sorted = [...checkins].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-3">
      {sorted.map((c) => {
        const dt = formatDateTime(c.created_at);
        return (
          <div
            key={c.id}
            className="rounded-xl bg-[#0a0e1a] border border-white/5 p-4"
          >
            {/* Header : date + heure + OVR */}
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/5">
              <div>
                <div className="font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest text-sm">
                  {dt.date}
                </div>
                <div className="text-[11px] text-[#8b93a7]">
                  Enregistré à {dt.time}
                </div>
              </div>
              {c.readiness_score !== null && (
                <div className="text-right">
                  <div className="text-[10px] text-[#8b93a7] uppercase tracking-widest font-[family-name:var(--font-oswald)]">
                    Readiness
                  </div>
                  <div
                    className="font-[family-name:var(--font-bebas)] text-3xl leading-none"
                    style={{ color: colorFor(c.readiness_score, 100) }}
                  >
                    {c.readiness_score}
                  </div>
                </div>
              )}
            </div>

            {/* Grid des 7 réponses */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Stat label="Sommeil"     value={c.sleep_hours !== null ? `${c.sleep_hours}h` : "—"} color={colorFor(c.sleep_hours, 10)} />
              <Stat label="Qualité"     value={`${c.sleep_quality ?? "—"}/5`}    color={colorFor(c.sleep_quality, 5)} />
              <Stat label="Fatigue"     value={`${c.fatigue ?? "—"}/10`}         color={colorFor(c.fatigue, 10, true)} />
              <Stat label="Douleurs"    value={`${c.muscle_soreness ?? "—"}/10`} color={colorFor(c.muscle_soreness, 10, true)} />
              <Stat label="Hydratation" value={`${c.urine_color ?? "—"}/8`}      color={colorFor(c.urine_color, 8, true)} />
              <Stat label="Stress"      value={`${c.stress ?? "—"}/5`}           color={colorFor(c.stress, 5, true)} />
              <Stat label="Humeur"      value={`${c.mood ?? "—"}/5`}             color={colorFor(c.mood, 5)} />
              <Stat label="Appétit"     value={`${c.appetite ?? "—"}/5`}         color={colorFor(c.appetite, 5)} />
              {c.soreness_zone && (
                <Stat label="Zone douleur" value={c.soreness_zone} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-[#131826] border border-white/5 rounded-lg px-3 py-2">
      <div className="text-[10px] text-[#8b93a7] uppercase tracking-widest font-[family-name:var(--font-oswald)]">
        {label}
      </div>
      <div className="flex items-baseline mt-1">
        <span
          className="font-[family-name:var(--font-bebas)] text-lg leading-none"
          style={{ color: color ?? "#f4f5f7" }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

export function PostSessionList({ sessions }: { sessions: PostSessionRow[] }) {
  if (sessions.length === 0) {
    return (
      <p className="text-sm text-[#8b93a7] text-center py-6">
        Aucune post-séance enregistrée sur les 30 derniers jours.
      </p>
    );
  }
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-2">
      {sorted.map((s) => {
        const dt = formatDateTime(s.created_at);
        return (
          <div
            key={s.id}
            className="rounded-xl bg-[#0a0e1a] border border-white/5 p-3 flex items-center gap-3 flex-wrap"
          >
            <div className="flex-1 min-w-0">
              <div className="font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest text-xs">
                {s.session_type === "match" ? "Match" : "Séance"} · {dt.date}
              </div>
              <div className="text-[11px] text-[#8b93a7]">
                Enregistré à {dt.time}{s.minutes ? ` · ${s.minutes}'` : ""}
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <Stat label="RPE"  value={`${s.rpe ?? "—"}/10`}             color={colorFor(s.rpe, 10, true)} />
              <Stat label="Kiff" value={`${s.enjoyment ?? "—"}/5`}        color={colorFor(s.enjoyment, 5)} />
              <Stat label="Perf" value={`${s.self_performance ?? "—"}/5`} color={colorFor(s.self_performance, 5)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
