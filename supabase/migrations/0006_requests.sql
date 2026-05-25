-- ============================================================
-- AureakForm — demandes du staff aux joueurs
-- Le staff envoie une demande (check-in matin / post-séance) à toute
-- la sélection. Les joueurs voient un banner sur leur home.
-- ============================================================

create table if not exists public.requests (
  id            uuid primary key default gen_random_uuid(),
  selection_id  uuid references public.selections(id) on delete cascade,
  kind          text not null check (kind in ('morning_checkin', 'post_session')),
  title         text,
  message       text,
  -- contexte libre : pour post_session p.ex. { session_type: 'match', opponent: 'Sénégal', minutes: 90 }
  context       jsonb,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz default now(),
  due_at        timestamptz,
  active        boolean default true
);

create index if not exists requests_selection_idx
  on public.requests(selection_id, active, created_at desc);

alter table public.requests enable row level security;

-- Tout user (joueur ou staff) de la sélection peut LIRE les demandes
drop policy if exists "requests_read_in_selection" on public.requests;
create policy "requests_read_in_selection" on public.requests
  for select using (
    selection_id = public.my_selection_id()
    OR public.is_staff_of(selection_id)
  );

-- Seul le staff peut créer / modifier / désactiver
drop policy if exists "requests_write_staff" on public.requests;
create policy "requests_write_staff" on public.requests
  for all using (public.is_staff_of(selection_id))
  with check (public.is_staff_of(selection_id));
