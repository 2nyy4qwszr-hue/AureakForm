import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InjuryForm } from "./InjuryForm";
import { BottomTabBar } from "@/components/aureak/BottomTabBar";
import type { InjuryRow } from "@/lib/types";

export const metadata = { title: "Déclarer un bobo · AureakForm" };

export default async function InjuryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!player) redirect("/onboarding");

  const { data: openInjuries } = await supabase
    .from("injuries")
    .select("*")
    .eq("player_id", player.id)
    .is("resolved_at", null)
    .order("declared_at", { ascending: false });

  return (
    <main className="flex-1 flex flex-col px-5 pt-7 pb-28 max-w-md mx-auto w-full">
      <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wider">
        DÉCLARER UN BOBO
      </h1>
      <p className="text-[#8b93a7] text-sm mt-1">
        Touche la zone qui te fait mal. Le staff médical est alerté direct.
      </p>

      <InjuryForm />

      {openInjuries && openInjuries.length > 0 && (
        <section className="mt-10">
          <h3 className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-3">
            Déclarations en cours
          </h3>
          <div className="space-y-2">
            {(openInjuries as InjuryRow[]).map((inj) => (
              <div
                key={inj.id}
                className="rounded-xl bg-[#131826] border border-white/5 px-4 py-3"
              >
                <div className="flex justify-between items-baseline">
                  <span className="font-[family-name:var(--font-oswald)] font-bold uppercase text-sm">
                    {inj.body_part}
                  </span>
                  <span className="text-xs text-[#ffa42b]">
                    {inj.intensity}/10
                  </span>
                </div>
                <div className="text-[11px] text-[#8b93a7] mt-1">
                  {inj.type ?? "—"} ·{" "}
                  {new Date(inj.declared_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </div>
                {inj.comment && (
                  <p className="text-xs text-[#cfd6e6] mt-2 italic">
                    « {inj.comment} »
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <BottomTabBar />
    </main>
  );
}
