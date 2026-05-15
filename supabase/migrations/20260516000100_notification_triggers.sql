-- Notification triggers for quotes, bookings, invoices
-- Uses security definer to bypass RLS (triggers run without auth.uid())

-- ── Helper: insert notification bypassing RLS ─────────────────
create or replace function notify_client(
  p_profile_id uuid,
  p_type       text,
  p_title_en   text,
  p_title_ar   text,
  p_body_en    text,
  p_body_ar    text
) returns void language plpgsql security definer as $$
begin
  insert into notifications(profile_id, type, title_en, title_ar, body_en, body_ar)
  values(p_profile_id, p_type, p_title_en, p_title_ar, p_body_en, p_body_ar);
end;
$$;

-- ── Quotes ────────────────────────────────────────────────────
create or replace function trg_quote_notify()
returns trigger language plpgsql security definer as $$
declare p_profile_id uuid;
        p_name       text;
begin
  if old.status = new.status then return new; end if;
  select c.profile_id into p_profile_id from clients c where c.id = new.client_id;
  p_name := coalesce(new.project_name, '#' || new.id::text);

  if new.status = 'sent' then
    perform notify_client(p_profile_id, 'quote_sent',
      'Quote Ready', 'عرض السعر جاهز',
      'Your quote "' || p_name || '" is ready to review.',
      'عرض السعر "' || p_name || '" جاهز للمراجعة.');
  elsif new.status = 'accepted' then
    perform notify_client(p_profile_id, 'quote_accepted',
      'Quote Accepted', 'تم قبول عرض السعر',
      'Your quote "' || p_name || '" has been accepted.',
      'تم قبول عرض السعر "' || p_name || '".');
  elsif new.status = 'rejected' then
    perform notify_client(p_profile_id, 'quote_rejected',
      'Quote Not Approved', 'عرض السعر غير مقبول',
      'Your quote "' || p_name || '" was not approved.',
      'لم تتم الموافقة على عرض السعر "' || p_name || '".');
  end if;
  return new;
end;
$$;

create trigger trg_quotes_notify
  after update on quotes
  for each row execute function trg_quote_notify();

-- ── Bookings ──────────────────────────────────────────────────
create or replace function trg_booking_notify()
returns trigger language plpgsql security definer as $$
declare p_profile_id uuid;
        p_ref        text;
begin
  if old.status = new.status then return new; end if;
  select c.profile_id into p_profile_id from clients c where c.id = new.client_id;
  p_ref := 'Booking #' || new.id::text;

  if new.status = 'confirmed' then
    perform notify_client(p_profile_id, 'booking_confirmed',
      'Booking Confirmed', 'تم تأكيد الحجز',
      p_ref || ' has been confirmed.',
      'تم تأكيد ' || p_ref || '.');
  elsif new.status = 'in_progress' then
    perform notify_client(p_profile_id, 'booking_started',
      'Equipment On-Site', 'المعدات في الموقع',
      p_ref || ' equipment is now on-site.',
      'معدات ' || p_ref || ' في الموقع الآن.');
  elsif new.status = 'completed' then
    perform notify_client(p_profile_id, 'booking_completed',
      'Booking Complete', 'اكتمل الحجز',
      p_ref || ' has been completed.',
      'اكتمل ' || p_ref || '.');
  elsif new.status = 'cancelled' then
    perform notify_client(p_profile_id, 'booking_cancelled',
      'Booking Cancelled', 'تم إلغاء الحجز',
      p_ref || ' has been cancelled.',
      'تم إلغاء ' || p_ref || '.');
  end if;
  return new;
end;
$$;

create trigger trg_bookings_notify
  after update on bookings
  for each row execute function trg_booking_notify();

-- ── Invoices ──────────────────────────────────────────────────
create or replace function trg_invoice_notify()
returns trigger language plpgsql security definer as $$
declare p_profile_id uuid;
        p_ref        text;
        p_amount     text;
begin
  if old.status = new.status then return new; end if;
  select c.profile_id into p_profile_id from clients c where c.id = new.client_id;
  p_ref    := 'Invoice #' || new.id::text;
  p_amount := to_char(new.total_sar, 'FM999,999,990.00') || ' SAR';

  if new.status = 'issued' then
    perform notify_client(p_profile_id, 'invoice_issued',
      'New Invoice', 'فاتورة جديدة',
      p_ref || ' for ' || p_amount || ' is ready.',
      p_ref || ' بمبلغ ' || p_amount || ' جاهزة.');
  elsif new.status = 'overdue' then
    perform notify_client(p_profile_id, 'invoice_overdue',
      'Payment Overdue', 'تأخر السداد',
      p_ref || ' is overdue. Please settle your balance.',
      p_ref || ' متأخرة. يرجى تسوية الرصيد.');
  elsif new.status = 'paid' then
    perform notify_client(p_profile_id, 'invoice_paid',
      'Payment Received', 'تم استلام الدفعة',
      p_ref || ' has been marked as paid. Thank you!',
      'تم استلام دفعة ' || p_ref || '. شكراً لك!');
  end if;
  return new;
end;
$$;

create trigger trg_invoices_notify
  after update on invoices
  for each row execute function trg_invoice_notify();
