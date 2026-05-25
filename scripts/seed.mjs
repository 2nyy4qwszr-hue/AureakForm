/**
 * Seed minimal : crée la sélection "Burundi" si elle n'existe pas.
 * Lancer une fois après avoir appliqué `supabase/migrations/0001_init.sql`.
 *
 *   node scripts/seed.mjs
 *
 * Lit les variables depuis `.env.local` à la racine du projet.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ── Charge .env.local manuellement (Node n'a pas dotenv par défaut)
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

if (!URL || !SERVICE) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local");
  process.exit(1);
}

const supabase = createClient(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("🌱 Seed AureakForm — Burundi 🇧🇮");

// 1. Sélection Burundi
const { data: existing } = await supabase
  .from("selections")
  .select("id")
  .eq("name", "Burundi 🇧🇮")
  .maybeSingle();

if (existing) {
  console.log(`   ↪ sélection déjà présente (id=${existing.id})`);
} else {
  const { data, error } = await supabase
    .from("selections")
    .insert({ name: "Burundi 🇧🇮", country_code: "BI" })
    .select()
    .single();
  if (error) {
    console.error("❌", error.message);
    process.exit(1);
  }
  console.log(`   ✓ sélection créée (id=${data.id})`);
}

console.log("✅ Seed OK. Tu peux maintenant te connecter via /login.");
