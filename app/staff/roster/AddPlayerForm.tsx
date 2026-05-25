"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserPlus, X } from "lucide-react";
import { addPlayer } from "./actions";

const POSITIONS = [
  { v: "GK",  label: "Gardien" },
  { v: "DEF", label: "Défense" },
  { v: "MIL", label: "Milieu" },
  { v: "ATT", label: "Attaque" },
] as const;

export function AddPlayerForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [position, setPosition] = useState<"GK" | "DEF" | "MIL" | "ATT">("MIL");
  const [jersey, setJersey] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => {
    setFirst(""); setLast(""); setPosition("MIL"); setJersey(""); setEmail("");
    setError(null);
  };

  const submit = (closeAfter: boolean) => {
    setError(null); setSuccess(null);
    startTransition(async () => {
      const res = await addPlayer({
        first_name: first,
        last_name: last,
        position,
        jersey_number: jersey ? Number(jersey) : null,
        email: email || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(`✓ ${first} ${last} ajouté.`);
      reset();
      router.refresh();
      if (closeAfter) {
        setOpen(false);
        setSuccess(null);
      } else {
        // Garde le formulaire ouvert pour ajout en chaîne
        setTimeout(() => setSuccess(null), 2000);
      }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl px-4 py-3 bg-gradient-to-br from-[#f6e3a1] via-[#c9a44b] to-[#806224] text-[#1c1206] font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-xs flex items-center gap-2 hover:scale-[1.02] transition shadow-lg"
      >
        <UserPlus size={16} /> Ajouter un joueur
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-[#c9a44b]/30 bg-[#131826] p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest text-sm text-[#c9a44b] flex items-center gap-2">
          <UserPlus size={16} /> Nouveau joueur
        </h2>
        <button
          onClick={() => { setOpen(false); reset(); setSuccess(null); }}
          className="text-[#8b93a7] hover:text-white p-1"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Prénom" required>
          <input
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            autoFocus
            placeholder="Jonathan"
            className="w-full rounded-lg bg-[#0a0e1a] border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a44b]"
          />
        </Field>
        <Field label="Nom" required>
          <input
            value={last}
            onChange={(e) => setLast(e.target.value)}
            placeholder="Nahimana"
            className="w-full rounded-lg bg-[#0a0e1a] border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a44b]"
          />
        </Field>
        <Field label="Poste" required>
          <div className="grid grid-cols-4 gap-2">
            {POSITIONS.map((p) => (
              <button
                key={p.v}
                type="button"
                onClick={() => setPosition(p.v)}
                className={`rounded-lg py-2 text-xs font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest border-2 transition ${
                  position === p.v
                    ? "border-[#c9a44b] bg-[#c9a44b]/15 text-white"
                    : "border-white/10 bg-[#0a0e1a] text-[#8b93a7] hover:border-white/30"
                }`}
                title={p.label}
              >
                {p.v}
              </button>
            ))}
          </div>
        </Field>
        <Field label="N° maillot (opt.)">
          <input
            type="number"
            inputMode="numeric"
            value={jersey}
            onChange={(e) => setJersey(e.target.value)}
            placeholder="10"
            min={1}
            max={99}
            className="w-full rounded-lg bg-[#0a0e1a] border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a44b]"
          />
        </Field>
        <Field label="Email du joueur (opt.)" className="md:col-span-2">
          <input
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="prenom.nom@example.com — laisser vide pour ajouter plus tard"
            className="w-full rounded-lg bg-[#0a0e1a] border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a44b]"
          />
        </Field>
      </div>

      {error && <p className="text-xs text-[#ff4d5e] mt-3">⚠️ {error}</p>}
      {success && <p className="text-xs text-[#2bd47d] mt-3">{success}</p>}

      <div className="flex gap-2 mt-5">
        <button
          onClick={() => submit(true)}
          disabled={pending || !first.trim() || !last.trim()}
          className="rounded-lg px-4 py-2.5 bg-gradient-to-br from-[#f6e3a1] via-[#c9a44b] to-[#806224] text-[#1c1206] font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={14} /> {pending ? "Ajout..." : "Ajouter"}
        </button>
        <button
          onClick={() => submit(false)}
          disabled={pending || !first.trim() || !last.trim()}
          className="rounded-lg px-4 py-2.5 bg-[#1a2030] text-[#cfd6e6] border border-white/10 font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-xs disabled:opacity-40"
          title="Ajoute et garde le formulaire ouvert pour le suivant"
        >
          + et continuer
        </button>
        <button
          onClick={() => { setOpen(false); reset(); setSuccess(null); }}
          className="rounded-lg px-4 py-2.5 text-[#8b93a7] hover:text-white font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-xs"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

function Field({
  label, children, required, className,
}: {
  label: string; children: React.ReactNode; required?: boolean; className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold">
        {label} {required && <span className="text-[#c9a44b]">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
