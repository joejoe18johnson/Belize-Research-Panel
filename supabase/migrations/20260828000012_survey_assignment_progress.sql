-- Live survey_assignments was created before progress/completion columns existed.
-- Safe to run on an existing production database.

ALTER TABLE survey_assignments
  ADD COLUMN IF NOT EXISTS progress_percent integer NOT NULL DEFAULT 0;

ALTER TABLE survey_assignments
  ADD COLUMN IF NOT EXISTS completed_date date;

NOTIFY pgrst, 'reload schema';
