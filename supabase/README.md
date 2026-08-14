# Belize Research Panel — Supabase / PostgreSQL

Database schema for migrating the site from JSON/CSV file storage to [Supabase](https://supabase.com) on PostgreSQL.

## Quick start

Your project ref is **`ptaorsttwhogczmncvuf`**.

### Option A — SQL Editor (no CLI install) **recommended**

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/ptaorsttwhogczmncvuf/sql/new)
2. Open `supabase/apply-all.sql` in this repo, copy the full contents, paste into the editor, and **Run**
3. Import JSON data:

```bash
cd web
npm run import:supabase:fresh
```

### Option B — Supabase CLI via npx (no global install)

```bash
cd "/Users/admin/Documents/Glen Project/Belize Research Panel"
npx supabase login
npx supabase link --project-ref ptaorsttwhogczmncvuf
npx supabase db push
cd web && npm run import:supabase:fresh
```

### Option C — Install CLI globally (Homebrew)

```bash
brew install supabase/tap/supabase
cd "/Users/admin/Documents/Glen Project/Belize Research Panel"
supabase login
supabase link --project-ref ptaorsttwhogczmncvuf
supabase db push
cd web && npm run import:supabase:fresh
```

For local Supabase (Docker required):

```bash
npx supabase start
npx supabase db reset   # runs migrations + seed.sql
```

Add environment variables to `web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ptaorsttwhogczmncvuf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Migration files

| File | Purpose |
|------|---------|
| `migrations/20250617000001_extensions_and_enums.sql` | `pgcrypto`, `citext`, enum types |
| `migrations/20250617000002_core_schema.sql` | All application tables + `panelist_point_balances` view |
| `migrations/20250617000003_rls_policies.sql` | Row Level Security + auth helper functions |
| `migrations/20250617000004_storage.sql` | Storage buckets + object policies |
| `seed.sql` | Default reward settings + staff role module access |

## Entity map (JSON → table)

| Current file | PostgreSQL table(s) |
|--------------|---------------------|
| `web/data/accounts.json` | `accounts` |
| `web/data/panelists.csv` | `panelists`, `panelist_uploads` |
| `web/data/staff-users.json` | `staff_users` |
| `web/data/staff-role-access.json` | `staff_role_modules` |
| `web/data/clients.json` | `clients` |
| `web/data/survey-definitions.json` | `survey_definitions`, `survey_questions` |
| `web/data/survey-custom-templates.json` | `survey_custom_templates` |
| `web/data/campaigns.json` | `campaigns` |
| `web/data/panelist-surveys.json` | `survey_assignments` |
| `web/data/survey-responses.json` | `survey_responses` |
| `web/data/panelist-groups.json` | `panelist_groups`, `panelist_group_members` |
| `web/data/reward-settings.json` | `reward_settings` |
| `web/data/panelist-reward-balances.json` | `panelist_reward_balance_seeds` |
| `web/data/panelist-points-overrides.json` | `panelist_points_overrides` |
| `web/data/redemption-requests.json` | `redemption_requests`, `point_transactions` |
| `web/data/panelist-notification-state.json` | `panelist_notification_reads` |
| `web/data/admin-read-state.json` | `admin_read_states` |
| `web/data/outbound-messages.json` | `outbound_messages` |
| `web/data/support-messages.json` | `support_messages` |

## Tables (22)

### Identity
- **accounts** — panelist login (email/password, verification)
- **panelists** — research profile, verification, residence/voter fields
- **panelist_uploads** — Supabase Storage metadata (photo ID, proof of residence)

### Staff & clients
- **staff_users** — admin console users
- **staff_role_modules** — role → admin module slugs + description
- **clients** — client portal organizations

### Surveys & campaigns
- **survey_definitions** — built-in survey blueprints
- **survey_questions** — normalized question rows (`options` as JSONB)
- **survey_custom_templates** — reusable template library
- **campaigns** — survey campaigns with targeting rules
- **survey_assignments** — per-panelist inbox items
- **survey_responses** — submitted answers (`answers` JSONB)

### Groups
- **panelist_groups** — static email lists or filter definitions
- **panelist_group_members** — normalized group membership

### Rewards
- **reward_settings** — singleton platform reward config
- **panelist_reward_balance_seeds** — legacy imported balances
- **panelist_points_overrides** — admin manual totals
- **point_transactions** — auditable points ledger (recommended going forward)
- **redemption_requests** — payout/redemption queue

### State & messaging
- **panelist_notification_reads** — dashboard notification read state
- **admin_read_states** — admin inbox read markers (notifications, payouts, campaigns)
- **outbound_messages** — email/WhatsApp outreach log
- **support_messages** — contact form / support inbox

### View
- **panelist_point_balances** — computed balance (mirrors `web/src/lib/panelist-points.ts`)

## Design notes

- **Text IDs preserved** where the app uses slugs (`campaigns.id`, `survey_definitions.id`, `staff_users.id`) for easier JSON import.
- **Email joins** remain as `citext` FKs during migration; long-term prefer `panelist_id` UUID FKs everywhere.
- **Dual passwords**: `accounts` and legacy `panelists.password_*` both exist today — consolidate onto `accounts` when wiring auth.
- **RLS** is enabled with policies for future Supabase Auth; the Next.js app currently uses cookie sessions and should use the **service role** key server-side until auth is migrated.
- **Storage paths**: `panelist-documents/{panelist_id}/photo_id|residence_proof`, `survey-assets/{survey_definition_id}/logo|cover`.

## Next steps

1. Run migrations against your Supabase project (`supabase db push`).
2. Import existing JSON/CSV data (one-time script — not included yet).
3. Replace `web/src/lib/*` file readers with Supabase queries using the service role on API routes.
4. Optionally migrate to Supabase Auth and map `auth.users.email` → `panelists.email` for client-side RLS.

## Generate TypeScript types

```bash
supabase gen types typescript --linked > web/src/lib/database.types.ts
```

## Import existing JSON/CSV data

After applying migrations, from `web/`:

```bash
npm run import:supabase          # upsert data from web/data/
npm run import:supabase:fresh    # clear app tables first, then import
node scripts/import-json-to-supabase.mjs --dry-run   # preview counts only
```

Survey assignment IDs are normalized to `{campaignId}::{panelistEmail}` (legacy JSON reused campaign ids for every panelist).
