-- Live campaigns table was created before cover_image_path existed.
-- Safe to run on an existing production database.

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS cover_image_path text NOT NULL DEFAULT '';

NOTIFY pgrst, 'reload schema';
