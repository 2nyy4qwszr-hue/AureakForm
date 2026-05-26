"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

const SORT_OPTIONS = [
  { value: "position", label: "Poste" },
  { value: "name", label: "Nom" },
  { value: "email", label: "Email" },
  { value: "staff", label: "Staff" },
] as const;

export function RosterSort({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "position") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(`/staff/roster?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown size={14} className="text-[#8b93a7]" />
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#131826] border border-white/10 rounded-lg px-3 py-2 text-xs uppercase tracking-widest font-[family-name:var(--font-oswald)] font-bold text-[#cfd6e6] hover:border-[#c9a44b]/40 focus:outline-none focus:border-[#c9a44b] cursor-pointer"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#0a0e1a]">
            Tri : {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
