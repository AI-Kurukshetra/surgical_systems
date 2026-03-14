-- SmartOR core schema + RLS + realtime readiness
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null check (name in ('admin', 'surgeon', 'staff', 'scheduler')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role_id uuid not null references public.roles (id),
  hospital_id uuid references public.hospitals (id),
  email text unique not null,
  full_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hospital_id, name)
);

create table if not exists public.operating_rooms (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments (id) on delete cascade,
  name text not null,
  status text not null default 'available' check (status in ('available', 'in_use', 'maintenance')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (department_id, name)
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  mrn text not null,
  full_name text not null,
  dob date not null,
  pre_op_status text not null default 'pending' check (pre_op_status in ('pending', 'cleared', 'blocked')),
  lab_results_status text not null default 'pending' check (lab_results_status in ('pending', 'ready', 'critical')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hospital_id, mrn)
);

create table if not exists public.surgeons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  specialty text not null,
  license_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  role_type text not null check (role_type in ('nurse', 'anesthesiologist', 'support')),
  shift_start time,
  shift_end time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.procedures (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  name text not null,
  cpt_code text,
  expected_duration_mins integer not null default 60,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hospital_id, name)
);

create table if not exists public.surgeries (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  patient_id uuid not null references public.patients (id),
  surgeon_id uuid not null references public.surgeons (id),
  operating_room_id uuid not null references public.operating_rooms (id),
  procedure_id uuid not null references public.procedures (id),
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'delayed', 'cancelled')),
  priority text not null default 'elective' check (priority in ('elective', 'urgent', 'emergency')),
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  actual_start timestamptz,
  actual_end timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (scheduled_end > scheduled_start)
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  surgery_id uuid not null unique references public.surgeries (id) on delete cascade,
  scheduled_date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  name text not null,
  code text not null,
  quantity_total integer not null default 1,
  quantity_available integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hospital_id, code)
);

create table if not exists public.staff_assignments (
  id uuid primary key default gen_random_uuid(),
  surgery_id uuid not null references public.surgeries (id) on delete cascade,
  staff_id uuid not null references public.staff (id) on delete cascade,
  assignment_role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (surgery_id, staff_id)
);

