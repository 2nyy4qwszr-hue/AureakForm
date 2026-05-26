"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { createCamp } from "./actions";

const todayIso = () => new Date().toISOString().slice(0, 10);
const isoPlus = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export function CreateCampForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [start, setStart] = useState(todayIso());
  const [end, setEnd] = useState(isoPlus(10));
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const res = await createCamp({ name, start_date: start, end_date: end });
      if (res.ok) {
        setName("");
        setStart(todayIso());
        setEnd(isoPlus(10));
        router.push(`/staff/camps/${res.id}`);
      } else {
        setErr(res.error);
      }
    });
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/5 bg-[#131826] p-4 flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-1">
          Nom du camp
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Stage CAN 2027 Maroc"
          required
          className="w-full rounded-lg bg-[#0a0e1a] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-[#c9a44b]"
        />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-1">
          Du
        </label>
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          required
          className="rounded-lg bg-[#0a0e1a] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-[#c9a44b]"
        />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-1">
          Au
        </label>
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
        disabled={pending || !name.trim()}
        className="rounded-lg px-4 py-2 text-xs uppercase tracking-widest font-[family-name:var(--font-oswald)] font-bold bg-[#c9a44b] text-[#1c1206] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#d8b35c] transition flex items-center gap-1.5"
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        Créer le camp
      </button>

      {err && (
        <div className="w-full text-xs text-[#ff4d5e]">⚠️ {err}</div>
      )}
    </form>
  );
}
