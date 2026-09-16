# SaaSquatch Leads

A B2B lead generation platform. Search a database of companies and decision makers, save the good ones into lists, and launch AI-personalized outreach over email and LinkedIn. Email and phone validation is built in, so bad data never reaches a campaign.

**Live demo:** [saasquatch-signal.vercel.app](https://saasquatch-signal.vercel.app)
**Demo sign-in:** `demo@saasquatch.test` / `demo1234` (or the one-click demo button on the login page)

The first request after a quiet spell can take up to a minute while the free-tier API wakes up. Everything after that is instant.

## What it does

1. **Find.** Search 1,200+ contacts and 400 companies by title, seniority, department, industry, location, company size, and tech stack. Or just type who you want in plain English ("VPs of engineering at fintech companies in Texas") and the AI fills in the same filters for you. Filters live in the URL, so any search is shareable and the back button works.
2. **Save.** Select results in bulk and save them to lists. Lists feed campaigns in two clicks and export to CSV.
3. **Reach out.** Describe your offer in four fields and the AI designs the whole sequence. First emails are personalized per lead, citing a real signal from their record, like a funding round or a hiring spree. Sending runs on real queues with delayed jobs for the follow-up waits, and delivery events feed a funnel. LinkedIn steps become manual tasks with a drafted message and a deep link, because automating LinkedIn breaks their terms.
4. **Validate.** Check any email (syntax, live MX lookup, disposable domains, role accounts) or phone number (format, allocated range, line type), one at a time or in bulk.

## Tools and technologies

| Layer | Tool | Where and why |
|---|---|---|
| Frontend | Next.js 15 | The web app in `apps/web`; server components fetch from the API so nothing loads client side unauthenticated |
| Frontend | React 19 + TypeScript | UI and type safety across the whole monorepo |
| Frontend | Tailwind CSS v4 | All styling, through design tokens for colors, spacing, and dark mode |
| Frontend | shadcn/ui + Radix | Accessible component kit: dialogs, dropdowns, tables, tabs, selects |
| Frontend | Auth.js v5 | Login sessions; the API's JWT rides inside the session cookie and never reaches the browser |
| Frontend | Zod | Validates login and signup forms before they hit the server |
| Backend | NestJS 11 | The API in `apps/api`: modular controllers and services with guards and dependency injection |
| Backend | PostgreSQL | System of record for companies, contacts, lists, campaigns, and messages |
| Backend | Prisma 6 | ORM, schema migrations, and the seed script (400 companies, 1,206 contacts) |
| Backend | Redis | Caches search results and facets, and backs the job queues |
| Backend | BullMQ | Queues for AI draft generation, sending, and day-delayed follow-up steps |
| Backend | Passport JWT + bcryptjs | Token auth and password hashing |
| Backend | class-validator + Throttler | Request validation and per-route rate limits |
| Backend | Swagger | Self-documenting API at `/docs` |
| Backend | libphonenumber-js | Offline phone validation: E.164, country, line type |
| AI and data | Google Gemini (Groq fallback) | Plain-English search parsing, sequence design, and per-lead personalized emails |
| AI and data | Apollo.io | Live company enrichment by domain ("Import from web") |
| AI and data | Hunter.io, Brevo, ZeroBounce | Wired slots for people by domain, real email sending, and deep email verification; the app runs in demo mode without keys |
| Infra | Docker + Compose | One-command production-shaped stack: postgres, redis, api, worker, web |
| Infra | embedded-postgres + redis-memory-server | Real Postgres and Redis for local dev with zero installs, no Docker needed |
| Infra | Render, Neon, Vercel | Hosting: the API with Redis, the database, and the web app |

## Run it locally

### With Docker

```bash
docker compose up --build
docker compose --profile seed run seed   # one time: migrate and load demo data
```

Web on http://localhost:3000, API and Swagger docs on http://localhost:4000/docs.

### Without Docker

```bash
# 1. infra: boots an embedded PostgreSQL (:5432) and Redis (:6379)
cd apps/api && npm i && node scripts/dev-infra.mjs &

# 2. api
cp .env.example .env            # set JWT_SECRET, add provider keys if you have them
npx prisma migrate dev && npm run seed
npm run start:dev               # :4000, queues run in-process

# 3. web
cd ../web && npm i && npm run dev   # :3000
```

Tip: set `DAY_MS=60000` in the API env to watch a multi-day sequence play out in minutes.

## Deployment

The repo carries a [render.yaml](render.yaml) blueprint that stands up the API (Docker, health-checked, queues in-process) and a Redis instance on Render's free tier. Postgres lives on Neon, and the web app deploys to Vercel with `API_URL` pointing at the Render service. All keys are entered in each dashboard and never committed.

Note for free tiers: the API spins down after about 15 idle minutes, so the first request after a quiet spell takes half a minute to wake.

## Design decisions worth knowing

- **AI search is grounded, not guessed.** The prompt-to-filters parser receives the actual industry and tech vocabulary from the index, so "fintech" maps to the real "Financial Services" facet instead of silently matching nothing.
- **Email status is a first-class thing.** Verified, guessed, and missing addresses are labeled everywhere, and launching a campaign skips contacts without an address rather than bouncing and hurting sender reputation.
- **Signals drive the copy.** The AI writer opens with the lead's stored signal and is told to skip personalization rather than invent it. No "loved your recent post" filler.
- **Compliance is a feature.** LinkedIn steps are deliberately manual. Email validation does no SMTP handshake, since cloud hosts block port 25 and catch-alls defeat it, and the UI says so instead of pretending certainty.
- **CSV export is injection-safe.** Exported lead data ends up in spreadsheets, so cells are guarded against formula injection.

## Repo tour

| Path | What's there |
|---|---|
| `apps/api/src/search` | Filtered search and facets (Redis-cached), Apollo and Hunter enrichment |
| `apps/api/src/ai` | LLM client with Gemini-to-Groq fallback, the writer, the NL parser, the sequence designer |
| `apps/api/src/campaigns` | Brief to campaign, step editing, contact management, launch |
| `apps/api/src/queues` | The generate and send processors, plus the standalone worker entrypoint |
| `apps/api/src/validation` | Email and phone validators, bulk mode, history |
| `apps/web/app/(app)` | Dashboard, find, lists, campaigns, validate, settings |
| `apps/web/lib/api.ts` | The one HTTP client every server component and action goes through |
