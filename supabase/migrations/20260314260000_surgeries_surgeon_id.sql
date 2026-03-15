-- Add surgeon_id to surgeries so a surgeon can be assigned when creating a surgery schedule.
-- Safe to run: uses "if not exists" for the column.
alter table public.surgeries
add column if not exists surgeon_id uuid references public.surgeons (id) on delete set null;

create index if not exists idx_surgeries_surgeon_id on public.surgeries (surgeon_id);