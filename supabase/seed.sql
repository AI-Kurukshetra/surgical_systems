insert into public.roles (name, description)
values
  ('admin', 'Hospital system administrator'),
  ('surgeon', 'Surgeon role'),
  ('staff', 'Nurse, anesthesiologist, and support role'),
  ('scheduler', 'OR scheduling coordinator')
on conflict (name) do nothing;
