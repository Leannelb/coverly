# Coverly

Personal health-insurance navigator for Irish patients. This repo contains two things built from one Vite project:

- **`index.html`** — the public marketing/waitlist landing page.
- **`app.html`** — the Phase 1 product prototype (policy onboarding, referral-to-specialist matching, booking/case tracking, and the rebate calculator), backed by a `localStorage` mock store standing in for a real backend.

## Local development

```
npm install
npm run dev
```

- Landing page: `http://localhost:5173/`
- Product app: `http://localhost:5173/app.html`

## Deployment

Deployed on Netlify, linked to this repo for continuous deployment — every push to `main` triggers a new build automatically.

- Build command and Node version are pinned in `netlify.toml` (no manual dashboard config needed).
- `public/_redirects` rewrites `/demo` to `app.html` so the product is reachable at `coverly.ie/demo` with a clean URL.
- `version1-outdated.html` is a kept-for-reference snapshot of an earlier design pass — not linked from anywhere, not part of the build.
