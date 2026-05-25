-- ============================================================
-- AureakForm — fix récursivité RLS sur public.staff
-- À copier-coller dans Supabase > SQL Editor > Run
-- ============================================================

-- 1. Drop l'ancienne policy récursive (elle lisait staff depuis dans staff)
drop policy if exists "staff_read_same_selection" on public.staff;

-- 2. Le strict minimum : un user peut lire SA propre ligne staff.
--    C'est tout ce que requireStaff() a besoin pour déterminer si le user est staff.
drop policy if exists "staff_read_self" on public.staff;
create policy "staff_read_self" on public.staff
  for select using (user_id = auth.uid());

-- 3. Bonus : un staff peut lire tous les autres staff de sa propre sélection.
--    Cette fois on s'appuie sur le helper SECURITY DEFINER my_selection_id_staff(),
--    qui bypasses RLS pour la lookup interne et évite la récursion.
create or replace function public.my_staff_selection_id() returns uuid
  language sql stable security definer set search_path = public as $$
    select selection_id from public.staff where user_id = auth.uid() limit 1;
  $$;

drop policy if exists "staff_read_same_selection_v2" on public.staff;
create policy "staff_read_same_selection_v2" on public.staff
  for select using (selection_id = public.my_staff_selection_id());
