# LedgerCrew AI

A multi-agent AI SaaS back-office for Indian MSMEs — five specialist agents read invoices, draft GST filings, chase overdue payments, and forecast cash flow, coordinated by an Orchestrator that surfaces a daily business brief.

This repository is currently a **scaffold** — the full folder structure for frontend, backend, and AI agent code, with no implementation yet. Empty files mark exactly where each piece of logic belongs.

## Repository structure

```
ledgercrew-ai/
├── apps/
│   └── web/                          Next.js frontend (deployed on Vercel)
│       ├── app/
│       │   ├── (marketing)/          Public landing page
│       │   ├── (auth)/
│       │   │   ├── login/
│       │   │   └── onboarding/
│       │   ├── (dashboard)/          Authenticated app
│       │   │   ├── dashboard/
│       │   │   ├── ledger/
│       │   │   │   └── [invoiceId]/  Invoice detail view
│       │   │   ├── collections/
│       │   │   ├── crew/
│       │   │   ├── cash-flow/
│       │   │   ├── trust-score/
│       │   │   ├── settings/
│       │   │   ├── billing/
│       │   │   ├── privacy/
│       │   │   └── resources/
│       │   └── api/
│       │       ├── webhooks/
│       │       │   ├── whatsapp/     Twilio WhatsApp Sandbox webhook
│       │       │   └── payments/     Billing provider webhook
│       │       └── agents/
│       │           └── [agentName]/  Invoke a specific crew agent
│       ├── components/
│       │   ├── ui/                   Design-system primitives (buttons, cards, pills)
│       │   ├── dashboard/            Dashboard-specific components
│       │   ├── crew/                 Agent cards, reasoning panel, etc.
│       │   └── charts/               Sparkline, gauge, bar chart components
│       ├── lib/
│       │   ├── supabase/             Client + server Supabase instances
│       │   ├── hooks/
│       │   └── utils/
│       ├── styles/
│       │   └── tokens.css            Design tokens (colors, fonts) — see /design
│       └── public/assets/
│
├── agents/                           AI agent orchestration (the "crew")
│   ├── orchestrator/                 Plans agent execution, holds shared state
│   ├── intake/                       Invoice/receipt OCR extraction
│   ├── compliance/                   GST classification + GSTR draft generation
│   ├── collections/                  Staged payment reminder drafting
│   ├── guardrail/                    Reviews Collections drafts before sending
│   ├── cash-flow/                    30/60/90-day forecasting
│   ├── shared/
│   │   ├── memory/                   Per-tenant pgvector memory access
│   │   ├── audit-log/                Logs every agent decision
│   │   └── llm-clients/              Claude, Groq, Gemini API clients
│   └── graph.ts                      LangGraph/CrewAI orchestration graph definition
│   (each agent folder has a /prompts subfolder for its system prompts)
│
├── supabase/                         Backend: database + serverless functions
│   ├── migrations/                   SQL schema migrations (multi-tenant, RLS)
│   ├── functions/
│   │   ├── process-invoice/          Edge Function: triggers Intake on upload
│   │   ├── send-reminder/            Edge Function: triggers Collections + Guardrail
│   │   ├── daily-brief/              Edge Function: triggers Orchestrator's daily brief
│   │   └── heartbeat/                Keeps the free-tier project from auto-pausing
│   ├── seed.sql                      Demo/seed data
│   └── config.toml
│
├── integrations/                     Third-party service clients
│   ├── whatsapp/                     Twilio WhatsApp Sandbox intake
│   ├── voice/                        Groq Whisper (STT) + Web Speech API (TTS)
│   ├── email/                        Resend transactional email
│   └── gst/                          Official GST/Income Tax/Udyam portal links
│
├── packages/
│   └── shared-types/                 TypeScript types shared between web + agents
│
├── design/
│   └── tokens.json                   Source-of-truth design tokens (see docs)
│
├── prototypes/                       Already-built static HTML UI prototypes
│   ├── landing.html                  Marketing page (built)
│   └── app.html                      Login + Dashboard/Ledger/Collections/Crew/Privacy/Resources (built)
│
├── docs/
│   ├── PROJECT_DOCUMENTATION.md      Full technical documentation + design system
│   ├── ledgercrew-ai-prd.pdf         Product Requirements Document
│   └── (Word/PDF copies of both)
│
├── scripts/
│   └── setup.sh                      Local dev environment setup
│
├── .env.example
├── .gitignore
└── LICENSE
```

## Status

Empty scaffold — no implementation yet. The `prototypes/` folder contains the two static HTML pages already designed (open directly in a browser); everything under `apps/`, `agents/`, `supabase/`, `integrations/`, and `packages/` is structure only, ready for real code to be written into it.

See `docs/PROJECT_DOCUMENTATION.md` for the full architecture, agent responsibilities, and design system, and `docs/ledgercrew-ai-prd.pdf` for feature priorities and phased build plan.

## Tech stack (planned)

Next.js (Vercel) · Supabase (DB/Auth/Storage/pgvector) · LangGraph or CrewAI · Claude API · Groq/Gemini Flash · Resend · Twilio WhatsApp Sandbox — all free-tier.

## License

MIT — see [LICENSE](LICENSE).
