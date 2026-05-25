# AureakForm 🇧🇮

Module wellness pour le football haut niveau — tracker de forme, sommeil et blessures
pour une sélection nationale du Burundi. Esthétique carte FIFA Ultimate Team,
PWA installable, mobile-first.

## Stack

- **Next.js 16.2.6** (App Router + Turbopack)
- **React 19** + **TypeScript 5**
- **Tailwind CSS v4** + **shadcn/ui v4** (preset Nova)
- **Motion 12** (ex-Framer Motion, import `motion/react`)
- **Supabase** (Postgres + Auth + RLS) via `@supabase/ssr`
- **@react-pdf/renderer 4** + **Resend 6** pour les exports PDF par mail
- **Recharts** pour les courbes et radar
- **Vercel** pour le déploiement + cron quotidien

## Setup local

```bash
# 1. installer les deps (déjà fait via create-next-app)
npm install

# 2. configurer les variables d'env
cp .env.example .env.local
# → remplir les valeurs Supabase + Resend

# 3. appliquer les migrations SQL dans Supabase
# Ouvrir Supabase > SQL Editor, puis paste à la suite :
#   supabase/migrations/0001_init.sql
#   supabase/migrations/0002_staff.sql

# 4. seed initial (sélection Burundi)
node scripts/seed.mjs

# 5. dev server
npm run dev
# → http://localhost:3000
```

## Premier login + promotion staff

```bash
# 1. se rendre sur /login depuis un navigateur
# 2. demander le magic link sur ton email
# 3. cliquer le lien → onboarding → home

# pour devenir staff/admin (voir tous les joueurs) :
node scripts/promote-staff.mjs ton.email@aureak.be
# → reload une page, accès à /staff
```

## Structure

```
app/
├── login/                  ← magic link
├── auth/callback/          ← OAuth callback
├── onboarding/             ← création carte joueur (1er login)
├── page.tsx (= /)          ← home joueur : carte FIFA + check-in du jour
├── checkin/                ← flow 7 écrans wellness
├── post-session/           ← RPE Borg + kiff + perf
├── injury/                 ← silhouette tap-to-select + intensité
├── me/                     ← radar 6 stats + courbe OVR 30j
├── profile/                ← infos + logout
├── demo/                   ← preview wireframe des 4 tiers
├── staff/                  ← layout sécurisé staff (requireStaff())
│   ├── page.tsx            ← squad en mosaïque
│   ├── alerts/             ← blessures + readiness bas
│   ├── player/[id]/        ← fiche joueur détaillée
│   └── export/             ← PDF download + email
└── api/
    ├── report/daily/       ← GET → PDF du jour
    ├── report/daily/email/ ← POST → envoi mail via Resend
    └── cron/daily-report/  ← endpoint cron Vercel (protégé par CRON_SECRET)

components/aureak/
├── PlayerCard.tsx          ← carte FIFA 4 tiers (gold/silver/bronze/special)
├── BurundiFlag.tsx         ← drapeau SVG inline
├── BodySilhouette.tsx      ← SVG corps face/dos + zones tactiles
├── CheckinFlow.tsx         ← flow 7 écrans avec swipes Motion
├── BigSlider.tsx           ← input slider gradient
├── EmojiPicker.tsx         ← grid émojis 1-5
├── StatsRadar.tsx          ← radar Recharts 6 axes
├── EvolutionChart.tsx      ← courbe ligne Recharts
└── BottomTabBar.tsx        ← nav mobile sticky bottom

lib/
├── supabase/               ← clients server + browser via @supabase/ssr
├── readiness.ts            ← formule OVR + 6 stats wellness
├── staff.ts                ← guard requireStaff()
├── types.ts                ← types lignes Supabase
├── pdf/DailyReport.tsx     ← composant @react-pdf
└── report.tsx              ← agrégation données + stream PDF
```

## Le score Readiness (OVR)

L'OVR (0-100) est une moyenne pondérée à partir du daily check-in :

| Sous-score | Calcul                                  | Poids |
|------------|------------------------------------------|-------|
| Sommeil    | 50% durée (cible 8h) + 50% qualité       | 25%   |
| Récup      | (fatigue + douleurs) / 2 inversés        | 20%   |
| Physique   | douleurs musc. inversées                 | 20%   |
| Forme      | (fatigue + humeur + appétit) / 3         | 15%   |
| Mental     | (stress inversé + humeur) / 2            | 10%   |
| Régularité | check-ins / 7 derniers jours             | 10%   |

Tiers de carte : Bronze `<60` (alerte) · Argent `60-74` · Or `75-87` · Spécial `88+` (TOTW).

## Déploiement Vercel

```bash
# 1. push sur GitHub
git remote add origin git@github.com:youraccount/aureakform.git
git push -u origin main

# 2. import sur vercel.com → branchera auto
# 3. ajouter les env vars dans Vercel (mêmes que .env.local + CRON_SECRET)
# 4. déploiement auto à chaque push

# Le cron quotidien (vercel.json) tournera à 20h UTC = 22h Bujumbura.
```

## Schéma Supabase

5 tables principales : `selections`, `players`, `daily_checkins`, `post_session`, `injuries`.
+ `staff` pour les permissions.

RLS activé partout, policies basées sur `auth.uid()` :
- Un joueur voit sa propre data + ses collègues de sélection
- Un staff voit tout dans sa sélection (via `is_staff_of()` SECURITY DEFINER)
- Les inserts joueur sont contraints à `user_id = auth.uid()`

## Scripts utiles

```bash
node scripts/seed.mjs                  # crée la sélection Burundi (idempotent)
node scripts/promote-staff.mjs <email> # promeut un user en admin
npm run dev                            # dev server (Turbopack)
npm run build && npm start             # prod local
```

## TODO post-MVP

- Photo joueur (Supabase Storage)
- Notifs push (web push API)
- Comparaison équipe (top 3 / bottom 3 par poste)
- Tests Yo-Yo / CMJ périodiques
- Historique blessures avec "resolved by staff"
- SMTP custom pour magic links Supabase prod
