-- Ajoute la couleur d'urine (échelle Armstrong 1-8) au check-in matin.
-- 1 = très clair / bien hydraté, 8 = ambre foncé / déshydraté.
-- Utilisé par lib/readiness.ts pour pondérer la stat "récup" (REC) avec
-- fatigue + soreness + hydratation.
alter table public.daily_checkins
  add column if not exists urine_color int
    check (urine_color is null or (urine_color between 1 and 8));

comment on column public.daily_checkins.urine_color is
  'Échelle Armstrong 1-8 : 1=transparent (bien hydraté), 8=ambre foncé (déshydraté). NULL si non renseigné (rétrocompat).';
