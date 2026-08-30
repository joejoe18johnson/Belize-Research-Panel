-- Allow more than one login account (and panelist row) to share an email.
-- The app still blocks duplicates unless Admin → Platform → Testing is on.
-- Sign-in then uses the password to pick the matching account.

ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_email_key;
CREATE INDEX IF NOT EXISTS accounts_email_idx ON accounts (email);

DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT rel.relname AS table_name, con.conname AS constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN pg_class ref ON ref.oid = con.confrelid
    JOIN unnest(con.confkey) AS refattnum ON true
    JOIN pg_attribute refatt ON refatt.attrelid = con.confrelid AND refatt.attnum = refattnum
    WHERE con.contype = 'f'
      AND nsp.nspname = 'public'
      AND ref.relname = 'panelists'
      AND refatt.attname = 'email'
  LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', rec.table_name, rec.constraint_name);
  END LOOP;
END $$;

ALTER TABLE panelists DROP CONSTRAINT IF EXISTS panelists_email_key;
CREATE INDEX IF NOT EXISTS panelists_email_idx ON panelists (email);
