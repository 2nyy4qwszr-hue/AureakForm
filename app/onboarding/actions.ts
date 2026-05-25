"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createPlayer(input: {
  first_name: string;
  last_name: string;
  position: "GK" | "DEF" | "MIL" | "ATT";
  selection_id: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Si une carte existe déjà pour ce user → on la met à jour au lieu de créer un doublon.
  const { data: existing } = await supabase
    .from("players")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (existing && existing.length > 0) {
    const { error } = await supabase
      .from("players")
      .update({
        first_name: input.first_name,
        last_name: input.last_name,
        position: input.position,
        selection_id: input.selection_id || null,
      })
      .eq("user_id", user.id);
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await supabase.from("players").insert({
      user_id: user.id,
      first_name: input.first_name,
      last_name: input.last_name,
      position: input.position,
      selection_id: input.selection_id || null,
    });
    if (error) return { ok: false as const, error: error.message };
  }

  revalidatePath("/");
  return { ok: true as const };
}
