-- ─────────────────────────────────────────────────────────────────────────────
-- Admin panel additional tables
-- ─────────────────────────────────────────────────────────────────────────────

-- ── CRM: Lead stages ─────────────────────────────────────────────────────────
CREATE TYPE lead_stage AS ENUM (
  'new','contacted','qualified','proposal','negotiation','won','lost'
);

CREATE TABLE leads (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_name  TEXT    NOT NULL,
  contact_name  TEXT,
  email         TEXT,
  phone         TEXT,
  stage         lead_stage NOT NULL DEFAULT 'new',
  value_sar     NUMERIC(12,2),
  source        TEXT,
  assigned_to   UUID REFERENCES profiles(id),
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE lead_activities (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_id  BIGINT REFERENCES leads(id) ON DELETE CASCADE,
  actor_id UUID   REFERENCES profiles(id),
  type     TEXT   NOT NULL CHECK (type IN ('note','call','email','meeting','follow_up')),
  body     TEXT,
  due_at   TIMESTAMPTZ,
  done     BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Maintenance: Vendors ──────────────────────────────────────────────────────
CREATE TABLE vendors (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name           TEXT NOT NULL,
  contact_name   TEXT,
  phone          TEXT,
  email          TEXT,
  specialization TEXT,
  rating         SMALLINT CHECK (rating BETWEEN 1 AND 5),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE maintenance_service_due (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  equipment_id       BIGINT REFERENCES equipment(id),
  service_type       TEXT NOT NULL,
  trigger_type       TEXT NOT NULL DEFAULT 'hours' CHECK (trigger_type IN ('hours','mileage','date')),
  trigger_value      NUMERIC,
  last_service_at    TIMESTAMPTZ,
  next_service_at    TIMESTAMPTZ,
  vendor_id          BIGINT REFERENCES vendors(id),
  estimated_cost_sar NUMERIC(12,2),
  notes              TEXT,
  created_at         TIMESTAMPTZ DEFAULT now()
);

-- ── CMS ───────────────────────────────────────────────────────────────────────
CREATE TABLE blog_posts (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  title_en      TEXT,
  title_ar      TEXT,
  body_en       TEXT,
  body_ar       TEXT,
  excerpt_en    TEXT,
  excerpt_ar    TEXT,
  cover_image_url TEXT,
  published     BOOLEAN DEFAULT false,
  published_at  TIMESTAMPTZ,
  author_id     UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE cms_homepage (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key         TEXT UNIQUE NOT NULL,
  value_en    TEXT,
  value_ar    TEXT,
  updated_by  UUID REFERENCES profiles(id),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Settings: Message templates ───────────────────────────────────────────────
CREATE TABLE message_templates (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT NOT NULL,
  channel     TEXT NOT NULL CHECK (channel IN ('email','whatsapp')),
  subject_en  TEXT,
  subject_ar  TEXT,
  body_en     TEXT NOT NULL,
  body_ar     TEXT NOT NULL,
  variables   JSONB DEFAULT '[]',
  updated_by  UUID REFERENCES profiles(id),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── HR: Operator schedule / hours ────────────────────────────────────────────
CREATE TABLE operator_schedule (
  id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  operator_id            BIGINT REFERENCES operators(id),
  booking_assignment_id  BIGINT REFERENCES booking_assignments(id),
  date                   DATE NOT NULL,
  hours_logged           NUMERIC(5,2) DEFAULT 0,
  notes                  TEXT,
  created_at             TIMESTAMPTZ DEFAULT now()
);

-- ── App settings (key/value) ──────────────────────────────────────────────────
CREATE TABLE app_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE leads                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities         ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_service_due ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_homepage            ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_schedule       ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings            ENABLE ROW LEVEL SECURITY;

-- leads: admin full access
CREATE POLICY "admin_leads" ON leads FOR ALL USING (is_admin());
CREATE POLICY "admin_lead_activities" ON lead_activities FOR ALL USING (is_admin());

-- vendors: admin full access
CREATE POLICY "admin_vendors" ON vendors FOR ALL USING (is_admin());
CREATE POLICY "admin_maint_due" ON maintenance_service_due FOR ALL USING (is_admin());

-- blog_posts: admin write; public read published
CREATE POLICY "admin_blog_write" ON blog_posts FOR ALL USING (is_admin());
CREATE POLICY "public_blog_read"  ON blog_posts FOR SELECT USING (published = true);

-- cms_homepage: admin write; public read
CREATE POLICY "admin_cms_write" ON cms_homepage FOR ALL USING (is_admin());
CREATE POLICY "public_cms_read"  ON cms_homepage FOR SELECT USING (true);

-- message_templates: admin only
CREATE POLICY "admin_templates" ON message_templates FOR ALL USING (is_admin());

-- operator_schedule: dispatcher/admin
CREATE POLICY "dispatch_schedule" ON operator_schedule FOR ALL
  USING (auth_role() IN ('dispatcher','admin','super_admin'));

-- app_settings: admin only
CREATE POLICY "admin_settings" ON app_settings FOR ALL USING (is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed data
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO app_settings (key, value) VALUES
  ('vat_rate',          '"0.15"'),
  ('currency',          '"SAR"'),
  ('ai_quote_model',    '"claude-sonnet-4-6"'),
  ('ai_assistant_model','"claude-sonnet-4-6"'),
  ('ai_survey_model',   '"claude-sonnet-4-6"');

INSERT INTO cms_homepage (key, value_en, value_ar) VALUES
  ('hero_headline',    'Powering Saudi Arabia''s Greatest Projects', 'نحرك أعظم مشاريع المملكة'),
  ('hero_subheadline', 'Heavy equipment rental built for the Kingdom', 'تأجير المعدات الثقيلة المصمم للمملكة'),
  ('hero_cta',         'Request a Quote', 'اطلب عرض سعر'),
  ('stats_projects',   '500+',  '٥٠٠+'),
  ('stats_machines',   '120+',  '١٢٠+'),
  ('stats_cities',     '12',    '١٢'),
  ('about_body',       'Nazrah Al Alam General Contracting has been serving the Kingdom since 2010 with a modern fleet of heavy equipment.', 'تخدم نظرة العالم للمقاولات العامة المملكة منذ عام ٢٠١٠ بأسطول حديث من المعدات الثقيلة.');

INSERT INTO message_templates (name, channel, subject_en, subject_ar, body_en, body_ar, variables) VALUES
  ('quote_sent', 'email',
   'Your Quote #{{quote_id}} from Nazrah Al Alam',
   'عرض سعر #{{quote_id}} من نظرة العالم',
   'Dear {{client_name}},\n\nPlease find your quote #{{quote_id}} for {{project_name}}.\n\nTotal: SAR {{total}}\n\nKind regards,\nNazrah Al Alam Team',
   'عزيزي {{client_name}}،\n\nيرجى الاطلاع على عرض السعر #{{quote_id}} للمشروع: {{project_name}}.\n\nالإجمالي: {{total}} ريال\n\nمع التحية،\nفريق نظرة العالم',
   '["quote_id","client_name","project_name","total"]'
  ),
  ('booking_confirmed', 'whatsapp',
   NULL, NULL,
   'Hello {{client_name}}, your booking #{{booking_id}} has been confirmed. Equipment arrives on {{delivery_date}}. Nazrah Al Alam.',
   'مرحبا {{client_name}}، تم تأكيد حجزك #{{booking_id}}. تصل المعدات بتاريخ {{delivery_date}}. نظرة العالم.',
   '["client_name","booking_id","delivery_date"]'
  ),
  ('invoice_issued', 'email',
   'Invoice #{{invoice_id}} — SAR {{total}}',
   'فاتورة #{{invoice_id}} — {{total}} ريال',
   'Dear {{client_name}},\n\nInvoice #{{invoice_id}} for SAR {{total}} is due on {{due_date}}.\n\nNazrah Al Alam.',
   'عزيزي {{client_name}}،\n\nالفاتورة #{{invoice_id}} بمبلغ {{total}} ريال مستحقة بتاريخ {{due_date}}.\n\nنظرة العالم.',
   '["client_name","invoice_id","total","due_date"]'
  );
