/**
 * Promeut un user existant en staff (avec service_role).
 *
 *   node scripts/promote-staff.mjs <email>
 *
 * Le user doit déjà s'être connecté au moins une fois (via magic link)
 * pour exister dans auth.users.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];

if (!email) {
  console.error("Usage : node scripts/promote-staff.mjs <email>");
  process.exit(1);
}

const supabase = createClient(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 1. trouve le user auth
const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
if (listErr) { console.error("❌", listErr.message); process.exit(1); }
const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.error(`❌ Aucun user ${email}. Il doit se connecter au moins une fois via /login d'abord.`);
  process.exit(1);
}

// 2. trouve la sélection Burundi (par défaut)
const { data: sel } = await supabase
  .from("selections").select("id,name").maybeSingle();
if (!sel) { console.error("❌ Aucune sélection. Lance d'abord scripts/seed.mjs."); process.exit(1); }

// 3. upsert le staff
const { error } = await supabase.from("staff").upsert({
  user_id: user.id,
  selection_id: sel.id,
  role: "admin",
  display_name: email.split("@")[0],
}, { onConflict: "user_id" });

if (error) { console.error("❌", error.message); process.exit(1); }
console.log(`✅ ${email} est maintenant staff/admin sur sélection "${sel.name}".`);
console.log(`   Accède au dashboard sur /staff après reconnexion.`);
