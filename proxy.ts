import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Rafraîchit la session Supabase à chaque requête et propage les cookies.
 * Pattern officiel @supabase/ssr adapté à Next 16 (proxy remplace middleware).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Touche la session pour la rafraîchir si possible (no-op si pas connecté).
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Tout sauf : _next/static, _next/image, favicon, manifest, icônes.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg).*)",
  ],
};
