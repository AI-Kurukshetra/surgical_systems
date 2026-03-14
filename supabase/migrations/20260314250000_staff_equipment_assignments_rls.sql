-- RLS policies for staff_assignments and equipment_assignments.
-- The smartor schema enables RLS on these tables but had no policies, so all inserts were denied.

-- staff_assignments: allow authenticated users to CRUD (same as surgeries)
create policy "staff_assignments_select_authenticated"
on public.staff_assignments for select to authenticated using (true);

create policy "staff_assignments_insert_authenticated"
on public.staff_assignments for insert to authenticated with check (true);

create policy "staff_assignments_update_authenticated"
on public.staff_assignments for update to authenticated using (true) with check (true);

create policy "staff_assignments_delete_authenticated"
on public.staff_assignments for delete to authenticated using (true);

-- equipment_assignments: allow authenticated users to CRUD
create policy "equipment_assignments_select_authenticated"
on public.equipment_assignments for select to authenticated using (true);

create policy "equipment_assignments_insert_authenticated"
on public.equipment_assignments for insert to authenticated with check (true);

create policy "equipment_assignments_update_authenticated"
on public.equipment_assignments for update to authenticated using (true) with check (true);

create policy "equipment_assignments_delete_authenticated"
on public.equipment_assignments for delete to authenticated using (true);
