"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { BigSlider } from "./BigSlider";
import { EmojiPicker } from "./EmojiPicker";
import { UrineColorPicker } from "./UrineColorPicker";
import { submitCheckin, type CheckinPayload } from "@/app/checkin/actions";

type Step = {
  key: keyof CheckinPayload | "review";
  title: string;
  subtitle?: string;
};

const STEPS: Step[] = [
  { key: "sleep_hours",     title: "Tu as dormi combien d'heures ?",        subtitle: "Cette nuit, sommeil total" },
  { key: "sleep_quality",   title: "Ton sommeil, qualité ?",                subtitle: "Du gros lag → repos parfait" },
  { key: "fatigue",         title: "Niveau de fatigue ce matin ?",          subtitle: "Au lever, jambes & corps" },
  { key: "muscle_soreness", title: "Des douleurs musculaires ?",            subtitle: "Courbatures, raideurs" },
  { key: "urine_color",     title: "Couleur de ton urine ?",                subtitle: "1er pipi du matin · indique ton hydratation" },
  { key: "stress",          title: "Stress / pression mentale ?",           subtitle: "Famille, foot, vie perso" },
  { key: "mood",            title: "Humeur du jour ?",                      subtitle: "Tu te lèves dans quel mood" },
  { key: "appetite",        title: "Appétit ce matin ?",                    subtitle: "Tu manges normal, peu, beaucoup ?" },
  { key: "review",          title: "Tout est bon ?",                        subtitle: "Tu peux revenir en arrière si besoin" },
];

const MOOD_FACES = [
  { emoji: "😣", label: "Pire", value: 1 },
  { emoji: "😟", label: "Bof",  value: 2 },
  { emoji: "😐", label: "OK",   value: 3 },
  { emoji: "🙂", label: "Bien", value: 4 },
  { emoji: "😄", label: "Top",  value: 5 },
];
const STRESS_FACES = [
  { emoji: "😌", label: "Zero", value: 1 },
  { emoji: "🙂", label: "Léger", value: 2 },
  { emoji: "😐", label: "Moyen", value: 3 },
  { emoji: "😟", label: "Élevé", value: 4 },
  { emoji: "🤯", label: "Max",  value: 5 },
];
const SLEEP_QUAL = [
  { emoji: "😵", label: "1", value: 1 },
  { emoji: "😴", label: "2", value: 2 },
  { emoji: "🛏️", label: "3", value: 3 },
  { emoji: "💤", label: "4", value: 4 },
  { emoji: "🌟", label: "5", value: 5 },
];
const APPETITE = [
  { emoji: "🚫", label: "Nul", value: 1 },
  { emoji: "🥄", label: "Peu", value: 2 },
  { emoji: "🍽️", label: "Normal", value: 3 },
  { emoji: "🍔", label: "+", value: 4 },
  { emoji: "🍕", label: "Max", value: 5 },
];

const DEFAULT_PAYLOAD: CheckinPayload = {
  sleep_hours: 7.5,
  sleep_quality: 4,
  fatigue: 4,
  muscle_soreness: 3,
  urine_color: 3, // milieu de la zone "bien hydraté"
  stress: 2,
  mood: 4,
  appetite: 4,
};

