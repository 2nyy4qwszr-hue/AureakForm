import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Users, AlertTriangle, FileDown, UserPlus, Send, CalendarRange } from "lucide-react";
import { requireStaff } from "@/lib/staff";
import { listCamps, ACTIVE_CAMP_COOKIE } from "@/lib/camp";
import { CampSwitcher } from "@/components/aureak/CampSwitcher";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login?error=not_staff");

  const camps = await listCamps(ctx.staff.selection_id);
  const store = await cookies();
  const activeCampId = store.get(ACTIVE_CAMP_COOKIE)?.value ?? null;
  // Si le cookie pointe vers un camp supprimé/hors-sélection, on l'ignore côté UI
  const validActiveId = camps.find((c) => c.id === activeCampId) ? activeCampId : null;

  return (
    <div className="flex-1 flex flex-col min-h-[100dvh]">
      <header className="border-b border-white/5 bg-[#0a0e1a]/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-5 py-3 flex items-center justify-between">
          <Link href="/staff" className="font-[family-name:var(--font-bebas)] text-2xl tracking-[2px]">
            AUREAK<span className="text-[#c9a44b]">FORM</span>
            <span className="ml-2 text-[10px] uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] align-middle">
              Staff
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-xs">
            <Link href="/staff" className="px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-1.5 font-[family-name:var(--font-oswald)] uppercase tracking-widest">
              <Users size={14} /> Squad
            </Link>
            <Link href="/staff/dispatch" className="px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-1.5 font-[family-name:var(--font-oswald)] uppercase tracking-widest">
              <Send size={14} /> Demandes
            </Link>
            <Link href="/staff/alerts" className="px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-1.5 font-[family-name:var(--font-oswald)] uppercase tracking-widest">
              <AlertTriangle size={14} /> Alertes
            </Link>
            <Link href="/staff/camps" className="px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-1.5 font-[family-name:var(--font-oswald)] uppercase tracking-widest">
              <CalendarRange size={14} /> Camps
            </Link>
            <Link href="/staff/roster" className="px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-1.5 font-[family-name:var(--font-oswald)] uppercase tracking-widest">
              <UserPlus size={14} /> Roster
            </Link>
            <Link href="/staff/export" className="px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-1.5 font-[family-name:var(--font-oswald)] uppercase tracking-widest">
              <FileDown size={14} /> Export
            </Link>
            <div className="ml-2 pl-2 border-l border-white/10">
              <CampSwitcher camps={camps} activeCampId={validActiveId} />
            </div>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
