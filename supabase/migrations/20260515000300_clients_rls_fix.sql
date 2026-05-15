-- Allow clients to update their own row (needed for onboarding upsert when row already exists)
create policy "clients: self update"
  on clients for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
