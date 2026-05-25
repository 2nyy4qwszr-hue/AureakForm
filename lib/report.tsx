import { createClient as createServiceClient } from "@supabase/supabase-js";
import { renderToStream } from "@react-pdf/renderer";
import { DailyReport, type ReportPlayer, type ReportInjury } from "@/lib/pdf/DailyReport";
import { readinessOvr, regularity7d } from "@/lib/readiness";
import type { DailyCheckinRow, InjuryRow, PlayerRow, SelectionRow } from "@/lib/types";

/**
 * Construit les données + génère le PDF.
 * Utilise le service_role pour cron/email (pas d'auth user).
 */
export async function buildDailyReportData(opts: {
  date: string;
  selectionId?: string; // si absent, prend la 1ère sélection
}) {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: selections } = await supabase
    .from("selections")
    .select("*")
    .limit(1);
  const selection = (selections?.[0] ?? null) as SelectionRow | null;
  if (!selection) throw new Error("Aucune sélection trouvée.");

  const sevenDaysAgo = new Date(opts.date);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenStr = sevenDaysAgo.toISOString().slice(0, 10);

  const [{ data: players }, { data: todayCheckins }, { data: recentDates }, { data: injuries }] =
    await Promise.all([
      supabase.from("players").select("*").eq("selection_id", selection.id),
      supabase
        .from("daily_checkins")
        .select("*")
        .eq("date", opts.date),
      supabase
        .from("daily_checkins")
        .select("player_id,date")
        .gte("date", sevenStr),
      supabase
        .from("injuries")
        .select("*")
        .is("resolved_at", null)
        .order("declared_at", { ascending: false }),
    ]);

  const playerList = (players ?? []) as PlayerRow[];
  const checkinByPlayer = new Map<string, DailyCheckinRow>();
  ((todayCheckins ?? []) as DailyCheckinRow[]).forEach((c) =>
    checkinByPlayer.set(c.player_id, c)
  );

  const datesByPlayer = new Map<string, string[]>();
  (recentDates ?? []).forEach((r) => {
    const pid = r.player_id as string;
    if (!datesByPlayer.has(pid)) datesByPlayer.set(pid, []);
    datesByPlayer.get(pid)!.push(r.date as string);
  });

  const reportPlayers: ReportPlayer[] = playerList.map((p) => {
    const today = checkinByPlayer.get(p.id) ?? null;
    const regularity = regularity7d(datesByPlayer.get(p.id) ?? []);
    const ovr = today
      ? today.readiness_score ?? readinessOvr(today, regularity)
      : null;
    return {
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
      position: p.position,
      ovr,
      checkedIn: !!today,
      fatigue: today?.fatigue ?? null,
      soreness: today?.muscle_soreness ?? null,
      sleep_hours: today?.sleep_hours ?? null,
    };
  });

  const playerNameById = new Map(
    playerList.map((p) => [p.id, `${p.first_name} ${p.last_name}`])
  );
  const reportInjuries: ReportInjury[] = ((injuries ?? []) as InjuryRow[])
    .filter((inj) => playerNameById.has(inj.player_id))
    .map((inj) => ({
      id: inj.id,
      player_name: playerNameById.get(inj.player_id) ?? "—",
      body_part: inj.body_part,
      body_side: inj.body_side,
      type: inj.type,
      intensity: inj.intensity,
      declared_at: inj.declared_at,
      comment: inj.comment,
    }));

  return { selection, players: reportPlayers, injuries: reportInjuries };
}

export async function renderDailyReportStream(date: string) {
  const { selection, players, injuries } = await buildDailyReportData({ date });
  // renderToStream renvoie un Node Readable
  return renderToStream(
    <DailyReport
      date={date}
      selection={selection.name}
      players={players}
      injuries={injuries}
    />
  );
}
