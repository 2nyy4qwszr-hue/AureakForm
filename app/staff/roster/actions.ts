"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireAdmin, requireStaff, type StaffRole } from "@/lib/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAuthUserByEmail } from "@/lib/auth-users";

const STAFF_ROLES: readonly StaffRole[] = ["admin", "coach", "medical", "staff"] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSITIONS = ["GK", "DEF", "MIL", "ATT"] as const;
type Pos = (typeof POSITIONS)[number];

/** Ajoute un nouveau joueur dans la sélection du staff. */
export async function addPlayer(input: {
  first_name: string;
  last_name: string;
  position: Pos;
  jersey_number?: number | null;
  email?: string | null;
}) {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login");

  const first = input.first_name.trim();
  const last = input.last_name.trim();
  if (!first || !last) return { ok: false as const, error: "Prénom et nom requis." };
  if (!POSITIONS.includes(input.position)) {
    return { ok: false as const, error: "Poste invalide." };
  }
  const email = input.email?.trim().toLowerCase() ?? "";
  if (email && !EMAIL_RE.test(email)) {
    return { ok: false as const, error: "Email invalide." };
  }

  const admin = createAdminClient();

  // Évite les doublons par couple first+last dans la sélection
  const { data: dup } = await admin
    .from("players")
    .select("id")
    .eq("selection_id", ctx.staff.selection_id)
    .eq("first_name", first)
    .eq("last_name", last)
    .limit(1);
  if (dup && dup.length > 0) {
    return { ok: false as const, error: `${first} ${last} existe déjà dans la sélection.` };
  }

  // Si email fourni : trouve/crée le user et vérifie qu'il n'est pas déjà rattaché
  let userId: string | null = null;
  if (email) {
    const existing = await findAuthUserByEmail(admin, email);
    if (existing) {
      userId = existing.id;
    } else {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (cErr || !created.user) {
        return { ok: false as const, error: cErr?.message ?? "Création auth user échouée." };
      }
      userId = created.user.id;
    }
    const { data: conflict } = await admin
      .from("players")
      .select("id").eq("user_id", userId).limit(1);
    if (conflict && conflict.length > 0) {
      return { ok: false as const, error: "Cet email est déjà rattaché à un autre joueur." };
    }
  }

  const { data: created, error } = await admin
    .from("players")
    .insert({
      selection_id: ctx.staff.selection_id,
      first_name: first,
      last_name: last,
      position: input.position,
      jersey_number: input.jersey_number ?? null,
      user_id: userId,
    })
    .select("id")
    .single();
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/staff/roster");
  revalidatePath("/staff");
  return { ok: true as const, id: created.id };
}

/** Change la position d'un joueur (GK/DEF/MIL/ATT). */
export async function updatePlayerPosition(playerId: string, position: Pos) {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login");

  if (!POSITIONS.includes(position)) {
    return { ok: false as const, error: "Poste invalide." };
  }

  const admin = createAdminClient();
  const { data: player } = await admin
    .from("players").select("selection_id").eq("id", playerId).maybeSingle();
  if (!player || player.selection_id !== ctx.staff.selection_id) {
    return { ok: false as const, error: "Joueur hors de ta sélection." };
  }
  const { error } = await admin
    .from("players").update({ position }).eq("id", playerId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/staff/roster");
  revalidatePath("/staff");
  return { ok: true as const };
}

/** Supprime un joueur (et toutes ses données via ON DELETE CASCADE). */
export async function deletePlayer(playerId: string) {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login");
  const admin = createAdminClient();
  const { data: player } = await admin
    .from("players").select("selection_id").eq("id", playerId).maybeSingle();
  if (!player || player.selection_id !== ctx.staff.selection_id) {
    return { ok: false as const, error: "Joueur hors de ta sélection." };
  }
  const { error } = await admin.from("players").delete().eq("id", playerId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/staff/roster");
  revalidatePath("/staff");
  return { ok: true as const };
}

/** Lie un email (= compte auth) à un player existant. */
export async function setPlayerEmail(playerId: string, email: string) {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login");

  const normalized = email.trim().toLowerCase();
  if (!EMAIL_RE.test(normalized)) {
    return { ok: false as const, error: "Email invalide." };
  }

  const admin = createAdminClient();

  // Vérifier que le player appartient à la sélection du staff (sécurité)
  const { data: player } = await admin
    .from("players")
    .select("id, selection_id")
    .eq("id", playerId)
    .maybeSingle();
  if (!player || player.selection_id !== ctx.staff.selection_id) {
    return { ok: false as const, error: "Joueur hors de ta sélection." };
  }

  // Trouve ou crée l'auth user
  let userId: string;
  const existing = await findAuthUserByEmail(admin, normalized);
  if (existing) {
    userId = existing.id;
  } else {
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: normalized,
      email_confirm: true,
    });
    if (cErr || !created.user) {
      return { ok: false as const, error: cErr?.message ?? "Création auth user échouée." };
    }
    userId = created.user.id;
  }

  // Empêche d'attribuer un user déjà rattaché à un autre player
  const { data: conflict } = await admin
    .from("players")
    .select("id")
    .eq("user_id", userId)
    .neq("id", playerId)
    .limit(1);
  if (conflict && conflict.length > 0) {
    return { ok: false as const, error: "Cet email est déjà rattaché à un autre joueur." };
  }

  const { error: uErr } = await admin
    .from("players")
    .update({ user_id: userId })
    .eq("id", playerId);
  if (uErr) return { ok: false as const, error: uErr.message };

  revalidatePath("/staff/roster");
  return { ok: true as const, email: normalized };
}

