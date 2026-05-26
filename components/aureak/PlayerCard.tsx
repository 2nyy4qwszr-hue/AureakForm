import Image from "next/image";
import { BurundiFlag } from "./BurundiFlag";

export type Position = "GK" | "DEF" | "MIL" | "ATT";
export type Tier = "neutral" | "bronze" | "silver" | "gold" | "special";

export type WellnessStats = {
  forme: number;       // FOR
  sleep: number;       // SOM
  recovery: number;    // REC
  physical: number;    // PHY
  mental: number;      // MEN
  regularity: number;  // REG
};

export type PlayerCardProps = {
  ovr: number;          // 0-100
  /** Nom de famille — affiché gros, en bold, comme sur une vraie carte FIFA. */
  name: string;
  /** Prénom — affiché plus petit, sous le nom (optionnel). */
  firstName?: string;
  position: Position;
  /** Rôle staff affiché sous le poste (ex: "Admin", "Coach"). */
  staffRole?: string | null;
  stats: WellnessStats;
  streak?: number;      // jours consécutifs
  xp?: number;
  /** Override automatic tier classification */
  tierOverride?: Tier;
  /** Footer tag override (e.g. "TEAM OF THE WEEK") */
  footerLeft?: string;
  /** Compact mode (no stats, no footer) — for staff squad mosaic */
  compact?: boolean;
  /** URL de la photo du joueur (ex: /players/Png/Henry Msanga.png). Si absent, silhouette SVG. */
  photoUrl?: string | null;
  /** Scale CSS appliqué à la photo (origin: bottom). Default 1.6 — sur la fiche joueur on pousse à 2.4. */
  photoScale?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * OVR → tier (matches wireframe legend).
 * Cas spécial : `ovr === 0` signifie "pas de check-in du jour" — on renvoie
 * `neutral` (gris) pour distinguer visuellement d'une vraie alerte bronze.
 */
export function tierFromOvr(ovr: number): Tier {
  if (ovr === 0) return "neutral";
  if (ovr >= 88) return "special";
  if (ovr >= 75) return "gold";
  if (ovr >= 60) return "silver";
  return "bronze";
}

const TIER_BG: Record<Tier, string> = {
  neutral: "linear-gradient(160deg, #3a4055 0%, #2a3142 35%, #1f2535 65%, #14171f 100%)",
  gold:    "linear-gradient(160deg, #f6e3a1 0%, #f0cf6e 35%, #c9a44b 65%, #806224 100%)",
  silver:  "linear-gradient(160deg, #e8e8e8 0%, #cfcfcf 35%, #a8a8a8 65%, #5a5a5a 100%)",
  bronze:  "linear-gradient(160deg, #d8a37a 0%, #b67e51 35%, #a06a3c 65%, #5e3a1d 100%)",
  special: "linear-gradient(160deg, #0e1a36 0%, #15102b 50%, #1c0a30 100%)",
};

const TIER_INK: Record<Tier, string> = {
  neutral: "#cfd6e6",
  gold:    "#1c1206",
  silver:  "#14171f",
  bronze:  "#2a1809",
  special: "#eaf6ff",
};

const STAT_LABELS: { key: keyof WellnessStats; label: string }[] = [
  { key: "forme",      label: "FOR" },
  { key: "sleep",      label: "SOM" },
  { key: "recovery",   label: "REC" },
  { key: "physical",   label: "PHY" },
  { key: "mental",     label: "MEN" },
  { key: "regularity", label: "REG" },
];

export function PlayerCard({
  ovr,
  name,
  firstName,
  position,
  staffRole,
  stats,
  streak,
  xp,
  tierOverride,
  footerLeft,
  compact = false,
  photoUrl,
  photoScale = 1.6,
  className = "",
  style,
}: PlayerCardProps) {
  const tier = tierOverride ?? tierFromOvr(ovr);
  const isSpecial = tier === "special";
  const isDark = tier === "special" || tier === "neutral";
  const innerBorder = isDark ? "rgba(255,255,255,.18)" : "rgba(0,0,0,.18)";

  return (
    <div
      className={`relative w-full max-w-[280px] mx-auto rounded-[18px] overflow-hidden isolate group ${className}`}
      style={{
        aspectRatio: "5 / 7.4",
        padding: "16px 18px 14px",
        color: TIER_INK[tier],
        background: TIER_BG[tier],
        boxShadow:
          "0 30px 60px -20px rgba(0,0,0,.55), 0 10px 30px -10px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.4)",
        ...style,
      }}
    >
      {/* Foil shine — TOTW only */}
      {isSpecial && (
        <span
          aria-hidden
          className="absolute inset-0 pointer-events-none z-0 mix-blend-screen"
          style={{
            background:
              "conic-gradient(from 220deg at 50% 0%, rgba(0,240,255,.45), transparent 30%), conic-gradient(from 40deg at 50% 100%, rgba(255,46,147,.45), transparent 30%)",
          }}
        />
      )}

      {/* Hover sweep highlight */}
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none z-[1] mix-blend-overlay -translate-x-1/3 group-hover:translate-x-1/3 transition-transform duration-700"
        style={{
          background:
            "linear-gradient(115deg, transparent 30%, rgba(255,255,255,.35) 45%, transparent 60%)",
        }}
      />

      <div className="relative z-[2] flex flex-col h-full">
        {/* TOP: OVR + position // flag + club */}
        <div className="flex justify-between items-start pb-1">
          <div className="flex flex-col items-start leading-[.9]">
            <div
              className="font-[family-name:var(--font-bebas)] tracking-tight"
              style={{ fontSize: 56 }}
            >
              {ovr === 0 ? "—" : ovr}
            </div>
            <div
              className="font-[family-name:var(--font-oswald)] font-bold mt-1"
              style={{ fontSize: 18, letterSpacing: 1 }}
            >
              {position}
            </div>
            {staffRole && (
              <div
                className="font-[family-name:var(--font-oswald)] font-bold uppercase"
                style={{ fontSize: 10, letterSpacing: 1.5, opacity: 0.7 }}
              >
                {staffRole}
              </div>
            )}
            <div
              className="my-1.5 h-[2px] w-8"
              style={{ background: "currentColor", opacity: 0.55 }}
            />
          </div>
          <div className="flex flex-col items-center gap-2 pt-1.5">
            <BurundiFlag width={26} />
            <div
              className="w-[26px] h-[26px] rounded-full flex items-center justify-center font-[family-name:var(--font-bebas)]"
              style={{
                background: "rgba(0,0,0,.15)",
                fontSize: 12,
                letterSpacing: 1,
              }}
            >
              AKF
            </div>
          </div>
        </div>

        {/* PHOTO : vraie photo si dispo, sinon silhouette SVG */}
        <div className="flex-1 flex items-end justify-center my-0.5 mb-1.5 min-h-0">
          {photoUrl ? (
            <div className="relative w-[90%] h-full">
              <Image
                src={photoUrl}
                alt={name}
                fill
                // 25 cartes en mosaïque staff (~180px chacune) + carte unique
                // joueur (~320px). Le compact rend en mosaïque ≥ md.
                sizes={compact ? "(min-width: 768px) 220px, 50vw" : "(min-width: 768px) 360px, 92vw"}
                className="object-contain object-bottom origin-bottom"
                style={{
                  transform: `scale(${photoScale})`,
                  filter: isDark
                    ? "drop-shadow(0 8px 14px rgba(0,0,0,.6))"
                    : "drop-shadow(0 6px 10px rgba(0,0,0,.35))",
                }}
              />
            </div>
          ) : (
            <svg
              viewBox="0 0 100 110"
              fill="currentColor"
              className="w-[90%] h-full"
              style={{ opacity: isDark ? 0.75 : 0.55 }}
            >
              <path d="M50 12c-9 0-16 7-16 16s7 16 16 16 16-7 16-16-7-16-16-16zm-26 64c0-14 12-22 26-22s26 8 26 22v18H24V76z" />
            </svg>
          )}
        </div>

        {/* NAME : last name gros (style FIFA), prénom plus petit en dessous */}
        <div
          className="text-center pt-1 pb-1.5"
          style={{ borderTop: `1px solid ${innerBorder}` }}
        >
          <div
            className="font-[family-name:var(--font-oswald)] font-bold uppercase leading-tight"
            style={{
              fontSize: compact ? 13 : 17,
              letterSpacing: 0.5,
              wordBreak: "break-word",
            }}
          >
            {name}
          </div>
          {firstName && (
            <div
              className="font-[family-name:var(--font-oswald)] opacity-80 capitalize leading-none mt-1"
              style={{
                fontSize: compact ? 12 : 14,
                letterSpacing: 0.4,
                fontWeight: 500,
              }}
            >
              {firstName}
            </div>
          )}
        </div>

        {!compact && (
          <>
            {/* STATS 3x2 */}
            <div
              className="grid grid-cols-2 gap-x-3.5 pt-1.5"
              style={{ borderTop: `1px solid ${innerBorder}` }}
            >
              {STAT_LABELS.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex gap-1.5 items-baseline font-[family-name:var(--font-oswald)] font-bold"
                  style={{ fontSize: 13, letterSpacing: 1 }}
                >
                  <span
                    className="font-[family-name:var(--font-bebas)] min-w-[28px]"
                    style={{ fontSize: 17 }}
                  >
                    {stats[key]}
                  </span>
                  <span className="opacity-70" style={{ fontSize: 11 }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* FOOTER */}
            <div
              className="mt-1.5 flex justify-between items-center font-[family-name:var(--font-oswald)] font-bold opacity-70"
              style={{ fontSize: 10, letterSpacing: 1 }}
            >
              <span>
                {footerLeft ?? (streak !== undefined ? `🔥 ${streak} JOURS` : "")}
              </span>
              <span>{xp !== undefined ? `XP ${xp}` : ""}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
