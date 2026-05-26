"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Check, Edit2, Loader2, Users } from "lucide-react";
import { toggleCampPlayer, updateCamp } from "../actions";
import type { CampRow } from "@/lib/camp";

type PlayerLite = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  selected: boolean;
};

type Group = {
  pos: string;
  label: string;
  players: PlayerLite[];
};

type Props = {
  camp: CampRow;
  groups: Group[];
};

const FR_LONG = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

export function CampEditor({ camp, groups: initialGroups }: Props) {
  const [groups, setGroups] = useState(initialGroups);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(camp.name);
  const [start, setStart] = useState(camp.start_date);
  const [end, setEnd] = useState(camp.end_date);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [activeCamp, setActiveCamp] = useState(camp);

  const totalPlayers = groups.reduce((sum, g) => sum + g.players.length, 0);
  const totalSelected = groups.reduce(
    (sum, g) => sum + g.players.filter((p) => p.selected).length,
    0
  );

  const toggle = (playerId: string, current: boolean) => {
    // Optimistic update
    setGroups((gs) =>
      gs.map((g) => ({
        ...g,
        players: g.players.map((p) =>
          p.id === playerId ? { ...p, selected: !current } : p
        ),
      }))
    );
    startTransition(async () => {
      const res = await toggleCampPlayer({
        camp_id: camp.id,
        player_id: playerId,
        checked: !current,
      });
      if (!res.ok) {
        // Rollback en cas d'erreur
        setGroups((gs) =>
          gs.map((g) => ({
            ...g,
            players: g.players.map((p) =>
              p.id === playerId ? { ...p, selected: current } : p
            ),
          }))
        );
        setErr(res.error);
      } else {
        setErr(null);
      }
    });
  };

  const selectAll = (pos: string, checked: boolean) => {
    const targets = groups
      .find((g) => g.pos === pos)
      ?.players.filter((p) => p.selected !== checked) ?? [];
    if (targets.length === 0) return;

    // Snapshot pour rollback si une mutation échoue en cours de route
    const snapshot = groups;
    // Optimistic
    setGroups((gs) =>
      gs.map((g) =>
        g.pos === pos
          ? { ...g, players: g.players.map((p) => ({ ...p, selected: checked })) }
          : g
      )
    );
    startTransition(async () => {
      for (const p of targets) {
        const res = await toggleCampPlayer({ camp_id: camp.id, player_id: p.id, checked });
        if (!res.ok) {
          setGroups(snapshot);
          setErr(res.error);
          return;
        }
      }
      setErr(null);
    });
  };

  const saveMeta = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const res = await updateCamp({ id: camp.id, name, start_date: start, end_date: end });
      if (res.ok) {
        setActiveCamp({ ...activeCamp, name, start_date: start, end_date: end });
        setEditing(false);
      } else {
        setErr(res.error);
      }
    });
  };

  return (
    <>
      {/* En-tête : nom + dates + bouton edit */}
      <div className="mt-4 mb-6">
        {!editing ? (
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wider">
                {activeCamp.name.toUpperCase()}
              </h1>
              <p className="text-[#8b93a7] text-sm mt-1">
                {FR_LONG(activeCamp.start_date)} → {FR_LONG(activeCamp.end_date)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#131826] border border-white/5 px-4 py-3 text-center">
                <div className="text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)]">Convoqués</div>
                <div className="font-[family-name:var(--font-bebas)] text-2xl">
                  {totalSelected}/{totalPlayers}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-lg px-3 py-2 text-xs uppercase tracking-widest font-[family-name:var(--font-oswald)] font-bold bg-white/5 border border-white/10 text-[#cfd6e6] hover:bg-white/10 transition flex items-center gap-1.5"
              >
                <Edit2 size={14} /> Éditer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={saveMeta} className="rounded-2xl border border-white/5 bg-[#131826] p-4 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-1">Nom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg bg-[#0a0e1a] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-[#c9a44b]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-1">Du</label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
                className="rounded-lg bg-[#0a0e1a] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-[#c9a44b]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-1">Au</label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
                className="rounded-lg bg-[#0a0e1a] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-[#c9a44b]"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg px-4 py-2 text-xs uppercase tracking-widest font-[family-name:var(--font-oswald)] font-bold bg-[#c9a44b] text-[#1c1206] hover:bg-[#d8b35c] transition flex items-center gap-1.5"
            >
              {pending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Enregistrer
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setName(activeCamp.name); setStart(activeCamp.start_date); setEnd(activeCamp.end_date); }}
              className="rounded-lg px-3 py-2 text-xs text-[#8b93a7] hover:text-white"
            >
              Annuler
            </button>
          </form>
        )}
      </div>

      {err && (
        <div className="mb-4 rounded-lg bg-[#ff4d5e]/10 border border-[#ff4d5e]/30 px-4 py-2 text-xs text-[#ff4d5e]">
          ⚠️ {err}
        </div>
      )}

      {/* Sections par poste avec checkbox tout sélectionner */}
      <div className="space-y-5">
        {groups.map((g) => {
          if (g.players.length === 0) return null;
          const selectedInGroup = g.players.filter((p) => p.selected).length;
          const allSelected = selectedInGroup === g.players.length;
          const noneSelected = selectedInGroup === 0;

          return (
            <section key={g.pos} className="rounded-2xl border border-white/5 bg-[#131826] overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#0a0e1a]/60 border-b border-white/5">
                <h2 className="font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest text-xs text-[#c9a44b] flex items-center gap-2">
                  <Users size={12} />
                  {g.label}
                  <span className="text-[#8b93a7] font-normal">({selectedInGroup}/{g.players.length})</span>
                </h2>
                <button
                  type="button"
                  onClick={() => selectAll(g.pos, !allSelected)}
                  className="text-[10px] uppercase tracking-widest font-[family-name:var(--font-oswald)] font-bold text-[#8b93a7] hover:text-[#c9a44b] transition"
                >
                  {allSelected ? "Tout désélectionner" : noneSelected ? "Tout sélectionner" : "Tout sélectionner"}
                </button>
              </div>
              <ul className="grid gap-1 p-2 [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
                {g.players.map((p) => (
                  <li key={p.id}>
                    <label className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition border ${
                      p.selected
                        ? "bg-[#2bd47d]/10 border-[#2bd47d]/30 hover:bg-[#2bd47d]/15"
                        : "bg-transparent border-white/5 hover:bg-white/5"
                    }`}>
                      <input
                        type="checkbox"
                        checked={p.selected}
                        onChange={() => toggle(p.id, p.selected)}
                        className="w-4 h-4 accent-[#2bd47d] cursor-pointer"
                      />
                      <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-[family-name:var(--font-bebas)] ${
                        p.photo_url ? "bg-[#0a0e1a]" : "bg-white/10 text-[#8b93a7]"
                      }`}>
                        {p.photo_url ? (
                          <Image
                            src={p.photo_url}
                            alt={p.last_name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <>{p.first_name[0]}{p.last_name[0]}</>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide truncate">
                          {p.last_name}
                        </div>
                        <div className="text-[11px] text-[#8b93a7] truncate">{p.first_name}</div>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
