"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPlayer } from "./actions";

const POSITIONS: { value: "GK" | "DEF" | "MIL" | "ATT"; label: string }[] = [
  { value: "GK",  label: "Gardien" },
  { value: "DEF", label: "Défense" },
  { value: "MIL", label: "Milieu" },
  { value: "ATT", label: "Attaque" },
];

export function OnboardingForm({
  selections,
}: {
  selections: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState<"GK" | "DEF" | "MIL" | "ATT">("MIL");
  const [selectionId, setSelectionId] = useState(selections[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!firstName || !lastName || !selectionId) {
      setError("Tous les champs sont requis.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await createPlayer({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        position,
        selection_id: selectionId,
      });
      if (!res.ok) {
        setError(res.error);
      } else {
        router.push("/");
        router.refresh();
      }
    });
  };

  return (
    <div className="mt-6 space-y-5">
      <label className="block">
        <span className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold">
          Prénom
        </span>
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Jeremy"
          className="mt-2 w-full rounded-xl bg-[#131826] border border-white/10 px-4 py-3.5 text-[16px] focus:outline-none focus:border-[#c9a44b]"
        />
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold">
          Nom
        </span>
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Devriendt"
          className="mt-2 w-full rounded-xl bg-[#131826] border border-white/10 px-4 py-3.5 text-[16px] focus:outline-none focus:border-[#c9a44b]"
        />
      </label>

      <div>
        <div className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-2">
          Poste
        </div>
        <div className="grid grid-cols-4 gap-2">
          {POSITIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPosition(p.value)}
              className={`rounded-xl py-3 text-xs font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest border-2 transition ${
                position === p.value
                  ? "border-[#c9a44b] bg-[#c9a44b]/15 text-white"
                  : "border-white/10 bg-[#131826] text-[#8b93a7]"
              }`}
            >
              {p.value}
            </button>
          ))}
        </div>
      </div>

      {selections.length === 0 ? (
        <p className="text-xs text-[#ffa42b]">
          ⚠️ Aucune sélection n&apos;existe encore en BDD. Le seed Burundi va être
          inséré la 1ère fois qu&apos;un staff/admin se connecte. Pour l&apos;instant,
          on peut quand même créer ta carte (selection_id sera null).
        </p>
      ) : (
        <div>
          <div className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-2">
            Sélection
          </div>
          <div className="space-y-2">
            {selections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectionId(s.id)}
                className={`w-full text-left rounded-xl px-4 py-3 border-2 transition ${
                  selectionId === s.id
                    ? "border-[#c9a44b] bg-[#c9a44b]/15"
                    : "border-white/10 bg-[#131826]"
                }`}
              >
                <span className="text-sm">{s.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-[#ff4d5e]">⚠️ {error}</p>}

      <button
        onClick={submit}
        disabled={pending}
        className="w-full rounded-xl py-4 font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-sm bg-gradient-to-br from-[#f6e3a1] via-[#c9a44b] to-[#806224] text-[#1c1206] shadow-lg active:scale-[.98] transition disabled:opacity-60"
      >
        {pending ? "Création..." : "Créer ma carte joueur →"}
      </button>
    </div>
  );
}
