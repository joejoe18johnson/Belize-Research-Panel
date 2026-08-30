-- Key/value platform settings (testing toggles, later operational flags).
-- Safe to run on an existing production database.

CREATE TABLE IF NOT EXISTS platform_settings (
  id text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text NOT NULL DEFAULT ''
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_settings_staff_read ON platform_settings;
CREATE POLICY platform_settings_staff_read ON platform_settings
  FOR SELECT TO authenticated
  USING (auth_is_staff());
