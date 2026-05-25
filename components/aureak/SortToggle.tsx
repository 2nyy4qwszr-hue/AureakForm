import Link from "next/link";
import { AlertTriangle, Shield } from "lucide-react";

type Props = {
  current: "alert" | "position";
  baseHref: string;
  preserve?: Record<string, string | undefined>;
};

export function SortToggle({ current, baseHref, preserve = {} }: Props) {
  const make = (sort: "alert" | "position") => {
    const params = new URLSearchParams();
    Object.entries(preserve).forEach(([k, v]) => { if (v) params.set(k, v); });
    if (sort !== "alert") params.set("sort", sort);
    const qs = params.toString();
    return `${baseHref}${qs ? `?${qs}` : ""}`;
  };
  return (
    <div className="inline-flex rounded-xl bg-[#131826] border border-white/5 p-1">
      <Link
        href={make("alert")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest transition ${
          current === "alert"
            ? "bg-[#ff4d5e]/15 text-[#ff4d5e]"
            : "text-[#8b93a7] hover:text-white"
        }`}
      >
        <AlertTriangle size={14} /> Alertes
      </Link>
      <Link
        href={make("position")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest transition ${
          current === "position"
            ? "bg-[#c9a44b]/15 text-[#c9a44b]"
            : "text-[#8b93a7] hover:text-white"
        }`}
      >
        <Shield size={14} /> Par poste
      </Link>
    </div>
  );
}
