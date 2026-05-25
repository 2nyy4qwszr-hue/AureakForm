/**
 * Seed une équipe complète de faux joueurs pour valider visuellement le dashboard staff.
 * Insère 8 joueurs (positions variées) + un check-in du jour pour chacun (presets variés)
 * + 2 blessures ouvertes + 3 post-séances.
 *
 *   node scripts/dev-seed-squad.mjs
 *
 * Idempotent : peut être re-run, met à jour les check-ins du jour sans dupliquer.
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

const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Get the Burundi selection
const { data: sel } = await s.from("selections").select("id,name").limit(1).single();
if (!sel) { console.error("❌ Aucune sélection. Lance d'abord seed.mjs"); process.exit(1); }
console.log(`📋 Sélection : ${sel.name}`);

// 8 joueurs avec des profils variés
const SQUAD = [
  { first: "Idriss",   last: "Nizigiyimana", position: "GK",  preset: "ko"     }, // bronze
  { first: "Saidi",    last: "Ndayisenga",   position: "DEF", preset: "moyen"  }, // argent
  { first: "Issa",     last: "Bahizi",       position: "DEF", preset: "top"    }, // or
  { first: "Karim",    last: "Nshimirimana", position: "DEF", preset: "moyen"  },
  { first: "Frédéric", last: "Nsabiyumva",   position: "MIL", preset: "top"    },
  { first: "Cédric",   last: "Kanyamuneza",  position: "MIL", preset: "ko"     },
  { first: "Pascal",   last: "Bigirimana",   position: "ATT", preset: "special"}, // TOTW
  { first: "Laudit",   last: "Mavugara",     position: "ATT", preset: "moyen"  },
];

const PRESETS = {
  top:     { sleep_hours: 8.0, sleep_quality: 5, fatigue: 2, muscle_soreness: 2, stress: 1, mood: 5, appetite: 5 },
  moyen:   { sleep_hours: 6.5, sleep_quality: 3, fatigue: 5, muscle_soreness: 4, stress: 3, mood: 3, appetite: 3 },
  ko:      { sleep_hours: 4.0, sleep_quality: 2, fatigue: 9, muscle_soreness: 8, stress: 5, mood: 2, appetite: 2 },
  special: { sleep_hours: 9.0, sleep_quality: 5, fatigue: 1, muscle_soreness: 1, stress: 1, mood: 5, appetite: 5 },
};

const c = (v) => Math.max(0, Math.min(100, Math.round(v)));
const invert = (v, max) => ((max - v + 1) / max) * 100;
const normal = (v, max) => (v / max) * 100;
function computeOvr(p, regularity = 100) {
  const sleep = c((Math.min(100, (p.sleep_hours / 8) * 100)) * 0.5 + (p.sleep_quality / 5) * 100 * 0.5);
  const fat = c(invert(p.fatigue, 10));
  const sor = c(invert(p.muscle_soreness, 10));
  const str = c(invert(p.stress, 5));
  const moo = c(normal(p.mood, 5));
  const app = c(normal(p.appetite, 5));
  const stats = {
    forme: c((fat + moo + app) / 3),
    sleep,
    recovery: c((fat + sor) / 2),
    physical: sor,
    mental: c((str + moo) / 2),
    regularity: c(regularity),
  };
  return c(
    stats.sleep * 0.25 + stats.recovery * 0.20 + stats.physical * 0.20 +
    stats.forme * 0.15 + stats.mental * 0.10 + stats.regularity * 0.10
  );
}

const today = new Date().toISOString().slice(0, 10);

for (const p of SQUAD) {
  // Upsert player (par couple last+first pour éviter doublon si re-run, ces faux joueurs n'ont pas de user_id)
  const { data: existing } = await s.from("players")
    .select("id")
    .eq("selection_id", sel.id)
    .eq("first_name", p.first).eq("last_name", p.last)
    .limit(1);

  let playerId;
  if (existing && existing.length > 0) {
    playerId = existing[0].id;
  } else {
    const { data, error } = await s.from("players").insert({
      selection_id: sel.id,
      first_name: p.first,
      last_name: p.last,
      position: p.position,
      user_id: null, // faux joueur, pas de compte auth
    }).select("id").single();
    if (error) { console.error("❌", p.first, ":", error.message); continue; }
    playerId = data.id;
  }

  const payload = PRESETS[p.preset];
  const ovr = computeOvr(payload, 100);

  const { error: cErr } = await s.from("daily_checkins").upsert({
    player_id: playerId,
    date: today,
    ...payload,
    readiness_score: ovr,
  }, { onConflict: "player_id,date" });
  if (cErr) { console.error("❌", p.first, "check-in :", cErr.message); continue; }

  console.log(`   ✓ ${p.first.padEnd(10)} ${p.last.padEnd(20)} [${p.position}] preset=${p.preset.padEnd(8)} OVR=${ovr}`);
}

// 2 blessures ouvertes pour pimenter le dashboard alertes
const { data: targets } = await s.from("players").select("id,first_name,last_name")
  .eq("selection_id", sel.id).in("last_name", ["Nizigiyimana", "Kanyamuneza"]);

for (const t of targets ?? []) {
  // delete existing open injuries for that player to keep it clean on re-run
  await s.from("injuries").delete().eq("player_id", t.id).is("resolved_at", null);
}

await s.from("injuries").insert([
  {
    player_id: targets.find(t => t.last_name === "Nizigiyimana").id,
    body_part: "Ischios",
    body_side: "right", body_view: "back",
    type: "douleur", intensity: 7,
    comment: "Sensation après le match de samedi, en train de gérer",
  },
  {
    player_id: targets.find(t => t.last_name === "Kanyamuneza").id,
    body_part: "Cheville/pied",
    body_side: "left", body_view: "front",
    type: "contracture", intensity: 5,
    comment: null,
  },
]);
console.log(`   ✓ 2 blessures ouvertes ajoutées`);

// 3 post-séances pour le graphique RPE
const { data: allPlayers } = await s.from("players").select("id").eq("selection_id", sel.id).limit(3);
for (const p of allPlayers ?? []) {
  await s.from("post_session").insert({
    player_id: p.id,
    session_date: today,
    session_type: "training",
    rpe: 6 + Math.floor(Math.random() * 4),
    enjoyment: 4,
    self_performance: 4,
    minutes: 90,
  });
}
console.log(`   ✓ ${allPlayers?.length ?? 0} post-séances ajoutées`);

console.log("\n✅ Squad seed terminée. Reload http://localhost:3000/staff");
