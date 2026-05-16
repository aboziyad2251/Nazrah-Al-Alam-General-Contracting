-- Track which leads have been converted to portal clients
alter table leads
  add column if not exists converted_profile_id uuid references profiles(id),
  add column if not exists converted_at timestamptz;
