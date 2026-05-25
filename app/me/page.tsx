import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomTabBar } from "@/components/aureak/BottomTabBar";
import { StatsRadar } from "@/components/aureak/StatsRadar";
import { EvolutionChart } from "@/components/aureak/EvolutionChart";
import {
  statsFromCheckin,
  regularity7d,
} from "@/lib/readiness";
import type { DailyCheckinRow, PlayerRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes stats · AureakForm" };

export default async function MePage() {
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

  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const { data: history } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("player_id", player.id)
    .gte("date", monthAgo.toISOString().slice(0, 10))
    .order("date", { ascending: true });

  const allCheckins = (history ?? []) as DailyCheckinRow[];
  const last = allCheckins[allCheckins.length - 1] ?? null;
  const regularity = regularity7d(allCheckins.map((c) => c.date));
  const lastStats = last
    ? statsFromCheckin(last, regularity)
    : { forme: 0, sleep: 0, recovery: 0, physical: 0, mental: 0, regularity };

  const chartData = allCheckins.map((c) => ({
    date: c.date,
    value: c.readiness_score ?? 0,
  }));

  return (
    <main className="flex-1 flex flex-col px-5 pt-7 pb-28 max-w-md mx-auto w-full">
      <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wider">
        MES STATS
      </h1>
      <p className="text-[#8b93a7] text-sm mt-1">
        Évolution sur 30 jours · {allCheckins.length} check-ins enregistrés
      </p>

      <section className="mt-8 rounded-2xl bg-[#131826] border border-white/5 p-4">
        <h3 className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-2">
          Profil aujourd&apos;hui
        </h3>
        <StatsRadar stats={lastStats} />
      </section>

      <section className="mt-6 rounded-2xl bg-[#131826] border border-white/5 p-4">
        <h3 className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold mb-2">
          Readiness OVR — 30 derniers jours
        </h3>
        {chartData.length > 0 ? (
          <EvolutionChart data={chartData} color="#c9a44b" label="OVR" />
        ) : (
          <div className="text-center py-12 text-[#8b93a7] text-sm">
            Pas encore assez de données.
            <br />
            Fais ton premier check-in pour démarrer ta courbe.
          </div>
        )}
      </section>

      <BottomTabBar />
    </main>
  );
}
