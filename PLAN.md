# SaaSquatch Signal — Sprint Plan

**Project:** Quality-first rebuild of SaaSquatch Leads search (Caprae Capital pre-work)
**Source of truth:** `BUILD_SPEC.md` (kept in repo root — the build is spec-driven)
**Working directory:** `/Users/apple/Desktop/Caprae Capital`
**Repo:** GitHub, pushed at the end of every sprint · **Deployed to Vercel from Sprint 1 onward**

> This plan was drafted from BUILD_SPEC.md + the Caprae handbook, then stress-tested by a
> three-lens adversarial review (rubric coverage · technical feasibility · reviewer experience).
> The material changes it forced are marked ⚡ below.

---

## Rules of engagement

1. Every sprint ends with **something visible running** (localhost + the Vercel URL from Sprint 1 on), a git commit, and a push. You review, give feedback, green-light the next sprint.
2. Every build decision traces to a rubric line (Business 10 · UX/UI 10 · Technicality 10 · Design 5 · Innovation 5). Only 10/40 points are code.
3. ⚡ **Cut order** (if anything slips): auth/shell → resolver → results → lists → outreach → dashboard → extras. **README + video assets are never cut** — they outrank everything below "results."
4. Data honesty: synthetic seed, `Demo data` badge on every screen, disclosed in README.
5. ⚡ Zero cost, no LLM calls, **no paid keys or third-party credentials** (an `AUTH_SECRET` env var is required by Auth.js v5 — `.env.example` committed, value auto-generated; this is not a paid secret).
6. ⚡ **Time honesty:** a start/stop time log per sprint is committed to the repo. The README claims "~5 hours of hands-on build time across sessions — log attached," never a single 5-hour window (commit timestamps would contradict it). Hour budgets below sum to ~5h of core build.

## Stack (locked)

Next.js 15 App Router · TypeScript · Tailwind CSS v4 · shadcn/ui (vendored) · Auth.js v5 (Credentials + JWT, **split edge-safe config**) · bcryptjs · SQLite via better-sqlite3 (**/tmp copy-on-cold-start on Vercel**) · zod + react-hook-form · fuse.js · recharts · lucide-react · next/font Google Fonts (Instrument Sans / Inter / JetBrains Mono) · vitest + testing-library (jsdom) · Vercel Hobby. *(Playwright: below the cut line — see Sprint 5.)*

---

## Sprint 0 — Evidence, repo, scaffold, design system  *(~0:45)*

**Goal:** the proof is banked, the skeleton exists and looks deliberate, and it's on GitHub.

- ⚡ **Before-evidence capture, before any code** (all three critics flagged deferring this as gambling the 10-pt business narrative — their app could be patched or the account could lapse mid-build):
  - Screenshots: law-firm results for "Computer Software, Austin" (F-01), the 287-option dropdown (F-03), the dropdown covering the submit button (F-02), `Total Leads: 0` after a search (F-04), all-N/A columns (F-06).
  - The raw `POST /api/naics/fetch_leads` payload + response sample.
  - A short screen recording of the live law-firm search — insurance footage for the video's opening.
  - Committed to `docs/evidence/`. *Needs your logged-in session — I drive your Chrome, or you capture while I list the shots.*
- `git init` (author identity set), GitHub repo created and pushed (see "GitHub setup" below).
- Next.js 15 + TS + Tailwind v4 scaffold; shadcn/ui initialised, components vendored.
- Design tokens from spec §9 in `globals.css`: brand teal DNA, cool neutrals, semantic confidence colours separate from brand, 6px radius, 4px spacing scale, 1.25 type scale, tabular-nums. Light **and** dark. Three fonts via `next/font/google`.
- `BUILD_SPEC.md` + `PLAN.md` + `docs/time-log.md` in repo; README skeleton written now with ⚡ **above-the-fold block reserved at the very top**: `Live demo · one-click demo sign-in (no signup) / Video (90s) / Run locally: npm i && npm run seed && npm run dev` — then the problem statement + captured payload while the evidence is fresh.
- `/dev/tokens` style-guide page (colours, type, spacing, both themes) — review artefact, cut-first later.

