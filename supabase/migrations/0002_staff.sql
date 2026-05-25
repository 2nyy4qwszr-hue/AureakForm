-- ============================================================
-- AureakForm — staff & policies
-- Run in Supabase SQL Editor after 0001_init.sql
-- Idempotent : peut être re-run sans danger.
-- ============================================================

create table if not exists public.staff (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  selection_id  uuid references public.selections(id) on delete cascade,
  role          text default 'staff' check (role in ('staff','coach','admin','medical')),
  display_name  text,
  created_at    timestamptz default now()
);

alter table public.staff enable row level security;

-- Tout staff peut lire la liste des staff de sa propre sélection
drop policy if exists "staff_read_same_selection" on public.staff;
create policy "staff_read_same_selection" on public.staff
  for select using (
    selection_id in (
      select selection_id from public.staff where user_id = auth.uid()
    )
  );

-- Helper Postgres pour les autres policies : est-ce que je suis staff de la sélection X ?
create or replace function public.is_staff_of(sel_id uuid) returns boolean
  language sql stable security definer as $$
    select exists (
      select 1 from public.staff
      where user_id = auth.uid() and selection_id = sel_id
    );
  $$;

-- Le staff voit tous les joueurs de sa sélection
drop policy if exists "players_read_staff" on public.players;
create policy "players_read_staff" on public.players
  for select using (public.is_staff_of(selection_id));

-- Le staff voit tous les check-ins des joueurs de sa sélection
drop policy if exists "checkins_read_staff" on public.daily_checkins;
create policy "checkins_read_staff" on public.daily_checkins
  for select using (
    public.is_staff_of(
      (select selection_id from public.players where id = player_id)
    )
  );

-- Le staff voit toutes les post-séances
drop policy if exists "session_read_staff" on public.post_session;
create policy "session_read_staff" on public.post_session
  for select using (
    public.is_staff_of(
      (select selection_id from public.players where id = player_id)
    )
  );

-- Le staff voit toutes les blessures + peut marquer "resolved"
drop policy if exists "injuries_read_staff" on public.injuries;
create policy "injuries_read_staff" on public.injuries
  for select using (
    public.is_staff_of(
      (select selection_id from public.players where id = player_id)
    )
  );

drop policy if exists "injuries_update_staff" on public.injuries;
create policy "injuries_update_staff" on public.injuries
  for update using (
    public.is_staff_of(
      (select selection_id from public.players where id = player_id)
    )
  );
