-- ── Overdue invoice automation ───────────────────────────────────────────────
-- Requires pg_cron extension — enable it in Supabase Dashboard → Database → Extensions
-- before running this migration.

-- Daily at 02:00 UTC: flip past-due issued invoices to overdue
select cron.schedule(
  'mark-overdue-invoices',
  '0 2 * * *',
  $$
    update invoices
    set    status     = 'overdue',
           updated_at = now()
    where  status   = 'issued'
      and  due_date < current_date;
  $$
);
