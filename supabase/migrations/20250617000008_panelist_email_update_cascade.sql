-- Allow panelist emails and assignment ids to be renamed in place when an admin
-- approves an email change.

ALTER TABLE survey_assignments DROP CONSTRAINT IF EXISTS survey_assignments_panelist_fk;
ALTER TABLE survey_assignments
  ADD CONSTRAINT survey_assignments_panelist_fk
  FOREIGN KEY (panelist_email) REFERENCES panelists(email) ON UPDATE CASCADE ON DELETE CASCADE;

DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'survey_responses'::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) ILIKE '%assignment_id%survey_assignments%'
  LOOP
    EXECUTE format('ALTER TABLE survey_responses DROP CONSTRAINT %I', rec.conname);
  END LOOP;
END $$;

ALTER TABLE survey_responses DROP CONSTRAINT IF EXISTS survey_responses_assignment_id_fkey;
ALTER TABLE survey_responses
  ADD CONSTRAINT survey_responses_assignment_id_fkey
  FOREIGN KEY (assignment_id) REFERENCES survey_assignments(id) ON UPDATE CASCADE ON DELETE CASCADE;

DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT c.conrelid::regclass AS tbl, c.conname
    FROM pg_constraint c
    WHERE c.contype = 'f'
      AND c.confrelid = 'panelists'::regclass
      AND pg_get_constraintdef(c.oid) ILIKE '%(email)%'
      AND pg_get_constraintdef(c.oid) NOT ILIKE '%ON UPDATE CASCADE%'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', rec.tbl, rec.conname);
    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (panelist_email) REFERENCES panelists(email) ON UPDATE CASCADE ON DELETE CASCADE',
      rec.tbl,
      rec.conname
    );
  END LOOP;
END $$;
