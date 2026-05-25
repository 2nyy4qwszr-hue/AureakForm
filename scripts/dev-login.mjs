/**
 * Génère un magic link via service_role et ouvre directement /auth/callback
 * avec le `hashed_token` — pas de round-trip Supabase, pas de fragment URL.
 *
 *   node scripts/dev-login.mjs [email] [next-path]
 *
 * Exemples :
 *   node scripts/dev-login.mjs                                # → j.devriendt + /
 *   node scripts/dev-login.mjs autre@aureak.be                # → autre + /
 *   node scripts/dev-login.mjs j.devriendt@aureak.be /staff   # → /staff
 *
 * À n'utiliser QU'EN DEV.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const env = Object.fromEntries(
  readFileSync(resolve(__dirname, "..", ".env.local"), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const email = process.argv[2] ?? "j.devriendt@aureak.be";
const next = process.argv[3] ?? "/";
const APP_ORIGIN = "http://localhost:3000";

const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log(`🔑 Génération magic link pour ${email} → ${next}`);

const { data, error } = await s.auth.admin.generateLink({
  type: "magiclink",
  email,
});

if (error) { console.error("❌", error.message); process.exit(1); }

const hashed = data?.properties?.hashed_token;
if (!hashed) {
  console.error("❌ Pas de hashed_token retourné. Data :", JSON.stringify(data, null, 2));
  process.exit(1);
}

// On construit une URL qui tape directement notre /auth/callback côté Next,
// avec le token déjà hashé — notre route fait `verifyOtp({token_hash, type})`.
const callbackUrl = `${APP_ORIGIN}/auth/callback?token_hash=${encodeURIComponent(hashed)}&type=magiclink&next=${encodeURIComponent(next)}`;

console.log(`✅ → ${callbackUrl}`);
console.log("🌐 Ouverture dans ton navigateur...");
execFile("open", [callbackUrl], (err) => {
  if (err) console.error("(ouverture auto échouée, copie-colle le lien manuellement)");
});
