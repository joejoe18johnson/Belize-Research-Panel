# Belize Research Panel

Next.js panelist portal for the Belizean Research Panel.

## Repository layout

| Path | Purpose |
|------|---------|
| `web/` | **Production app** — deploy this directory only |
| `appfiles/` | Local Streamlit prototype (gitignored, not on GitHub) |
| `netlify.toml` | Netlify build config (base directory = `web`) |

## Development

```bash
cd web
npm install
npm run dev
```

Demo accounts: run `npm run seed:demo` from `web/`.

## Netlify (recommended for testing)

1. Connect [GitHub repo](https://github.com/joejoe18johnson/Belize-Research-Panel) in the Netlify dashboard.
2. Netlify reads **`netlify.toml` at the repo root** — no manual base directory needed.
3. Set environment variables (Site settings → Environment variables):
   - `AUTH_SESSION_SECRET` — required for production deploys
   - `ENABLE_DEMO_ACCOUNTS` / `NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS` — `true` on staging sites
   - `ENABLE_POINTS_OVERRIDE` — `true` to test rewards point editing

Deploy previews and branch deploys automatically enable demo mode via `netlify.toml`.

**Build command:** `npm run build:netlify` (seeds demo accounts, then builds)  
**Node version:** 20 (from `web/.nvmrc`)

### Local Netlify simulation

From the repo root (requires [Netlify CLI](https://docs.netlify.com/cli/get-started/)):

```bash
npx netlify dev
```

### Testing limitations on Netlify

The app stores panelist data in local JSON/CSV files under `web/data/`. On Netlify, the filesystem is **ephemeral** — reads from bundled seed data work, but **writes may not persist** between serverless invocations. Use demo logins and read-only flows for preview QA; plan a database for production persistence.

### Demo credentials (after seed)

| Email | Password | Use |
|-------|----------|-----|
| `demo@belizepanel.test` | `DemoPass1!` | Registration flow |
| `johannesjohnsonj@gmail.com` | `DemoPass1!` | Verified dashboard |
| `demo.unverified@belizepanel.test` | `DemoPass1!` | Unverified panelist |

## Other hosts

- **Vercel:** Root Directory → `web`, build → `npm run build`
- **GitHub Actions:** The `Web` workflow mirrors the Netlify build
