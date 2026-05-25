/**
 * Insère un check-in fictif pour un joueur — utile pour valider la home / le radar.
 *
 *   node scripts/dev-fake-checkin.mjs [email] [preset]
 *
 *   preset = "top" (défaut) | "moyen" | "ko"
 *
 * À n'utiliser QU'EN DEV.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const env = Object.fromEntries(
  readFileSync(resolve(__dirname, "..", ".env.local"), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const email = process.argv[2] ?? "j.devriendt@aureak.be";
const preset = process.argv[3] ?? "top";

// urine_color = échelle Armstrong 1..8 (1 = transparent / 8 = ambre foncé)
const PRESETS = {
  top:   { sleep_hours: 8.0, sleep_quality: 5, fatigue: 2, muscle_soreness: 2, stress: 1, mood: 5, appetite: 5, urine_color: 1 },
  moyen: { sleep_hours: 6.5, sleep_quality: 3, fatigue: 5, muscle_soreness: 4, stress: 3, mood: 3, appetite: 3, urine_color: 4 },
  ko:    { sleep_hours: 4.0, sleep_quality: 2, fatigue: 9, muscle_soreness: 8, stress: 5, mood: 2, appetite: 2, urine_color: 8 },
};

// ── Formules importées depuis lib/readiness.ts (en JS pur) ──
const c = (v) => Math.max(0, Math.min(100, Math.round(v)));
const invert = (v, max) => ((max - v + 1) / max) * 100;
const normal = (v, max) => (v / max) * 100;

function computeOvr(p, regularity = 14) {
  const sleep = c((Math.min(100, (p.sleep_hours / 8) * 100)) * 0.5 + (p.sleep_quality / 5) * 100 * 0.5);
  const fat = c(invert(p.fatigue, 10));
  const sor = c(invert(p.muscle_soreness, 10));
  const str = c(invert(p.stress, 5));
  const moo = c(normal(p.mood, 5));
  const app = c(normal(p.appetite, 5));
  const hyd = c(invert(p.urine_color, 8));
  const stats = {
    forme: c((fat + moo + app) / 3),
    sleep,
    recovery: c((fat + sor + hyd) / 3),
    physical: sor,
    mental: c((str + moo) / 2),
    regularity: c(regularity),
  };
  return c(
    stats.sleep * 0.25 + stats.recovery * 0.20 + stats.physical * 0.20 +
    stats.forme * 0.15 + stats.mental * 0.10 + stats.regularity * 0.10
  );
}

// ── Run ──
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const { data: { users } } = await s.auth.admin.listUsers();
const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) { console.error(`❌ User ${email} introuvable`); process.exit(1); }

const { data: players } = await s.from("players").select("id,first_name").eq("user_id", user.id).limit(1);
const player = players?.[0];
if (!player) { console.error(`❌ Aucun player pour ${email}`); process.exit(1); }

const payload = PRESETS[preset];
if (!payload) { console.error(`❌ preset doit être : top | moyen | ko`); process.exit(1); }

const today = new Date().toISOString().slice(0, 10);

// Compute regularity from existing dates
const sevenAgo = new Date(); sevenAgo.setDate(sevenAgo.getDate() - 6);
const { data: recent } = await s
  .from("daily_checkins").select("date")
  .eq("player_id", player.id)
  .gte("date", sevenAgo.toISOString().slice(0, 10));
const regularity = c((new Set([...(recent ?? []).map(r => r.date), today]).size / 7) * 100);

const readiness = computeOvr(payload, regularity);

const { error } = await s.from("daily_checkins").upsert({
  player_id: player.id,
  date: today,
  ...payload,
  readiness_score: readiness,
}, { onConflict: "player_id,date" });

if (error) { console.error("❌", error.message); process.exit(1); }

console.log(`✅ Check-in "${preset}" inséré pour ${player.first_name} (${email})`);
console.log(`   → OVR du jour : ${readiness}/100`);
console.log(`   → Reload http://localhost:3000/ pour voir ta carte mise à jour`);
