"use client";

/**
 * Picker visuel pour la couleur d'urine — échelle Armstrong 1..8.
 * Réf : https://www.urinecolors.com/urine-color-chart/
 *  - 1..3 : bien hydraté (vert)
 *  - 4..5 : limite, à surveiller (orange)
 *  - 6..8 : déshydraté, alerte (rouge)
 *
 * Affiche aussi un libellé d'interprétation sous la grille pour
 * que le joueur ait un feedback immédiat.
 */

type Props = {
  value: number | null;
  onChange: (v: number) => void;
};

/** Hex Armstrong-like — du jaune très pâle à l'ambre foncé. */
const URINE_COLORS: { value: number; hex: string }[] = [
  { value: 1, hex: "#F8F4B8" },
  { value: 2, hex: "#F9EE7C" },
  { value: 3, hex: "#F9D94C" },
  { value: 4, hex: "#F7C72F" },
  { value: 5, hex: "#E8A92E" },
  { value: 6, hex: "#D38B22" },
  { value: 7, hex: "#B36A1B" },
  { value: 8, hex: "#8C4A14" },
];

function statusFor(v: number): { label: string; color: string; emoji: string } {
  if (v <= 3) return { label: "Bien hydraté", color: "#2bd47d", emoji: "💧" };
  if (v <= 5) return { label: "À surveiller — bois de l'eau", color: "#ffa42b", emoji: "⚠️" };
  return { label: "Déshydraté — bois maintenant", color: "#ff4d5e", emoji: "🚨" };
}

export function UrineColorPicker({ value, onChange }: Props) {
  const status = value ? statusFor(value) : null;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="grid grid-cols-4 gap-2">
        {URINE_COLORS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${
                active
                  ? "border-[#c9a44b] scale-105 shadow-lg"
                  : "border-white/10 hover:border-white/30"
              }`}
              style={{ background: opt.hex }}
              aria-label={`Niveau ${opt.value}`}
            >
              <span
                className="font-[family-name:var(--font-bebas)] text-2xl leading-none"
                style={{ color: opt.value <= 4 ? "#1a1206" : "#ffffff", textShadow: opt.value > 4 ? "0 1px 2px rgba(0,0,0,.4)" : "none" }}
              >
                {opt.value}
              </span>
            </button>
          );
        })}
      </div>

      {status && (
        <div
          className="mt-5 rounded-xl border px-4 py-3 flex items-center gap-3 text-sm"
          style={{
            background: `${status.color}1a`, // 10% alpha
            borderColor: `${status.color}55`,
            color: status.color,
          }}
        >
          <span className="text-xl leading-none">{status.emoji}</span>
          <span className="font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest text-xs">
            {status.label}
          </span>
        </div>
      )}
    </div>
  );
}