**You review:** evidence set, style-guide page in both themes, repo on GitHub, README opening.

---

## Sprint 1 — Auth, database layer, app shell, **first deploy**  *(~1:00)*

**Goal:** a reviewer gets in with one click — on the deployed URL, not just localhost.

- ⚡ **Auth.js v5 split config** (middleware compiles for the Edge runtime; importing better-sqlite3 there fails): edge-safe `auth.config.ts` (JWT `authorized` callback, zero DB imports) consumed by `middleware.ts`; full `auth.ts` (Credentials + bcryptjs cost 10 + SQLite) used only in server actions. JWT sessions, 30-day expiry. In-memory login rate limit (5/min/email). `.env.example` with `AUTH_SECRET`.
- ⚡ **Vercel-safe database layer** in `lib/db.ts`: `serverExternalPackages: ['better-sqlite3']` in next.config; `outputFileTracingIncludes` for the seeded `.db`; on Vercel, copy the bundled seed DB to `/tmp` on cold start and open there (no WAL — needs writable sidecars); locally, open the repo file. Writes work per-instance; a graceful toast ("demo resets periodically") on any write error so nothing ever looks broken.
- SQLite schema (all 7 tables, spec §8) + **idempotent** seed script — ⚡ no postinstall hook (it would wipe local data on every install); seed skips if DB exists, `--force` rebuilds, chained as `"build": "npm run seed && next build"`, seeded PRNG (mulberry32) for determinism. Seed v1: demo user, so first login is never empty.
- `/login` with **demo credentials in plain text + one-click "Sign in as demo"** (`demo@saasquatch.test` / `demo1234`); `/signup` with zod validation; sign-out in user menu.
- App shell: 260px sidebar, **FIND / ACT** job-grouped nav + live counts, `PROTOTYPE` badge, topbar with `Demo data` badge, theme toggle. Icon rail <1024px, drawer <768px. Placeholder pages for all §6.2 routes.
- ⚡ **Deploy the walking skeleton to Vercel now** (you authenticate the CLI once); verify one-click demo login **and one write path** in a private window. Redeploy every sprint after — the three riskiest integrations (native module, edge middleware, seed-at-build) get validated with maximum runway, not in the final sprint.

**You review:** cold private window → deployed URL → one-click demo sign-in → navigate shell, themes, sign-out, protected-route redirect.

---

## Sprint 2 — Taxonomy pipeline + Industry Resolver  *(~1:00)*

**Goal:** the real engineering. Deterministic, tested, metric printed.

- `data/raw-industries.json`: ~300 raw strings mirroring production **including their actual observed defects** (case dupes, `Busines software`, `Producitvity`, `Verical`, `Legalattorney`, free-text noise).
- `lib/taxonomy/normalise.ts` → `spellfix.ts` (observed-typo dictionary, then Levenshtein ≤2 vs canonical vocabulary, every correction logged) → canonical collapse to `data/taxonomy.json` (~40 entries, NAICS code/title/sector from public-domain Census data). ⚡ Framed as **compile-time enrichment + caching**: taxonomy compiles at build time, and every lead gets enriched with canonical industry + NAICS — this is the rubric's "enrichment" keyword, named as such in the README.
- Build script prints the headline metric (`~312 raw → ~41 canonical · N dupes collapsed · N typos fixed · 100% NAICS-mapped`) — screenshot for the README.
- `lib/taxonomy/resolve.ts`: exact → alias → Fuse.js weighted fuzzy (label 0.7 / aliases 0.3, threshold 0.4); ⚡ Fuse index built **once at module scope** (citable perf choice). Confidence bands: **High ≥85 auto-apply · Medium 60–84 flag · Low <60 block** (code comment at the low branch pointing at F-01).
- Vitest suite: ≥6 cases (typo, alias, no-match, band boundaries).
- ⚡ `/dev/resolver` playground — **now a permanent, polished feature** ("Resolver playground", linked in the sidebar under FIND): type anything, watch the full derivation live. It demos the 10-pt technical criterion to a reviewer with zero instructions.

