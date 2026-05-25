import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";

type Props = {
  /** vue courante */
  current: "grid" | "list";
  /** route de base — on garde les autres search params éventuels */
  baseHref: string;
};

/**
 * Toggle visuel grille/liste pour le dashboard staff.
 * État persistant via search param `view` (server-side, linkable).
 */
export function ViewToggle({ current, baseHref }: Props) {
  return (
    <div className="inline-flex rounded-xl bg-[#131826] border border-white/5 p-1">
      <Link
        href={baseHref}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest transition ${
          current === "grid"
            ? "bg-[#c9a44b]/15 text-[#c9a44b]"
            : "text-[#8b93a7] hover:text-white"
        }`}
        aria-current={current === "grid" ? "page" : undefined}
      >
        <LayoutGrid size={14} /> Cartes
      </Link>
      <Link
        href={`${baseHref}?view=list`}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-[family-name:var(--font-oswald)] font-bold uppercase tracking-widest transition ${
          current === "list"
            ? "bg-[#c9a44b]/15 text-[#c9a44b]"
            : "text-[#8b93a7] hover:text-white"
        }`}
        aria-current={current === "list" ? "page" : undefined}
      >
        <List size={14} /> Liste
      </Link>
    </div>
  );
}
