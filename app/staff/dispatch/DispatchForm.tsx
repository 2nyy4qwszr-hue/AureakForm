"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sunrise, Dumbbell, Send, Loader2 } from "lucide-react";
import { dispatchRequest } from "./actions";

type Mode = "idle" | "morning" | "post";

export function DispatchForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // post-session fields
  const [sessionType, setSessionType] = useState<"training" | "match">("training");
  const [opponent, setOpponent] = useState("");
  const [minutes, setMinutes] = useState("");
  const [message, setMessage] = useState("");

  const reset = () => {
    setOpponent(""); setMinutes(""); setMessage("");
    setError(null);
  };

  const send = (kind: "morning_checkin" | "post_session") => {
    setError(null); setSuccess(null);
    startTransition(async () => {
      const res = await dispatchRequest(
        kind === "morning_checkin"
          ? { kind: "morning_checkin", message: message || undefined }
          : {
              kind: "post_session",
              session_type: sessionType,
              opponent: opponent || undefined,
              minutes: minutes ? Number(minutes) : null,
              message: message || undefined,
            }
      );
      if (!res.ok) { setError(res.error); return; }
      setSuccess(`✓ Demande envoyée à la sélection.`);
      reset();
      setMode("idle");
      router.refresh();
      setTimeout(() => setSuccess(null), 3000);
    });
  };

  if (mode === "idle") {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => setMode("morning")}
          className="rounded-2xl p-6 bg-gradient-to-br from-[#c9a44b]/15 to-[#806224]/10 border-2 border-[#c9a44b]/30 hover:border-[#c9a44b] hover:bg-[#c9a44b]/20 transition text-left group"
        >
          <Sunrise size={28} className="text-[#c9a44b] mb-3" />
          <div className="font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest text-base text-white">
            Check-in matin
          </div>
          <p className="text-xs text-[#8b93a7] mt-2">
            Sommeil · fatigue · douleurs · stress · humeur · appétit (7 écrans, ~30 sec).
          </p>
        </button>
        <button
          onClick={() => setMode("post")}
          className="rounded-2xl p-6 bg-gradient-to-br from-[#00aaff]/15 to-[#0072ff]/10 border-2 border-[#00aaff]/30 hover:border-[#00aaff] hover:bg-[#00aaff]/20 transition text-left group"
        >
          <Dumbbell size={28} className="text-[#00aaff] mb-3" />
          <div className="font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest text-base text-white">
            Post-séance / match
          </div>
          <p className="text-xs text-[#8b93a7] mt-2">
            RPE Borg · kiff · perf auto-éval — optionnel : opposant + minutes.
          </p>
        </button>

        {success && (
          <div className="md:col-span-2 rounded-xl bg-[#2bd47d]/10 border border-[#2bd47d]/30 px-4 py-3 text-sm text-[#2bd47d]">
            {success}
          </div>
        )}
      </div>
    );
  }

  const accent = mode === "morning" ? "#c9a44b" : "#00aaff";
  const title = mode === "morning" ? "Demande check-in matin" : "Demande post-séance / match";

  return (
    <div
      className="rounded-2xl bg-[#131826] border-2 p-5"
      style={{ borderColor: `${accent}40` }}
    >
      <div className="flex items-baseline justify-between mb-4">
        <h2
          className="font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest text-sm flex items-center gap-2"
          style={{ color: accent }}
        >
          {mode === "morning" ? <Sunrise size={16} /> : <Dumbbell size={16} />}
          {title}
        </h2>
        <button
          onClick={() => { setMode("idle"); reset(); }}
          className="text-[#8b93a7] hover:text-white text-xs uppercase tracking-widest font-[family-name:var(--font-oswald)] font-bold"
        >
          Annuler
        </button>
      </div>

      {mode === "post" && (
        <div className="space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-2">
              Type de séance
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["training", "match"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSessionType(t)}
                  className={`rounded-lg py-3 text-xs font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest border-2 transition ${
                    sessionType === t
                      ? "border-[#00aaff] bg-[#00aaff]/15 text-white"
                      : "border-white/10 bg-[#0a0e1a] text-[#8b93a7]"
                  }`}
                >
                  {t === "training" ? "Séance" : "Match"}
                </button>
              ))}
            </div>
          </div>

          {sessionType === "match" && (
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold">
                Opposant (opt.)
              </span>
              <input
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="Sénégal"
                className="mt-1.5 w-full rounded-lg bg-[#0a0e1a] border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-[#00aaff]"
              />
            </label>
          )}

          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold">
              Minutes (opt.)
            </span>
            <input
              type="number"
              inputMode="numeric"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="90"
              min={1}
              max={180}
              className="mt-1.5 w-full rounded-lg bg-[#0a0e1a] border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-[#00aaff]"
            />
          </label>
        </div>
      )}

      <label className="block mt-4">
        <span className="text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold">
          Message (opt.)
        </span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ex : pensez bien à remplir avant 10h"
          rows={2}
          className="mt-1.5 w-full rounded-lg bg-[#0a0e1a] border border-white/10 px-3 py-2.5 text-sm focus:outline-none resize-none"
          style={{ borderColor: undefined }}
        />
      </label>

      {error && <p className="text-xs text-[#ff4d5e] mt-3">⚠️ {error}</p>}

      <button
        onClick={() => send(mode === "morning" ? "morning_checkin" : "post_session")}
        disabled={pending}
        className="mt-5 w-full rounded-lg py-3 font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2 text-[#1c1206] disabled:opacity-60"
        style={{
          background: mode === "morning"
            ? "linear-gradient(135deg, #f6e3a1, #c9a44b 50%, #806224)"
            : "linear-gradient(135deg, #00aaff, #0072ff)",
          color: mode === "morning" ? "#1c1206" : "#fff",
        }}
      >
        {pending ? <><Loader2 size={14} className="animate-spin" /> Envoi...</> : <><Send size={14} /> Envoyer à toute la sélection</>}
      </button>
    </div>
  );
}
