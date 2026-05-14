-- ============================================================
-- 002_rls.sql  –  Row Level Security policies
-- ============================================================

-- ── Role helpers ─────────────────────────────────────────────
create or replace function auth_role()
returns user_role language sql stable security definer as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_admin()
returns boolean language sql stable security definer as $$
  select auth_role() in ('admin','super_admin')
$$;

create or replace function is_super_admin()
returns boolean language sql stable security definer as $$
  select auth_role() = 'super_admin'
$$;

-- client_id helper (returns clients.id for current user)
create or replace function my_client_id()
returns bigint language sql stable security definer as $$
  select id from clients where profile_id = auth.uid()
$$;

-- ── Enable RLS ───────────────────────────────────────────────
alter table profiles              enable row level security;
alter table equipment_categories  enable row level security;
alter table equipment             enable row level security;
alter table clients               enable row level security;
alter table quotes                enable row level security;
alter table quote_items           enable row level security;
alter table bookings              enable row level security;
alter table booking_assignments   enable row level security;
alter table operators             enable row level security;
alter table invoices              enable row level security;
alter table payments              enable row level security;
alter table maintenance_logs      enable row level security;
alter table projects_portfolio    enable row level security;
alter table ai_conversations      enable row level security;
alter table ai_messages           enable row level security;
alter table site_surveys          enable row level security;
alter table notifications         enable row level security;
alter table audit_log             enable row level security;

-- ═══════════════════════════════════════════════════════════════
-- profiles
-- ═══════════════════════════════════════════════════════════════
create policy "profiles: own row select"
  on profiles for select using (id = auth.uid() or is_admin());

create policy "profiles: own row update"
  on profiles for update using (id = auth.uid() or is_admin());

create policy "profiles: admin insert"
  on profiles for insert with check (is_admin() or id = auth.uid());

create policy "profiles: super_admin delete"
  on profiles for delete using (is_super_admin());

-- ═══════════════════════════════════════════════════════════════
-- equipment_categories  (public read, admin write)
-- ═══════════════════════════════════════════════════════════════
create policy "eq_cats: public read"
  on equipment_categories for select using (true);

create policy "eq_cats: admin write"
  on equipment_categories for all using (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- equipment  (public read, admin write)
-- ═══════════════════════════════════════════════════════════════
create policy "equipment: public read"
  on equipment for select using (true);

create policy "equipment: admin write"
  on equipment for all using (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- clients
-- ═══════════════════════════════════════════════════════════════
create policy "clients: own record"
  on clients for select using (profile_id = auth.uid() or is_admin());

create policy "clients: admin write"
  on clients for all using (is_admin());

create policy "clients: self insert"
  on clients for insert with check (profile_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- quotes
-- ═══════════════════════════════════════════════════════════════
create policy "quotes: client sees own"
  on quotes for select
  using (client_id = my_client_id() or is_admin());

create policy "quotes: client insert"
  on quotes for insert
  with check (client_id = my_client_id() or is_admin());

create policy "quotes: client update draft"
  on quotes for update
  using (
    (client_id = my_client_id() and status = 'draft')
    or is_admin()
  );

create policy "quotes: admin delete"
  on quotes for delete using (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- quote_items
-- ═══════════════════════════════════════════════════════════════
create policy "quote_items: visible with quote"
  on quote_items for select
  using (
    exists (
      select 1 from quotes q
      where q.id = quote_items.quote_id
        and (q.client_id = my_client_id() or is_admin())
    )
  );

create policy "quote_items: admin write"
  on quote_items for all using (is_admin());

create policy "quote_items: client insert own quote"
  on quote_items for insert
  with check (
    exists (
      select 1 from quotes q
      where q.id = quote_items.quote_id
        and q.client_id = my_client_id()
        and q.status = 'draft'
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- bookings
-- ═══════════════════════════════════════════════════════════════
create policy "bookings: client sees own"
  on bookings for select
  using (client_id = my_client_id() or is_admin()
    or auth_role() in ('dispatcher','operator'));

create policy "bookings: client insert"
  on bookings for insert
  with check (client_id = my_client_id() or is_admin());

create policy "bookings: admin update"
  on bookings for update using (is_admin() or auth_role() = 'dispatcher');

create policy "bookings: admin delete"
  on bookings for delete using (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- booking_assignments
-- ═══════════════════════════════════════════════════════════════
create policy "assignments: operator sees own"
  on booking_assignments for select
  using (
    operator_id = auth.uid()
    or is_admin()
    or auth_role() = 'dispatcher'
    or exists (
      select 1 from bookings b where b.id = booking_assignments.booking_id
        and b.client_id = my_client_id()
    )
  );

create policy "assignments: dispatcher/admin write"
  on booking_assignments for all
  using (is_admin() or auth_role() = 'dispatcher');

-- ═══════════════════════════════════════════════════════════════
-- operators
-- ═══════════════════════════════════════════════════════════════
create policy "operators: own record"
  on operators for select
  using (profile_id = auth.uid() or is_admin() or auth_role() = 'dispatcher');

create policy "operators: admin write"
  on operators for all using (is_admin());

create policy "operators: self update availability"
  on operators for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- invoices
-- ═══════════════════════════════════════════════════════════════
create policy "invoices: client sees own"
  on invoices for select
  using (client_id = my_client_id() or is_admin());

create policy "invoices: admin write"
  on invoices for all using (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- payments
-- ═══════════════════════════════════════════════════════════════
create policy "payments: client sees own"
  on payments for select
  using (
    exists (
      select 1 from invoices i where i.id = payments.invoice_id
        and (i.client_id = my_client_id() or is_admin())
    )
  );

create policy "payments: admin write"
  on payments for all using (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- maintenance_logs
-- ═══════════════════════════════════════════════════════════════
create policy "maintenance: admin/dispatcher read"
  on maintenance_logs for select
  using (is_admin() or auth_role() = 'dispatcher');

create policy "maintenance: admin write"
  on maintenance_logs for all using (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- projects_portfolio  (public read)
-- ═══════════════════════════════════════════════════════════════
create policy "portfolio: public read"
  on projects_portfolio for select using (true);

create policy "portfolio: admin write"
  on projects_portfolio for all using (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- ai_conversations + ai_messages
-- ═══════════════════════════════════════════════════════════════
create policy "ai_conv: own"
  on ai_conversations for all
  using (profile_id = auth.uid() or is_admin());

create policy "ai_msg: own conversation"
  on ai_messages for all
  using (
    exists (
      select 1 from ai_conversations c
      where c.id = ai_messages.conversation_id
        and (c.profile_id = auth.uid() or is_admin())
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- site_surveys
-- ═══════════════════════════════════════════════════════════════
create policy "surveys: own"
  on site_surveys for all
  using (profile_id = auth.uid() or is_admin());

-- ═══════════════════════════════════════════════════════════════
-- notifications
-- ═══════════════════════════════════════════════════════════════
create policy "notifications: own"
  on notifications for select
  using (profile_id = auth.uid() or is_admin());

create policy "notifications: own update (mark read)"
  on notifications for update
  using (profile_id = auth.uid() or is_admin());

create policy "notifications: admin insert"
  on notifications for insert with check (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- audit_log  (admin read-only; written by triggers)
-- ═══════════════════════════════════════════════════════════════
create policy "audit: admin read"
  on audit_log for select using (is_admin());
