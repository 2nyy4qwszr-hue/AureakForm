import Link from "next/link";
import { Sunrise, Dumbbell } from "lucide-react";

type Props = {
  current: "morning" | "session";
  baseHref: string;
  /** other search params to preserve */
  preserve?: Record<string, string | undefined>;
};

export function FilterTabs({ current, baseHref, preserve = {} }: Props) {
  const make = (filter: "morning" | "session") => {
    const params = new URLSearchParams();
    Object.entries(preserve).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    if (filter !== "morning") params.set("filter", filter);
    const qs = params.toString();
    return `${baseHref}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="inline-flex rounded-xl bg-[#131826] border border-white/5 p-1">
      <Link
        href={make("morning")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest transition ${
          current === "morning"
            ? "bg-[#c9a44b]/15 text-[#c9a44b]"
            : "text-[#8b93a7] hover:text-white"
        }`}
      >
        <Sunrise size={14} /> Matin
      </Link>
      <Link
        href={make("session")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest transition ${
          current === "session"
            ? "bg-[#00aaff]/15 text-[#00aaff]"
            : "text-[#8b93a7] hover:text-white"
        }`}
      >
        <Dumbbell size={14} /> Après-séance
      </Link>
    </div>
  );
}
