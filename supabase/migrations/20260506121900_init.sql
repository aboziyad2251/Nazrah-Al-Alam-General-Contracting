-- ============================================================
-- 001_init.sql  –  Nazrah Al Alam · Schema Bootstrap
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────
create type user_role        as enum ('client','operator','dispatcher','admin','super_admin');
create type equipment_status as enum ('available','rented','maintenance','retired');
create type quote_status     as enum ('draft','sent','accepted','rejected','expired');
create type booking_status   as enum ('pending','confirmed','in_progress','completed','cancelled');
create type invoice_status   as enum ('draft','issued','paid','overdue','cancelled');
create type payment_method   as enum ('bank','cash','mada','stcpay');
create type message_role     as enum ('user','assistant','system');
create type portfolio_cat    as enum ('residential','commercial','maintenance');

-- ── Helper: updated_at trigger ───────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ── Helper: audit_log trigger factory ────────────────────────
create or replace function audit_log_trigger()
returns trigger language plpgsql security definer as $$
declare actor uuid;
begin
  actor := auth.uid();
  if (tg_op = 'DELETE') then
    insert into audit_log(actor_id,action,entity,entity_id,diff)
    values(actor,'DELETE',tg_table_name,old.id,to_jsonb(old));
    return old;
  else
    insert into audit_log(actor_id,action,entity,entity_id,diff)
    values(actor,tg_op,tg_table_name,new.id,
           jsonb_build_object('old',to_jsonb(old),'new',to_jsonb(new)));
    return new;
  end if;
end;
$$;

