# AureakForm — notes pour les futurs agents

## Quick context

AureakForm est un module wellness pour football haut niveau, ciblé sur la **sélection nationale du Burundi 🇧🇮** (pilote ~20-25 joueurs). C'est un spin-off de l'écosystème AUREAK (voir `~/Documents/Claude-projets/Application Aureak/`).

L'esthétique cible est la **carte FIFA Ultimate Team** : 4 tiers (Bronze/Argent/Or/Spécial TOTW) calculés depuis un Readiness OVR 0-100.

## Stack lockée (24 mai 2026)

- Next.js **16.2.6** (Turbopack), React **19.2.4**, TS 5
- Tailwind **v4** (config CSS via `@theme`, pas de `tailwind.config.js`)
- shadcn/ui **v4** preset **Nova** (Lucide icons, Geist font)
- **Motion 12.40** — import `motion/react`, plus `framer-motion`
- Supabase JS **2.106**, @supabase/ssr
- @react-pdf/renderer **4.5**
- Resend **6.12**
- Recharts 2.x

## Pièges Next 16

⚠️ Le fichier `middleware.ts` est renommé `proxy.ts` et la fonction exportée doit s'appeler `proxy` (pas `middleware`). Sinon le serveur plante au runtime. Voir [doc officielle](https://nextjs.org/docs/messages/middleware-to-proxy).

## Conventions de ce projet

- **Mobile-first strict** sur tous les écrans joueur (`/`, `/checkin`, etc.). Le staff (`/staff/*`) est responsive desktop d'abord.
- **Server Components par défaut**, Client Components seulement quand interactivité ou Motion. Marquer `"use client"` en tête de fichier.
- **Server Actions** pour toutes les mutations (`actions.ts` à côté de la page).
- **RLS Supabase** sur toutes les tables — jamais désactivé. Le service_role est utilisé uniquement dans `scripts/*` et dans les routes API serveur (PDF report, cron).
- **Pas de `tailwind.config.js`** — tout dans `app/globals.css` via `@theme`.
- Les **polices custom** (Bebas Neue, Oswald) sont chargées via `next/font/google` dans `app/layout.tsx` et exposées en CSS vars `--font-bebas` / `--font-oswald`. Utilisation : `className="font-[family-name:var(--font-bebas)]"`.
- Les **gradients FIFA** des cartes sont en `style={{ background: ... }}` inline (pas exprimables proprement en Tailwind).

## Couleurs identifiantes

| | hex |
|---|---|
| BG sombre | `#0a0e1a` |
| Panel | `#131826` |
| Or (CTA + accent) | `#c9a44b` |
| Vert succès | `#2bd47d` |
| Orange warning | `#ffa42b` |
| Rouge alerte | `#ff4d5e` |
| Bleu post-séance | `#00aaff` → `#0072ff` |

## Le score Readiness

Formule complète dans `lib/readiness.ts`. C'est une moyenne pondérée 0-100 :
- Sommeil 25%, Récup 20%, Physique 20%, Forme 15%, Mental 10%, Régularité 10%

Le tier de la carte (Bronze/Argent/Or/Spécial) découle directement de l'OVR (`tierFromOvr` dans `PlayerCard.tsx`).

## Workflow tâches

Le projet a été construit en 4 phases via TaskCreate/TaskUpdate : J1 fondations, J2-3 player app, J4-5 staff dashboard, J6 PDF + deploy. Voir `MEMORY.md` à la racine du dossier memory pour le contexte d'origine.

## Pour debugger

```bash
# logs dev server
tail -f /tmp/aureakform-dev.log

# état Supabase
node scripts/seed.mjs   # re-seed (idempotent)

# test PDF en local
curl http://localhost:3000/api/report/daily > /tmp/test.pdf && open /tmp/test.pdf
```