**You review:** `npm run taxonomy` output, green tests, and the playground on the deployed URL.

---

## Sprint 3 — Search, picker, results, transparency panel  *(~1:15)*

**Goal:** the hero flow — misspelled input → correction → confident, explained results — **impossible for a reviewer to miss**.

- **Industry picker combobox** (F-02 fix): full ARIA combobox pattern, ↑↓ Enter Esc, closes on outside click/blur/selection, portal + collision detection (can never cover the submit button), grouped by NAICS sector, inline codes, recents pinned, "no match" offers closest three. ⚡ Behavior covered in **vitest + testing-library** (Esc/outside-click/keyboard); the bounding-box overlap gets a manual screenshot for the README — Playwright's ~30–45 min setup for one assertion moves below the cut line.
- Search form (F-07): Industry + Location required; collapsed Refine section (employees slider, revenue band, founded range, keyword).
- ⚡ **Example-query chips directly under the search box**: `Try: computr software` and `Try: lawnkare softwear (watch it refuse)` — the differentiators must fire without the reviewer inventing a typo.
- Full seed: ~500 deterministic synthetic companies (~15 industries, ~25 metros) each carrying a messy `rawIndustry`; ~800 contacts; ⚡ a fuzzy **duplicate-company check** in the seed pipeline ("2 possible duplicates merged" logged) — the rubric's "dedup" keyword at the company level, not just string level.
- **Match transparency panel**: band pill + confidence %, resolved label + NAICS chip, "matched from …", Change, **"Why this match?" derivation chain** (normalised → corrected → alias → canonical → NAICS + top-3 alternatives). Low band blocks with alternatives + "search anyway" escape hatch. ⚡ Footer line: *"Taxonomy: 312 raw strings → 41 canonical · 100% NAICS-mapped"* — the headline metric lives in the app, not only the README.
- Results table (F-06 — every column carries data): sticky header, sortable, tabular-nums, row selection + bulk bar, skeleton/empty/error states, pagination, row click → company drawer. ⚡ Where `rawIndustry` ≠ canonical, the Industry cell shows the fix inline (muted `Busines software →` before the canonical chip) — the thesis visible without opening anything. *(Density toggle + column-visibility menu: cut-first extras.)*

**You review (deployed):** click the `computr software` chip → correction + resolution; expand the chain; click the refuse chip → blocked with alternatives; keyboard-drive the combobox; verify zero industry leakage.

---

## Sprint 4 — Saved lists + outreach prefill  *(~0:45)*

**Goal:** results stop evaporating (F-04); outreach writes its own first draft (F-05).

- Save-to-list from bulk bar: modal (existing lists + create new); toast *"14 companies saved to …"* with **Undo**; dashboard counts increment (`// F-04` comment at the handler).
- `/lists` cards (name, count, industry-mix sparkline, updated) · `/lists/[id]` table with rename / duplicate / delete / **CSV export** / "Draft outreach for all."
- `/outreach` queue + `/outreach/[leadId]` compose: subject + body + **three context points prefilled deterministically from lead data** (industry/NAICS · size/founded · location/market), each editable, "generated from lead data" chip, Regenerate cycles template variants. No LLM anywhere.
- Seed extension (same idempotent script): 3 pre-populated lists, 4 drafts, 6 search logs — demo login lands in a working state.

**You review (deployed):** select → save (try Undo) → list → CSV export → Draft outreach → all three context points prefilled and regenerable.

---

## Sprint 5 — Dashboard + quality pass  *(~0:45)*

**Goal:** the product opens on proof; every §13 quality box goes green.