export function CheckinFlow() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [payload, setPayload] = useState<CheckinPayload>(DEFAULT_PAYLOAD);
  const [error, setError] = useState<string | null>(null);

  const current = STEPS[step];
  const totalAnswerableSteps = STEPS.length - 1; // exclude review

  const set = <K extends keyof CheckinPayload>(k: K, v: number) =>
    setPayload((p) => ({ ...p, [k]: v }));

  const next = () => {
    setDirection(1);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const prev = () => {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await submitCheckin(payload);
      if (!res.ok) {
        setError(res.error);
      } else {
        router.push(`/?just_checked_in=${res.readiness}`);
      }
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0a0e1a]">
      {/* progress bar */}
      <div className="px-6 pt-6">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= step ? "bg-[#c9a44b]" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[11px] text-[#8b93a7] font-[family-name:var(--font-oswald)] uppercase tracking-widest">
          <span>
            {step < totalAnswerableSteps
              ? `${step + 1} / ${totalAnswerableSteps}`
              : "Récap"}
          </span>
          <button
            onClick={() => router.push("/")}
            className="hover:text-white"
          >
            Annuler
          </button>
        </div>
      </div>

      {/* slide content */}
      <div className="flex-1 flex flex-col px-6 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -direction * 60, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 flex flex-col pt-8"
          >
            <h1 className="font-[family-name:var(--font-oswald)] text-2xl font-bold leading-tight">
              {current.title}
            </h1>
            {current.subtitle && (
              <p className="text-sm text-[#8b93a7] mt-2">{current.subtitle}</p>
            )}

            <div className="flex-1 flex items-center justify-center py-6">
              {current.key === "sleep_hours" && (
                <BigSlider
                  min={0}
                  max={12}
                  step={0.5}
                  value={payload.sleep_hours}
                  onChange={(v) => set("sleep_hours", v)}
                  inverted={false}
                  unit="h"
                />
              )}
              {current.key === "sleep_quality" && (
                <EmojiPicker
                  options={SLEEP_QUAL}
                  value={payload.sleep_quality}
                  onChange={(v) => set("sleep_quality", v)}
                />
              )}
              {current.key === "fatigue" && (
                <BigSlider
                  min={1}
                  max={10}
                  value={payload.fatigue}
                  onChange={(v) => set("fatigue", v)}
                  inverted={true}
                  displayValue={(v) => String(v)}
                />
              )}
              {current.key === "muscle_soreness" && (
                <BigSlider
                  min={1}
                  max={10}
                  value={payload.muscle_soreness}
                  onChange={(v) => set("muscle_soreness", v)}
                  inverted={true}
                />
              )}
              {current.key === "urine_color" && (
                <UrineColorPicker
                  value={payload.urine_color}
                  onChange={(v) => set("urine_color", v)}
                />
              )}
              {current.key === "stress" && (
                <EmojiPicker
                  options={STRESS_FACES}
                  value={payload.stress}
                  onChange={(v) => set("stress", v)}
                />
              )}
              {current.key === "mood" && (
                <EmojiPicker
                  options={MOOD_FACES}
                  value={payload.mood}
                  onChange={(v) => set("mood", v)}
                />
              )}
              {current.key === "appetite" && (
                <EmojiPicker
                  options={APPETITE}
                  value={payload.appetite}
                  onChange={(v) => set("appetite", v)}
                />
              )}
              {current.key === "review" && (
                <ReviewBlock payload={payload} />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* footer actions */}
      <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+22px)] pt-4 border-t border-white/5">
        {error && (
          <p className="text-xs text-[#ff4d5e] mb-3 text-center">⚠️ {error}</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={prev}
            disabled={step === 0}
            className="flex items-center gap-1 rounded-xl px-5 py-4 bg-[#1a2030] text-[#8b93a7] disabled:opacity-40 font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-xs"
          >
            <ChevronLeft size={18} /> Retour
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={next}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-4 bg-gradient-to-br from-[#f6e3a1] via-[#c9a44b] to-[#806224] text-[#1c1206] font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-sm shadow-lg active:scale-[.98] transition"
            >
              Suivant <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={pending}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-4 bg-gradient-to-br from-[#2bd47d] to-[#16a35e] text-[#04150b] font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-sm shadow-lg active:scale-[.98] transition disabled:opacity-60"
            >
              {pending ? "Envoi..." : <>Valider <Check size={20} /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewBlock({ payload }: { payload: CheckinPayload }) {
  const hydrationLabel =
    payload.urine_color <= 3
      ? "bien hydraté"
      : payload.urine_color <= 5
        ? "à surveiller"
        : "déshydraté";
  const rows: { label: string; value: string }[] = [
    { label: "Sommeil",     value: `${payload.sleep_hours}h · qualité ${payload.sleep_quality}/5` },
    { label: "Fatigue",     value: `${payload.fatigue}/10` },
    { label: "Douleurs",    value: `${payload.muscle_soreness}/10` },
    { label: "Hydratation", value: `urine ${payload.urine_color}/8 · ${hydrationLabel}` },
    { label: "Stress",      value: `${payload.stress}/5` },
    { label: "Humeur",      value: `${payload.mood}/5` },
    { label: "Appétit",     value: `${payload.appetite}/5` },
  ];
  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex justify-between items-baseline px-4 py-3 rounded-xl bg-[#131826] border border-white/5"
        >
          <span className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)]">
            {r.label}
          </span>
          <span className="font-[family-name:var(--font-bebas)] text-xl">
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}
