import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";

export const metadata = { title: "Bienvenue · AureakForm" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // If player row already exists, send them home
  const { data: existing } = await supabase
    .from("players")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) redirect("/");

  // Fetch the existing selections (Burundi by default — we expect 1 row)
  const { data: selections } = await supabase
    .from("selections")
    .select("id,name");

  return (
    <main className="flex-1 flex flex-col px-6 py-8 max-w-md mx-auto w-full">
      <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wider">
        BIENVENUE
      </h1>
      <p className="text-[#8b93a7] mt-1 text-sm">
        Crée ta carte joueur en 30 secondes.
      </p>

      <OnboardingForm selections={selections ?? []} />
    </main>
  );
}
