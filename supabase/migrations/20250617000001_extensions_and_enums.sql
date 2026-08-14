-- Belize Research Panel — extensions and enum types
-- Idempotent: safe if apply-all.sql was run in the SQL Editor first.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE OR REPLACE FUNCTION public.__brp_create_enum(type_name text, enum_values text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = type_name
      AND n.nspname = 'public'
  ) THEN
    EXECUTE format('CREATE TYPE public.%I AS ENUM (%s)', type_name, enum_values);
  END IF;
END;
$$;

SELECT public.__brp_create_enum('account_status', '''active'', ''on_hold''');
SELECT public.__brp_create_enum(
  'account_hold_reason',
  '''email_change'', ''phone_change'', ''email_and_phone'', ''fraud_review'''
);
SELECT public.__brp_create_enum(
  'verification_status',
  '''Pending'', ''Verified'', ''Possible Duplicate'', ''Rejected'', ''Needs Follow-up'''
);
SELECT public.__brp_create_enum('panelist_status', '''Active'', ''Inactive'', ''Suspended''');
SELECT public.__brp_create_enum('user_status', '''active'', ''inactive''');
SELECT public.__brp_create_enum(
  'staff_role',
  '''super_admin'', ''operations_manager'', ''research_analyst'', ''field_supervisor'', ''finance_officer'', ''client_viewer'''
);
SELECT public.__brp_create_enum('survey_category', '''political'', ''market'', ''civic''');
SELECT public.__brp_create_enum(
  'survey_definition_status',
  '''draft'', ''published'', ''closed'''
);
SELECT public.__brp_create_enum(
  'survey_question_type',
  '''short_text'', ''long_text'', ''single_choice'', ''multiple_choice'', ''dropdown'', ''rating_scale'', ''yes_no'''
);
SELECT public.__brp_create_enum(
  'survey_assignment_status',
  '''available'', ''in_progress'', ''completed'''
);
SELECT public.__brp_create_enum('campaign_status', '''draft'', ''active'', ''closed''');
SELECT public.__brp_create_enum('campaign_delivery_type', '''internal'', ''external''');
SELECT public.__brp_create_enum(
  'campaign_target_mode',
  '''all_verified'', ''registered_voters'', ''specific_constituency'', ''specific_districts'', ''specific_constituencies'', ''specific_emails'', ''panelist_group'', ''market_target'', ''custom'''
);
SELECT public.__brp_create_enum('panelist_group_type', '''static'', ''filter''');
SELECT public.__brp_create_enum(
  'redemption_option_id',
  '''mobile_top_up'', ''bank_transfer'', ''utility_credit'', ''gift_card'''
);
SELECT public.__brp_create_enum(
  'redemption_request_status',
  '''pending'', ''approved'', ''rejected'', ''fulfilled'''
);
SELECT public.__brp_create_enum(
  'point_transaction_kind',
  '''registration'', ''verification'', ''survey_completion'', ''redemption_hold'', ''redemption_fulfilled'', ''redemption_released'', ''manual_adjustment'''
);
SELECT public.__brp_create_enum('outreach_channel', '''email'', ''whatsapp''');
SELECT public.__brp_create_enum('delivery_status', '''sent'', ''logged'', ''failed''');
SELECT public.__brp_create_enum('support_message_status', '''new'', ''read''');
SELECT public.__brp_create_enum(
  'upload_kind',
  '''photo_id'', ''residence_proof'', ''survey_logo'', ''survey_cover'''
);
SELECT public.__brp_create_enum(
  'admin_read_category',
  '''notification'', ''payout'', ''campaign'''
);

DROP FUNCTION public.__brp_create_enum(text, text);
