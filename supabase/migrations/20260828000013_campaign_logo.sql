-- Live campaigns table was created without a logo column.
-- Safe to run on an existing production database.

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS cover_image_path text NOT NULL DEFAULT '';

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS logo_path text NOT NULL DEFAULT '';

NOTIFY pgrst, 'reload schema';
