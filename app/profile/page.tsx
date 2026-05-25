import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomTabBar } from "@/components/aureak/BottomTabBar";
import { signOut } from "./actions";
import { BurundiFlag } from "@/components/aureak/BurundiFlag";
import type { PlayerRow } from "@/lib/types";

export const metadata = { title: "Mon profil · AureakForm" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<PlayerRow>();
  if (!player) redirect("/onboarding");

  return (
    <main className="flex-1 flex flex-col px-5 pt-7 pb-28 max-w-md mx-auto w-full">
      <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wider">
        MON PROFIL
      </h1>

      <section className="mt-8 rounded-2xl bg-[#131826] border border-white/5 p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f6e3a1] via-[#c9a44b] to-[#806224] flex items-center justify-center font-[family-name:var(--font-bebas)] text-3xl text-[#1c1206]">
            {player.first_name[0]}{player.last_name[0]}
          </div>
          <div>
            <div className="font-[family-name:var(--font-oswald)] text-xl font-bold uppercase">
              {player.first_name} {player.last_name}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8b93a7] mt-0.5">
              <BurundiFlag width={18} /> Sélection nationale · {player.position}
            </div>
          </div>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between border-b border-white/5 pb-2">
            <dt className="text-[#8b93a7]">Email</dt>
            <dd className="font-mono text-xs">{user.email}</dd>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-2">
            <dt className="text-[#8b93a7]">Poste</dt>
            <dd>{player.position}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#8b93a7]">Inscrit le</dt>
            <dd>
              {new Date(player.created_at).toLocaleDateString("fr-FR", {
                day: "2-digit", month: "short", year: "numeric",
              })}
            </dd>
          </div>
        </dl>
      </section>

      <form action={signOut} className="mt-6">
        <button
          type="submit"
          className="w-full rounded-xl py-3.5 bg-[#1a2030] text-[#ff4d5e] font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-sm border border-[#ff4d5e]/20 hover:bg-[#ff4d5e]/10 transition"
        >
          Se déconnecter
        </button>
      </form>

      <p className="text-[10px] text-[#8b93a7] text-center mt-6 uppercase tracking-widest font-[family-name:var(--font-oswald)]">
        AureakForm · v0.1 · 🇧🇮
      </p>

      <BottomTabBar />
    </main>
  );
}
