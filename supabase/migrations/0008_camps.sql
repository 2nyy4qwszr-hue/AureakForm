-- ============================================================
-- AureakForm — camps (stages de l'équipe nationale)
-- Un camp = nom + période (start_date, end_date) + liste de joueurs
-- convoqués. Permet de filtrer toutes les vues /staff sur les joueurs
-- du stage et la fenêtre temporelle correspondante.
-- ============================================================

create table if not exists public.camps (
  id            uuid primary key default gen_random_uuid(),
  selection_id  uuid not null references public.selections(id) on delete cascade,
  name          text not null,
  start_date    date not null,
  end_date      date not null,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz default now(),
  constraint camps_dates_valid check (end_date >= start_date)
);

create index if not exists camps_selection_idx
  on public.camps(selection_id, start_date desc);

create table if not exists public.camp_players (
  camp_id    uuid not null references public.camps(id) on delete cascade,
  player_id  uuid not null references public.players(id) on delete cascade,
  added_at   timestamptz default now(),
  primary key (camp_id, player_id)
);

create index if not exists camp_players_player_idx
  on public.camp_players(player_id);

-- RLS
alter table public.camps enable row level security;
alter table public.camp_players enable row level security;

-- Staff lit/écrit les camps de sa sélection
drop policy if exists "camps_staff_all" on public.camps;
create policy "camps_staff_all" on public.camps
  for all using (public.is_staff_of(selection_id))
  with check (public.is_staff_of(selection_id));

-- Staff lit/écrit la liste des convoqués pour les camps de sa sélection
drop policy if exists "camp_players_staff_all" on public.camp_players;
create policy "camp_players_staff_all" on public.camp_players
  for all using (
    public.is_staff_of(
      (select selection_id from public.camps where id = camp_id)
    )
  )
  with check (
    public.is_staff_of(
      (select selection_id from public.camps where id = camp_id)
    )
  );
