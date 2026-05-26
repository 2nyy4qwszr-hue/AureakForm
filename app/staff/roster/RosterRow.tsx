"use client";

import { useState, useTransition } from "react";
import { Mail, Link as LinkIcon, Check, Copy, Trash2, Loader2, UserX, Shield, ShieldOff } from "lucide-react";
import {
  setPlayerEmail,
  unlinkPlayerEmail,
  generateMagicLinkForPlayer,
  deletePlayer,
  promoteToStaff,
  revokeStaff,
  updatePlayerPosition,
} from "./actions";
import type { StaffRole } from "@/lib/staff";

const POSITION_OPTIONS = [
  { value: "GK",  label: "GK · Gardien" },
  { value: "DEF", label: "DEF · Défenseur" },
  { value: "MIL", label: "MIL · Milieu" },
  { value: "ATT", label: "ATT · Attaquant" },
] as const;
type Pos = (typeof POSITION_OPTIONS)[number]["value"];

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: "admin",   label: "Admin" },
  { value: "coach",   label: "Coach" },
  { value: "medical", label: "Kiné / médical" },
  { value: "staff",   label: "Staff (autre)" },
];

const ROLE_BADGE: Record<StaffRole, { label: string; cls: string }> = {
  admin:   { label: "Admin",   cls: "bg-[#c9a44b]/20 text-[#c9a44b] border-[#c9a44b]/40" },
  coach:   { label: "Coach",   cls: "bg-[#00aaff]/20 text-[#00aaff] border-[#00aaff]/40" },
  medical: { label: "Kiné",    cls: "bg-[#2bd47d]/20 text-[#2bd47d] border-[#2bd47d]/40" },
  staff:   { label: "Staff",   cls: "bg-white/10 text-[#cfd6e6] border-white/20" },
};

type Props = {
  player: {
    id: string;
    first_name: string;
    last_name: string;
    position: string | null;
    email: string | null; // = email du user lié, ou null
    staffRole: StaffRole | null;
    isSelf: boolean;
  };
  viewerIsAdmin: boolean;
};

