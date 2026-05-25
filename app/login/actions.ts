"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/login?error=missing_email");

  const supabase = await createClient();
  const hdrs = await headers();
  const origin =
    hdrs.get("origin") ??
    `https://${hdrs.get("host") ?? "localhost:3000"}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/login?sent=1&email=${encodeURIComponent(email)}`);
}
