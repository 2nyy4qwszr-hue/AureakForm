import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireStaff } from "@/lib/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CampRow } from "@/lib/camp";
import type { PlayerRow, Position } from "@/lib/types";
import { CampEditor } from "./CampEditor";

export const dynamic = "force-dynamic";

const POSITION_ORDER: readonly Position[] = ["GK", "DEF", "MIL", "ATT"] as const;
const POSITION_LABEL: Record<string, string> = {
  GK:   "Gardiens",
  DEF:  "Défenseurs",
  MIL:  "Milieux",
  ATT:  "Attaquants",
  NONE: "Sans poste",
};

export default async function CampDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login?error=not_staff");

  const { id } = await params;
  const admin = createAdminClient();

  const { data: camp } = await admin
    .from("camps").select("*").eq("id", id).maybeSingle<CampRow>();
  if (!camp || camp.selection_id !== ctx.staff.selection_id) notFound();

  const [{ data: players }, { data: cpRows }] = await Promise.all([
    admin.from("players")
      .select("id, first_name, last_name, position, photo_url")
      .eq("selection_id", ctx.staff.selection_id)
      .order("last_name"),
    admin.from("camp_players").select("player_id").eq("camp_id", camp.id),
  ]);

  const list = (players ?? []) as Pick<PlayerRow, "id" | "first_name" | "last_name" | "position" | "photo_url">[];
  const selectedIds = new Set((cpRows ?? []).map((r) => r.player_id as string));

  const groupsByPos: { pos: string; players: typeof list }[] = POSITION_ORDER.map((pos) => ({
    pos: pos as string,
    players: list.filter((p) => p.position === pos),
  }));
  // Joueurs sans position (typiquement ceux créés depuis les PNG sans roster officiel)
  const noPosition = list.filter((p) => !p.position);
  if (noPosition.length > 0) {
    groupsByPos.push({ pos: "NONE", players: noPosition });
  }

  return (
    <main className="max-w-[1100px] mx-auto px-5 py-8">
      <Link href="/staff/camps" className="text-xs text-[#8b93a7] hover:text-white inline-flex items-center gap-1">
        <ChevronLeft size={14} /> retour camps
      </Link>

      <CampEditor
        camp={camp}
        groups={groupsByPos.map((g) => ({
          pos: g.pos,
          label: POSITION_LABEL[g.pos],
          players: g.players.map((p) => ({
            id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
            photo_url: p.photo_url,
            selected: selectedIds.has(p.id),
          })),
        }))}
      />
    </main>
  );
}
