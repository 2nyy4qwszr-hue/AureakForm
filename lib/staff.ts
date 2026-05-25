import { createClient } from "@/lib/supabase/server";

/**
 * Vérifie si l'utilisateur courant est staff (côté serveur).
 * Renvoie { user, staff } ou null si pas staff.
 */
export async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: staff } = await supabase
    .from("staff")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!staff) return null;
  return { user, staff, supabase };
}
