-- Add all columns required by the UI that may be missing depending on which migrations ran.
-- Safe to run multiple times: uses "if not exists".

-- =============================================================================
-- hospitals: UI has name, address, city, state, country, phone, email
-- =============================================================================
alter table public.hospitals add column if not exists address text;
alter table public.hospitals add column if not exists city text;
alter table public.hospitals add column if not exists state text;
alter table public.hospitals add column if not exists country text;
alter table public.hospitals add column if not exists phone text;
alter table public.hospitals add column if not exists email text;
