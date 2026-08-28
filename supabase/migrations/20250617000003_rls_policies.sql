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
ALTER TABLE authorised_registrars ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY authorised_registrars_staff_read ON authorised_registrars
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
