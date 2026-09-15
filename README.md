# SaaSquatch Leads

A full-stack B2B lead-generation platform: search a filterable index of companies and
decision makers, save the good ones into lists, and launch AI-personalized outreach
sequences over email and LinkedIn — with built-in email and phone validation so bad
data never reaches a campaign.

**Demo sign-in:** `demo@saasquatch.test` / `demo1234` (one-click button on /login)

---

## The product in one pass

1. **Find** — People and Companies tabs over a Postgres-backed index (400 companies,
   1,200+ contacts seeded; live imports land in the same tables). Filter by title,
   seniority, department, industry, location, company size, tech stack, and email
   status — or type the audience in plain English and let the AI fill the same
   filters (*"VPs of engineering at 50–200 person fintech companies in Texas"*).
   Every filter lives in the URL: searches are shareable and back-button friendly.
2. **Save** — bulk-select results into lists. Lists feed campaigns in two clicks and
   export to injection-safe CSV.
3. **Act** — a campaign starts from a four-field brief (offer, audience, tone, CTA);
   the AI designs the whole multi-step sequence. Step-1 emails are personalized *per
   lead*, citing a concrete signal (funding round, hiring spree, tech migration) from
   the contact's record. Generation and sending run on real queues with delayed jobs
   for follow-up waits; delivery events feed a funnel (sent → delivered → opened).
   LinkedIn steps become **compliant tasks** — AI-drafted message, copy to clipboard,
   deep-link to the profile — because LinkedIn automation violates their ToS.
4. **Validate** — self-hosted email checks (syntax, live MX lookup, disposable
   domains, role accounts) and offline phone validation (libphonenumber: E.164,
   country, line type), single or bulk, with history.

## Architecture

```
apps/
├── web   Next.js 15 (App Router) · Auth.js v5 · Tailwind v4 + shadcn/ui
│         Server components fetch from the API; the API's JWT rides inside
│         the Auth.js session cookie and never reaches the browser.
└── api   NestJS 11 · Prisma 6 + PostgreSQL · Swagger at /docs
          ├── Redis        response caching (search 60s, facets 10min)
          ├── BullMQ       queues: draft generation + sending, with retry,
          │                rate limiting, and waitDays-delayed follow-ups
          ├── worker.ts    separate worker entrypoint for production
          └── providers    Apollo · Hunter · Gemini/Groq · Brevo · ZeroBounce
```

- **12-model domain** (User, Company, Contact, List, Campaign, CampaignStep,
  CampaignContact, Message, ValidationResult, CreditUsage, …) in
  [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma).
- **Auth**: bcrypt + JWT (passport-jwt); per-route throttling on auth, AI, and
  validation endpoints.
- **Everything is a real pipeline**: launching a campaign queues jobs, the send
  processor emits delivery events, the dashboard reads them back. When no email
  provider is configured the transport is simulated — same queue, same events,
  no real delivery.

### Live integrations — all optional, graceful demo mode without keys

| Provider | Used for | Free tier reality check |
|---|---|---|
| **Apollo** | Company enrichment by domain (`Import from web`) | Free plan exposes *org enrich only* — people search/match returns `API_INACCESSIBLE` (verified live) |
| **Hunter.io** | People + work emails by domain | 50 lookups/mo free |
| **Gemini** (Groq fallback) | NL search parsing, sequence design, per-lead personalization | Generous free tier; model configurable via `GEMINI_MODEL` |
| **Brevo** | Real email sending behind `MailerService` | 300 emails/day free — currently simulated by default |
| **ZeroBounce** | Deep mailbox-level verification | 100 checks/mo free |

Keys live only in the API's environment (`apps/api/.env`, gitignored). The
Settings page shows what's connected without ever exposing a key.

## Run it

### Docker (full stack)

```bash
docker compose up --build          # postgres + redis + api + worker + web
docker compose --profile seed run seed   # one-off: migrate + seed demo data
```

Web on http://localhost:3000, API + Swagger on http://localhost:4000/docs.

### Local dev (no Docker needed)

```bash
# 1. infra — boots an embedded PostgreSQL (:5432) and Redis (:6379)
cd apps/api && npm i && node scripts/dev-infra.mjs &

# 2. api
cp .env.example .env               # then set JWT_SECRET (and any provider keys)
npx prisma migrate dev && npm run seed
npm run start:dev                  # :4000, INLINE_WORKER=1 runs queues in-process

# 3. web
cd ../web && npm i && npm run dev  # :3000
```

Tip: set `DAY_MS=60000` in the API env to watch a multi-day sequence play out in
minutes.

## Design decisions worth calling out

- **NL search is grounded, not vibes.** The prompt→filters parser receives the
  index's *actual* industry and tech vocabulary, so "fintech" maps to the real
  "Financial Services" facet instead of silently matching nothing.
- **Email status is a first-class asset.** Verified / guessed / unavailable badges
  everywhere; campaign launch skips contacts without an address rather than
  bouncing and burning sender reputation.
- **Signals drive copy.** The AI writer must cite the lead's stored signal in the
  opening line — and is instructed to skip personalization rather than fake it
  (the Clay "SKIP" pattern). No "I loved your recent post" filler.
- **Compliance is a feature.** LinkedIn steps are deliberately manual
  (copy + deep-link + done-tracking). Email validation does no SMTP handshake —
  cloud hosts block port 25 and catch-alls defeat it — and says so in the UI
  instead of pretending mailbox-level certainty.
- **CSV export is injection-safe** (RFC 4180 + OWASP formula-injection guard) —
  exported lead data ends up in spreadsheets.

## Repo tour

| Path | What's there |
|---|---|
| `apps/api/src/search` | Filtered search + facets (Redis-cached), Apollo/Hunter enrichment |
| `apps/api/src/ai` | LLM client (Gemini→Groq fallback), writer, NL parser, sequence designer |
| `apps/api/src/campaigns` | Brief→campaign, step editing, contact management, launch |
| `apps/api/src/queues` | Generate + send processors, worker module |
| `apps/api/src/validation` | Email + phone validators, bulk, history |
| `apps/web/app/(app)` | Dashboard, find, lists, campaigns, validate, settings |
| `apps/web/lib/api.ts` | The one HTTP client every server component/action goes through |
| `docs/` | Original teardown evidence of the reference product, time log |

---

*Built as a hiring pre-work exercise. The first phase was a quality-lane teardown of
the reference app (see [docs/](docs/) for the evidence trail); the project then grew
into the standalone product this README describes.*
