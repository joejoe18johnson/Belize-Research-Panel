ALTER TABLE survey_assignments
  ADD COLUMN IF NOT EXISTS progress_percent integer NOT NULL DEFAULT 0
    CHECK (progress_percent >= 0 AND progress_percent <= 100);

ALTER TABLE survey_assignments
  ADD COLUMN IF NOT EXISTS completed_date date;

ALTER TABLE survey_responses
  ALTER COLUMN submitted_at DROP NOT NULL;

ALTER TABLE survey_responses
  ADD COLUMN IF NOT EXISTS started_at timestamptz;

ALTER TABLE survey_responses
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS point_transactions_survey_completion_uniq
  ON point_transactions (reference_type, reference_id)
  WHERE kind = 'survey_completion' AND reference_type = 'survey_assignment';