export function RosterRow({ player, viewerIsAdmin }: Props) {
  const [email, setEmail] = useState(player.email ?? "");
  const [savedEmail, setSavedEmail] = useState(player.email ?? "");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentRole, setCurrentRole] = useState<StaffRole | null>(player.staffRole);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [position, setPosition] = useState<Pos>((player.position as Pos) ?? "MIL");

  const dirty = email.trim().toLowerCase() !== (savedEmail ?? "").toLowerCase();
  const linked = !!savedEmail;
  const isStaff = !!currentRole;

  const save = () => {
    setMsg(null); setLink(null);
    startTransition(async () => {
      const res = await setPlayerEmail(player.id, email);
      if (res.ok) {
        setSavedEmail(res.email);
        setMsg({ type: "ok", text: "Email rattaché ✓" });
      } else {
        setMsg({ type: "err", text: res.error });
      }
    });
  };

  const unlink = () => {
    if (!confirm(`Délier l'email de ${player.first_name} ${player.last_name} ?\nLe compte reste actif mais sera dissocié de cette carte joueur.`)) return;
    setMsg(null); setLink(null);
    startTransition(async () => {
      const res = await unlinkPlayerEmail(player.id);
      if (res.ok) {
        setSavedEmail("");
        setEmail("");
        setMsg({ type: "ok", text: "Email délié" });
      } else {
        setMsg({ type: "err", text: res.error });
      }
    });
  };

  const remove = () => {
    if (!confirm(`Supprimer DÉFINITIVEMENT ${player.first_name} ${player.last_name} ?\nTous ses check-ins, post-séances et blessures seront aussi supprimés.\nCette action est irréversible.`)) return;
    setMsg(null); setLink(null);
    startTransition(async () => {
      const res = await deletePlayer(player.id);
      if (!res.ok) setMsg({ type: "err", text: res.error });
      // Sinon le revalidate côté serveur retire la ligne du DOM
    });
  };

  const genLink = () => {
    setMsg(null); setLink(null); setCopied(false);
    startTransition(async () => {
      const res = await generateMagicLinkForPlayer(player.id);
      if (res.ok) {
        setLink(res.url);
        setMsg({ type: "ok", text: `Lien généré pour ${res.email}` });
      } else {
        setMsg({ type: "err", text: res.error });
      }
    });
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const promote = (role: StaffRole) => {
    setMsg(null); setLink(null); setShowRoleMenu(false);
    startTransition(async () => {
      const res = await promoteToStaff({ playerId: player.id, role });
      if (res.ok) {
        setCurrentRole(role);
        setMsg({ type: "ok", text: `Promu ${ROLE_BADGE[role].label} ✓` });
      } else {
        setMsg({ type: "err", text: res.error });
      }
    });
  };

  const changePosition = (next: Pos) => {
    const prev = position;
    setPosition(next);
    setMsg(null); setLink(null);
    startTransition(async () => {
      const res = await updatePlayerPosition(player.id, next);
      if (res.ok) {
        setMsg({ type: "ok", text: `Poste mis à jour (${next})` });
      } else {
        setPosition(prev);
        setMsg({ type: "err", text: res.error });
      }
    });
  };

  const revoke = () => {
    if (!confirm(`Retirer le statut staff de ${player.first_name} ${player.last_name} ?\nLa personne perdra l'accès au dashboard /staff. Son compte joueur reste actif.`)) return;
    setMsg(null); setLink(null);
    startTransition(async () => {
      const res = await revokeStaff(player.id);
      if (res.ok) {
        setCurrentRole(null);
        setMsg({ type: "ok", text: "Statut staff retiré" });
      } else {
        setMsg({ type: "err", text: res.error });
      }
    });
  };

  return (
    <li className="border-b border-white/5 last:border-b-0 p-4 hover:bg-white/[.02] transition-colors">
      <div className="flex flex-wrap items-center gap-3">
        {/* Identité */}
        <div className="flex items-center gap-3 min-w-0 md:w-72">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-[family-name:var(--font-bebas)] text-sm shrink-0 ${
            linked
              ? "bg-[#2bd47d]/15 text-[#2bd47d] border border-[#2bd47d]/40"
              : "bg-[#5a6378]/15 text-[#8b93a7] border border-white/10"
          }`}>
            {player.first_name[0]}{player.last_name[0]}
          </div>
          <div className="min-w-0">
            <div className="font-[family-name:var(--font-oswald)] font-bold uppercase text-sm truncate flex items-center gap-2">
              <span className="truncate">{player.last_name}</span>
              {isStaff && (
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] tracking-widest border font-bold ${ROLE_BADGE[currentRole!].cls}`}
                  title="Rôle staff actif sur cette sélection"
                >
                  {ROLE_BADGE[currentRole!].label.toUpperCase()}
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#8b93a7] truncate flex items-center gap-1.5">
              <span className="truncate">{player.first_name}</span>
              <span>·</span>
              <select
                value={position}
                onChange={(e) => changePosition(e.target.value as Pos)}
                disabled={pending}
                title="Changer le poste"
                className="bg-transparent border border-white/10 rounded px-1.5 py-0.5 text-[11px] text-[#cfd6e6] hover:border-[#c9a44b]/40 focus:outline-none focus:border-[#c9a44b] cursor-pointer disabled:opacity-50"
              >
                {POSITION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0a0e1a]">
                    {opt.value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Email input */}
        <div className="flex-1 min-w-[220px] flex gap-2">
          <div className="relative flex-1">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b93a7]" />
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom.nom@example.com"
              className="w-full rounded-lg bg-[#0a0e1a] border border-white/10 pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#c9a44b]"
            />
          </div>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || pending || !email.trim()}
            className="rounded-lg px-3 py-2 text-xs uppercase tracking-widest font-[family-name:var(--font-oswald)] font-bold bg-[#c9a44b] text-[#1c1206] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#d8b35c] transition flex items-center gap-1.5"
          >
            {pending && dirty ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 relative">
          {linked && (
            <>
              <button
                type="button"
                onClick={genLink}
                disabled={pending}
                className="rounded-lg px-3 py-2 text-xs uppercase tracking-widest font-[family-name:var(--font-oswald)] font-bold bg-[#00aaff]/15 text-[#00aaff] border border-[#00aaff]/30 hover:bg-[#00aaff]/25 transition flex items-center gap-1.5"
              >
                <LinkIcon size={14} /> Lien
              </button>
              {viewerIsAdmin && !isStaff && (
                <button
                  type="button"
                  onClick={() => setShowRoleMenu((v) => !v)}
                  disabled={pending}
                  className="rounded-lg px-3 py-2 text-xs uppercase tracking-widest font-[family-name:var(--font-oswald)] font-bold bg-[#c9a44b]/15 text-[#c9a44b] border border-[#c9a44b]/30 hover:bg-[#c9a44b]/25 transition flex items-center gap-1.5"
                  title="Promouvoir en staff"
                >
                  <Shield size={14} /> Staff
                </button>
              )}
              {viewerIsAdmin && isStaff && !player.isSelf && (
                <button
                  type="button"
                  onClick={revoke}
                  disabled={pending}
                  className="rounded-lg px-2 py-2 text-xs text-[#8b93a7] hover:bg-[#ffa42b]/10 hover:text-[#ffa42b] transition"
                  title="Retirer le statut staff"
                >
                  <ShieldOff size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={unlink}
                disabled={pending}
                className="rounded-lg px-2 py-2 text-xs text-[#8b93a7] hover:bg-[#ffa42b]/10 hover:text-[#ffa42b] transition"
                title="Délier l'email"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="rounded-lg px-2 py-2 text-xs text-[#8b93a7] hover:bg-[#ff4d5e]/10 hover:text-[#ff4d5e] transition"
            title="Supprimer le joueur (et toutes ses données)"
          >
            <UserX size={14} />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 top-full mt-2 z-20 rounded-xl border border-white/10 bg-[#0a0e1a] shadow-2xl min-w-[200px] overflow-hidden">
              <div className="px-3 py-2 border-b border-white/5 text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold">
                Promouvoir en…
              </div>
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => promote(opt.value)}
                  disabled={pending}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition flex items-center gap-2"
                >
                  <span className={`inline-block w-2 h-2 rounded-full ${ROLE_BADGE[opt.value].cls.split(" ")[0]}`} />
                  {opt.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowRoleMenu(false)}
                className="w-full text-center px-3 py-2 text-xs text-[#8b93a7] hover:bg-white/5 transition border-t border-white/5"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Feedback message */}
      {msg && (
        <div className={`mt-2 text-xs ${msg.type === "ok" ? "text-[#2bd47d]" : "text-[#ff4d5e]"}`}>
          {msg.type === "ok" ? "✓ " : "⚠️ "}{msg.text}
        </div>
      )}

      {/* Lien magique généré */}
      {link && (
        <div className="mt-3 rounded-lg bg-[#0a0e1a] border border-[#00aaff]/20 p-3">
          <div className="text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-2">
            Lien magique (valide 1h · à envoyer au joueur par WhatsApp / SMS)
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={link}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 rounded-md bg-[#131826] border border-white/10 px-3 py-2 text-[11px] font-mono"
            />
            <button
              type="button"
              onClick={copy}
              className="rounded-md px-3 py-2 text-xs uppercase tracking-widest font-[family-name:var(--font-oswald)] font-bold bg-[#c9a44b] text-[#1c1206] hover:bg-[#d8b35c] transition flex items-center gap-1.5"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
