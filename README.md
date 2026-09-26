# LedgerCrew AI

A multi-agent AI SaaS back-office for Indian MSMEs — five specialist agents read invoices, draft GST filings, chase overdue payments, and forecast cash flow, coordinated by an Orchestrator that surfaces a daily business brief.

**Frontend: complete and tested.** Backend: designed, not yet built.

## Run it locally

```bash
cd apps/web
npm install --no-audit --no-fund --legacy-peer-deps
npm run dev
```

Open **http://localhost:3000**.

| Page | Route |
|---|---|
| Landing | `/` |
| Login | `/login` |
| Dashboard | `/dashboard` |
| Your Profile | `/profile` |
| Ledger | `/ledger` |
| Collections | `/collections` |
| Crew | `/crew` |
| Privacy | `/privacy` |
| Resources | `/resources` |
| Settings | `/settings` |

All 10 pages above are real, built, and tested — not placeholders. Onboarding, Invoice Detail, Cash-flow (deep-dive), Trust Score, and Billing are still placeholder stubs (lower priority per the PRD).

Every page ships **without a backend yet** — all data shown (invoices, agent activity, GST figures, etc.) is hardcoded demo content. Sign-in currently routes straight through with no real auth check, and "Delete account" in Settings asks for confirmation but can't actually delete anything yet.

**Light/Dark theme**: a real toggle exists — the 🌙/☀️ icon in the nav, or the full picker on `/settings` (Light / Dark / System). It persists across reloads via `localStorage` and applies before the page paints, so there's no flash of the wrong theme. Dark mode is a genuine near-black (`#07090A`), not just a dimmed version of light mode.

## Repository structure

```
ledgercrew-ai/
├── apps/
│   └── web/                          Next.js 15 + React 19 + Tailwind frontend
│       ├── app/
│       │   ├── (marketing)/page.tsx        Landing — ✅ built
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx          ✅ built (Vanta glow, GSAP animations)
│       │   │   └── onboarding/             placeholder
│       │   ├── (dashboard)/                Shared nav/layout — ✅ built (incl. theme quick-toggle)
│       │   │   ├── dashboard/page.tsx      ✅ built (hero, attention queue, chat, activity feed, calendar, gauge)
│       │   │   ├── profile/page.tsx        ✅ built (avatar upload, GST fields, document vault)
│       │   │   ├── ledger/page.tsx         ✅ built
│       │   │   ├── collections/page.tsx    ✅ built
│       │   │   ├── crew/page.tsx           ✅ built
│       │   │   ├── privacy/page.tsx        ✅ built
│       │   │   ├── resources/page.tsx      ✅ built
│       │   │   ├── settings/page.tsx       ✅ built (theme, automation, notifications, team, danger zone)
│       │   │   ├── cash-flow/, trust-score/, billing/   placeholders
│       │   │   └── ledger/[invoiceId]/     placeholder
│       │   └── api/webhooks/, api/agents/  route stubs (501 not implemented)
│       ├── lib/theme.ts              Shared theme read/write/detect logic
│       ├── types/vanta.d.ts          Hand-written types for the untyped vanta package
│       └── (components/, styles/ — scaffolded, not yet populated)
│
├── agents/                           AI agent orchestration (the "crew") — scaffolded, not built
│   ├── orchestrator/, intake/, compliance/, collections/, guardrail/, cash-flow/
│   └── shared/{memory, audit-log, llm-clients}/
│
├── supabase/                         Backend — scaffolded, not built
│   ├── migrations/                   Multi-tenant schema + RLS (see Backend plan below)
│   └── functions/{process-invoice, send-reminder, daily-brief, heartbeat}/
│
├── integrations/                     WhatsApp (Twilio), voice (Groq Whisper), email (Resend), GST links
├── packages/shared-types/            Shared TypeScript types
├── prototypes/                       Original static HTML UI prototypes (kept in sync as a design reference)
├── docs/
│   ├── PROJECT_DOCUMENTATION.md      Full architecture, agent responsibilities, design system
│   └── ledgercrew-ai-prd.pdf         Product Requirements Document
├── .env.example
└── LICENSE
```

## Backend plan (Supabase) — designed, next up to build

**Data model:** `businesses`, `profiles`, `clients`, `invoices`, `collections_stages`, `agent_activity_log` (powers the Dashboard's live feed, Crew's reasoning traces, and Resources' calculation proof — one table, three UI surfaces), `gst_filings`, `calendar_events`, `agent_settings`, `agent_memory` (pgvector, per-tenant), `trust_score_aggregates` (kept structurally separate from per-business data).

**Multi-tenancy:** every table gets `business_id`; one uniform RLS policy (`business_id = (select business_id from profiles where id = auth.uid())`) rather than per-table exceptions.

**Auth:** Supabase Auth, email/password + Google OAuth (buttons already built on `/login`). The WhatsApp button stays real but doesn't authenticate anyone yet — it's an intake channel, not an auth provider.

**Storage:** `avatars` (public-read) and `documents` (private, business-scoped) buckets — makes Your Profile's document vault persist for real instead of just in-tab memory.

**Realtime:** subscribing to `agent_activity_log` inserts replaces the Dashboard's current `setInterval` demo feed with genuinely live agent output.

**Build order:** (1) Supabase project + client wiring → (2) core schema + RLS → (3) real auth on Login and real logout/delete on Settings → (4) Storage buckets wired to Profile → (5) `agent_activity_log` + Realtime → (6) collections/GST/calendar tables → (7) first real Edge Function (`process-invoice`, real Claude call) → (8) remaining Edge Functions → (9) `agent_memory` → (10) trust score aggregation (deliberately last — needs real cross-tenant usage to mean anything).

Full detail in `docs/PROJECT_DOCUMENTATION.md`.

## Tech stack

**Built:** Next.js 15, React 19, TypeScript, Tailwind CSS, GSAP, three.js + Vanta.js.
**Planned:** Supabase (DB/Auth/Storage/pgvector) · LangGraph or CrewAI · Claude API · Groq/Gemini Flash · Resend · Twilio WhatsApp Sandbox — all free-tier.

## License

MIT — see [LICENSE](LICENSE).
