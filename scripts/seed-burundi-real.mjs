/**
 * Seed des vrais joueurs de la sélection Burundi (source : Footmercato).
 * + Crée un staff "Cédric" (kiné, role=medical).
 *
 * Comportement :
 *   1. Supprime les FAUX joueurs (= ceux sans user_id) sur la sélection Burundi
 *   2. Upsert chaque joueur réel (par first+last+selection)
 *   3. Crée un user auth.users pour Cédric s'il n'existe pas, puis sa ligne staff
 *
 *   node scripts/seed-burundi-real.mjs
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

// ─── Sélection Burundi ────────────────────────────────────────────
const { data: sel } = await s.from("selections").select("id,name").limit(1).single();
if (!sel) { console.error("❌ Aucune sélection. Lance d'abord scripts/seed.mjs"); process.exit(1); }
console.log(`📋 Sélection : ${sel.name}\n`);

// ─── Roster réel (source : footmercato.net/selection/burundi/effectif) ───
const ROSTER = [
  // GK
  { first: "Jonathan",         last: "Nahimana",        position: "GK"  },
  { first: "Justin",           last: "Ndikumana",       position: "GK"  },
  { first: "Mattéo",           last: "Nkurunziza",      position: "GK"  },
  { first: "Aladin Rodrigue",  last: "Bizimana",        position: "GK"  },
  { first: "Onésime",          last: "Rukundo",         position: "GK"  },
  // DEF
  { first: "Olivier",          last: "Dushime",         position: "DEF" },
  { first: "Patrick",          last: "Mutimana",        position: "DEF" },
  { first: "Jamir Matheo Aziz",last: "Naudts",          position: "DEF" },
  { first: "Abdoul",           last: "Manirakoze",      position: "DEF" },
  { first: "Derrick",          last: "Mukombozi",       position: "DEF" },
  { first: "Akbar",            last: "Muderi",          position: "DEF" },
  { first: "Franck",           last: "Nduwimana",       position: "DEF" },
  { first: "Saïdi Ntibazonkiza",last: "Likati",         position: "DEF" },
  { first: "Vancy Roméo",      last: "Mabanza",         position: "DEF" },
  { first: "Youssouf",         last: "Ndayishimiye",    position: "DEF" },
  { first: "Claus Babo",       last: "Niyukuri",        position: "DEF" },
  { first: "Aime Vaillance",   last: "Nihorimbere",     position: "DEF" },
  { first: "Eric",             last: "Ndizeye",         position: "DEF" },
  { first: "Richard Bazombwa", last: "Kirongozi",       position: "DEF" },
  { first: "Kevin",            last: "Icoyitungiye",    position: "DEF" },
  { first: "Abdourahmani",     last: "Rukundo",         position: "DEF" },
  { first: "Frédéric",         last: "Nsabiyumva",      position: "DEF" },
  { first: "Keita",            last: "Bukuru",          position: "DEF" },
  { first: "Moussa",           last: "Muryango",        position: "DEF" },
  { first: "Christophe Lucio", last: "Nduwarugira",     position: "DEF" },
  // MIL
  { first: "Lucien",           last: "Delaigle",        position: "MIL" },
  { first: "Marco",            last: "Weymans",         position: "MIL" },
  { first: "Pacifique",        last: "Niyongabire",     position: "MIL" },
  { first: "Gaël",             last: "Bigirimana",      position: "MIL" },
  { first: "Aruna Moussa",     last: "Madjaliwa",       position: "MIL" },
  { first: "David Richard",    last: "Ndayishimiye",    position: "MIL" },
  { first: "Yannick",          last: "Nkurunziza",      position: "MIL" },
  { first: "Trésor Ngabo",     last: "Mossi",           position: "MIL" },
  { first: "Emmanuel Manou",   last: "Mvuyekure",       position: "MIL" },
  { first: "Hussein Shabalala",last: "Shabani",         position: "MIL" },
  { first: "Karim",            last: "Kamana",          position: "MIL" },
  { first: "Shassiri",         last: "Nahimana",        position: "MIL" },
  { first: "Jordi",            last: "Liongola",        position: "MIL" },
  { first: "Parfait",          last: "Bizoza",          position: "MIL" },
  { first: "Ismail",           last: "Nshimirimana",    position: "MIL" },
  { first: "Leonard",          last: "Gakwaya",         position: "MIL" },
  { first: "Bonfils-Caleb",    last: "Bimenyimana",     position: "MIL" },
  { first: "Beltran",          last: "Mvuka",           position: "MIL" },
  { first: "Omar",             last: "Moussa",          position: "MIL" },
  { first: "Omar Mbanza Mussa",last: "Rukundo",         position: "MIL" },
  { first: "Aaron",            last: "Musore",          position: "MIL" },
  { first: "Jospin",           last: "Nshimirimana",    position: "MIL" },
  { first: "Mike Sudi",        last: "Abdallah",        position: "MIL" },
  { first: "Irakoze",          last: "Donasiyano",      position: "MIL" },
  { first: "Abedi",            last: "Bigirimana",      position: "MIL" },
  // ATT
  { first: "Mohamed",          last: "Amissi",          position: "ATT" },
  { first: "Jean Claude",      last: "Girumugisha",     position: "ATT" },
  { first: "Fiston",           last: "Abdul Razak",     position: "ATT" },
  { first: "Elvis",            last: "Kamsoba",         position: "ATT" },
  { first: "Mokono Élie",      last: "Eldhino",         position: "ATT" },
  { first: "Henry",            last: "Msanga",          position: "ATT" },
  { first: "Bienvenue",        last: "Kanakimana",      position: "ATT" },
];

// ─── 1. Suppression des faux joueurs (user_id = null, hors sélection Burundi ou pas) ───
//   On garde ceux avec un user_id (= vrais comptes joueurs réels qui ont signé up).
const { data: fakes } = await s.from("players").select("id,first_name,last_name").is("user_id", null);
console.log(`🗑️  Suppression de ${fakes?.length ?? 0} faux joueurs (sans user_id)...`);
for (const f of fakes ?? []) {
  await s.from("players").delete().eq("id", f.id);
}

// ─── 2. Upsert des joueurs réels ───
//   On utilise first_name + last_name + selection_id comme clé de déduplication (côté code).
console.log(`👥 Insertion des ${ROSTER.length} joueurs du roster Burundi...`);
let added = 0, skipped = 0;
for (const p of ROSTER) {
  const { data: existing } = await s.from("players")
    .select("id").eq("selection_id", sel.id)
    .eq("first_name", p.first).eq("last_name", p.last).limit(1);
  if (existing && existing.length > 0) { skipped++; continue; }
  const { error } = await s.from("players").insert({
    selection_id: sel.id,
    first_name: p.first,
    last_name: p.last,
    position: p.position,
    user_id: null,
  });
  if (error) console.error(`   ❌ ${p.first} ${p.last}:`, error.message);
  else added++;
}
console.log(`   ✓ ${added} ajoutés · ${skipped} déjà présents`);

// ─── 3. Staff Cédric (kiné = role 'medical') ───
const CEDRIC_EMAIL = "cedric.kine@aureak.be";
console.log(`\n🩺 Création staff kiné : Cédric (${CEDRIC_EMAIL})`);

// 3a. trouver ou créer l'auth user
const { data: { users } } = await s.auth.admin.listUsers();
let cedric = users.find((u) => u.email?.toLowerCase() === CEDRIC_EMAIL);
if (!cedric) {
  const { data: created, error: cErr } = await s.auth.admin.createUser({
    email: CEDRIC_EMAIL,
    email_confirm: true, // bypass email confirmation
  });
  if (cErr) { console.error("❌ Création user :", cErr.message); process.exit(1); }
  cedric = created.user;
  console.log(`   ✓ Auth user créé (id=${cedric.id})`);
} else {
  console.log(`   ↪ Auth user déjà présent (id=${cedric.id})`);
}

// 3b. upsert ligne staff
const { error: sErr } = await s.from("staff").upsert({
  user_id: cedric.id,
  selection_id: sel.id,
  role: "medical",
  display_name: "Cédric (Kiné)",
}, { onConflict: "user_id" });
if (sErr) { console.error("❌ Staff :", sErr.message); process.exit(1); }
console.log(`   ✓ Staff "Cédric (Kiné)" rattaché à ${sel.name}`);

console.log(`\n✅ Seed complète terminée.`);
console.log(`   → Reload http://localhost:3000/staff (57 joueurs visibles)`);
console.log(`   → Pour te logger comme Cédric : node scripts/dev-login.mjs ${CEDRIC_EMAIL} /staff`);