- Dashboard: 4 stat tiles (never 0), **industry mix** bars (canonical-only — the point), **match-confidence histogram** (a metric their product cannot produce), recent searches with one-click re-run.
- ⚡ **Seeded recent searches include** `computr software · corrected → Software Development · 94%` **and a low-confidence blocked search** — plus a CTA card ("See the resolver fix the law-firm bug →") deep-linking to the pre-run misspelled query. A reviewer who never types still sees everything.
- Quality pass: dark-mode audit, responsive to 375px with tables→stacked cards (refutes F-09), all four interactive states everywhere, `prefers-reduced-motion`, aria-live errors, contrast, zero console errors, clean build, **Lighthouse a11y ≥95 screenshot**. ⚡ Static route config on public pages + a bundle-size note vs their ~40-chunk route (F-10) — citable perf items for the README.
- *(Cut-first extras, only if time allows: minimal Settings page, saved buy boxes, density toggle, column visibility, the Playwright overlap spec.)*

**You review (deployed):** dashboard on demo login, full 375px walkthrough, Lighthouse score.

---

## Sprint 6 — README, submission assets, final verify  *(~0:45 packaging)*

**Goal:** the parts worth the most points. Assembly only — everything was captured/deployed earlier.

- README final, spec §11 structure with ⚡ these amendments:
  - **Above the fold:** live demo URL + "one-click demo sign-in, no signup" + video link + run-locally one-liner. Then before/after pair, then the captured payload.
  - ⚡ **Architecture section keyed to the handbook's exact graded terms:** UX design choices · backend architecture · data storage strategy (SQLite + why + the /tmp-on-serverless pattern, stated honestly) · **caching & performance** (compile-time taxonomy, module-scope Fuse index, static routes, bundle note) · hosting (serverless) · deployment process · cloud provider (Vercel) · **scalability** (O(1) canonical lookup, swap-in path to their live `fetch_leads`, what changes at 1M rows) · **enrichment & dedup** named explicitly.
  - Dataset (synthetic seed) in repo per handbook; data-honesty note; time log linked.
  - "What I deliberately did not build" (AI scoring exists; wrong lane; unverifiable integrations) + "With another week."
- ⚡ **The three Caprae business-understanding answers — required, not optional** (mission / why Caprae / how Caprae changes ETA & PE): 10 of 40 points ride on this line; drafted from material we already wrote.
- Final §13 definition-of-done sweep on the deployed URL in a private window (including save-to-list working); tag `v1.0`.
- Video: spec §12 script tightened to what actually shipped (using Sprint 0 footage for the opening), talking-points sheet.

**You review:** deployed link end-to-end as a cold reviewer, README top-to-bottom, video script, business answers.

---

## GitHub setup (decision needed before Sprint 0)

`gh` CLI is not installed. Two paths:

- **A (recommended):** `brew install gh` → `gh auth login` (you approve in the browser once) → I create the repo and manage pushes end-to-end.
- **B:** you create an empty repo at github.com and paste me the URL; I wire the remote and push.

Also confirm: repo name (`saasquatch-signal` per spec codename?) and public-from-start vs public-at-submission.

## Deviations from / additions to BUILD_SPEC.md

1. **README architecture section expanded** — the handbook grades storage, caching, hosting, deployment, cloud provider, scalability, dedup/enrichment by name; spec §11 didn't list them.
2. **Dataset in repo** — handbook requires it; the synthetic seed satisfies it and doubles as the data-honesty story.
3. **Evidence capture moved to Sprint 0** (spec §2 says "screenshot each one before building"; the first draft had it last).
4. **Deploy moved to Sprint 1** with per-sprint redeploys — native module, edge middleware, and seed-at-build are validated early.
5. **Playwright demoted below the cut line**; combobox behavior tested in vitest/jsdom instead.
6. **Resolver playground promoted to a shipped feature**; the reduction metric and rawIndustry fix surfaced in-app, not only in the README.
7. **"No .env secrets" reworded** to "no paid keys or third-party credentials" — Auth.js v5 requires `AUTH_SECRET`.
8. `/dev/tokens` remains a dev-only page, removed before submission.
