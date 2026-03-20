# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Production build (outputs to /dist)
npm run lint      # Run ESLint on all JS/JSX files
npm run preview   # Preview production build locally
```

No test suite is configured.

## Architecture

**Declawed** is an AI-powered lease analysis SaaS. Users upload a PDF/DOCX lease; it gets parsed client-side, sent to a Cloudflare edge function, analyzed by Claude, and results are stored in Supabase.

### Stack
- **Frontend**: React 19 + React Router 7 + Tailwind CSS 4 + Framer Motion, built with Vite
- **Backend**: Cloudflare Pages Functions (serverless edge, `/functions/api/`)
- **Database & Auth**: Supabase (PostgreSQL + RLS + Auth)
- **Payments**: Stripe (checkout, subscriptions, webhooks)
- **AI**: Anthropic Claude API (via `/functions/api/summarize.js`)
- **Document parsing**: pdfjs-dist + mammoth run on the client

### Analysis Flow
1. Client parses PDF/DOCX to raw text
2. `POST /api/summarize` — backend calls Claude with tenant or landlord prompt
3. Claude returns structured JSON: `{ score, verdict, redFlags, keyDates, tenantRights, actionSteps, unusualClauses }`
4. Result stored in `analyses` table; `analyses_used` incremented via Supabase RPC
5. `SummaryPanel.jsx` renders the result

### Auth & Usage Gating
- `AuthContext.jsx` holds `user`, `profile`, `loading`; call `refreshProfile()` after plan upgrades
- Backend validates JWTs by calling Supabase auth endpoint; uses service-role key for DB writes
- Anonymous users get 1 free analysis tracked via a signed HttpOnly cookie (`dcl_free_used`, signed with `COOKIE_SECRET`)
- Plan tiers: `free` (1 analysis), `one` (1, one-time $3.99), `pro` (10/mo, $12), `unlimited` (9999/mo, $29)

### Backend Conventions
- Functions in `/functions/api/` use raw `fetch()` — no Stripe or Supabase server SDK
- All authenticated endpoints expect `Authorization: Bearer <jwt>`
- Stripe webhook signature verified via Web Crypto API (`crypto.subtle`)
- Supabase DB mutations use service-role key (bypasses RLS)

### Database
Key tables in `supabase/schema.sql`:
- `profiles` — extends `auth.users`; stores `plan`, `analyses_used`, `analyses_limit`, Stripe IDs
- `analyses` — stores `result` (JSONB), `share_token`, `source_text`, `note`, `user_id`

Supabase RPC functions handle atomic operations: `increment_analyses_used`, `upgrade_user_plan`.

### Frontend Routing
Defined in `App.jsx`. Protected routes check auth state; unauthenticated users are redirected to `/`. The Vite config copies `dist/index.html` → `dist/404.html` for Cloudflare Pages SPA routing.

### Environment Variables
Frontend (VITE_ prefix, public): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Backend (Cloudflare Pages env only): `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ONE/PRO/UNLIMITED`, `COOKIE_SECRET`
