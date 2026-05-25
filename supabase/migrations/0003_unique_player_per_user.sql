-- Empêche les doublons de player pour un même user.
-- À appliquer dans le SQL Editor Supabase APRÈS avoir nettoyé les éventuels
-- doublons existants (sinon la contrainte échouera).

alter table public.players
  drop constraint if exists players_user_id_unique,
  add constraint players_user_id_unique unique (user_id);
