"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Power, Trash2, Sunrise, Dumbbell } from "lucide-react";
import { closeRequest, deleteRequest } from "./actions";
import type { RequestRow as Req } from "@/lib/types";

type Props = {
  request: Req;
  responseCount: number;
  totalPlayers: number;
};

export function RequestRow({ request, responseCount, totalPlayers }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const Icon = request.kind === "morning_checkin" ? Sunrise : Dumbbell;
  const accent = request.kind === "morning_checkin" ? "#c9a44b" : "#00aaff";

  const close = () => {
    if (!confirm("Désactiver cette demande ? Les joueurs ne la verront plus.")) return;
    startTransition(async () => {
      await closeRequest(request.id);
      router.refresh();
    });
  };

  const remove = () => {
    if (!confirm("Supprimer définitivement cette demande ?")) return;
    startTransition(async () => {
      await deleteRequest(request.id);
      router.refresh();
    });
  };

  const ctx = (request.context ?? {}) as Record<string, unknown>;
  const opp = typeof ctx.opponent === "string" ? ctx.opponent : null;
  const min = typeof ctx.minutes === "number" ? ctx.minutes : null;
  const sessionType = typeof ctx.session_type === "string" ? ctx.session_type : null;

  const dt = new Date(request.created_at);
  const dtStr = dt.toLocaleString("fr-FR", {
    weekday: "short", day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });

  const pct = totalPlayers > 0 ? Math.round((responseCount / totalPlayers) * 100) : 0;

  return (
    <li
      className="rounded-xl border p-4"
      style={{
        borderColor: request.active ? `${accent}30` : "rgba(255,255,255,.06)",
        background: request.active ? `${accent}08` : "#131826",
        opacity: request.active ? 1 : 0.6,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <Icon size={20} style={{ color: accent }} className="shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest text-sm">
                {request.title}
              </span>
              {!request.active && (
                <span className="text-[9px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] bg-white/5 px-1.5 py-0.5 rounded">
                  fermée
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#8b93a7] mt-1">
              {dtStr}
              {sessionType === "match" && opp && ` · vs ${opp}`}
              {min && ` · ${min} min`}
            </div>
            {request.message && (
              <p className="text-xs text-[#cfd6e6] mt-2 italic">« {request.message} »</p>
            )}
          </div>
        </div>

        {/* Réponses */}
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)]">
            Réponses
          </div>
          <div
            className="font-[family-name:var(--font-bebas)] text-2xl leading-none"
            style={{ color: pct >= 75 ? "#2bd47d" : pct >= 40 ? "#ffa42b" : "#ff4d5e" }}
          >
            {responseCount}/{totalPlayers}
          </div>
          <div className="w-20 h-1 bg-white/10 rounded-full mt-1 ml-auto overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: pct >= 75 ? "#2bd47d" : pct >= 40 ? "#ffa42b" : "#ff4d5e",
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
        {request.active && (
          <button
            type="button"
            onClick={close}
            disabled={pending}
            className="text-[11px] uppercase tracking-widest font-[family-name:var(--font-oswald)] font-bold text-[#ffa42b] hover:text-white flex items-center gap-1.5 px-2 py-1"
          >
            <Power size={12} /> Fermer
          </button>
        )}
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="text-[11px] uppercase tracking-widest font-[family-name:var(--font-oswald)] font-bold text-[#8b93a7] hover:text-[#ff4d5e] flex items-center gap-1.5 px-2 py-1"
        >
          <Trash2 size={12} /> Supprimer
        </button>
      </div>
    </li>
  );
}
