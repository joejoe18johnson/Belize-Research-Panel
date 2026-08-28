-- Public-facing research sponsor shown as "Survey by: …"
-- Safe to run on an existing production database.

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS survey_by text NOT NULL DEFAULT 'Belize Research Panel';

NOTIFY pgrst, 'reload schema';