-- ── 1. profiles ───────────────────────────────────────────────
create table profiles (
  id            uuid primary key references auth.users on delete cascade,
  full_name     text,
  full_name_ar  text,
  phone         text,
  company       text,
  role          user_role not null default 'client',
  locale        text not null default 'en',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_profiles_updated
  before update on profiles for each row execute function set_updated_at();

-- ── 2. equipment_categories ──────────────────────────────────
create table equipment_categories (
  id              bigint generated always as identity primary key,
  slug            text not null unique,
  name_en         text not null,
  name_ar         text not null,
  description_en  text,
  description_ar  text,
  icon            text,
  image_url       text,
  sort_order      int not null default 0
);

-- ── 3. equipment ─────────────────────────────────────────────
create table equipment (
  id               bigint generated always as identity primary key,
  category_id      bigint not null references equipment_categories(id),
  model_name       text not null,
  brand            text,
  year             smallint,
  capacity         text,
  hourly_rate_sar  numeric(10,2),
  daily_rate_sar   numeric(10,2),
  weekly_rate_sar  numeric(10,2),
  monthly_rate_sar numeric(10,2),
  status           equipment_status not null default 'available',
  image_urls       jsonb not null default '[]',
  specs            jsonb not null default '{}',
  location         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index idx_equipment_category on equipment(category_id);
create index idx_equipment_status   on equipment(status);
create trigger trg_equipment_updated
  before update on equipment for each row execute function set_updated_at();

-- ── 4. clients ───────────────────────────────────────────────
create table clients (
  id                  bigint generated always as identity primary key,
  profile_id          uuid not null unique references profiles(id) on delete cascade,
  vat_number          text,
  billing_address     text,
  credit_limit        numeric(12,2) not null default 0,
  payment_terms_days  int not null default 30,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_clients_profile on clients(profile_id);
create trigger trg_clients_updated
  before update on clients for each row execute function set_updated_at();

-- ── 5. quotes ────────────────────────────────────────────────
create table quotes (
  id               bigint generated always as identity primary key,
  client_id        bigint not null references clients(id),
  status           quote_status not null default 'draft',
  project_name     text,
  project_location text,
  start_date       date,
  end_date         date,
  total_sar        numeric(14,2) not null default 0,
  currency         text not null default 'SAR',
  ai_summary       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index idx_quotes_client on quotes(client_id);
create index idx_quotes_status on quotes(status);
create trigger trg_quotes_updated
  before update on quotes for each row execute function set_updated_at();
create trigger trg_quotes_audit
  after insert or update or delete on quotes
  for each row execute function audit_log_trigger();

-- ── 6. quote_items ───────────────────────────────────────────
create table quote_items (
  id            bigint generated always as identity primary key,
  quote_id      bigint not null references quotes(id) on delete cascade,
  equipment_id  bigint not null references equipment(id),
  qty           int not null default 1,
  days          int not null default 1,
  unit_rate     numeric(10,2) not null,
  line_total    numeric(14,2) generated always as (qty * days * unit_rate) stored,
  with_operator boolean not null default false
);
create index idx_quote_items_quote     on quote_items(quote_id);
create index idx_quote_items_equipment on quote_items(equipment_id);

-- ── 7. bookings ──────────────────────────────────────────────
create table bookings (
  id               bigint generated always as identity primary key,
  quote_id         bigint references quotes(id),
  client_id        bigint not null references clients(id),
  status           booking_status not null default 'pending',
  delivery_address text,
  delivery_lat     numeric(10,7),
  delivery_lng     numeric(10,7),
  delivery_date    date,
  return_date      date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index idx_bookings_quote  on bookings(quote_id);
create index idx_bookings_client on bookings(client_id);
create index idx_bookings_status on bookings(status);
create trigger trg_bookings_updated
  before update on bookings for each row execute function set_updated_at();
create trigger trg_bookings_audit
  after insert or update or delete on bookings
  for each row execute function audit_log_trigger();

-- ── 8. booking_assignments ───────────────────────────────────
create table booking_assignments (
  id            bigint generated always as identity primary key,
  booking_id    bigint not null references bookings(id) on delete cascade,
  equipment_id  bigint not null references equipment(id),
  operator_id   uuid references profiles(id),
  dispatched_at timestamptz,
  returned_at   timestamptz
);
create index idx_assignments_booking  on booking_assignments(booking_id);
create index idx_assignments_equipment on booking_assignments(equipment_id);
create index idx_assignments_operator on booking_assignments(operator_id);

-- ── 9. operators ─────────────────────────────────────────────
create table operators (
  id             bigint generated always as identity primary key,
  profile_id     uuid not null unique references profiles(id) on delete cascade,
  license_type   text,
  certifications jsonb not null default '[]',
  hourly_rate    numeric(8,2),
  available      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_operators_profile   on operators(profile_id);
create index idx_operators_available on operators(available);
create trigger trg_operators_updated
  before update on operators for each row execute function set_updated_at();

-- ── 10. invoices ─────────────────────────────────────────────
create table invoices (
  id          bigint generated always as identity primary key,
  booking_id  bigint not null references bookings(id),
  client_id   bigint not null references clients(id),
  amount_sar  numeric(14,2) not null,
  vat_sar     numeric(14,2) not null default 0,
  total_sar   numeric(14,2) not null,
  status      invoice_status not null default 'draft',
  due_date    date,
  paid_at     timestamptz,
  pdf_url     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_invoices_booking on invoices(booking_id);
create index idx_invoices_client  on invoices(client_id);
create index idx_invoices_status  on invoices(status);
create trigger trg_invoices_updated
  before update on invoices for each row execute function set_updated_at();
create trigger trg_invoices_audit
  after insert or update or delete on invoices
  for each row execute function audit_log_trigger();

-- ── 11. payments ─────────────────────────────────────────────
create table payments (
  id          bigint generated always as identity primary key,
  invoice_id  bigint not null references invoices(id),
  amount_sar  numeric(14,2) not null,
  method      payment_method not null,
  reference   text,
  paid_at     timestamptz not null default now()
);
create index idx_payments_invoice on payments(invoice_id);

-- ── 12. maintenance_logs ─────────────────────────────────────
create table maintenance_logs (
  id            bigint generated always as identity primary key,
  equipment_id  bigint not null references equipment(id),
  type          text,
  description   text,
  cost_sar      numeric(10,2),
  performed_by  text,
  performed_at  timestamptz not null default now()
);
create index idx_maintenance_equipment on maintenance_logs(equipment_id);

-- ── 13. projects_portfolio ───────────────────────────────────
create table projects_portfolio (
  id               bigint generated always as identity primary key,
  name_en          text not null,
  name_ar          text not null,
  category         portfolio_cat not null,
  owner            text,
  location         text,
  area_sqm         numeric(10,2),
  completion_year  smallint,
  image_urls       jsonb not null default '[]',
  featured         boolean not null default false,
  created_at       timestamptz not null default now()
);
create index idx_portfolio_category on projects_portfolio(category);
create index idx_portfolio_featured on projects_portfolio(featured);

-- ── 14. ai_conversations ─────────────────────────────────────
create table ai_conversations (
  id          bigint generated always as identity primary key,
  profile_id  uuid not null references profiles(id) on delete cascade,
  title       text,
  model_used  text,
  created_at  timestamptz not null default now()
);
create index idx_ai_conv_profile on ai_conversations(profile_id);

-- ── 15. ai_messages ──────────────────────────────────────────
create table ai_messages (
  id               bigint generated always as identity primary key,
  conversation_id  bigint not null references ai_conversations(id) on delete cascade,
  role             message_role not null,
  content          text not null,
  model            text,
  tokens_in        int,
  tokens_out       int,
  cost_usd         numeric(10,6),
  created_at       timestamptz not null default now()
);
create index idx_ai_msg_conversation on ai_messages(conversation_id);

-- ── 16. site_surveys ─────────────────────────────────────────
create table site_surveys (
  id                   bigint generated always as identity primary key,
  profile_id           uuid not null references profiles(id) on delete cascade,
  photos               jsonb not null default '[]',
  ai_analysis          jsonb,
  recommended_equipment jsonb,
  created_at           timestamptz not null default now()
);
create index idx_surveys_profile on site_surveys(profile_id);

-- ── 17. notifications ────────────────────────────────────────
create table notifications (
  id          bigint generated always as identity primary key,
  profile_id  uuid not null references profiles(id) on delete cascade,
  type        text,
  title_en    text,
  title_ar    text,
  body_en     text,
  body_ar     text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index idx_notifications_profile on notifications(profile_id);
create index idx_notifications_read    on notifications(profile_id, read);

-- ── 18. audit_log ────────────────────────────────────────────
create table audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid references profiles(id),
  action      text not null,
  entity      text not null,
  entity_id   bigint,
  diff        jsonb,
  created_at  timestamptz not null default now()
);
create index idx_audit_actor  on audit_log(actor_id);
create index idx_audit_entity on audit_log(entity, entity_id);
