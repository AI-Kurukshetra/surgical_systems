-- Align equipment table with /api/equipment POST (name, hospital_id, status).
-- Safe to run: adds columns if missing, relaxes NOT NULL where needed.

-- Add status column if missing (used by API and UI)
alter table public.equipment
  add column if not exists status text check (status in ('available', 'in_use', 'maintenance'));

-- Add code column if missing (some schemas have it as NOT NULL; we add as nullable for API compatibility)
alter table public.equipment
  add column if not exists code text;

-- Allow nullable hospital_id so API can create equipment without a hospital
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'equipment' and column_name = 'hospital_id'
  ) then
    alter table public.equipment alter column hospital_id drop not null;
  end if;
end $$;

-- Allow nullable code if column exists (so API does not need to send code)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'equipment' and column_name = 'code'
  ) then
    alter table public.equipment alter column code drop not null;
  end if;
end $$;

-- Ensure name can be set (some schemas have name not null; we keep it; API requires name)
-- No change needed for name.

-- Update RLS policy to allow equipment with null hospital_id (only if this policy exists, e.g. init_smartor)
do $$
begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'equipment' and policyname = 'equipment hospital scoped') then
    drop policy "equipment hospital scoped" on public.equipment;
    create policy "equipment hospital scoped" on public.equipment
    for all to authenticated
    using (
      hospital_id is null
      or hospital_id = public.user_hospital_id()
      or public.has_any_role(array['admin', 'scheduler'])
    )
    with check (
      hospital_id is null
      or hospital_id = public.user_hospital_id()
      or public.has_any_role(array['admin', 'scheduler'])
    );
  end if;
end $$;
