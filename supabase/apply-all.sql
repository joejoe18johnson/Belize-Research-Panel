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
-- Belize Research Panel — core tables
-- Depends on: 20250617000001_extensions_and_enums.sql

-- ─── Shared trigger: updated_at ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Identity: panelist login accounts ────────────────────────────────────────

CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  password_salt text NOT NULL,
  password_hash text NOT NULL,
  email_verified boolean NOT NULL DEFAULT false,
  verification_token text NOT NULL DEFAULT '',
  verification_sent_at timestamptz,
  panelist_registered boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Panelists (research panel profile) ─────────────────────────────────────

CREATE TABLE panelists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid UNIQUE REFERENCES accounts(id) ON DELETE SET NULL,
  email citext NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  date_of_birth date,
  gender text NOT NULL DEFAULT '',
  district text NOT NULL DEFAULT '',
  constituency text NOT NULL DEFAULT '',
  city_town_village text NOT NULL DEFAULT '',
  registered_to_vote_in_belize boolean NOT NULL DEFAULT false,
  registered_constituency text NOT NULL DEFAULT '',
  registered_city_town_village text NOT NULL DEFAULT '',
  market_research_interests text[] NOT NULL DEFAULT '{}',
  verification_status verification_status NOT NULL DEFAULT 'Pending',
  status panelist_status NOT NULL DEFAULT 'Active',
  account_status account_status NOT NULL DEFAULT 'active',
  account_hold_reason account_hold_reason,
  account_hold_note text,
  account_hold_at timestamptz,
  account_hold_by text,
  email_verified boolean NOT NULL DEFAULT false,
  phone_verified boolean NOT NULL DEFAULT false,
  id_verified boolean NOT NULL DEFAULT false,
  residence_verified boolean NOT NULL DEFAULT false,
  password_salt text NOT NULL DEFAULT '',
  password_hash text NOT NULL DEFAULT '',
  photo_id_path text NOT NULL DEFAULT '',
  residence_proof_path text NOT NULL DEFAULT '',
  registration_date date,
  last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT panelists_account_hold_reason_check CHECK (
    account_status = 'active' OR account_status = 'on_hold'
  )
);

CREATE INDEX panelists_verification_status_idx ON panelists (verification_status);
CREATE INDEX panelists_status_idx ON panelists (status);
CREATE INDEX panelists_district_idx ON panelists (district);
CREATE INDEX panelists_constituency_idx ON panelists (constituency);
CREATE INDEX panelists_registered_voter_idx ON panelists (registered_to_vote_in_belize)
  WHERE registered_to_vote_in_belize = true;

CREATE TRIGGER panelists_updated_at
  BEFORE UPDATE ON panelists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── File uploads (Supabase Storage metadata) ─────────────────────────────────

CREATE TABLE panelist_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  panelist_id uuid NOT NULL REFERENCES panelists(id) ON DELETE CASCADE,
  kind upload_kind NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'panelist-documents',
  storage_path text NOT NULL,
  original_filename text,
  mime_type text,
  byte_size bigint,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (panelist_id, kind)
);

CREATE INDEX panelist_uploads_panelist_id_idx ON panelist_uploads (panelist_id);

-- ─── Staff users ──────────────────────────────────────────────────────────────

