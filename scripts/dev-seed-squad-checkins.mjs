/**
 * Insère un check-in du jour pour CHAQUE joueur de la sélection.
 * Mix réaliste : 60% bonne forme, 25% moyen, 10% ko, 5% TOTW.
 * Bypass user_id (service_role).
 *
 *   node scripts/dev-seed-squad-checkins.mjs [pct-skip]
 *
 *   pct-skip = % de joueurs qu'on saute (= "pas encore checké aujourd'hui")
 *              défaut 15.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const env = Object.fromEntries(
  readFileSync(resolve(__dirname, "..", ".env.local"), "utf8").split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const pctSkip = Number(process.argv[2] ?? 15);
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PRESETS = {
  top:     { sleep_hours: 8.0, sleep_quality: 5, fatigue: 2, muscle_soreness: 2, stress: 1, mood: 5, appetite: 5 },
  high:    { sleep_hours: 7.5, sleep_quality: 4, fatigue: 3, muscle_soreness: 3, stress: 2, mood: 4, appetite: 4 },
  moyen:   { sleep_hours: 6.5, sleep_quality: 3, fatigue: 5, muscle_soreness: 4, stress: 3, mood: 3, appetite: 3 },
  low:     { sleep_hours: 5.5, sleep_quality: 2, fatigue: 7, muscle_soreness: 6, stress: 4, mood: 2, appetite: 3 },
  ko:      { sleep_hours: 4.0, sleep_quality: 2, fatigue: 9, muscle_soreness: 8, stress: 5, mood: 2, appetite: 2 },
  special: { sleep_hours: 9.0, sleep_quality: 5, fatigue: 1, muscle_soreness: 1, stress: 1, mood: 5, appetite: 5 },
};

// Mix réaliste pondéré
const POOL = [
  "special", "special", "special",                              // ~5%
  "top", "top", "top", "top", "top", "top", "top", "top", "top", // ~15%
  "high", "high", "high", "high", "high", "high", "high",       // ~12%
  "moyen", "moyen", "moyen", "moyen", "moyen", "moyen", "moyen",// ~12%
  "low",  "low",                                                // ~3%
  "ko",                                                         // ~2%
];
const pick = () => POOL[Math.floor(Math.random() * POOL.length)];

const c = (v) => Math.max(0, Math.min(100, Math.round(v)));
const invert = (v, max) => ((max - v + 1) / max) * 100;
const normal = (v, max) => (v / max) * 100;
function ovr(p, reg = 100) {
  const sleep = c((Math.min(100, (p.sleep_hours / 8) * 100)) * 0.5 + (p.sleep_quality / 5) * 100 * 0.5);
  const fat = c(invert(p.fatigue, 10));
  const sor = c(invert(p.muscle_soreness, 10));
  const str = c(invert(p.stress, 5));
  const moo = c(normal(p.mood, 5));
  const app = c(normal(p.appetite, 5));
  const stats = {
    forme: c((fat + moo + app) / 3),
    sleep, recovery: c((fat + sor) / 2), physical: sor,
    mental: c((str + moo) / 2), regularity: c(reg),
  };
  return c(stats.sleep*0.25 + stats.recovery*0.20 + stats.physical*0.20 + stats.forme*0.15 + stats.mental*0.10 + stats.regularity*0.10);
}

const today = new Date().toISOString().slice(0, 10);
const { data: players } = await s.from("players").select("id,first_name,last_name");
console.log(`👥 ${players.length} joueurs · skip ${pctSkip}% ("pas encore checké")`);

let done = 0, skipped = 0;
for (const p of players) {
  if (Math.random() * 100 < pctSkip) { skipped++; continue; }
  const preset = pick();
  const payload = PRESETS[preset];
  const score = ovr(payload, 80 + Math.floor(Math.random() * 21)); // regularity entre 80 et 100
  await s.from("daily_checkins").upsert({
    player_id: p.id,
    date: today,
    ...payload,
    readiness_score: score,
  }, { onConflict: "player_id,date" });
  done++;
}

console.log(`✅ ${done} check-ins insérés · ${skipped} skipped`);
console.log("Reload /staff pour voir la fiche TeamPulse remplie.");
