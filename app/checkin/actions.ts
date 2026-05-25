"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { readinessOvr, regularity7d } from "@/lib/readiness";

export type CheckinPayload = {
  sleep_hours: number;
  sleep_quality: number;
  fatigue: number;
  muscle_soreness: number;
  stress: number;
  mood: number;
  appetite: number;
  /** Échelle Armstrong 1..8 (1 = transparent / bien hydraté, 8 = ambre foncé / déshydraté). */
  urine_color: number;
};

export async function submitCheckin(payload: CheckinPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Find player row
  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!player) redirect("/onboarding");

  // Compute regularity from last 7 days of check-ins
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const { data: recent } = await supabase
    .from("daily_checkins")
    .select("date")
    .eq("player_id", player.id)
    .gte("date", sevenDaysAgo.toISOString().slice(0, 10));

  const regularity = regularity7d(
    (recent ?? []).map((r) => r.date as string)
  );

  const readiness = readinessOvr(payload, regularity);

  const dateStr = today.toISOString().slice(0, 10);

  // Upsert today's check-in
  const { error } = await supabase
    .from("daily_checkins")
    .upsert(
      {
        player_id: player.id,
        date: dateStr,
        ...payload,
        readiness_score: readiness,
      },
      { onConflict: "player_id,date" }
    );

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/me");
  return { ok: true as const, readiness };
}