/** Délie un email d'un player (sans supprimer le compte auth). */
export async function unlinkPlayerEmail(playerId: string) {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login");
  const admin = createAdminClient();
  const { data: player } = await admin
    .from("players").select("selection_id").eq("id", playerId).maybeSingle();
  if (!player || player.selection_id !== ctx.staff.selection_id) {
    return { ok: false as const, error: "Joueur hors de ta sélection." };
  }
  const { error } = await admin
    .from("players").update({ user_id: null }).eq("id", playerId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/staff/roster");
  return { ok: true as const };
}

/** Génère un magic link pour un player (à partager via WhatsApp/SMS/mail). */
export async function generateMagicLinkForPlayer(playerId: string) {
  const ctx = await requireStaff();
  if (!ctx) redirect("/login");

  const admin = createAdminClient();
  const { data: player } = await admin
    .from("players")
    .select("id, user_id, selection_id, first_name, last_name")
    .eq("id", playerId)
    .maybeSingle();
  if (!player || player.selection_id !== ctx.staff.selection_id) {
    return { ok: false as const, error: "Joueur hors de ta sélection." };
  }
  if (!player.user_id) {
    return { ok: false as const, error: "Ce joueur n'a pas encore d'email rattaché." };
  }

  // Récupère l'email du user
  const { data: { user: authUser }, error: uErr } = await admin.auth.admin.getUserById(player.user_id);
  if (uErr || !authUser?.email) {
    return { ok: false as const, error: "Impossible de retrouver l'email du joueur." };
  }

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: authUser.email,
  });
  if (error || !data?.properties?.hashed_token) {
    return { ok: false as const, error: error?.message ?? "Génération échouée." };
  }

  // On construit une URL qui passe direct par notre /auth/callback (token_hash)
  // — court-circuite le verify Supabase qui poserait des problèmes de fragment.
  const url = `${origin}/auth/callback?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=magiclink&next=/`;

  return { ok: true as const, url, email: authUser.email };
}

/** Promeut un user en staff (admin uniquement). Le user cible doit déjà avoir un compte. */
export async function promoteToStaff(input: { playerId: string; role: StaffRole; displayName?: string | null }) {
  const ctx = await requireAdmin();
  if (!ctx) return { ok: false as const, error: "Réservé aux admins." };

  if (!STAFF_ROLES.includes(input.role)) {
    return { ok: false as const, error: "Rôle invalide." };
  }

  const admin = createAdminClient();

  // Le player ciblé doit être dans la sélection de l'admin et avoir un compte lié
  const { data: player } = await admin
    .from("players")
    .select("id, selection_id, user_id, first_name, last_name")
    .eq("id", input.playerId)
    .maybeSingle();
  if (!player || player.selection_id !== ctx.staff.selection_id) {
    return { ok: false as const, error: "Joueur hors de ta sélection." };
  }
  if (!player.user_id) {
    return { ok: false as const, error: "Ce joueur n'a pas encore d'email rattaché." };
  }

  const displayName =
    input.displayName?.trim() || `${player.first_name} ${player.last_name}`.trim();

  const { error } = await admin
    .from("staff")
    .upsert(
      {
        user_id: player.user_id,
        selection_id: ctx.staff.selection_id,
        role: input.role,
        display_name: displayName,
      },
      { onConflict: "user_id" }
    );
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/staff/roster");
  return { ok: true as const };
}

/** Retire le statut staff d'un user (admin uniquement). Empêche un admin de se révoquer lui-même. */
export async function revokeStaff(playerId: string) {
  const ctx = await requireAdmin();
  if (!ctx) return { ok: false as const, error: "Réservé aux admins." };

  const admin = createAdminClient();
  const { data: player } = await admin
    .from("players")
    .select("selection_id, user_id")
    .eq("id", playerId)
    .maybeSingle();
  if (!player || player.selection_id !== ctx.staff.selection_id) {
    return { ok: false as const, error: "Joueur hors de ta sélection." };
  }
  if (!player.user_id) {
    return { ok: false as const, error: "Aucun compte lié." };
  }
  if (player.user_id === ctx.user.id) {
    return { ok: false as const, error: "Tu ne peux pas te révoquer toi-même." };
  }

  const { error } = await admin
    .from("staff")
    .delete()
    .eq("user_id", player.user_id)
    .eq("selection_id", ctx.staff.selection_id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/staff/roster");
  return { ok: true as const };
}
