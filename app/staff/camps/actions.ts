"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireStaff } from "@/lib/staff";
import { ACTIVE_CAMP_COOKIE } from "@/lib/camp";
import { createAdminClient } from "@/lib/supabase/admin";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Persiste le camp actif dans un cookie (ou efface si null). */
export async function setActiveCamp(campId: string | null) {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login?error=not_staff");

  const store = await cookies();
  if (campId === null) {
    store.delete(ACTIVE_CAMP_COOKIE);
  } else {
    // Valide que le camp existe et appartient à la sélection du staff
    const admin = createAdminClient();
    const { data: camp } = await admin
      .from("camps")
      .select("id")
      .eq("id", campId)
      .eq("selection_id", ctx.staff.selection_id)
      .maybeSingle();
    if (!camp) return { ok: false as const, error: "Camp introuvable." };
    store.set(ACTIVE_CAMP_COOKIE, campId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 an
    });
  }

  // Revalide toutes les vues staff qui filtrent par camp
  revalidatePath("/staff", "layout");
  return { ok: true as const };
}

/** Crée un nouveau camp. */
export async function createCamp(input: { name: string; start_date: string; end_date: string }) {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login?error=not_staff");

  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "Nom requis." };
  if (!ISO_DATE_RE.test(input.start_date) || !ISO_DATE_RE.test(input.end_date)) {
    return { ok: false as const, error: "Dates invalides (format YYYY-MM-DD)." };
  }
  if (input.end_date < input.start_date) {
    return { ok: false as const, error: "Date de fin antérieure à la date de début." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("camps")
    .insert({
      selection_id: ctx.staff.selection_id,
      name,
      start_date: input.start_date,
      end_date: input.end_date,
      created_by: ctx.user.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/staff/camps");
  revalidatePath("/staff", "layout");
  return { ok: true as const, id: data.id };
}

/** Met à jour un camp existant (name + dates). */
export async function updateCamp(input: {
  id: string;
  name?: string;
  start_date?: string;
  end_date?: string;
}) {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login?error=not_staff");

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("camps").select("selection_id, start_date, end_date").eq("id", input.id).maybeSingle();
  if (!existing || existing.selection_id !== ctx.staff.selection_id) {
    return { ok: false as const, error: "Camp hors de ta sélection." };
  }

  const patch: Record<string, string> = {};
  if (input.name !== undefined) {
    const n = input.name.trim();
    if (!n) return { ok: false as const, error: "Nom requis." };
    patch.name = n;
  }
  if (input.start_date !== undefined) {
    if (!ISO_DATE_RE.test(input.start_date)) return { ok: false as const, error: "Date début invalide." };
    patch.start_date = input.start_date;
  }
  if (input.end_date !== undefined) {
    if (!ISO_DATE_RE.test(input.end_date)) return { ok: false as const, error: "Date fin invalide." };
    patch.end_date = input.end_date;
  }
  const finalStart = patch.start_date ?? existing.start_date;
  const finalEnd = patch.end_date ?? existing.end_date;
  if (finalEnd < finalStart) {
    return { ok: false as const, error: "Date de fin antérieure à la date de début." };
  }

  const { error } = await admin.from("camps").update(patch).eq("id", input.id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/staff/camps");
  revalidatePath(`/staff/camps/${input.id}`);
  revalidatePath("/staff", "layout");
  return { ok: true as const };
}

/** Supprime un camp (cascade sur camp_players). */
export async function deleteCamp(id: string) {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login?error=not_staff");

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("camps").select("selection_id").eq("id", id).maybeSingle();
  if (!existing || existing.selection_id !== ctx.staff.selection_id) {
    return { ok: false as const, error: "Camp hors de ta sélection." };
  }

  const { error } = await admin.from("camps").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  // Si c'était le camp actif, on l'efface du cookie
  const store = await cookies();
  if (store.get(ACTIVE_CAMP_COOKIE)?.value === id) {
    store.delete(ACTIVE_CAMP_COOKIE);
  }

  revalidatePath("/staff/camps");
  revalidatePath("/staff", "layout");
  return { ok: true as const };
}

/** Toggle un joueur dans la liste des convoqués d'un camp. */
export async function toggleCampPlayer(input: { camp_id: string; player_id: string; checked: boolean }) {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login?error=not_staff");

  const admin = createAdminClient();
  const { data: camp } = await admin
    .from("camps").select("selection_id").eq("id", input.camp_id).maybeSingle();
  if (!camp || camp.selection_id !== ctx.staff.selection_id) {
    return { ok: false as const, error: "Camp hors de ta sélection." };
  }

  if (input.checked) {
    const { error } = await admin
      .from("camp_players")
      .upsert(
        { camp_id: input.camp_id, player_id: input.player_id },
        { onConflict: "camp_id,player_id" }
      );
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await admin
      .from("camp_players")
      .delete()
      .eq("camp_id", input.camp_id)
      .eq("player_id", input.player_id);
    if (error) return { ok: false as const, error: error.message };
  }

  revalidatePath(`/staff/camps/${input.camp_id}`);
  revalidatePath("/staff", "layout");
  return { ok: true as const };
}
