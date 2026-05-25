"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PostSessionPayload = {
  session_type: "training" | "match";
  rpe: number;
  enjoyment: number;
  self_performance: number;
  minutes: number | null;
};

export async function submitPostSession(payload: PostSessionPayload) {
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

  const { error } = await supabase.from("post_session").insert({
    player_id: player.id,
    session_date: new Date().toISOString().slice(0, 10),
    ...payload,
  });

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/");
  return { ok: true as const };
}
