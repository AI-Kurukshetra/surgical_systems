-- Add patient_id to surgeries so a patient can be selected when creating a surgery schedule.
-- Safe to run: uses "if not exists" for the column.

alter table public.surgeries
  add column if not exists patient_id uuid references public.patients(id) on delete set null;

create index if not exists idx_surgeries_patient_id on public.surgeries(patient_id);
