-- ============================================================
-- AureakForm — initial schema
-- Run this in your Supabase project SQL Editor (one shot).
-- ============================================================

-- 1. SELECTIONS (équipes / sélections)
create table if not exists public.selections (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  country_code  text default 'BI',          -- Burundi 🇧🇮
  created_at    timestamptz default now()
);

-- 2. PLAYERS
create table if not exists public.players (
  id             uuid primary key default gen_random_uuid(),
  selection_id   uuid references public.selections(id) on delete cascade,
  user_id        uuid references auth.users(id) on delete set null,
  first_name     text not null,
  last_name      text not null,
  position       text check (position in ('GK','DEF','MIL','ATT')),
  jersey_number  int,
  photo_url      text,
  date_of_birth  date,
  created_at     timestamptz default now()
);
create index if not exists players_selection_idx on public.players(selection_id);
create index if not exists players_user_idx      on public.players(user_id);

-- 3. DAILY CHECK-INS (le wellness du matin)
create table if not exists public.daily_checkins (
  id                uuid primary key default gen_random_uuid(),
  player_id         uuid references public.players(id) on delete cascade,
  date              date not null default current_date,
  sleep_hours       numeric(3,1),                                   -- 0.0 → 12.0
  sleep_quality     int check (sleep_quality   between 1 and 5),
  fatigue           int check (fatigue         between 1 and 10),
  muscle_soreness   int check (muscle_soreness between 1 and 10),
  soreness_zone     text,                                           -- ex: "calf-left"
  stress            int check (stress   between 1 and 5),
  mood              int check (mood     between 1 and 5),
  appetite          int check (appetite between 1 and 5),
  readiness_score   int,                                            -- OVR 0-100 calculé
  created_at        timestamptz default now(),
  unique (player_id, date)
);
create index if not exists checkins_player_date_idx on public.daily_checkins(player_id, date desc);

-- 4. POST-SESSION (post-séance ou post-match)
create table if not exists public.post_session (
  id                uuid primary key default gen_random_uuid(),
  player_id         uuid references public.players(id) on delete cascade,
  session_date      date not null default current_date,
  session_type      text check (session_type in ('training','match')),
  rpe               int check (rpe              between 1 and 10),  -- Borg CR10
  enjoyment         int check (enjoyment        between 1 and 5),
  self_performance  int check (self_performance between 1 and 5),
  minutes           int,
  created_at        timestamptz default now()
);
create index if not exists session_player_date_idx on public.post_session(player_id, session_date desc);

-- 5. INJURIES (déclarations de blessure)
create table if not exists public.injuries (
  id           uuid primary key default gen_random_uuid(),
  player_id    uuid references public.players(id) on delete cascade,
  declared_at  timestamptz default now(),
  body_part    text not null,                                       -- ex: "knee", "calf"
  body_side    text check (body_side in ('left','right','center')),
  body_view    text check (body_view in ('front','back')),
  type         text check (type in ('contracture','douleur','coup','autre')),
  intensity    int  check (intensity between 1 and 10),
  comment      text,
  resolved_at  timestamptz
);
create index if not exists injuries_player_idx on public.injuries(player_id, declared_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.selections     enable row level security;
alter table public.players        enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.post_session   enable row level security;
alter table public.injuries       enable row level security;

-- A player can read its OWN row via the user_id link
drop policy if exists "players_read_self" on public.players;
create policy "players_read_self" on public.players
  for select using (auth.uid() = user_id);

-- A player can read everyone in the SAME selection (for squad view)
-- ⚠️ Doit utiliser un helper SECURITY DEFINER pour éviter l'auto-récursion.
-- Le helper est créé / mis à jour dans 0004_fix_rls_recursion.sql.
-- En attendant que 0004 soit appliqué on ne crée pas la policy ici (elle vivra dans 0004).

-- An authenticated user can create their OWN player row (first-login profile)
drop policy if exists "players_insert_self" on public.players;
create policy "players_insert_self" on public.players
  for insert with check (auth.uid() = user_id);

-- A player can update their OWN player row (photo, name, etc.)
drop policy if exists "players_update_self" on public.players;
create policy "players_update_self" on public.players
  for update using (auth.uid() = user_id);

drop policy if exists "checkins_owner_all" on public.daily_checkins;
create policy "checkins_owner_all" on public.daily_checkins
  for all using (
    auth.uid() = (select user_id from public.players where id = player_id)
  );

drop policy if exists "session_owner_all" on public.post_session;
create policy "session_owner_all" on public.post_session
  for all using (
    auth.uid() = (select user_id from public.players where id = player_id)
  );

drop policy if exists "injuries_owner_all" on public.injuries;
create policy "injuries_owner_all" on public.injuries
  for all using (
    auth.uid() = (select user_id from public.players where id = player_id)
  );

-- Selections : readable by any authenticated user (so player sees their squad name)
drop policy if exists "selections_read_auth" on public.selections;
create policy "selections_read_auth" on public.selections
  for select using (auth.role() = 'authenticated');

-- NOTE staff : pour les policies "staff voit tout", on créera une table
-- `staff (user_id, selection_id, role)` et on ajoutera les policies basées dessus en J4.
