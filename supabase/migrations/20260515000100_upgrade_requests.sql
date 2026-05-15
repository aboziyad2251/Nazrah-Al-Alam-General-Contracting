-- ── upgrade_requests ─────────────────────────────────────────────────────────
create table upgrade_requests (
  id           bigint generated always as identity primary key,
  profile_id   uuid not null references profiles(id) on delete cascade,
  message      text,
  status       text not null default 'pending'
                 check (status in ('pending','approved','rejected')),
  reviewed_by  uuid references profiles(id),
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index idx_upgrade_requests_profile on upgrade_requests(profile_id);
create index idx_upgrade_requests_status  on upgrade_requests(status);

alter table upgrade_requests enable row level security;

-- clients can submit their own requests
create policy "upgrade_requests_insert" on upgrade_requests
  for insert to authenticated
  with check (profile_id = auth.uid());

-- clients can view their own requests
create policy "upgrade_requests_select_own" on upgrade_requests
  for select to authenticated
  using (profile_id = auth.uid());

-- admins have full access
create policy "upgrade_requests_admin" on upgrade_requests
  for all to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('admin','super_admin')
    )
  );
