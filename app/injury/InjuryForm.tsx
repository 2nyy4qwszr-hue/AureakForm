"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { BodySilhouette, type BodyZone } from "@/components/aureak/BodySilhouette";
import { BigSlider } from "@/components/aureak/BigSlider";
import { declareInjury } from "./actions";

const TYPES: { v: "contracture" | "douleur" | "coup" | "autre"; label: string; icon: string }[] = [
  { v: "douleur",     label: "Douleur",    icon: "🤕" },
  { v: "contracture", label: "Contracture",icon: "🦵" },
  { v: "coup",        label: "Coup",       icon: "💥" },
  { v: "autre",       label: "Autre",      icon: "❓" },
];

export function InjuryForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<"front" | "back">("front");
  const [zone, setZone] = useState<BodyZone | null>(null);
  const [type, setType] = useState<"contracture" | "douleur" | "coup" | "autre">("douleur");
  const [intensity, setIntensity] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = () => {
    if (!zone) {
      setError("Choisis d'abord la zone qui te fait mal.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await declareInjury({
        body_part: zone.label,
        body_side: zone.side,
        body_view: zone.view,
        type,
        intensity,
        comment,
      });
      if (!res.ok) setError(res.error);
      else {
        setSuccess(true);
        setTimeout(() => router.refresh(), 1500);
      }
    });
  };

  if (success) {
    return (
      <div className="mt-8 rounded-2xl border border-[#2bd47d]/30 bg-[#2bd47d]/10 p-6 text-center">
        <div className="text-4xl mb-2">✅</div>
        <h2 className="font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wider text-[#2bd47d] mb-2">
          Déclaration envoyée
        </h2>
        <p className="text-sm text-[#cfd6e6]">
          Le staff médical est alerté. Bon rétablissement.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* view toggle */}
      <div className="flex gap-2 mb-4 max-w-xs mx-auto">
        {(["front", "back"] as const).map((v) => (
          <button
            key={v}
            onClick={() => { setView(v); setZone(null); }}
            className={`flex-1 rounded-xl py-2 font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-xs border-2 transition ${
              view === v
                ? "border-[#c9a44b] bg-[#c9a44b]/15"
                : "border-white/10 bg-[#131826] text-[#8b93a7]"
            }`}
          >
            {v === "front" ? "Face" : "Dos"}
          </button>
        ))}
      </div>

      <BodySilhouette
        view={view}
        selected={zone?.id ?? null}
        onSelect={(z) => setZone(z)}
      />

      {zone && (
        <>
          <div className="text-center mt-3 text-sm">
            Zone : <b className="font-[family-name:var(--font-oswald)] uppercase tracking-widest text-[#c9a44b]">
              {zone.label}{zone.side !== "center" ? ` (${zone.side === "left" ? "gauche" : "droite"})` : ""}
            </b>
          </div>

          <div className="mt-6">
            <div className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-2">
              Type
            </div>
            <div className="grid grid-cols-4 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.v}
                  onClick={() => setType(t.v)}
                  className={`rounded-xl py-3 flex flex-col items-center gap-1 border-2 transition ${
                    type === t.v
                      ? "border-[#ff4d5e] bg-[#ff4d5e]/15"
                      : "border-white/10 bg-[#131826]"
                  }`}
                >
                  <span className="text-xl">{t.icon}</span>
                  <span className="text-[10px] uppercase tracking-wider font-[family-name:var(--font-oswald)] font-bold">
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-2">
              Intensité de la douleur
            </div>
            <BigSlider
              min={1}
              max={10}
              value={intensity}
              onChange={setIntensity}
              inverted={true}
            />
          </div>

          <label className="block mt-4">
            <span className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold">
              Commentaire (optionnel)
            </span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Quand ça a commencé, lors d'un duel, etc."
              rows={3}
              className="mt-2 w-full rounded-xl bg-[#131826] border border-white/10 px-4 py-3.5 text-[16px] focus:outline-none focus:border-[#c9a44b] resize-none"
            />
          </label>

          {error && <p className="text-xs text-[#ff4d5e] mt-3">⚠️ {error}</p>}

          <button
            onClick={submit}
            disabled={pending}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-4 bg-gradient-to-br from-[#ff4d5e] to-[#c9152a] text-white font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-sm shadow-lg disabled:opacity-60"
          >
            {pending ? "Envoi..." : <>Déclarer & alerter staff <Check size={18} /></>}
          </button>
        </>
      )}
    </div>
  );
}
