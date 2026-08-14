-- Extra app fields stored as JSON metadata (signup workflow, CSV-only panelist columns)

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE panelists
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE staff_users
  ADD COLUMN IF NOT EXISTS password_reset_token text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS password_reset_sent_at timestamptz;
