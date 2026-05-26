/**
 * AureakForm — calcul du Readiness OVR et des 6 stats FIFA-style
 * à partir des données wellness brutes.
 *
 * Chaque sous-score est ramené sur 0-100. L'OVR final est une
 * moyenne pondérée. Les 6 stats affichées sur la carte sont
 * regroupées par "famille" pour rester lisibles côté joueur.
 */

import type { WellnessStats } from "@/components/aureak/PlayerCard";

export type RawCheckin = {
  sleep_hours: number | null;          // 0..12
  sleep_quality: number | null;        // 1..5
  fatigue: number | null;              // 1..10 (10 = épuisé)
  muscle_soreness: number | null;      // 1..10 (10 = très douloureux)
  stress: number | null;               // 1..5  (5 = très stressé)
  mood: number | null;                 // 1..5  (5 = au top)
  appetite: number | null;             // 1..5  (5 = grand appétit)
  urine_color: number | null;          // 1..8  Armstrong (1=hydraté, 8=déshydraté)
};

/** clamp helper, et normalise une valeur sur 0-100 */
const c = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

/**
 * Inverse une échelle [min..max] → [100..0].
 * Ex: fatigue 1..10  → value=1 ⇒ 100, value=10 ⇒ 0.
 * Ex: urine 1..8     → value=1 ⇒ 100, value=8  ⇒ 0.
 * Ex: stress 1..5    → value=1 ⇒ 100, value=5  ⇒ 0.
 *
 * Anciennement `((max - value + 1) / max) * 100` qui produisait un plancher
 * non nul (ex: value=max ⇒ 1/max au lieu de 0). Corrigé pour ne pas surestimer
 * l'OVR des joueurs en alerte rouge.
 */
const invertScale = (value: number, min: number, max: number) =>
  ((max - value) / (max - min)) * 100;

/**
 * Normalise une échelle [min..max] → [0..100].
 * Ex: mood 1..5 → value=1 ⇒ 0, value=5 ⇒ 100.
 */
const normalScale = (value: number, min: number, max: number) =>
  ((value - min) / (max - min)) * 100;

/** Sleep score : 50% durée (cible 8h), 50% qualité */
export function sleepScore(checkin: RawCheckin): number {
  const hours = checkin.sleep_hours ?? 0;
  const qual = checkin.sleep_quality ?? 0;
  const hoursScore = Math.min(100, (hours / 8) * 100);
  const qualScore = qual > 0 ? normalScale(qual, 1, 5) : 0;
  return c(hoursScore * 0.5 + qualScore * 0.5);
}

export function fatigueScore(c0: RawCheckin): number {
  return c0.fatigue ? c(invertScale(c0.fatigue, 1, 10)) : 50;
}

export function sorenessScore(c0: RawCheckin): number {
  return c0.muscle_soreness ? c(invertScale(c0.muscle_soreness, 1, 10)) : 50;
}

export function stressScore(c0: RawCheckin): number {
  return c0.stress ? c(invertScale(c0.stress, 1, 5)) : 50;
}

export function moodScore(c0: RawCheckin): number {
  return c0.mood ? c(normalScale(c0.mood, 1, 5)) : 50;
}

export function appetiteScore(c0: RawCheckin): number {
  return c0.appetite ? c(normalScale(c0.appetite, 1, 5)) : 50;
}

/**
 * Hydration score depuis la couleur d'urine (Armstrong 1..8).
 * 1 → 100 (bien hydraté), 8 → 0 (déshydraté).
 * Renvoie 50 si non renseigné (rétrocompat checkins pré-migration).
 */
export function hydrationScore(c0: RawCheckin): number {
  return c0.urine_color ? c(invertScale(c0.urine_color, 1, 8)) : 50;
}

/**
 * Les 6 stats affichées sur la carte FIFA, mappées sur les "familles" :
 *  - FOR (Forme générale) = moy. fatigue + mood + appétit
 *  - SOM (Sommeil) = sleepScore
 *  - REC (Récup) = moy. fatigue + soreness + hydratation
 *  - PHY (Physique / douleurs) = sorenessScore
 *  - MEN (Mental / stress) = moy. stress + mood
 *  - REG (Régularité) = calculée séparément (% de check-ins faits sur 7j)
 */
export function statsFromCheckin(
  checkin: RawCheckin,
  regularity = 100
): WellnessStats {
  const fat = fatigueScore(checkin);
  const sor = sorenessScore(checkin);
  const str = stressScore(checkin);
  const moo = moodScore(checkin);
  const app = appetiteScore(checkin);
  const sle = sleepScore(checkin);
  const hyd = hydrationScore(checkin);

  return {
    forme: c((fat + moo + app) / 3),
    sleep: sle,
    recovery: c((fat + sor + hyd) / 3),
    physical: sor,
    mental: c((str + moo) / 2),
    regularity: c(regularity),
  };
}

/**
 * Le Readiness OVR : moyenne pondérée des sous-scores.
 * Pondération choisie pour refléter ce que le staff médical priorise
 * sur une journée donnée (sommeil & récup pèsent le plus).
 */
export function readinessOvr(
  checkin: RawCheckin,
  regularity = 100
): number {
  const s = statsFromCheckin(checkin, regularity);
  const weights = {
    sleep: 0.25,
    recovery: 0.20,
    physical: 0.20,
    forme: 0.15,
    mental: 0.10,
    regularity: 0.10,
  };
  const ovr =
    s.sleep * weights.sleep +
    s.recovery * weights.recovery +
    s.physical * weights.physical +
    s.forme * weights.forme +
    s.mental * weights.mental +
    s.regularity * weights.regularity;
  return c(ovr);
}

/**
 * Régularité sur 7 derniers jours : nb de check-ins / 7 * 100.
 * `dates` = array de dates ISO 'YYYY-MM-DD' des check-ins du joueur.
 */
export function regularity7d(dates: string[]): number {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const recent = dates.filter((d) => {
    const dt = new Date(d);
    return dt >= sevenDaysAgo && dt <= today;
  });
  return c((new Set(recent).size / 7) * 100);
}