CREATE TABLE staff_users (
  id text PRIMARY KEY,
  email citext NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role staff_role NOT NULL,
  password_salt text NOT NULL,
  password_hash text NOT NULL,
  status user_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX staff_users_role_idx ON staff_users (role);

CREATE TRIGGER staff_users_updated_at
  BEFORE UPDATE ON staff_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE staff_role_modules (
  role staff_role PRIMARY KEY,
  modules text[] NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER staff_role_modules_updated_at
  BEFORE UPDATE ON staff_role_modules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Client organizations ─────────────────────────────────────────────────────

CREATE TABLE clients (
  id text PRIMARY KEY,
  name text NOT NULL,
  contact_name text NOT NULL DEFAULT '',
  contact_email citext NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  password_salt text NOT NULL,
  password_hash text NOT NULL,
  status user_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Survey definitions ───────────────────────────────────────────────────────

CREATE TABLE survey_definitions (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category survey_category NOT NULL,
  status survey_definition_status NOT NULL DEFAULT 'draft',
  estimated_minutes integer NOT NULL DEFAULT 10 CHECK (estimated_minutes > 0),
  points integer NOT NULL DEFAULT 0 CHECK (points >= 0),
  logo_path text NOT NULL DEFAULT '',
  cover_image_path text NOT NULL DEFAULT '',
  created_by citext,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX survey_definitions_status_idx ON survey_definitions (status);
CREATE INDEX survey_definitions_category_idx ON survey_definitions (category);

CREATE TRIGGER survey_definitions_updated_at
  BEFORE UPDATE ON survey_definitions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE survey_questions (
  id text PRIMARY KEY,
  survey_definition_id text NOT NULL REFERENCES survey_definitions(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  type survey_question_type NOT NULL,
  prompt text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  scale_min integer,
  scale_max integer,
  scale_min_label text,
  scale_max_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (survey_definition_id, sort_order)
);

CREATE INDEX survey_questions_definition_idx ON survey_questions (survey_definition_id);

CREATE TABLE survey_custom_templates (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category survey_category NOT NULL,
  estimated_minutes integer NOT NULL DEFAULT 10,
  points integer NOT NULL DEFAULT 0,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER survey_custom_templates_updated_at
  BEFORE UPDATE ON survey_custom_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Panelist groups ──────────────────────────────────────────────────────────

CREATE TABLE panelist_groups (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  type panelist_group_type NOT NULL DEFAULT 'static',
  member_emails citext[] NOT NULL DEFAULT '{}',
  filter_districts text[] NOT NULL DEFAULT '{}',
  filter_constituencies text[] NOT NULL DEFAULT '{}',
  filter_registered_voters boolean,
  filter_verification_statuses verification_status[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX panelist_groups_type_idx ON panelist_groups (type);

CREATE TRIGGER panelist_groups_updated_at
  BEFORE UPDATE ON panelist_groups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Normalized membership (optional; mirrors member_emails for queries)
CREATE TABLE panelist_group_members (
  group_id text NOT NULL REFERENCES panelist_groups(id) ON DELETE CASCADE,
  panelist_id uuid NOT NULL REFERENCES panelists(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, panelist_id)
);

CREATE INDEX panelist_group_members_panelist_idx ON panelist_group_members (panelist_id);

-- ─── Campaigns ─────────────────────────────────────────────────────────────────

CREATE TABLE campaigns (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category survey_category NOT NULL,
  status campaign_status NOT NULL DEFAULT 'draft',
  survey_url text NOT NULL DEFAULT '',
  survey_definition_id text REFERENCES survey_definitions(id) ON DELETE SET NULL,
  delivery_type campaign_delivery_type NOT NULL DEFAULT 'internal',
  points integer NOT NULL DEFAULT 0 CHECK (points >= 0),
  assigned_date date,
  complete_by_date date,
  delivery_method text NOT NULL DEFAULT '',
  client_id text REFERENCES clients(id) ON DELETE SET NULL,
  target_mode campaign_target_mode NOT NULL DEFAULT 'all_verified',
  target_emails citext[] NOT NULL DEFAULT '{}',
  target_districts text[] NOT NULL DEFAULT '{}',
  target_constituencies text[] NOT NULL DEFAULT '{}',
  target_constituency text,
  target_panelist_group_id text REFERENCES panelist_groups(id) ON DELETE SET NULL,
  target_market_interests text[] NOT NULL DEFAULT '{}',
  target_custom jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  launched_at timestamptz,
  cover_image_path text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX campaigns_status_idx ON campaigns (status);
CREATE INDEX campaigns_client_id_idx ON campaigns (client_id);
CREATE INDEX campaigns_survey_definition_id_idx ON campaigns (survey_definition_id);

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Survey assignments (panelist inbox) ──────────────────────────────────────

CREATE TABLE survey_assignments (
  id text PRIMARY KEY,
  campaign_id text NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  panelist_id uuid REFERENCES panelists(id) ON DELETE CASCADE,
  panelist_email citext NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category survey_category NOT NULL,
  status survey_assignment_status NOT NULL DEFAULT 'available',
  survey_url text NOT NULL DEFAULT '',
  survey_definition_id text REFERENCES survey_definitions(id) ON DELETE SET NULL,
  delivery_type campaign_delivery_type NOT NULL DEFAULT 'internal',
  points integer NOT NULL DEFAULT 0 CHECK (points >= 0),
  assigned_date date,
  complete_by_date date,
  delivery_method text NOT NULL DEFAULT '',
  progress_percent integer NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  completed_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, panelist_email),
  CONSTRAINT survey_assignments_panelist_fk
    FOREIGN KEY (panelist_email) REFERENCES panelists(email) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX survey_assignments_panelist_email_idx ON survey_assignments (panelist_email);
CREATE INDEX survey_assignments_panelist_id_idx ON survey_assignments (panelist_id);
CREATE INDEX survey_assignments_status_idx ON survey_assignments (status);
CREATE INDEX survey_assignments_campaign_id_idx ON survey_assignments (campaign_id);

CREATE TRIGGER survey_assignments_updated_at
  BEFORE UPDATE ON survey_assignments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Survey responses ─────────────────────────────────────────────────────────

CREATE TABLE survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id text NOT NULL UNIQUE REFERENCES survey_assignments(id) ON UPDATE CASCADE ON DELETE CASCADE,
  panelist_email citext NOT NULL,
  survey_definition_id text REFERENCES survey_definitions(id) ON DELETE SET NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz,
  updated_at timestamptz,
  submitted_at timestamptz,
  CONSTRAINT survey_responses_panelist_fk
    FOREIGN KEY (panelist_email) REFERENCES panelists(email) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX survey_responses_panelist_email_idx ON survey_responses (panelist_email);
CREATE INDEX survey_responses_submitted_at_idx ON survey_responses (submitted_at DESC);

-- ─── Rewards ───────────────────────────────────────────────────────────────────

CREATE TABLE reward_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  registration_points integer NOT NULL DEFAULT 10 CHECK (registration_points >= 0),
  verification_points integer NOT NULL DEFAULT 25 CHECK (verification_points >= 0),
  minimum_redemption_points integer NOT NULL DEFAULT 500 CHECK (minimum_redemption_points >= 0),
  points_per_bzd_dollar integer NOT NULL DEFAULT 25 CHECK (points_per_bzd_dollar > 0),
  survey_reward_presets integer[] NOT NULL DEFAULT '{100,150,200}',
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER reward_settings_updated_at
  BEFORE UPDATE ON reward_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Legacy seed balances (migrated from panelist-reward-balances.json)
CREATE TABLE panelist_reward_balance_seeds (
  panelist_email citext PRIMARY KEY REFERENCES panelists(email) ON UPDATE CASCADE ON DELETE CASCADE,
  total_points integer NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Admin manual point overrides
CREATE TABLE panelist_points_overrides (
  panelist_email citext PRIMARY KEY REFERENCES panelists(email) ON UPDATE CASCADE ON DELETE CASCADE,
  total_points integer NOT NULL CHECK (total_points >= 0),
  note text NOT NULL DEFAULT '',
  updated_by citext,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auditable points ledger (source of truth going forward)
CREATE TABLE point_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  panelist_id uuid NOT NULL REFERENCES panelists(id) ON DELETE CASCADE,
  kind point_transaction_kind NOT NULL,
  points integer NOT NULL,
  reference_type text,
  reference_id text,
  description text NOT NULL DEFAULT '',
  created_by citext,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX point_transactions_panelist_id_idx ON point_transactions (panelist_id, created_at DESC);
CREATE INDEX point_transactions_reference_idx ON point_transactions (reference_type, reference_id);
CREATE UNIQUE INDEX point_transactions_survey_completion_uniq
  ON point_transactions (reference_type, reference_id)
  WHERE kind = 'survey_completion' AND reference_type = 'survey_assignment';

CREATE TABLE redemption_requests (
  id text PRIMARY KEY,
  panelist_id uuid NOT NULL REFERENCES panelists(id) ON DELETE CASCADE,
  panelist_email citext NOT NULL,
  option_id redemption_option_id NOT NULL,
  option_label text NOT NULL DEFAULT '',
  points integer NOT NULL CHECK (points > 0),
  amount_bz numeric(10, 2),
  value_label text NOT NULL DEFAULT '',
  status redemption_request_status NOT NULL DEFAULT 'pending',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text NOT NULL DEFAULT '',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  processed_by citext,
  CONSTRAINT redemption_requests_panelist_fk
    FOREIGN KEY (panelist_email) REFERENCES panelists(email) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX redemption_requests_panelist_id_idx ON redemption_requests (panelist_id);
CREATE INDEX redemption_requests_status_idx ON redemption_requests (status);
CREATE INDEX redemption_requests_requested_at_idx ON redemption_requests (submitted_at DESC);

-- ─── Notifications & admin read state ─────────────────────────────────────────

CREATE TABLE panelist_notification_reads (
  panelist_email citext NOT NULL REFERENCES panelists(email) ON UPDATE CASCADE ON DELETE CASCADE,
  notification_id text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (panelist_email, notification_id)
);

CREATE TABLE admin_read_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id text REFERENCES staff_users(id) ON DELETE CASCADE,
  category admin_read_category NOT NULL,
  item_id text NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_user_id, category, item_id)
);

CREATE INDEX admin_read_states_category_idx ON admin_read_states (category, item_id);

-- ─── Outbound messaging & support ─────────────────────────────────────────────

CREATE TABLE outbound_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL,
  phone text NOT NULL DEFAULT '',
  channel outreach_channel NOT NULL,
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  context text NOT NULL DEFAULT '',
  delivery_status delivery_status NOT NULL DEFAULT 'logged',
  resend_id text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX outbound_messages_sent_at_idx ON outbound_messages (sent_at DESC);

CREATE TABLE support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  email citext NOT NULL,
  topic text NOT NULL DEFAULT '',
  topic_label text NOT NULL DEFAULT '',
  message text NOT NULL,
  panelist_id uuid REFERENCES panelists(id) ON DELETE SET NULL,
  panelist_email citext NOT NULL DEFAULT '',
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  status support_message_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX support_messages_status_idx ON support_messages (status);
CREATE INDEX support_messages_created_at_idx ON support_messages (created_at DESC);

-- ─── Helper view: panelist point balance ────────────────────────────────────────

CREATE OR REPLACE VIEW panelist_point_balances AS
WITH earned AS (
  SELECT
    p.id AS panelist_id,
    p.email AS panelist_email,
    CASE WHEN p.registration_date IS NOT NULL THEN rs.registration_points ELSE 0 END AS reg_pts,
    CASE WHEN p.verification_status = 'Verified' THEN rs.verification_points ELSE 0 END AS ver_pts,
    COALESCE(SUM(sa.points) FILTER (WHERE sa.status = 'completed'), 0)::integer AS survey_pts
  FROM panelists p
  CROSS JOIN reward_settings rs
  LEFT JOIN survey_assignments sa ON sa.panelist_email = p.email
  GROUP BY
    p.id,
    p.email,
    rs.registration_points,
    rs.verification_points,
    p.registration_date,
    p.verification_status
),
adjusted AS (
  SELECT
    e.panelist_id,
    e.panelist_email,
    COALESCE(
      po.total_points,
      COALESCE(bs.total_points, 0) + e.reg_pts + e.ver_pts + e.survey_pts
    ) AS total_points
  FROM earned e
  LEFT JOIN panelist_points_overrides po ON po.panelist_email = e.panelist_email
  LEFT JOIN panelist_reward_balance_seeds bs ON bs.panelist_email = e.panelist_email
),
redemptions AS (
  SELECT
    panelist_id,
    COALESCE(SUM(points) FILTER (WHERE status = 'fulfilled'), 0)::integer AS fulfilled_points,
    COALESCE(SUM(points) FILTER (WHERE status IN ('pending', 'approved')), 0)::integer AS reserved_points
  FROM redemption_requests
  GROUP BY panelist_id
)
SELECT
  a.panelist_id,
  a.panelist_email,
  a.total_points,
  COALESCE(r.fulfilled_points, 0) AS fulfilled_redemption_points,
  COALESCE(r.reserved_points, 0) AS reserved_points,
  a.total_points - COALESCE(r.fulfilled_points, 0) - COALESCE(r.reserved_points, 0) AS available_points
FROM adjusted a
LEFT JOIN redemptions r ON r.panelist_id = a.panelist_id;

COMMENT ON VIEW panelist_point_balances IS
  'Computed reward balance mirroring web/src/lib/panelist-points.ts logic.';
-- Belize Research Panel — Row Level Security
-- Depends on: 20250617000002_core_schema.sql
--
-- The Next.js app currently uses cookie sessions and server-side data access.
-- These policies support direct Supabase client access when you wire auth later.
-- Service role bypasses RLS for admin scripts and migrations.

-- ─── Enable RLS on all application tables ─────────────────────────────────────

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE panelists ENABLE ROW LEVEL SECURITY;
ALTER TABLE panelist_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_role_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_custom_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE panelist_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE panelist_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE panelist_reward_balance_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE panelist_points_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemption_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE panelist_notification_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_read_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- ─── Helper: map auth.users email to panelist ─────────────────────────────────

CREATE OR REPLACE FUNCTION auth_panelist_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM panelists WHERE email = auth.jwt() ->> 'email' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION auth_panelist_email()
RETURNS citext
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM panelists WHERE email = auth.jwt() ->> 'email' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION auth_is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_users
    WHERE email = auth.jwt() ->> 'email'
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION auth_is_client()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM clients
    WHERE contact_email = auth.jwt() ->> 'email'
      AND status = 'active'
  );
$$;

-- ─── Panelist policies ────────────────────────────────────────────────────────

CREATE POLICY panelists_select_own ON panelists
  FOR SELECT TO authenticated
  USING (email = auth.jwt() ->> 'email' OR auth_is_staff());

CREATE POLICY panelists_update_own ON panelists
  FOR UPDATE TO authenticated
  USING (email = auth.jwt() ->> 'email')
  WITH CHECK (email = auth.jwt() ->> 'email');

CREATE POLICY accounts_select_own ON accounts
  FOR SELECT TO authenticated
  USING (email = auth.jwt() ->> 'email' OR auth_is_staff());

CREATE POLICY accounts_update_own ON accounts
  FOR UPDATE TO authenticated
  USING (email = auth.jwt() ->> 'email')
  WITH CHECK (email = auth.jwt() ->> 'email');

CREATE POLICY panelist_uploads_own ON panelist_uploads
  FOR ALL TO authenticated
  USING (panelist_id = auth_panelist_id())
  WITH CHECK (panelist_id = auth_panelist_id());

CREATE POLICY survey_assignments_select_own ON survey_assignments
  FOR SELECT TO authenticated
  USING (panelist_email = auth_panelist_email() OR auth_is_staff() OR auth_is_client());

CREATE POLICY survey_assignments_update_own ON survey_assignments
  FOR UPDATE TO authenticated
  USING (panelist_email = auth_panelist_email())
  WITH CHECK (panelist_email = auth_panelist_email());

CREATE POLICY survey_responses_own ON survey_responses
  FOR ALL TO authenticated
  USING (panelist_email = auth_panelist_email() OR auth_is_staff())
  WITH CHECK (panelist_email = auth_panelist_email());

CREATE POLICY redemption_requests_select_own ON redemption_requests
  FOR SELECT TO authenticated
  USING (panelist_email = auth_panelist_email() OR auth_is_staff());

CREATE POLICY redemption_requests_insert_own ON redemption_requests
  FOR INSERT TO authenticated
  WITH CHECK (panelist_email = auth_panelist_email());

CREATE POLICY notification_reads_own ON panelist_notification_reads
  FOR ALL TO authenticated
  USING (panelist_email = auth_panelist_email())
  WITH CHECK (panelist_email = auth_panelist_email());

CREATE POLICY support_messages_own ON support_messages
  FOR ALL TO authenticated
  USING (panelist_email = auth_panelist_email() OR auth_is_staff())
  WITH CHECK (panelist_email = auth_panelist_email());

CREATE POLICY point_transactions_select_own ON point_transactions
  FOR SELECT TO authenticated
  USING (panelist_id = auth_panelist_id() OR auth_is_staff());

-- ─── Staff policies (read-mostly for analysts; writes via service role) ───────

CREATE POLICY staff_users_staff_read ON staff_users
  FOR SELECT TO authenticated
  USING (auth_is_staff());

CREATE POLICY staff_role_modules_staff_read ON staff_role_modules
  FOR SELECT TO authenticated
  USING (auth_is_staff());

CREATE POLICY campaigns_staff_read ON campaigns
  FOR SELECT TO authenticated
  USING (auth_is_staff() OR auth_is_client());

CREATE POLICY survey_definitions_staff_read ON survey_definitions
  FOR SELECT TO authenticated
  USING (auth_is_staff() OR auth_is_client());

CREATE POLICY survey_questions_staff_read ON survey_questions
  FOR SELECT TO authenticated
  USING (auth_is_staff() OR auth_is_client());

CREATE POLICY panelist_groups_staff_read ON panelist_groups
  FOR SELECT TO authenticated
  USING (auth_is_staff());

CREATE POLICY reward_settings_read ON reward_settings
  FOR SELECT TO authenticated
  USING (true);

-- Staff full access via service role only for admin mutations.
-- When migrating to Supabase Auth, add INSERT/UPDATE/DELETE policies per role module.

CREATE POLICY admin_read_states_staff ON admin_read_states
  FOR ALL TO authenticated
  USING (auth_is_staff())
  WITH CHECK (auth_is_staff());

CREATE POLICY outbound_messages_staff ON outbound_messages
  FOR SELECT TO authenticated
  USING (auth_is_staff());

-- ─── Storage buckets (run in Supabase dashboard or separate migration) ─────────
--
-- INSERT INTO storage.buckets (id, name, public) VALUES
--   ('panelist-documents', 'panelist-documents', false),
--   ('survey-assets', 'survey-assets', false);
--
-- CREATE POLICY "Panelists upload own documents"
--   ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'panelist-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
-- Storage buckets for panelist documents and survey branding assets

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'panelist-documents',
    'panelist-documents',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  ),
  (
    'survey-assets',
    'survey-assets',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  )
ON CONFLICT (id) DO NOTHING;

-- Panelists may upload/read files under panelist-documents/{panelist_id}/...
CREATE POLICY panelist_documents_select_own
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'panelist-documents'
    AND (storage.foldername(name))[1] = auth_panelist_id()::text
  );

CREATE POLICY panelist_documents_insert_own
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'panelist-documents'
    AND (storage.foldername(name))[1] = auth_panelist_id()::text
  );

CREATE POLICY panelist_documents_update_own
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'panelist-documents'
    AND (storage.foldername(name))[1] = auth_panelist_id()::text
  );

CREATE POLICY panelist_documents_delete_own
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'panelist-documents'
    AND (storage.foldername(name))[1] = auth_panelist_id()::text
  );

-- Staff read access to panelist documents
CREATE POLICY panelist_documents_staff_select
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'panelist-documents' AND auth_is_staff());

-- Survey assets: staff write, authenticated read (for assigned surveys)
CREATE POLICY survey_assets_staff_all
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'survey-assets' AND auth_is_staff())
  WITH CHECK (bucket_id = 'survey-assets' AND auth_is_staff());

CREATE POLICY survey_assets_authenticated_read
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'survey-assets');
-- Belize Research Panel — seed data
-- Applied automatically on `supabase db reset` (see config.toml)

INSERT INTO reward_settings (
  id,
  registration_points,
  verification_points,
  minimum_redemption_points,
  points_per_bzd_dollar,
  survey_reward_presets,
  updated_by
) VALUES (
  1,
  10,
  25,
  500,
  25,
  ARRAY[100, 150, 200],
  'Super Admin'
)
ON CONFLICT (id) DO UPDATE SET
  registration_points = EXCLUDED.registration_points,
  verification_points = EXCLUDED.verification_points,
  minimum_redemption_points = EXCLUDED.minimum_redemption_points,
  points_per_bzd_dollar = EXCLUDED.points_per_bzd_dollar,
  survey_reward_presets = EXCLUDED.survey_reward_presets,
  updated_by = EXCLUDED.updated_by,
  updated_at = now();

-- Default admin module access (mirrors web/src/lib/staff-roles.ts DEFAULT_ROLE_MODULE_ACCESS)
INSERT INTO staff_role_modules (role, modules, description) VALUES
  (
    'super_admin',
    ARRAY[
      'admin-dashboard', 'payouts', 'fraud-prevention', 'reward-settings', 'notifications',
      'email-templates', 'support-inbox', 'user-roles', 'panelists', 'panelist-groups',
      'under-review', 'sample-selection', 'campaigns', 'create-campaign', 'survey-builder',
      'survey-templates', 'survey-distribution', 'distribution-engine', 'fieldwork-management',
      'communication-notifications', 'external-data-import', 'advanced-analytics',
      'client-reporting', 'client-project-management', 'financial-revenue', 'data-protection',
      'backup-recovery', 'system-settings', 'api-integrations', 'deployment-production'
    ],
    'Full access to every admin module, settings, and platform controls.'
  ),
  (
    'operations_manager',
    ARRAY[
      'panelists', 'panelist-groups', 'admin-dashboard', 'under-review', 'notifications',
      'email-templates', 'support-inbox', 'payouts', 'fraud-prevention', 'sample-selection',
      'campaigns', 'create-campaign', 'reward-settings', 'survey-builder', 'survey-templates',
      'survey-distribution', 'distribution-engine', 'fieldwork-management',
      'communication-notifications', 'external-data-import'
    ],
    'Panel register, campaigns, sampling, distribution, and fieldwork operations.'
  ),
  (
    'research_analyst',
    ARRAY[
      'admin-dashboard', 'panelist-groups', 'advanced-analytics', 'survey-builder',
      'survey-templates', 'survey-distribution', 'distribution-engine', 'client-reporting',
      'client-project-management'
    ],
    'Analytics, reporting, client projects, and survey distribution insights.'
  ),
  (
    'field_supervisor',
    ARRAY[
      'admin-dashboard', 'under-review', 'fieldwork-management', 'fraud-prevention',
      'survey-distribution'
    ],
    'Fieldwork quality control, fraud review, and under-review queue.'
  ),
  (
    'finance_officer',
    ARRAY['admin-dashboard', 'payouts', 'financial-revenue', 'reward-settings'],
    'Payout requests, financial revenue, and redemption processing.'
  ),
  (
    'client_viewer',
    ARRAY['client-reporting'],
    'Read-only access to assigned client reporting modules.'
  )
ON CONFLICT (role) DO UPDATE SET
  modules = EXCLUDED.modules,
  description = EXCLUDED.description,
  updated_at = now();
