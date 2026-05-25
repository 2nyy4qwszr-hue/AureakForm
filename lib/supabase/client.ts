import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components & browser-side code.
 * Reads anon (publishable) key from NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
