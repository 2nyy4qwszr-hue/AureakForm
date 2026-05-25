-- ============================================================
-- AureakForm — fix récursivité RLS sur public.players
-- À copier-coller dans Supabase > SQL Editor > Run
-- ============================================================

-- 1. La policy "players_read_same_selection" du 0001 contenait une auto-référence
--    `select ... from public.players where user_id = auth.uid()` à l'intérieur
--    de sa clause USING — Postgres bloque (infinite recursion).
--    On la drop.
drop policy if exists "players_read_same_selection" on public.players;

-- 2. On crée un helper SECURITY DEFINER qui contourne RLS pour la lookup.
create or replace function public.my_selection_id() returns uuid
  language sql stable security definer set search_path = public as $$
    select selection_id from public.players where user_id = auth.uid() limit 1;
  $$;

-- 3. On recrée la policy en s'appuyant sur le helper (plus de récursion).
drop policy if exists "players_read_same_selection_v2" on public.players;
create policy "players_read_same_selection_v2" on public.players
  for select using (selection_id = public.my_selection_id());
