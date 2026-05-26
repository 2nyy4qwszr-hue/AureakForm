"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, CalendarRange, Check, Plus } from "lucide-react";
import { setActiveCamp } from "@/app/staff/camps/actions";
import type { CampRow } from "@/lib/camp";

type Props = {
  camps: CampRow[];
  activeCampId: string | null;
};

const FR_SHORT = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

export function CampSwitcher({ camps, activeCampId }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);

  // Ferme le menu au clic hors de la zone
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const active = camps.find((c) => c.id === activeCampId) ?? null;

  const select = (id: string | null) => {
    setOpen(false);
    startTransition(async () => {
      await setActiveCamp(id);
    });
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-[family-name:var(--font-oswald)] uppercase tracking-widest transition border ${
          active
            ? "bg-[#c9a44b]/15 border-[#c9a44b]/40 text-[#c9a44b] hover:bg-[#c9a44b]/25"
            : "bg-white/5 border-white/10 text-[#cfd6e6] hover:bg-white/10"
        }`}
        title="Choisir le camp / stage actif"
      >
        <CalendarRange size={14} />
        <span className="truncate max-w-[160px]">
          {active ? active.name : "Tous les joueurs"}
        </span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 rounded-xl border border-white/10 bg-[#0a0e1a] shadow-2xl min-w-[280px] overflow-hidden">
          <div className="px-3 py-2 border-b border-white/5 text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold">
            Période active
          </div>

          <button
            type="button"
            onClick={() => select(null)}
            disabled={pending}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition flex items-center gap-2 ${
              !active ? "bg-white/5" : ""
            }`}
          >
            <span className="w-4 inline-flex">
              {!active && <Check size={14} className="text-[#2bd47d]" />}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium">Tous les joueurs</div>
              <div className="text-[10px] text-[#8b93a7]">Vue complète, pas de filtre</div>
            </div>
          </button>

          {camps.length > 0 && (
            <div className="border-t border-white/5">
              {camps.map((c) => {
                const isActive = c.id === activeCampId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => select(c.id)}
                    disabled={pending}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition flex items-center gap-2 ${
                      isActive ? "bg-[#c9a44b]/10" : ""
                    }`}
                  >
                    <span className="w-4 inline-flex">
                      {isActive && <Check size={14} className="text-[#c9a44b]" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{c.name}</div>
                      <div className="text-[10px] text-[#8b93a7]">
                        {FR_SHORT(c.start_date)} → {FR_SHORT(c.end_date)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <Link
            href="/staff/camps"
            onClick={() => setOpen(false)}
            className="border-t border-white/5 w-full block text-center px-3 py-2 text-xs text-[#c9a44b] hover:bg-[#c9a44b]/10 transition font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase"
          >
            <Plus size={12} className="inline mr-1" /> Gérer les camps
          </Link>
        </div>
      )}
    </div>
  );
}
