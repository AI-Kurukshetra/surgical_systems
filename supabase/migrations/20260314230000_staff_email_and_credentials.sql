-- Add email to staff for login credentials
alter table public.staff add column if not exists email text;
