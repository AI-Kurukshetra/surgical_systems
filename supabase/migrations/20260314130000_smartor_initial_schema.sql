-- SmartOR initial schema
-- Compatible with Supabase SQL editor

create extension if not exists pgcrypto;

-- 1) hospitals
create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  created_at timestamptz not null default now()
);

-- 2) profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text check (role in ('admin', 'scheduler', 'surgeon', 'staff')),
  hospital_id uuid references public.hospitals(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 3) departments
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references public.hospitals(id) on delete cascade,
  name text,
  created_at timestamptz not null default now()
);

-- 4) operating_rooms
create table if not exists public.operating_rooms (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references public.hospitals(id) on delete cascade,
  room_name text,
  status text check (status in ('available', 'in_surgery', 'cleaning', 'maintenance')),
  created_at timestamptz not null default now()
);

-- 5) patients
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  dob date,
  gender text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

-- 6) surgeons
create table if not exists public.surgeons (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references public.hospitals(id) on delete cascade,
  name text,
  specialization text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

-- 7) staff
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references public.hospitals(id) on delete cascade,
  name text,
  role text,
  created_at timestamptz not null default now()
);

-- 8) case_requests
create table if not exists public.case_requests (
  id uuid primary key default gen_random_uuid(),
  surgeon_id uuid references public.surgeons(id) on delete set null,
  patient_id uuid references public.patients(id) on delete set null,
  procedure_name text,
  requested_date timestamptz,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- 9) surgeries
create table if not exists public.surgeries (
  id uuid primary key default gen_random_uuid(),
  case_request_id uuid references public.case_requests(id) on delete set null,
  operating_room_id uuid references public.operating_rooms(id) on delete set null,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  status text check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- 10) staff_assignments
create table if not exists public.staff_assignments (
  id uuid primary key default gen_random_uuid(),
  surgery_id uuid references public.surgeries(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 11) equipment
create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references public.hospitals(id) on delete cascade,
  name text,
  status text check (status in ('available', 'in_use', 'maintenance')),
  created_at timestamptz not null default now()
);

-- 12) equipment_assignments
create table if not exists public.equipment_assignments (
  id uuid primary key default gen_random_uuid(),
  surgery_id uuid references public.surgeries(id) on delete cascade,
  equipment_id uuid references public.equipment(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 13) notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  message text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 14) documents
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  surgery_id uuid references public.surgeries(id) on delete cascade,
  file_url text,
  created_at timestamptz not null default now()
);

-- Required indexes
create index if not exists idx_surgeries_operating_room_id on public.surgeries(operating_room_id);
create index if not exists idx_surgeries_scheduled_start on public.surgeries(scheduled_start);
create index if not exists idx_case_requests_surgeon_id on public.case_requests(surgeon_id);
create index if not exists idx_patients_last_name on public.patients(last_name);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.hospitals enable row level security;
alter table public.departments enable row level security;
alter table public.operating_rooms enable row level security;
alter table public.patients enable row level security;
alter table public.surgeons enable row level security;
alter table public.staff enable row level security;
alter table public.case_requests enable row level security;
alter table public.surgeries enable row level security;
alter table public.staff_assignments enable row level security;
alter table public.equipment enable row level security;
alter table public.equipment_assignments enable row level security;
alter table public.notifications enable row level security;
alter table public.documents enable row level security;

-- Required RLS policies

-- profiles: users can read and update their own profile
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Optional but practical: allow users to insert their own profile row
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

-- hospitals: authenticated users can read
create policy "hospitals_select_authenticated"
on public.hospitals
for select
to authenticated
using (true);

-- patients: authenticated users can CRUD
create policy "patients_select_authenticated"
on public.patients
for select
to authenticated
using (true);

create policy "patients_insert_authenticated"
on public.patients
for insert
to authenticated
with check (true);

create policy "patients_update_authenticated"
on public.patients
for update
to authenticated
using (true)
with check (true);

create policy "patients_delete_authenticated"
on public.patients
for delete
to authenticated
using (true);

-- surgeries: authenticated users can CRUD
create policy "surgeries_select_authenticated"
on public.surgeries
for select
to authenticated
using (true);

create policy "surgeries_insert_authenticated"
on public.surgeries
for insert
to authenticated
with check (true);

create policy "surgeries_update_authenticated"
on public.surgeries
for update
to authenticated
using (true)
with check (true);

create policy "surgeries_delete_authenticated"
on public.surgeries
for delete
to authenticated
using (true);
