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
2. **Build settings** (Site configuration → Build & deploy):
   - **Base directory:** `web`
   - **Build command:** leave blank (uses `netlify.toml`) or `npm run build:netlify`
   - **Publish directory:** **clear this field** or set to `.next` — never `web` (same as base → build fails)
3. **`netlify.toml`** sets `publish = ".next"` and `@netlify/plugin-nextjs`.
4. **Required env var:** `AUTH_SESSION_SECRET` — long random string for login sessions.

### Fix “Page not found” (Netlify generic 404)

This usually means Netlify deployed a **static folder** instead of the Next.js runtime:

1. Clear **Publish directory** in Netlify UI (it must not be `web`).
2. Or set Publish directory to **`.next`** (relative to base `web`).
3. Redeploy — `netlify.toml` now sets `publish = ".next"` to override the UI.

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
