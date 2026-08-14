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
