import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const ACTIVE_CAMP_COOKIE = "aureak_camp_id";

export type CampRow = {
  id: string;
  selection_id: string;
  name: string;
  start_date: string; // ISO date
  end_date: string;   // ISO date
  created_by: string | null;
  created_at: string;
};

export type CampScope = {
  camp: CampRow;
  /** Liste des player_id convoqués sur ce camp. Si vide, aucun joueur visible. */
  playerIds: string[];
  /** Fenêtre temporelle [start, end] au format YYYY-MM-DD. */
  dateRange: { start: string; end: string };
};

/**
 * Lit le cookie `aureak_camp_id` et retourne le scope du camp actif, ou null
 * si aucun camp n'est sélectionné (ou cookie invalide / camp supprimé).
 *
 * Vérifie aussi que le camp appartient bien à la sélection du staff courant —
 * sinon on retourne null (cookie obsolète après changement de sélection).
 */
export async function getActiveCamp(selection_id: string): Promise<CampScope | null> {
  const store = await cookies();
  const id = store.get(ACTIVE_CAMP_COOKIE)?.value;
  if (!id) return null;

  const supabase = await createClient();
  const { data: camp } = await supabase
    .from("camps")
    .select("*")
    .eq("id", id)
    .eq("selection_id", selection_id)
    .maybeSingle<CampRow>();
  if (!camp) return null;

  const { data: rows } = await supabase
    .from("camp_players")
    .select("player_id")
    .eq("camp_id", camp.id);
  const playerIds = (rows ?? []).map((r) => r.player_id as string);

  return {
    camp,
    playerIds,
    dateRange: { start: camp.start_date, end: camp.end_date },
  };
}

/**
 * Liste tous les camps d'une sélection (pour le dropdown header & la page /staff/camps).
 * Triés du plus récent au plus ancien.
 */
export async function listCamps(selection_id: string): Promise<CampRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("camps")
    .select("*")
    .eq("selection_id", selection_id)
    .order("start_date", { ascending: false });
  return (data ?? []) as CampRow[];
}
