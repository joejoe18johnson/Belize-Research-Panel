-- Rewrite leftover testing plus-addresses (name+brp@inbox) back to the real inbox.
-- Run after 20260829000002_duplicate_login_emails.sql.

UPDATE accounts
SET email = regexp_replace(email::text, '\+brp[0-9]*@', '@', 'i')
WHERE email::text ~* '\+brp[0-9]*@';

UPDATE panelists
SET email = regexp_replace(email::text, '\+brp[0-9]*@', '@', 'i')
WHERE email::text ~* '\+brp[0-9]*@';

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'survey_assignments',
    'survey_responses',
    'panelist_points_overrides',
    'panelist_reward_balance_seeds',
    'panelist_notification_reads',
    'redemption_requests',
    'support_messages'
  ]
  LOOP
    IF to_regclass('public.' || tbl) IS NULL THEN
      CONTINUE;
    END IF;
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl
        AND column_name = 'panelist_email'
    ) THEN
      EXECUTE format(
        'UPDATE %I SET panelist_email = regexp_replace(panelist_email::text, ''\+brp[0-9]*@'', ''@'', ''i'') WHERE panelist_email::text ~* ''\+brp[0-9]*@''',
        tbl
      );
    END IF;
  END LOOP;
END $$;
