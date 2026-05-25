"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/staff";
import { createAdminClient } from "@/lib/supabase/admin";

type MorningInput = {
  kind: "morning_checkin";
  message?: string;
};

type PostSessionInput = {
  kind: "post_session";
  session_type: "training" | "match";
  opponent?: string;
  minutes?: number | null;
  message?: string;
};

export async function dispatchRequest(input: MorningInput | PostSessionInput) {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login");
  const admin = createAdminClient();

  let title: string;
  let context: Record<string, unknown> | null = null;

  if (input.kind === "morning_checkin") {
    title = "Check-in du matin";
  } else {
    const isMatch = input.session_type === "match";
    title = isMatch
      ? `Post-match${input.opponent ? ` vs ${input.opponent}` : ""}`
      : "Post-séance";
    context = {
      session_type: input.session_type,
      opponent: input.opponent || null,
      minutes: input.minutes ?? null,
    };
  }

  const { data, error } = await admin
    .from("requests")
    .insert({
      selection_id: ctx.staff.selection_id,
      kind: input.kind,
      title,
      message: input.message?.trim() || null,
      context,
      created_by: ctx.user.id,
      active: true,
    })
    .select("id")
    .single();

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/staff/dispatch");
  revalidatePath("/");
  return { ok: true as const, id: data.id };
}

/** Désactive une demande (les joueurs ne la voient plus). */
export async function closeRequest(requestId: string) {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login");
  const admin = createAdminClient();

  const { data: req } = await admin
    .from("requests")
    .select("selection_id")
    .eq("id", requestId)
    .maybeSingle();
  if (!req || req.selection_id !== ctx.staff.selection_id) {
    return { ok: false as const, error: "Demande hors de ta sélection." };
  }

  const { error } = await admin
    .from("requests")
    .update({ active: false })
    .eq("id", requestId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/staff/dispatch");
  revalidatePath("/");
  return { ok: true as const };
}

/** Supprime définitivement une demande (rare — préférer closeRequest). */
export async function deleteRequest(requestId: string) {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login");
  const admin = createAdminClient();
  const { data: req } = await admin
    .from("requests").select("selection_id").eq("id", requestId).maybeSingle();
  if (!req || req.selection_id !== ctx.staff.selection_id) {
    return { ok: false as const, error: "Demande hors de ta sélection." };
  }
  const { error } = await admin.from("requests").delete().eq("id", requestId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/staff/dispatch");
  return { ok: true as const };
}
