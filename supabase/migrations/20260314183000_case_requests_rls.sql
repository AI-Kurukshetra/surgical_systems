-- Ensure case_requests is accessible to authenticated users.
-- API role checks still enforce role-specific behavior.
do $$
begin
  if exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename = 'case_requests'
  ) then
    execute 'alter table public.case_requests enable row level security';

    execute 'drop policy if exists "case_requests_select_authenticated" on public.case_requests';
    execute 'drop policy if exists "case_requests_insert_authenticated" on public.case_requests';
    execute 'drop policy if exists "case_requests_update_authenticated" on public.case_requests';
    execute 'drop policy if exists "case_requests_delete_authenticated" on public.case_requests';

    execute 'create policy "case_requests_select_authenticated"
      on public.case_requests
      for select
      to authenticated
      using (true)';

    execute 'create policy "case_requests_insert_authenticated"
      on public.case_requests
      for insert
      to authenticated
      with check (true)';

    execute 'create policy "case_requests_update_authenticated"
      on public.case_requests
      for update
      to authenticated
      using (true)
      with check (true)';

    execute 'create policy "case_requests_delete_authenticated"
      on public.case_requests
      for delete
      to authenticated
      using (true)';
  end if;
end
$$;
