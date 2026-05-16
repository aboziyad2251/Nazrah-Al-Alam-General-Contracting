-- Operators can update their own assignment timestamps (dispatched_at, returned_at)
create policy "assignments: operator self update"
  on booking_assignments for update
  using (operator_id = auth.uid())
  with check (operator_id = auth.uid());
