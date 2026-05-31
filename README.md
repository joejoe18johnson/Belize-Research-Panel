# Belize Research Panel

Next.js panelist portal for the Belizean Research Panel.

## Repository layout

| Path | Purpose |
|------|---------|
| `web/` | **Production app** — deploy this directory only |
| `appfiles/` | Local Streamlit prototype (gitignored, not on GitHub) |

## Development

```bash
cd web
npm install
npm run dev
```

Demo accounts: run `npm run seed:demo` from `web/`.

## Deploy from GitHub

Connect this repo to your host and set the **root directory to `web`**.

- **Vercel:** Project Settings → General → Root Directory → `web`
- **Netlify:** Site settings → Build & deploy → Base directory → `web`
- **GitHub Actions:** The `Web` workflow builds only `web/` on push to `main`.

Build command: `npm run build`  
Output: Next.js default (`.next`)
