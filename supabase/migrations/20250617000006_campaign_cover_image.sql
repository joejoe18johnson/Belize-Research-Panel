ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS cover_image_path text NOT NULL DEFAULT '';
