"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type InjuryPayload = {
  body_part: string;
  body_side: "left" | "right" | "center";
  body_view: "front" | "back";
  type: "contracture" | "douleur" | "coup" | "autre";
  intensity: number;
  comment: string;
};

export async function declareInjury(payload: InjuryPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!player) redirect("/onboarding");

  const { error } = await supabase.from("injuries").insert({
    player_id: player.id,
    ...payload,
    comment: payload.comment.trim() || null,
  });

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/");
  revalidatePath("/me");
  return { ok: true as const };
}
