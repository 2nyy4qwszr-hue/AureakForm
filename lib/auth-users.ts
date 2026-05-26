import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Helpers paginés pour `admin.auth.admin.listUsers()`.
 *
 * Pourquoi : l'API Supabase retourne 50 users/page par défaut et 1000 max.
 * Avec une équipe de 25 joueurs ça passe, mais si l'app grossit (ou si des
 * comptes test/abandonnés s'accumulent) on doit paginer pour ne pas rater
 * un user. Plutôt que de fragiliser chaque call site, on centralise ici.
 */

const PER_PAGE = 1000;
const MAX_PAGES = 100; // safety net : 100 000 users

/** Récupère tous les auth users en suivant la pagination. */
export async function listAllAuthUsers(admin: SupabaseClient): Promise<User[]> {
  const all: User[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: PER_PAGE,
    });
    if (error) throw error;
    all.push(...data.users);
    if (data.users.length < PER_PAGE) break;
  }
  return all;
}

/**
 * Trouve un auth user par email (case-insensitive).
 * Paginé pour ne pas rater un compte au-delà des 50 premiers.
 * Renvoie null si non trouvé.
 */
export async function findAuthUserByEmail(
  admin: SupabaseClient,
  email: string
): Promise<User | null> {
  const normalized = email.trim().toLowerCase();
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: PER_PAGE,
    });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (hit) return hit;
    if (data.users.length < PER_PAGE) return null;
  }
  return null;
}
