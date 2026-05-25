/**
 * One-off : crée le joueur "De Vriendt Jérémy" (GK) lié à j.devriendt@aureak.be,
 * rattaché à la sélection Burundi. Idempotent : met à jour la ligne existante si présente.
 *
 *   node scripts/dev-create-jeremy.mjs
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

const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMAIL = "j.devriendt@aureak.be";
const FIRST = "Jérémy";
const LAST = "De Vriendt";
const POSITION = "GK";

// 1. Récupère la sélection Burundi
const { data: sel, error: selErr } = await s
  .from("selections")
  .select("id,name")
  .limit(1)
  .single();
if (selErr || !sel) {
  console.error("❌ Aucune sélection trouvée. Lance d'abord seed.mjs");
  process.exit(1);
}
console.log(`📋 Sélection : ${sel.name}`);

// 2. Trouve ou crée le user auth
let userId = null;

// listUsers paginated, on cherche par email
const { data: list, error: listErr } = await s.auth.admin.listUsers({
  page: 1,
  perPage: 200,
});
if (listErr) {
  console.error("❌ listUsers :", listErr.message);
  process.exit(1);
}
const found = list?.users?.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());
if (found) {
  userId = found.id;
  console.log(`👤 User existant : ${found.email} (id=${userId})`);
} else {
  const { data: created, error: createErr } = await s.auth.admin.createUser({
    email: EMAIL,
    email_confirm: true,
  });
  if (createErr || !created?.user) {
    console.error("❌ createUser :", createErr?.message);
    process.exit(1);
  }
  userId = created.user.id;
  console.log(`✓ User créé : ${EMAIL} (id=${userId})`);
}

// 3. Upsert player
const { data: existing } = await s
  .from("players")
  .select("id")
  .eq("user_id", userId)
  .limit(1);

if (existing && existing.length > 0) {
  const { error } = await s
    .from("players")
    .update({
      first_name: FIRST,
      last_name: LAST,
      position: POSITION,
      selection_id: sel.id,
    })
    .eq("user_id", userId);
  if (error) { console.error("❌ update player :", error.message); process.exit(1); }
  console.log(`✓ Joueur mis à jour : ${FIRST} ${LAST} [${POSITION}] (id=${existing[0].id})`);
} else {
  const { data, error } = await s
    .from("players")
    .insert({
      user_id: userId,
      selection_id: sel.id,
      first_name: FIRST,
      last_name: LAST,
      position: POSITION,
    })
    .select("id")
    .single();
  if (error) { console.error("❌ insert player :", error.message); process.exit(1); }
  console.log(`✓ Joueur créé : ${FIRST} ${LAST} [${POSITION}] (id=${data.id})`);
}

console.log(`\n✅ Prêt. Connecte-toi avec :  node scripts/dev-login.mjs ${EMAIL}`);
