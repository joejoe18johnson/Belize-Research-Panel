-- Authorised registrar codes (single-use in-person verification)
-- Safe to run on an existing production database.

CREATE TABLE IF NOT EXISTS authorised_registrars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  notes text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL DEFAULT '',
  used_at timestamptz,
  used_by_email citext
);

CREATE UNIQUE INDEX IF NOT EXISTS authorised_registrars_code_idx
  ON authorised_registrars (code);

ALTER TABLE authorised_registrars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS authorised_registrars_staff_read ON authorised_registrars;
CREATE POLICY authorised_registrars_staff_read ON authorised_registrars
  FOR SELECT TO authenticated
  USING (auth_is_staff());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-data',
  'app-data',
  false,
  1048576,
  ARRAY['application/json', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;
