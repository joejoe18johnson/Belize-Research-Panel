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
  logo_path text NOT NULL DEFAULT '',
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

CREATE TABLE authorised_registrars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  notes text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL DEFAULT '',
  used_at timestamptz,
  used_by_email citext
);

CREATE UNIQUE INDEX authorised_registrars_code_idx ON authorised_registrars (code);

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
