/**
 * Reset des données d'un joueur — utile pour re-tester le flow d'onboarding et le
 * gros bouton vert "Check-in du matin".
 *
 *   node scripts/dev-reset-checkin.mjs [email] [scope]
 *
 *   scope = "today"  (défaut) → supprime juste le check-in du jour
 *         | "all"             → supprime TOUS les check-ins + post-sessions + blessures
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
const scope = process.argv[3] ?? "today";

if (!["today", "all"].includes(scope)) {
  console.error('❌ scope doit être "today" ou "all"');
  process.exit(1);
}

const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const { data: { users } } = await s.auth.admin.listUsers();
const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) { console.error(`❌ User ${email} introuvable`); process.exit(1); }

const { data: players } = await s.from("players").select("id,first_name").eq("user_id", user.id).limit(1);
const player = players?.[0];
if (!player) { console.error(`❌ Aucun player pour ${email}`); process.exit(1); }

if (scope === "today") {
  const today = new Date().toISOString().slice(0, 10);
  const { error, count } = await s
    .from("daily_checkins")
    .delete({ count: "exact" })
    .eq("player_id", player.id)
    .eq("date", today);
  if (error) { console.error("❌", error.message); process.exit(1); }
  console.log(`✅ ${count ?? 0} check-in supprimé pour ${player.first_name} (date = ${today})`);
} else {
  const tables = ["daily_checkins", "post_session", "injuries"];
  for (const t of tables) {
    const { error, count } = await s.from(t).delete({ count: "exact" }).eq("player_id", player.id);
    if (error) { console.error(`❌ ${t}:`, error.message); continue; }
    console.log(`✅ ${t} : ${count ?? 0} ligne(s) supprimée(s)`);
  }
}

console.log("\n🔄 Reload http://localhost:3000/ pour voir l'état frais.");
