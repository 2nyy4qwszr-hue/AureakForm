/**
 * Mappe les PNG de public/players/Png/ aux joueurs en base et upsert photo_url.
 *
 * Logique :
 *   1. Lit tous les fichiers .png du dossier
 *   2. Récupère tous les joueurs de la sélection Burundi
 *   3. Normalise les deux côtés (sans accents, lowercase, sans espaces ni tirets)
 *      puis matche le nom de fichier sur first+last name (ou full reverse)
 *   4. Applique une table d'alias manuels pour les surnoms (Bosingwa, Saido, etc.)
 *   5. Update photo_url = "/players/Png/<filename>" sur chaque joueur matché
 *   6. Reporte les photos non-matchées + les joueurs sans photo
 *
 * Usage :
 *   node scripts/seed-player-photos.mjs                            # dry-run
 *   node scripts/seed-player-photos.mjs --apply                    # update photo_url
 *   node scripts/seed-player-photos.mjs --apply --create-missing   # + crée les joueurs absents (1 par PNG non matché)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APPLY = process.argv.includes("--apply");
const CREATE_MISSING = process.argv.includes("--create-missing");

// PNG à ne PAS transformer en joueur (staff, etc.)
const SKIP_AS_PLAYER = new Set(["cedrickine"]);

const env = Object.fromEntries(
  readFileSync(resolve(__dirname, "..", ".env.local"), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PHOTO_DIR = resolve(__dirname, "..", "public", "players", "Png");
const URL_PREFIX = "/players/Png/";

// ─── Normalisation : "Aaron Musore" / "aaron-musore" / "MUSORE" → "aaronmusore" ───
const norm = (str) =>
  str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accents
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // espaces, tirets, points, etc.

// ─── Alias manuels (surnoms / orthographes alternatives connues) ───
//    Clé = norm(filename sans extension)  →  norm(first_name + last_name) à matcher
const ALIASES = {
  // "Saido.png" est le surnom de Saïdi Ntibazonkiza Likati
  saido: "saidintibazonkizalikati",
  // Orthographe "Mohammed" (2 m) dans le PNG vs "Mohamed" (1 m) en base
  mohammedamissi: "mohamedamissi",
  // Ordre des prénoms : "Roméo Vancy" dans le PNG vs "Vancy Roméo" en base
  romeovancymabanza: "vancyromeomabanza",
};

// ─── 1. Lecture des fichiers PNG ───
const files = readdirSync(PHOTO_DIR).filter((f) => /\.png$/i.test(f));
console.log(`📂 ${files.length} fichiers PNG trouvés dans ${PHOTO_DIR}\n`);

// ─── 2. Récup joueurs Burundi ───
const { data: sel } = await s.from("selections").select("id,name").limit(1).single();
const { data: players, error: pErr } = await s
  .from("players")
  .select("id,first_name,last_name,photo_url")
  .eq("selection_id", sel.id);
if (pErr) { console.error("❌", pErr.message); process.exit(1); }
console.log(`👥 ${players.length} joueurs en base sur sélection "${sel.name}"\n`);

// ─── 3. Indexation des joueurs par nom normalisé ───
//   On indexe à la fois "firstlast" et "lastfirst" pour matcher les fichiers
//   avec l'ordre inversé ("Moussa Omar.png" → "Omar Moussa" en base).
const playerByKey = new Map();
for (const p of players) {
  const first = norm(p.first_name);
  const last = norm(p.last_name);
  playerByKey.set(first + last, p);
  playerByKey.set(last + first, p);
  // également juste le last name (pour "Bosingwa.png", "Jimmy.png", etc. si ça matche)
  if (!playerByKey.has(last)) playerByKey.set(last, p);
  if (!playerByKey.has(first)) playerByKey.set(first, p);
}

// ─── 4. Matching ───
const matched = [];     // { file, player }
const unmatched = [];   // file
for (const file of files) {
  const base = file.replace(/\.png$/i, "");
  const key = norm(base);
  const aliased = ALIASES[key] ?? key;
  const hit = playerByKey.get(aliased);
  if (hit) matched.push({ file, player: hit });
  else unmatched.push(file);
}

const photoByPlayerId = new Map();
for (const { file, player } of matched) {
  // Si deux fichiers matchent le même joueur, le premier gagne, on log l'ambigüité
  if (photoByPlayerId.has(player.id)) {
    console.warn(`⚠️  Deux photos matchent ${player.first_name} ${player.last_name} : "${photoByPlayerId.get(player.id).split("/").pop()}" gardée, "${file}" ignorée`);
    continue;
  }
  photoByPlayerId.set(player.id, URL_PREFIX + file);
}

// ─── 5. Rapport ───
console.log("─── 🎯 Photos matchées ───");
for (const { file, player } of matched) {
  console.log(`   ✓ ${file.padEnd(35)} → ${player.first_name} ${player.last_name}`);
}

console.log(`\n─── ❓ Photos sans joueur (${unmatched.length}) ───`);
for (const file of unmatched) console.log(`   · ${file}`);

const playersWithoutPhoto = players.filter((p) => !photoByPlayerId.has(p.id));
console.log(`\n─── 📷 Joueurs sans photo (${playersWithoutPhoto.length}) ───`);
for (const p of playersWithoutPhoto.slice(0, 15)) {
  console.log(`   · ${p.first_name} ${p.last_name}`);
}
if (playersWithoutPhoto.length > 15) console.log(`   … et ${playersWithoutPhoto.length - 15} de plus`);

// ─── 6. Écriture (si --apply) ───
if (!APPLY) {
  console.log(`\n💡 Dry-run terminé. Relance avec --apply pour écrire en base.`);
  process.exit(0);
}

console.log(`\n📝 Application des ${photoByPlayerId.size} updates photo_url...`);
let ok = 0, fail = 0;
for (const [playerId, url] of photoByPlayerId) {
  const { error } = await s.from("players").update({ photo_url: url }).eq("id", playerId);
  if (error) { console.error(`   ❌ ${playerId}:`, error.message); fail++; }
  else ok++;
}
console.log(`✅ ${ok} mis à jour · ${fail} échecs`);

// ─── 7. Création des joueurs manquants (si --create-missing) ───
if (CREATE_MISSING) {
  // Parse "FirstName LastName.png" → { first, last }
  // "Pseudo.png" (un seul mot) → { first: "", last: "Pseudo" }
  const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  const parseName = (filename) => {
    const base = filename.replace(/\.png$/i, "").trim();
    const parts = base.split(/\s+/);
    if (parts.length === 1) return { first: "", last: cap(parts[0]) };
    return { first: cap(parts[0]), last: parts.slice(1).map(cap).join(" ") };
  };

  const toCreate = unmatched.filter((f) => !SKIP_AS_PLAYER.has(norm(f.replace(/\.png$/i, ""))));
  console.log(`\n📝 Création de ${toCreate.length} joueurs depuis PNG non matchés (skip: ${unmatched.length - toCreate.length})...`);

  let created = 0, cfail = 0;
  for (const file of toCreate) {
    const { first, last } = parseName(file);
    const { error } = await s.from("players").insert({
      selection_id: sel.id,
      first_name: first,
      last_name: last,
      position: null,
      user_id: null,
      photo_url: URL_PREFIX + file,
    });
    if (error) { console.error(`   ❌ ${file}:`, error.message); cfail++; }
    else { console.log(`   ✓ ${(first + " " + last).trim().padEnd(35)} ← ${file}`); created++; }
  }
  console.log(`✅ ${created} joueurs créés · ${cfail} échecs`);
}
