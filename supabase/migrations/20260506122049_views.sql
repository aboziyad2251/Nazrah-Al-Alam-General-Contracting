-- ============================================================
-- 004_views.sql  –  Operational & analytics views
-- ============================================================

-- ── v_active_bookings ─────────────────────────────────────────
-- Joins bookings → client profile → assigned equipment & operator
create or replace view v_active_bookings with (security_invoker = true) as
select
  b.id                  as booking_id,
  b.status              as booking_status,
  b.delivery_address,
  b.delivery_date,
  b.return_date,
  c.id                  as client_id,
  p.full_name           as client_name,
  p.full_name_ar        as client_name_ar,
  p.phone               as client_phone,
  p.company             as client_company,
  e.model_name          as equipment_model,
  e.brand               as equipment_brand,
  ec.name_en            as category_en,
  ec.name_ar            as category_ar,
  op.full_name          as operator_name,
  ba.dispatched_at,
  ba.returned_at,
  q.project_name,
  q.project_location,
  q.total_sar           as quote_total_sar
from bookings b
join clients  c  on c.id = b.client_id
join profiles p  on p.id = c.profile_id
left join quotes q on q.id = b.quote_id
left join booking_assignments ba on ba.booking_id = b.id
left join equipment e  on e.id = ba.equipment_id
left join equipment_categories ec on ec.id = e.category_id
left join profiles op on op.id = ba.operator_id
where b.status in ('pending','confirmed','in_progress');

-- ── v_revenue_by_month ────────────────────────────────────────
-- Monthly revenue (paid invoices only) for the current calendar year
create or replace view v_revenue_by_month with (security_invoker = true) as
select
  date_trunc('month', paid_at)::date  as month,
  count(*)                            as invoices_paid,
  sum(amount_sar)                     as revenue_sar,
  sum(vat_sar)                        as vat_sar,
  sum(total_sar)                      as total_sar
from invoices
where status = 'paid'
  and paid_at >= date_trunc('year', now())
group by 1
order by 1;

-- ── v_equipment_utilization ───────────────────────────────────
-- Per-equipment: active vs. total booking days this year → utilization %
create or replace view v_equipment_utilization with (security_invoker = true) as
with booked_days as (
  select
    ba.equipment_id,
    sum(
      greatest(
        extract(epoch from (coalesce(ba.returned_at, now()) - ba.dispatched_at)) / 86400,
        0
      )
    )::numeric(10,2) as days_out
  from booking_assignments ba
  join bookings b on b.id = ba.booking_id
  where ba.dispatched_at >= date_trunc('year', now())
    and b.status not in ('cancelled')
  group by ba.equipment_id
)
select
  e.id               as equipment_id,
  e.model_name,
  e.brand,
  e.status,
  ec.name_en         as category,
  coalesce(bd.days_out, 0)                       as days_out_ytd,
  round(coalesce(bd.days_out, 0) /
    nullif(extract(doy from now())::numeric, 0) * 100, 1) as utilization_pct
from equipment e
join equipment_categories ec on ec.id = e.category_id
left join booked_days bd on bd.equipment_id = e.id
where e.status != 'retired'
order by utilization_pct desc nulls last;

-- ── v_quote_pipeline ──────────────────────────────────────────
-- Sales pipeline: open quotes grouped by status with totals
create or replace view v_quote_pipeline with (security_invoker = true) as
select
  status,
  count(*)          as count,
  sum(total_sar)    as pipeline_sar,
  min(created_at)   as oldest,
  max(created_at)   as newest
from quotes
where status not in ('rejected','expired')
group by status
order by array_position(array['draft','sent','accepted']::quote_status[], status);

-- ── v_overdue_invoices ────────────────────────────────────────
create or replace view v_overdue_invoices with (security_invoker = true) as
select
  i.id              as invoice_id,
  i.due_date,
  now()::date - i.due_date   as days_overdue,
  i.total_sar,
  p.full_name       as client_name,
  p.full_name_ar    as client_name_ar,
  p.phone           as client_phone
from invoices i
join clients  c on c.id = i.client_id
join profiles p on p.id = c.profile_id
where i.status = 'issued'
  and i.due_date < now()::date
order by days_overdue desc;