create table if not exists public.equipment_assignments (
  id uuid primary key default gen_random_uuid(),
  surgery_id uuid not null references public.surgeries (id) on delete cascade,
  equipment_id uuid not null references public.equipment (id) on delete cascade,
  quantity integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (surgery_id, equipment_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  surgery_id uuid references public.surgeries (id) on delete cascade,
  type text not null check (type in ('delay', 'schedule_update', 'emergency')),
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conflicts (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  surgery_id uuid not null references public.surgeries (id) on delete cascade,
  conflict_type text not null,
  conflict_details jsonb not null default '{}'::jsonb,
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_metrics (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  metric_key text not null,
  metric_value numeric(10,2) not null,
  measured_on date not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hospital_id, metric_key, measured_on)
);

create or replace function public.user_hospital_id()
returns uuid
language sql
stable
as $$
  select hospital_id from public.users where id = auth.uid();
$$;

create or replace function public.user_role()
returns text
language sql
stable
as $$
  select r.name
  from public.users u
  join public.roles r on r.id = u.role_id
  where u.id = auth.uid();
$$;

create or replace function public.has_any_role(roles text[])
returns boolean
language sql
stable
as $$
  select coalesce(public.user_role() = any(roles), false);
$$;

-- updated_at triggers
create trigger trg_roles_updated_at before update on public.roles for each row execute function public.set_updated_at();
create trigger trg_hospitals_updated_at before update on public.hospitals for each row execute function public.set_updated_at();
create trigger trg_users_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger trg_departments_updated_at before update on public.departments for each row execute function public.set_updated_at();
create trigger trg_operating_rooms_updated_at before update on public.operating_rooms for each row execute function public.set_updated_at();
create trigger trg_patients_updated_at before update on public.patients for each row execute function public.set_updated_at();
create trigger trg_surgeons_updated_at before update on public.surgeons for each row execute function public.set_updated_at();
create trigger trg_staff_updated_at before update on public.staff for each row execute function public.set_updated_at();
create trigger trg_procedures_updated_at before update on public.procedures for each row execute function public.set_updated_at();
create trigger trg_surgeries_updated_at before update on public.surgeries for each row execute function public.set_updated_at();
create trigger trg_schedules_updated_at before update on public.schedules for each row execute function public.set_updated_at();
create trigger trg_equipment_updated_at before update on public.equipment for each row execute function public.set_updated_at();
create trigger trg_staff_assignments_updated_at before update on public.staff_assignments for each row execute function public.set_updated_at();
create trigger trg_equipment_assignments_updated_at before update on public.equipment_assignments for each row execute function public.set_updated_at();
create trigger trg_notifications_updated_at before update on public.notifications for each row execute function public.set_updated_at();
create trigger trg_conflicts_updated_at before update on public.conflicts for each row execute function public.set_updated_at();
create trigger trg_analytics_metrics_updated_at before update on public.analytics_metrics for each row execute function public.set_updated_at();

-- RLS enable
alter table public.roles enable row level security;
alter table public.hospitals enable row level security;
alter table public.users enable row level security;
alter table public.departments enable row level security;
alter table public.operating_rooms enable row level security;
alter table public.patients enable row level security;
alter table public.surgeons enable row level security;
alter table public.staff enable row level security;
alter table public.procedures enable row level security;
alter table public.surgeries enable row level security;
alter table public.schedules enable row level security;
alter table public.equipment enable row level security;
alter table public.staff_assignments enable row level security;
alter table public.equipment_assignments enable row level security;
alter table public.notifications enable row level security;
alter table public.conflicts enable row level security;
alter table public.analytics_metrics enable row level security;

-- Shared hospital scoped access
create policy "users read own row" on public.users
for select to authenticated
using (id = auth.uid() or public.has_any_role(array['admin', 'scheduler']));

create policy "users update own row" on public.users
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "roles read" on public.roles
for select to authenticated
using (true);

create policy "hospitals read own hospital" on public.hospitals
for select to authenticated
using (id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']));

create policy "departments hospital scoped" on public.departments
for all to authenticated
using (hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']))
with check (hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']));

create policy "or hospital scoped" on public.operating_rooms
for all to authenticated
using (
  exists (
    select 1 from public.departments d
    where d.id = department_id and (d.hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']))
  )
)
with check (
  exists (
    select 1 from public.departments d
    where d.id = department_id and (d.hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']))
  )
);

create policy "patients hospital scoped" on public.patients
for all to authenticated
using (hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']))
with check (hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']));

create policy "surgeons readable" on public.surgeons
for select to authenticated
using (true);

create policy "staff readable" on public.staff
for select to authenticated
using (true);

create policy "procedures hospital scoped" on public.procedures
for all to authenticated
using (hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']))
with check (hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']));

create policy "surgeries hospital scoped" on public.surgeries
for all to authenticated
using (hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']))
with check (hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']));

create policy "schedules hospital scoped" on public.schedules
for all to authenticated
using (hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']))
with check (hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']));

create policy "equipment hospital scoped" on public.equipment
for all to authenticated
using (hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']))
with check (hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']));

create policy "staff assignments from visible surgeries" on public.staff_assignments
for all to authenticated
using (exists (select 1 from public.surgeries s where s.id = surgery_id and (s.hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']))))
with check (exists (select 1 from public.surgeries s where s.id = surgery_id and (s.hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']))));

create policy "equipment assignments from visible surgeries" on public.equipment_assignments
for all to authenticated
using (exists (select 1 from public.surgeries s where s.id = surgery_id and (s.hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']))))
with check (exists (select 1 from public.surgeries s where s.id = surgery_id and (s.hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']))));

create policy "notifications hospital scoped" on public.notifications
for all to authenticated
using (hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']))
with check (hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']));

create policy "conflicts hospital scoped" on public.conflicts
for all to authenticated
using (hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']))
with check (hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']));

create policy "analytics hospital scoped" on public.analytics_metrics
for all to authenticated
using (hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']))
with check (hospital_id = public.user_hospital_id() or public.has_any_role(array['admin', 'scheduler']));

-- Storage bucket for surgical documents
insert into storage.buckets (id, name, public)
values ('surgical-documents', 'surgical-documents', false)
on conflict (id) do nothing;

create policy "surgical docs read" on storage.objects
for select to authenticated
using (bucket_id = 'surgical-documents');

create policy "surgical docs write" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'surgical-documents'
  and public.has_any_role(array['admin', 'surgeon', 'scheduler'])
);

create policy "surgical docs update" on storage.objects
for update to authenticated
using (bucket_id = 'surgical-documents')
with check (bucket_id = 'surgical-documents');

-- Realtime publication hints
alter publication supabase_realtime add table public.surgeries;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.staff_assignments;
alter publication supabase_realtime add table public.operating_rooms;
