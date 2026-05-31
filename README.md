# Belize Research Panel

Next.js panelist portal for the Belizean Research Panel.

## Repository layout

| Path | Purpose |
|------|---------|
| `web/` | **Production app** — deploy this directory only |
| `netlify.toml` | Netlify build config (base directory = `web`) |
| `appfiles/` | Local Streamlit prototype (gitignored, not on GitHub) |

## Development

```bash
npm install --prefix web   # first time
npm run dev                # from repo root, or cd web && npm run dev
```

Demo accounts: `npm run seed:demo` (also runs automatically on Netlify build).

## Netlify deploy checklist

1. Connect [GitHub repo](https://github.com/joejoe18johnson/Belize-Research-Panel) in Netlify.
2. Netlify reads **`netlify.toml` at the repo root** — no manual base directory needed.
3. **Required env var** (Site settings → Environment variables):
   - `AUTH_SESSION_SECRET` — long random string (required for login sessions on production)
4. **Already set in `netlify.toml`** for testing:
   - `NEXT_PUBLIC_USE_TEXT_LOGO=true` — fast text logo (no PNG download)
   - `NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS=true` — demo login shortcuts on deploy previews/production

**Build:** `npm run build:netlify` (seeds demo accounts, then `next build`)  
**Node:** 20 (`web/.nvmrc`)

### Demo credentials (bundled in `web/data/`)

| Email | Password | Use |
|-------|----------|-----|
| `glen.avilez@belizepanel.test` | `DemoPass1!` | Verified, 2,800 earned / 750 available |
| `johannesjohnsonj@gmail.com` | `DemoPass1!` | Verified dashboard |
| `demo.unverified@belizepanel.test` | `DemoPass1!` | Unverified panelist |
| `demo@belizepanel.test` | `DemoPass1!` | Registration flow |

### Netlify limitations

Panelist data lives in JSON/CSV under `web/data/`. The Netlify filesystem is **ephemeral** — seed data reads work for testing, but **writes may not persist** between requests.

## Performance notes

- Text logo enabled by default (`NEXT_PUBLIC_USE_TEXT_LOGO`)
- Single web font (Geist Sans), no logo PNG on critical path
- Static `/_next/*` assets cached via `netlify.toml` headers
- Production build: `npm run build:netlify` from `web/`
