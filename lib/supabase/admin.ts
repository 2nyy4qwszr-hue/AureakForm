import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase service_role pour les opérations admin (création auth users,
 * bypass RLS pour seed/relink). À n'importer QUE depuis du code serveur.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
