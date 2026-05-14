-- ============================================================
-- 006_rbac_google_auth.sql  –  Google OAuth + RBAC upgrade
-- ============================================================

-- ── Add premium_client to user_role enum ────────────────────
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'premium_client' AFTER 'client';

-- ── role_audit table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS role_audit (
  id             BIGSERIAL PRIMARY KEY,
  target_user_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  changed_by     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  old_role       user_role,
  new_role       user_role   NOT NULL,
  reason         TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_role_audit_target  ON role_audit(target_user_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_created ON role_audit(created_at DESC);

ALTER TABLE role_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_audit: admin read"
  ON role_audit FOR SELECT USING (is_admin());

-- ── Auto-create profile on new auth.users row ────────────────
-- Runs on every new sign-up (email OTP, Google OAuth, etc.)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  bootstrap_email  TEXT        := 'tarj123@gmail.com';
  initial_role     user_role   := 'client';
  display_name     TEXT;
BEGIN
  -- Bootstrap admin promotion
  IF lower(NEW.email) = lower(bootstrap_email) THEN
    initial_role := 'admin';
  END IF;

  display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, display_name, initial_role)
  ON CONFLICT (id) DO NOTHING;

  -- Audit bootstrap promotion
  IF initial_role = 'admin' THEN
    INSERT INTO role_audit(target_user_id, old_role, new_role, reason)
    VALUES (NEW.id, 'client', 'admin', 'bootstrap admin');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── admin_change_role RPC ────────────────────────────────────
-- Called from admin panel; enforces server-side role check.
CREATE OR REPLACE FUNCTION admin_change_role(
  target_id UUID,
  new_role   user_role,
  reason     TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  caller_role user_role;
  old_role    user_role;
BEGIN
  SELECT auth_role() INTO caller_role;
  IF caller_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT role INTO old_role FROM profiles WHERE id = target_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF old_role = new_role THEN
    RETURN;
  END IF;

  UPDATE profiles SET role = new_role WHERE id = target_id;

  INSERT INTO role_audit(target_user_id, changed_by, old_role, new_role, reason)
  VALUES (target_id, auth.uid(), old_role, new_role, reason);
END;
$$;

-- ── get_users_with_email RPC ─────────────────────────────────
-- Admin-only: join profiles with auth.users to expose email.
CREATE OR REPLACE FUNCTION get_users_with_email()
RETURNS TABLE (
  id           UUID,
  full_name    TEXT,
  email        TEXT,
  role         user_role,
  locale       TEXT,
  created_at   TIMESTAMPTZ,
  last_sign_in TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    u.email,
    p.role,
    p.locale,
    p.created_at,
    u.last_sign_in_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;
