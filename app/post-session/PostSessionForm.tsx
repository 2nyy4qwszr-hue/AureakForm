"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { BigSlider } from "@/components/aureak/BigSlider";
import { EmojiPicker } from "@/components/aureak/EmojiPicker";
import { submitPostSession, type PostSessionPayload } from "./actions";

const STEPS = [
  "type",
  "rpe",
  "enjoyment",
  "self_performance",
  "review",
] as const;

const PERF_FACES = [
  { emoji: "😞", label: "Pire", value: 1 },
  { emoji: "😕", label: "Bof",  value: 2 },
  { emoji: "😐", label: "OK",   value: 3 },
  { emoji: "🙂", label: "Bien", value: 4 },
  { emoji: "🔥", label: "Feu",  value: 5 },
];

const KIFF_FACES = [
  { emoji: "😒", label: "Aucun", value: 1 },
  { emoji: "😐", label: "Peu",   value: 2 },
  { emoji: "🙂", label: "OK",    value: 3 },
  { emoji: "😄", label: "Top",   value: 4 },
  { emoji: "🤩", label: "Wow",   value: 5 },
];

export function PostSessionForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<PostSessionPayload>({
    session_type: "training",
    rpe: 6,
    enjoyment: 4,
    self_performance: 3,
    minutes: 90,
  });

  const set = <K extends keyof PostSessionPayload>(
    k: K,
    v: PostSessionPayload[K]
  ) => setPayload((p) => ({ ...p, [k]: v }));

  const next = () => {
    setDir(1);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const prev = () => {
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await submitPostSession(payload);
      if (!res.ok) setError(res.error);
      else router.push("/?post_session=ok");
    });
  };

  const current = STEPS[step];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0a0e1a]">
      <div className="px-6 pt-6">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full ${
                i <= step ? "bg-[#00aaff]" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[11px] text-[#8b93a7] font-[family-name:var(--font-oswald)] uppercase tracking-widest">
          <span>{step + 1} / {STEPS.length}</span>
          <button onClick={() => router.push("/")} className="hover:text-white">
            Annuler
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-6 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            initial={{ x: dir * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -dir * 60, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col pt-8"
          >
            {current === "type" && (
              <>
                <h1 className="font-[family-name:var(--font-oswald)] text-2xl font-bold leading-tight">
                  Type de séance ?
                </h1>
                <p className="text-sm text-[#8b93a7] mt-2">
                  Entraînement ou match
                </p>
                <div className="flex-1 flex items-center justify-center py-6 gap-3">
                  {(["training", "match"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => set("session_type", t)}
                      className={`flex-1 rounded-2xl py-8 border-2 transition ${
                        payload.session_type === t
                          ? "border-[#00aaff] bg-[#00aaff]/15"
                          : "border-white/10 bg-[#131826]"
                      }`}
                    >
                      <div className="text-4xl mb-2">{t === "training" ? "🏃" : "⚽"}</div>
                      <div className="font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest text-sm">
                        {t === "training" ? "Séance" : "Match"}
                      </div>
                    </button>
                  ))}
                </div>
                <label className="block mt-2">
                  <span className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold">
                    Minutes (optionnel)
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={payload.minutes ?? ""}
                    onChange={(e) =>
                      set(
                        "minutes",
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                    placeholder="90"
                    className="mt-2 w-full rounded-xl bg-[#131826] border border-white/10 px-4 py-3.5 text-[16px] focus:outline-none focus:border-[#00aaff]"
                  />
                </label>
              </>
            )}

            {current === "rpe" && (
              <>
                <h1 className="font-[family-name:var(--font-oswald)] text-2xl font-bold leading-tight">
                  Effort perçu ?
                </h1>
                <p className="text-sm text-[#8b93a7] mt-2">
                  Échelle Borg CR10 — 1 = très facile · 10 = maximal
                </p>
                <div className="flex-1 flex items-center justify-center">
                  <BigSlider
                    min={1}
                    max={10}
                    value={payload.rpe}
                    onChange={(v) => set("rpe", v)}
                    inverted={true}
                  />
                </div>
              </>
            )}

            {current === "enjoyment" && (
              <>
                <h1 className="font-[family-name:var(--font-oswald)] text-2xl font-bold leading-tight">
                  Tu as kiffé ?
                </h1>
                <p className="text-sm text-[#8b93a7] mt-2">
                  Pure subjectif. Ça compte aussi.
                </p>
                <div className="flex-1 flex items-center justify-center py-6">
                  <EmojiPicker
                    options={KIFF_FACES}
                    value={payload.enjoyment}
                    onChange={(v) => set("enjoyment", v)}
                  />
                </div>
              </>
            )}

            {current === "self_performance" && (
              <>
                <h1 className="font-[family-name:var(--font-oswald)] text-2xl font-bold leading-tight">
                  Tu te notes comment ?
                </h1>
                <p className="text-sm text-[#8b93a7] mt-2">
                  Ta perf perso d&apos;aujourd&apos;hui
                </p>
                <div className="flex-1 flex items-center justify-center py-6">
                  <EmojiPicker
                    options={PERF_FACES}
                    value={payload.self_performance}
                    onChange={(v) => set("self_performance", v)}
                  />
                </div>
              </>
            )}

            {current === "review" && (
              <>
                <h1 className="font-[family-name:var(--font-oswald)] text-2xl font-bold leading-tight">
                  Récap
                </h1>
                <div className="flex-1 flex flex-col gap-2 mt-6 max-w-md mx-auto w-full">
                  {[
                    ["Type",     payload.session_type === "match" ? "Match ⚽" : "Séance 🏃"],
                    ["Minutes",  payload.minutes ? `${payload.minutes}'` : "—"],
                    ["RPE",      `${payload.rpe}/10`],
                    ["Kiff",     `${payload.enjoyment}/5`],
                    ["Perso",    `${payload.self_performance}/5`],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between px-4 py-3 rounded-xl bg-[#131826] border border-white/5"
                    >
                      <span className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)]">
                        {k}
                      </span>
                      <span className="font-[family-name:var(--font-bebas)] text-xl">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

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
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-4 bg-gradient-to-br from-[#00aaff] to-[#0072ff] text-white font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-sm shadow-lg"
            >
              Suivant <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={pending}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-4 bg-gradient-to-br from-[#2bd47d] to-[#16a35e] text-[#04150b] font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-sm shadow-lg disabled:opacity-60"
            >
              {pending ? "Envoi..." : <>Valider <Check size={20} /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
