create extension if not exists pgcrypto;

create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  state text,
  country text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

alter table public.hospitals add column if not exists address text;
alter table public.hospitals add column if not exists city text;
alter table public.hospitals add column if not exists state text;
alter table public.hospitals add column if not exists country text;
alter table public.hospitals add column if not exists phone text;
alter table public.hospitals add column if not exists email text;
alter table public.hospitals add column if not exists created_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'hospitals'
      and column_name = 'code'
  ) then
    execute 'alter table public.hospitals alter column code drop not null';
    execute 'alter table public.hospitals alter column code set default ''HOSP-'' || upper(substring(replace(gen_random_uuid()::text, ''-'', '''') from 1 for 8))';
  end if;
end $$;
