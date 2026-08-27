-- Idempotent: ensure survey draft/submit columns exist and PostgREST reloads them.
-- Production DBs created from the original core schema are missing started_at / updated_at.

ALTER TABLE survey_assignments
  ADD COLUMN IF NOT EXISTS progress_percent integer NOT NULL DEFAULT 0;

ALTER TABLE survey_assignments
  ADD COLUMN IF NOT EXISTS completed_date date;

ALTER TABLE survey_responses
  ALTER COLUMN submitted_at DROP NOT NULL;

ALTER TABLE survey_responses
  ADD COLUMN IF NOT EXISTS started_at timestamptz;

ALTER TABLE survey_responses
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

NOTIFY pgrst, 'reload schema';
