# SaaSquatch Leads — Rebuild Spec

**Project codename:** `saasquatch-signal`
**Purpose:** Caprae Capital — Full Stack Developer pre-work submission
**Author:** Daniyal (Danny) Samim
**Date:** 15 September 2026

---

## 0. How to use this document

This file is the complete brief for an AI coding assistant (Claude Code, Cursor, etc.).
Read it top to bottom before writing any code. It contains:

1. The assessment's actual rules and scoring rubric
2. Verified evidence of what is broken in the current product
3. The full specification of what we are building instead
4. Design system, data model, algorithms, and component inventory
5. Build order with a time budget
6. A video walkthrough script and talking points

**Prime directive:** every build decision must be traceable to a rubric line in §2.
If a feature doesn't earn points, it doesn't get built.

---

## 1. The assessment — verbatim constraints

Taken from the Caprae Capital *Full Stack Developer Interview Pre-Work* handbook.

| Constraint | Value |
|---|---|
| Time cap | **"Dedicate no more than 5 hours to engineer one or two impactful features for the tool."** |
| Deliverable 1 | GitHub repository with code and README |
| Deliverable 2 | 1–2 minute video walkthrough explaining design decisions and results |
| Deliverable 3 | Optional demo link or Jupyter Notebook |
| Focus | Either **quality improvements** or **quantity-driven features** — pick one lane |
| Submission | `recruiting@capraecapital.com`, subject `Full Stack Developer - Handbook Submission - Daniyal Samim`, plus current resume |
| Next step | 10-minute screening interview within 2–3 business days if the score is satisfactory |

**Our chosen lane: QUALITY.** We are not scraping more leads. We are making the leads the tool already returns correct, trustworthy, and usable.

### Scoring rubric — 40 points total

| Criterion | Points | What the build must demonstrate |
|---|---|---|
| Business understanding | 10 | We found a revenue-affecting defect by actually using the product, and we can name its commercial consequence |
| UX / UI design | 10 | Workflow redesigned around the user's job, not the feature list; broken interactions fixed |
| Technical implementation | 10 | A real algorithm and data pipeline, not CRUD forms |
| Visual design | 5 | A deliberate design system — type scale, spacing, semantic colour |
| Innovation / creativity | 5 | An idea nobody else in the pile will have |

> **Note:** only 10 of 40 points are technical. Half the score is judgment and presentation.
> Budget time accordingly — the README and the video are worth more than another component.

---

## 2. Current product — verified findings

All findings below were reproduced in a live session on a real account at `app.saasquatchleads.com`
on 15 Sep 2026. Nothing is inferred from marketing copy. **These are our "before" evidence.
Screenshot each one before building — the README needs before/after pairs.**

### 2.1 What the product is

A B2B prospecting suite for acquisition searchers: find companies → enrich them → write outreach.
Next.js App Router, scaffolded with **v0.dev** (confirmed by the page's own `<meta name="generator">` tag),
shadcn/ui on Tailwind, Inter. Browser tab still reads *"LeadGenAI"* — the white-label rename was never finished.

**Backend services observed:**

```
POST https://data.saasquatchleads.com/api/naics/fetch_leads   ← search
     https://api.saasquatchleads.com/ai-score                 ← scoring (ALREADY EXISTS)
     https://api.saasquatchleads.com/scraper                  ← scraping
```

Email drafting runs on **DeepSeek**. The search endpoint is namespaced `/naics/` — the intended design
is that an industry phrase resolves to a NAICS code. **That resolution layer does not exist. That is the bug.**

### 2.2 F-01 · CRITICAL — The industry filter does not filter

Searched `Industry: Computer Software`, `Location: Austin, TX`. Got 150 results. All law firms.

```
POST /api/naics/fetch_leads
{"industry":"Computer Software","location":"Austin, TX, USA"}

→ 150 results. First ten:
Law Offices of William Schmidt        Lawyers
The Texas Probate                     Legalattorney
Davis & Wilkerson, P.C.               Legalattorney
Selman Munson & Lerner P.C.           Legalattorney
GoransonBain Ausley                   Legalattorney
Byrd Davis Alden & Henrichson, LLP    Legalattorney
Winstead PC                           Legalattorney
Bemis Roach and Reed                  Legalattorney
Slack and Davis LLP                   Legalattorney
Gary A Calabrese Attorney             Lawyers
```

No error. No warning. 150 confidently wrong rows.
**Commercial consequence:** a searcher builds a target list in the wrong industry and discovers it after outreach goes out. Silent wrongness destroys trust faster than an error message ever could.

### 2.3 F-02 · CRITICAL — Autocomplete dropdowns never close and cover the submit button

`Escape` does nothing. Outside click does nothing. Arrow keys do nothing (no keyboard nav at all — an accessibility failure).

```js
document.elementFromPoint(/* centre of "Find Companies" */)
→ <li class="px-3 py-2 cursor-pointer hover:bg-accent …">
// the dropdown is on top of the button
```

A first-time user filling the form the obvious way **cannot submit it.**

### 2.4 F-03 · HIGH — The industry list is an ungoverned dump of raw DB strings

Typing "Software" returns **287 options**. Verbatim samples:

```
// case-exact duplicates
"Vertical Software"   "vertical Software"
"Business Software"   "Business software"
"Security Software"   "security software"

// typos live in production
"Busines software"
"Business/Producitvity Software"
"Verical Saas – Landscaping Software"

// free text that was never a category
"utility software, and infrastructure maintenance"

// mangled slug in the results grid
"Legalattorney"   ← should be "Legal / Attorney"
```

This is the root cause under F-01.

### 2.5 Remaining findings

| ID | Sev | Finding |
|---|---|---|
| F-04 | High | **Search results evaporate.** 150 results found; dashboard still reads `Total Leads: 0`; `/lead/companies` reads `Showing 1–0 of 0 results`. No save-to-list on any row. The core loop has a missing middle. |
| F-05 | High | **Modules are islands.** Email Generator demands Person Name, Company, Industry + **three Context Points of min 20 words each** = 60+ words typed per lead, none prefilled from lead data the app already holds. The human does the personalisation; the AI paraphrases. |
| F-06 | Med | **Empty columns shipped as schema.** BBB Rating and Company Phone were `N/A` on all 150 rows. A third of the table is dead. |
| F-07 | Med | **Search is three inputs.** Industry, Product (optional), Location. No headcount, revenue, funding, tech stack, founded-year, or keyword. A buy box cannot be expressed. |
| F-08 | Low | **Production placeholders.** Footer ships an image alt-texted `"Your Logo"`, a sentence ending mid-clause *"…AI-powered messaging, and "*, and four social links all `href="#"`. |
| F-09 | Low | **Sub-768px shows "Better on Desktop — please switch to a larger screen."** |
| F-10 | Low | ~40 JS chunks load on a single route. |

### 2.6 Their design system, measured

Stock **shadcn/ui default theme with exactly one token changed**: `--primary` set to Tailwind `teal-500`.
Radius is default `0.5rem`. Everything else untouched boilerplate.

```css
:root  { --primary: 173 80% 40%; /* #14B8A6 */ --radius: 0.5rem; }
.dark  { --background: 222.2 84% 4.9%; /* #020817 */ --border: 217.2 32.6% 17.5%; }
```

**Read this as opportunity.** Nobody has spent an hour on this product's visual identity.
A candidate who spends forty focused minutes on a real type scale, honest spacing, and *semantic* colour
will visibly outclass the original. The bar is low and clearly marked.

---

## 3. The trap — DO NOT BUILD THIS

> ### ⛔ Do not build "AI lead scoring."
> It already exists. There is an **AI Scoring** button in their results toolbar right now,
> and an `api.saasquatchleads.com/ai-score` endpoint in their bundle.
>
> "AI lead scoring" is the obvious idea, so a large share of the submission pile will be exactly that.
> Those candidates hand back a feature the company already shipped and prove they never looked past the
> landing page. That is a failing grade on business understanding.

Also ruled out:
- **A pure visual reskin.** A prettier search that returns law firms for software companies is a prettier broken product. Caps you at 5 points, forfeits the 20 that matter.
- **More data sources / more leads.** That's the *quantity* lane. We chose quality. Don't straddle.
- **Integrations, CRM sync, Chrome extension.** Unbuildable in the budget, and unverifiable by a reviewer.

---

## 4. What we are building

### 4.1 One-line thesis

> **A lead tool's real currency is trust, and trust comes from showing the user what you matched — not from hiding it.**

### 4.2 Product definition

A rebuilt SaaSquatch Leads prototype whose search **resolves what the user meant**, **shows its work**,
**refuses to guess when it isn't confident**, and **carries the lead's data forward** into the rest of the workflow.

Two headline features, in strict priority order:

1. **The Industry Resolver** (the hero — fixes F-01 and F-03)
2. **The Continuous Workflow** (fixes F-04 and F-05 — search → list → outreach with data carried through)

Plus the supporting platform: authentication, our own information architecture, and our own design system.

### 4.3 Branding decision

Keep the name **SaaSquatch Leads** with a small `PROTOTYPE` badge in the sidebar.
Keep a teal DNA in the palette so it is recognisably their product.

**Why this matters:** a submission that renames and rebrands their product reads as "I replaced you."
A submission that improves their product inside their identity reads as "I can work here." That is a scoring decision, not an aesthetic one.

We do **not** copy their page structure, navigation, component library usage, or layout. Only the name and the colour DNA.

---

## 5. Hard constraints

### 5.1 ZERO COST — non-negotiable

Every dependency, service, font, dataset and deployment target must be free with no card on file.

| Need | Choice | Cost |
|---|---|---|
| Framework | Next.js 15 (App Router) | Free, MIT |
| Language | TypeScript | Free |
| Styling | Tailwind CSS v4 | Free |
| Components | shadcn/ui (copied into repo, not a dependency) | Free |
| Auth | Auth.js v5 (`next-auth@beta`), Credentials provider | Free |
| Password hashing | `bcryptjs` | Free |
| Database | SQLite via `better-sqlite3` (local file) | Free |
| Validation | `zod` + `react-hook-form` | Free |
| Fuzzy matching | `fuse.js` | Free, MIT |
| Charts | `recharts` | Free |
| Icons | `lucide-react` | Free |
| Fonts | Google Fonts via `next/font/google` | Free |
| NAICS codes | US Census Bureau — public domain | Free |
| Company data | Locally generated synthetic seed (§8) | Free |
| Deployment | Vercel Hobby | Free |

**Forbidden:** Supabase/Firebase/Clerk/Auth0 paid tiers, Apollo/Clearbit/PDL/Hunter APIs, OpenAI/Anthropic API keys, Turso/PlanetScale, any paid font, any service requiring a payment method.

**No LLM calls anywhere.** The email prefill in §7.6 is template-driven and deterministic. This is a feature, not a limitation — say so in the video: *"No API keys, no per-seat inference cost, runs offline."*

### 5.2 Data honesty — non-negotiable

The company dataset is **synthetic and clearly labelled as such**.

- A persistent `Demo data` badge sits in the app header on every screen.
- The README states plainly that companies are generated, that the resolver and NAICS mapping are real, and that the architecture is designed to swap the seed for their live `fetch_leads` endpoint.
- Never present generated companies as real businesses. Use plausible-but-obviously-constructed names.

This is not timidity. A reviewer who spots undisclosed fake data throws the whole submission out.
A reviewer who sees *"synthetic seed, real algorithm, swap-in ready"* sees an engineer with judgment.

### 5.3 Scope discipline

If time runs short, ship in exactly this order and cut from the bottom:

1. Auth + shell + design system
2. Industry Resolver + match transparency panel
3. Search results with the fix demonstrated
4. Saved Lists (closes F-04)
5. Outreach prefill (closes F-05)
6. Dashboard charts
7. Settings

**A finished feature 1–4 beats a half-finished 1–7. There is no rubric line for breadth.**

---

## 6. Information architecture — ours, not theirs

### 6.1 The design decision to articulate in the video

> **Their navigation is organised by feature. Ours is organised by the job.**

Theirs: two mega-dropdowns scattering 12 destinations across "Research & Discovery" and "Creation & Outreach", with two of them unbuilt and badged "Soon", and `/ppt-generator` not linked in the top nav at all.

Ours: a persistent left sidebar following the actual sequence a searcher works in.

### 6.2 Route map

```
/                      → redirect: authed → /dashboard, else → /login

PUBLIC
/login                 Sign in + one-click demo account
/signup                Create account

APP (protected by middleware)
/dashboard             Pipeline overview, recent searches, list health
/find                  The search — Industry Resolver lives here
/find/results          Results with match transparency panel
/lists                 All saved lists
/lists/[id]            One list: table, bulk actions, export CSV
/company/[id]          Single company detail
/outreach              Draft queue — prefilled from a list
/outreach/[leadId]     Compose one message
/settings              Profile, password, preferences
```

### 6.3 Sidebar

```
┌─────────────────────────┐
│ 🦍 SaaSquatch Leads     │
│    PROTOTYPE            │
├─────────────────────────┤
│ ◉ Dashboard             │
│                         │
│   FIND                  │
│ ◉ Search                │
│ ◉ Saved Lists      (3)  │
│                         │
│   ACT                   │
│ ◉ Outreach         (12) │
│                         │
├─────────────────────────┤
│ ⚙ Settings              │
│ 👤 Daniyal S.           │
└─────────────────────────┘
```

Counts are live. Two labelled groups — FIND and ACT — because those are the two halves of the job.
Collapsible to icon-rail at `<1024px`. Drawer at `<768px`.

---

## 7. Feature specifications

### 7.1 Authentication

**Goal:** a real, working auth system that a reviewer can get past in one click.

**Screens**

- `/login` — email, password, "Sign in", divider, **"Sign in as demo" button**, link to signup
- `/signup` — name, email, password, confirm; zod validation; friendly inline errors
- Sign out in the user menu

**The single most important detail:**
> The login screen must display the demo credentials in plain text **and** offer a one-click
> **"Sign in as demo"** button.
>
> `demo@saasquatch.test` / `demo1234`
>
> A reviewer with 200 submissions to get through will not create an account. If they hit a
> signup wall they close the tab and you score zero. Most candidates will miss this.

**Implementation**

- Auth.js v5, Credentials provider, JWT session strategy, 30-day expiry
- `bcryptjs` with cost factor 10
- `middleware.ts` protects every route except `/login`, `/signup`, and static assets
- Server actions for signup/login; never expose password hashes to the client
- Zod schemas shared between client and server validation
- Rate-limit login attempts in-memory (5 per minute per email) — cheap, and shows security awareness
- Seed script creates the demo user plus three saved lists so the app is **never empty on first login**

**Deployment note to put in the README (this scores):**
SQLite writes do not persist across Vercel serverless cold starts. Local dev has full persistence;
the hosted demo is seeded read-mostly and resets periodically. Stating this honestly demonstrates
you understand your own deployment target.

---

### 7.2 The Industry Resolver — the hero feature

This is the centrepiece. Budget the most time here.

#### 7.2.1 The taxonomy pipeline

Build `lib/taxonomy/` as a real data pipeline, not a lookup object.

**Step 1 — Seed the raw strings.**
Ship `data/raw-industries.json` containing ~300 raw industry strings that mirror theirs, **including the actual defects observed in production**:

```json
[
  "Computer Software", "Computer Software & Services", "Computer Software Developers",
  "Business Software", "Business software", "Busines software",
  "Business/Productivity Software", "Business/Producitvity Software",
  "Vertical Software", "vertical Software", "Verical Saas – Landscaping Software",
  "Security Software", "security software",
  "utility software, and infrastructure maintenance",
  "Legalattorney", "Lawyers", "Legal Services",
  "..."
]
```

Using their real typos is deliberate. In the video you can say: *"these are their actual strings, unedited."*

**Step 2 — Normalise.** `lib/taxonomy/normalise.ts`
```
lowercase → trim → collapse whitespace → strip punctuation except & and /
→ expand abbreviations (saas → software as a service, mfg → manufacturing, svcs → services)
→ singularise trailing plurals
→ split on separators (&, /, ",") into tokens
```

**Step 3 — Correct typos.** `lib/taxonomy/spellfix.ts`
- Explicit dictionary for observed misspellings (`busines→business`, `producitvity→productivity`, `verical→vertical`)
- Then Levenshtein distance ≤ 2 against the canonical vocabulary for anything unmatched
- Log every correction — the log becomes a README artefact

**Step 4 — Collapse to canonical entries.** `data/taxonomy.json`
```ts
type CanonicalIndustry = {
  id: string              // "software-development"
  label: string           // "Software Development"
  aliases: string[]       // ["computer software", "business software", ...]
  naicsCode: string       // "541511"
  naicsTitle: string      // "Custom Computer Programming Services"
  sector: string          // "Information & Technology"
}
```

Target: **~40 canonical entries covering the 287 software variants and the rest.**
That reduction number is your headline metric. Print it at build time:

```
✓ Taxonomy built: 312 raw strings → 41 canonical industries
  · 63 case-duplicates collapsed
  · 11 typos corrected
  · 100% mapped to NAICS
```

**Put that terminal output in the README as an image.** It is proof of real work.

#### 7.2.2 The resolver

`lib/taxonomy/resolve.ts`

```ts
type ResolveResult = {
  query: string                    // what the user typed
  normalised: string               // after step 2
  corrections: string[]            // typos fixed, for the "why" popover
  match: CanonicalIndustry | null
  confidence: number               // 0–100
  band: 'high' | 'medium' | 'low'
  alternatives: Array<{ industry: CanonicalIndustry; confidence: number }>  // top 3
}

function resolveIndustry(input: string): ResolveResult
```

**Algorithm**
1. Normalise + spellfix the input
2. Exact match against canonical `label` → confidence 100
3. Exact match against any `alias` → confidence 95
4. Fuse.js weighted search: `label` weight 0.7, `aliases` weight 0.3, `threshold: 0.4`, `includeScore: true`
5. `confidence = Math.round((1 - fuseScore) * 100)`
6. Return best match + top 3 alternatives

**Confidence bands — this is the product decision**

| Band | Range | Behaviour |
|---|---|---|
| High | ≥ 85 | Auto-apply. Green pill. Search runs. |
| Medium | 60–84 | Apply but flag. Amber pill. "Did you mean…?" with alternatives one click away. |
| Low | < 60 | **Block the search.** Red state. Show alternatives and a "search anyway" escape hatch. |

> **The low band is the entire fix for F-01.** Their app returns 150 law firms rather than
> admit it doesn't know. Ours says so. Write a code comment at this branch pointing back to F-01.

#### 7.2.3 The match transparency panel

Always visible above the results. This is the component the reviewer will remember.

```
┌────────────────────────────────────────────────────────────────┐
│ ● HIGH CONFIDENCE · 94%                              [ Change ]│
│                                                                 │
│ Showing  Software Development                                   │
│          NAICS 541511 · Custom Computer Programming Services    │
│                                                                 │
│ matched from "computr software"          [ Why this match? ▾ ] │
└────────────────────────────────────────────────────────────────┘
```

Expanding **"Why this match?"** reveals the full derivation chain:

```
  "computr software"
       ↓  normalised
  computr software
       ↓  spell-corrected   computr → computer
  computer software
       ↓  matched alias of
  Software Development
       ↓  mapped to
  NAICS 541511 · Custom Computer Programming Services

  Also considered:
    Software Publishing            NAICS 513210    71%
    IT Consulting                  NAICS 541512    64%
```

**Nobody else in the submission pile will build this.** It is the innovation score in a single component.

#### 7.2.4 The industry picker (replaces their 287-item dump)

- Combobox: type-ahead, **full keyboard navigation** (↑↓ Enter Esc), ARIA `combobox`/`listbox`/`option` roles
- Closes on `Escape`, on outside click, on blur, on selection — **explicitly fixes F-02**
- Portal-rendered with collision detection so it can never cover the submit button
- Grouped by NAICS sector, not a flat list
- Shows NAICS code inline on each option
- Max 8 visible with scroll; "no match" state offers the closest three
- Recent selections pinned at top

Write a test that asserts the dropdown does not overlap the submit button's bounding box. Mention it in the video.

---

### 7.3 Search

**Inputs** — fixing F-07 without over-building:

| Field | Control | Notes |
|---|---|---|
| Industry | Resolver combobox | Required |
| Location | Combobox, city/state, grouped | Required |
| Employee count | Range slider, presets 1-10 / 11-50 / 51-200 / 201-1000 / 1000+ | Optional |
| Revenue band | Select | Optional |
| Founded | Year range | Optional |
| Keyword | Text, matches name + description | Optional |

Advanced fields live in a collapsible "Refine" section — default collapsed so the primary path stays two fields.

**Saved buy boxes:** name and save a filter set, reload it in one click. Small feature, big signal — it shows you understand searchers work a repeatable buy box.

---

### 7.4 Results

**Columns** (fixing F-06 — every column must carry data):
Company · Industry (with NAICS chip) · Location · Employees · Revenue band · Founded · Website · Actions

**Requirements**
- Sticky header, sortable columns, tabular-nums on all figures
- Row selection with checkbox; bulk bar appears on selection
- Bulk actions: **Save to list**, Export CSV, Draft outreach
- Empty, loading (skeleton rows, not a spinner), and error states all designed
- 25/50/100 per page
- Density toggle: comfortable / compact
- Column visibility menu, persisted to localStorage
- Click a row → company detail drawer, not a page navigation

**The proof shot for the video:** the results table showing software companies, with the transparency
panel above it reading `Software Development · NAICS 541511`, side by side with their screenshot of law firms.

---

### 7.5 Saved Lists — closes F-04

The missing middle of their product.

- `/lists` — cards per list: name, count, industry mix sparkline, last updated
- `/lists/[id]` — full table, rename, duplicate, delete, export CSV, "Draft outreach for all"
- Save-to-list from results: modal with existing lists + "Create new"
- Toast on save: *"14 companies saved to Austin SaaS Q4"* with an **Undo** action
- Dashboard tile: total leads, lists, outreach drafted — **must never read 0 after a search**

Write a code comment at the save handler: `// F-04: their app discards search results. This is the fix.`

---

### 7.6 Outreach prefill — closes F-05

Their Email Generator demands 60+ words of hand-typed research per lead. Ours derives it.

**The flow:** select rows → "Draft outreach" → compose screen opens with everything prefilled.

**Prefilled from data we already hold** (no LLM, fully deterministic):

| Their field | Our source |
|---|---|
| Company Name | lead record |
| Industry | resolved canonical label + NAICS title |
| Person Name / Title | lead contact record |
| Context Point 1 | industry + NAICS sector sentence, templated |
| Context Point 2 | size + founded-year sentence, templated |
| Context Point 3 | location + regional market sentence, templated |

Each context point is **editable, and visibly marked as a draft** with a "generated from lead data" chip.
A "Regenerate" button cycles template variants.

**Say this out loud in the video:**
> *"Their product asks the human to do the personalisation and lets the AI do the paraphrasing.
> That's backwards. The tool already knows the industry, the size, the location and the NAICS sector —
> it should be writing the first draft, and the human should be editing it."*

That sentence is worth several business-understanding points on its own.

---

### 7.7 Dashboard

Opens in a **realistic working state** — seeded lists and searches, never an empty shell.

- Four stat tiles: Total leads · Saved lists · Drafts queued · Searches this week
- **Industry mix** — horizontal bar, canonical industries only (theirs is unreadable because the taxonomy is dirty; ours is clean *because* of the resolver, which is the point)
- **Match confidence distribution** — a small histogram of the confidence of recent searches. A metric that literally cannot exist in their product.
- Recent searches list, click to re-run
- All charts via Recharts, theme-token colours, accessible labels

---

## 8. Data model

```ts
// SQLite via better-sqlite3

User          { id, name, email, passwordHash, createdAt }
Company       { id, name, website, linkedin, description,
                industryId,            // FK → canonical taxonomy
                rawIndustry,           // the messy original — keep it, it demos the fix
                naicsCode, city, state, employeeCount, revenueBand, foundedYear }
Contact       { id, companyId, name, title, email, linkedin }
List          { id, userId, name, createdAt, updatedAt }
ListItem      { id, listId, companyId, addedAt, note }
SearchLog     { id, userId, query, resolvedIndustryId, confidence, band, resultCount, createdAt }
Draft         { id, userId, companyId, contactId, subject, body, contextPoints, status, createdAt }
```

**Keep `rawIndustry` on every company.** It lets you show, in the UI, "stored as `Busines software` →
resolved to `Software Development`". That's the whole thesis visible in one table cell.

### 8.1 Seed dataset

`scripts/seed.ts` generates deterministically (fixed RNG seed, so the demo is reproducible):

- **~500 companies** across ~15 industries and ~25 US metros
- Each assigned a realistic `rawIndustry` drawn from the messy string pool — including typos
- ~800 contacts
- Demo user + 3 pre-populated lists + 6 search log entries + 4 drafts
- Names plausible but clearly constructed; **no real company is named**

Run on `postinstall` and via `npm run seed`.

---

## 9. Design system

### 9.1 Palette

Teal DNA retained, but deliberate rather than stock. Semantic colours are separate from the brand accent.

```css
:root {
  /* brand — deeper, less candy than their teal-500 */
  --brand-500: #0FB5A2;
  --brand-600: #0D9488;
  --brand-050: #E6F7F4;

  /* neutrals — cool, slight blue bias (chosen, not inherited grey) */
  --bg:        #F7F9FA;
  --surface:   #FFFFFF;
  --surface-2: #EFF3F5;
  --border:    #D8E0E5;
  --text:      #0E1519;
  --text-2:    #46555F;
  --text-3:    #72838E;

  /* semantic — confidence bands. NOT the brand colour. */
  --conf-high: #1F8A54;
  --conf-med:  #A66A08;
  --conf-low:  #C23B32;

  --radius: 6px;   /* not shadcn's 8px default — a deliberate, tighter choice */
}

.dark {
  --bg:        #0A0F12;
  --surface:   #121A1F;
  --surface-2: #1A242A;
  --border:    #263238;
  --text:      #E6EDF1;
  --text-2:    #A3B2BB;
  --text-3:    #72838E;
  --brand-500: #2ECFBC;
  --conf-high: #46B87A;
  --conf-med:  #D0A03F;
  --conf-low:  #E0655C;
}
```

**Both themes must be built.** A working theme toggle is a visible-design point for almost no effort.

### 9.2 Typography

Three roles, all free on Google Fonts, loaded via `next/font/google`:

| Role | Face | Usage |
|---|---|---|
| Display | **Instrument Sans** 600/700 | Page titles, section headings, stat values |
| Body / UI | **Inter** 400/500/600 | Everything else |
| Data | **JetBrains Mono** 400/500 | NAICS codes, confidence %, counts, the derivation chain |

**Type scale** (1.25 ratio): 12 · 14 · 16 · 20 · 25 · 31 · 39px
Body 14px in dense table UI, 16px in prose. Headings get `text-wrap: balance`.
Uppercase labels: 11px, `letter-spacing: 0.08em`, `--text-3`.
Every column of figures gets `font-variant-numeric: tabular-nums`.

Using a monospace for NAICS codes and confidence figures is not decoration — it's the technical register of the domain, and it makes the derivation chain readable.

### 9.3 Spacing and layout

- 4px base unit. Spacing scale: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64
- Sidebar 260px, collapses to 64px icon rail below 1024px, drawer below 768px
- Content max-width 1440px, page gutter 24px (16px on mobile)
- **Fully responsive down to 375px** — this directly refutes F-09. Tables become stacked cards on mobile.
- Layout via flex/grid `gap`, never per-element margins

### 9.4 Component discipline

- **Not everything is a card.** Border, fill, radius and shadow each mean "separate object." Spend them by role. Lift only the transparency panel and the stat tiles.
- One shadow token, used twice on a screen at most
- Interactive elements look interactive: hover, active, focus-visible, disabled — all four states designed
- Focus ring: 2px `--brand-500`, 2px offset, on everything keyboard-reachable
- `prefers-reduced-motion` respected on every transition

### 9.5 Accessibility floor

- All interactive elements keyboard-reachable in logical order
- Combobox implements the full ARIA combobox pattern
- Colour contrast ≥ 4.5:1 for text, ≥ 3:1 for UI boundaries, in **both** themes
- Confidence never communicated by colour alone — always colour + label + icon
- Every form input has a real `<label>`, every error is announced via `aria-live`
- Run Lighthouse; target ≥ 95 accessibility; **screenshot the score for the README**

---

## 10. Build order — the five hours

| Time | Block | Output |
|---|---|---|
| **0:00–0:30** | Scaffold | Next.js + TS + Tailwind + shadcn init. Design tokens in `globals.css`. Fonts wired. Write the README problem statement **now**, while the evidence is fresh. |
| **0:30–1:00** | Auth + shell | Auth.js, SQLite, bcrypt, middleware, login/signup screens, demo button, sidebar + topbar shell. |
| **1:00–2:00** | Taxonomy pipeline | Raw seed, normalise, spellfix, canonical collapse, NAICS map. Print the reduction metric. Unit-test 6 inputs including a typo and a no-match. |
| **2:00–2:45** | Resolver + transparency panel | `resolveIndustry()`, confidence bands, the derivation-chain popover. |
| **2:45–3:30** | Picker + search + results | Accessible combobox (F-02 fix), search form, results table with all states. |
| **3:30–4:00** | Lists + outreach prefill | Save-to-list with undo toast (F-04), prefilled compose screen (F-05). |
| **4:00–4:20** | Dashboard + polish | Stat tiles, industry mix, confidence histogram. Dark mode pass. Mobile pass. Lighthouse. |
| **4:20–4:45** | README | Before/after pairs, the captured API payload, the reduction metric, decisions, trade-offs, what's next. |
| **4:45–5:00** | Record and send | One or two minutes. One take is fine. **Then stop.** |

> **Do not spend hour six polishing.** The brief says no more than five. Respecting a stated
> constraint is itself a signal — and an honest note in the README that you stopped at the cap
> reads better than an obviously over-built submission.

---

## 11. README requirements

The README is read before the code and often before the video. Structure it exactly like this:

1. **One-paragraph problem statement** — the law-firm bug, stated plainly
2. **Before / after screenshot pair** — their results vs. ours, side by side, at the top
3. **The captured API payload** in a code block — proof you investigated, not guessed
4. **What I built** — the two features, four sentences each
5. **The metric** — `312 raw strings → 41 canonical industries · 63 duplicates collapsed · 11 typos corrected · 100% NAICS-mapped`, with the terminal screenshot
6. **Design decisions** — nav-by-workflow not by-feature; confidence bands; refusing to guess; no LLM dependency
7. **What I deliberately did not build** — AI scoring (already exists), more data sources (wrong lane), integrations (unverifiable). *This section demonstrates judgment more than any feature does.*
8. **Data honesty note** — synthetic seed, real algorithm, swap-in ready for `fetch_leads`
9. **Deployment note** — SQLite persistence on serverless, stated honestly
10. **Run locally** — `npm i && npm run seed && npm run dev`, demo credentials
11. **With another week** — 5 bullets. Shows you know what's missing.

---

## 12. Video walkthrough — script and talking points

**Total: 1–2 minutes. Rehearse once, record once.**

### 12.1 The script

**[0:00–0:20] Open on their bug, not on your code.**

> "Before I show you what I built — this is your live app. I'm searching for Computer Software
> companies in Austin."
> *[run the search]*
> "Every result is a law firm. A hundred and fifty of them, and no error is shown. I traced it:
> the industry string never resolves to a NAICS code, so the query silently falls through.
> Here's the fix."

**[0:20–0:50] The resolver and the transparency panel.**

> "Your industry picker offers 287 options for the word 'software' — with duplicates, and typos
> that shipped to production. I normalised them into 41 canonical industries, each mapped to a
> real NAICS code.
> Now when I type — deliberately misspelled — it corrects, resolves, and tells me exactly what
> it matched and how confident it is. And if confidence drops below 60%, it refuses to guess.
> That's the whole thesis: a lead tool's currency is trust, and trust comes from showing your work."

**[0:50–1:15] The workflow.**

> "I also reorganised the navigation around the job rather than the feature list. Search, save,
> act. In your app a search returns 150 companies and the dashboard still reads zero — results
> aren't saved anywhere. Here they go to a list in one click.
> And outreach is prefilled from the lead data you already hold, instead of asking the user to
> type sixty words of context per lead."

**[1:15–1:35] Craft and close.**

> "Full auth, light and dark, responsive to 375px, keyboard-accessible combobox, Lighthouse 95+.
> No API keys and no inference cost — the resolver is deterministic and runs offline.
> I've run 250+ hiring processes and over a thousand engineer interviews, so I've watched people
> build target lists for a living. Silent wrong results are the failure mode that quietly kills
> trust in a sourcing tool. That's why I fixed that first."

### 12.2 Talking points bank

Have these ready in case the screening interview digs in:

**On the bug**
- Found by using the product, not reading about it; captured the actual POST payload
- The endpoint is namespaced `/naics/` — the resolution layer was always the intended design, it just doesn't exist
- Silent wrongness > loud errors in damage: the user has no signal to distrust the output

**On the resolver**
- Normalise → spellfix → canonical collapse → NAICS map → fuzzy resolve
- Fuse.js weighted `label` 0.7 / `aliases` 0.3, threshold 0.4; confidence = `(1 − score) × 100`
- Three bands; the low band blocks rather than guesses — that's the product decision, not the algorithm
- Deterministic and offline: no API key, no per-seat cost, no latency

**On the design**
- Nav by workflow, not by feature — their 12 destinations across two mega-dropdowns vs. our FIND / ACT grouping
- Semantic colour is separate from brand colour; confidence never signalled by colour alone
- Kept their name and teal DNA on purpose — this is an improvement to their product, not a replacement
- Tighter 6px radius and a real 1.25 type scale instead of shadcn defaults

**On what I didn't build**
- AI scoring already exists (`/ai-score` endpoint + a button in their toolbar) — building it would have proved I never looked
- Didn't chase more data sources; the brief asks you to pick a lane and I picked quality
- Didn't fake real company data; synthetic seed, real algorithm, architected to swap in `fetch_leads`

**On the constraint**
- Stopped at the five-hour cap. The prioritised cut-list is in the README.

---

## 13. Definition of done

Do not record the video until every box is ticked.

**Functional**
- [ ] Sign up, sign in, sign out, session persists across refresh
- [ ] "Sign in as demo" works in one click from a cold browser
- [ ] Protected routes redirect to `/login` when signed out
- [ ] Typing a misspelled industry resolves correctly and shows the correction
- [ ] Confidence < 60 blocks the search and offers alternatives
- [ ] The derivation chain popover renders the full path
- [ ] Combobox: ↑↓ Enter Esc all work; closes on outside click; never covers the submit button
- [ ] Search returns companies in the resolved industry — no cross-industry leakage
- [ ] Save to list works; toast with Undo; dashboard count increments
- [ ] Draft outreach prefills all three context points from lead data
- [ ] CSV export downloads and opens cleanly

**Quality**
- [ ] Light and dark both correct; no unreadable text in either
- [ ] Usable at 375px; no horizontal body scroll at any width
- [ ] Every interactive element has hover / active / focus-visible / disabled
- [ ] Loading skeletons, empty states, and error states all designed
- [ ] Lighthouse accessibility ≥ 95, screenshotted
- [ ] Zero console errors on every route
- [ ] `npm run build` passes clean; no TypeScript errors
- [ ] No API keys, no `.env` secrets required to run

**Submission**
- [ ] README complete with before/after images
- [ ] Repo public, clean history, sensible commit messages
- [ ] Demo deployed and verified in a private window
- [ ] Video 1–2 min, audio clear, opens on their bug
- [ ] Email to `recruiting@capraecapital.com`, subject `Full Stack Developer - Handbook Submission - Daniyal Samim`, resume attached

---

## 14. Skills to enable for better UI/UX output

I searched for installable skills matching this work and **found nothing new to add** — but three
skills already available in your Claude session are directly useful here. Invoke them by name:

| Skill | When to use it in this build |
|---|---|
| **`design`** | Before coding the UI. Produces a multi-artboard canvas you can edit visually — good for locking the sidebar, search, results and transparency panel layouts before you write JSX. |
| **`dataviz`** | Before writing *any* chart code. The dashboard's industry-mix bars and confidence histogram must read as one system in both themes. Load it before choosing chart colours. |
| **`artifact-design`** | Design fundamentals — type scale, token structure, theme handling, spacing discipline. Worth reading once before §9 gets implemented. |

**Practical workflow:** open Claude Code in the project folder, paste this file in as the first message,
then say: *"Read BUILD_SPEC.md. Start with block 0:00–0:30. Use the `design` skill to lock the layouts before writing components."*

Keep this file in the repo root as `BUILD_SPEC.md` — and mention in the README that the build was
spec-driven. Reviewers like seeing that an engineer wrote the brief before the code.

---

## 15. One open item

The handbook asks *"What is your current working status in the US?"* and specifies **9AM–6PM EST,
minimum 40 hours/week** for a 2–3 month training period — that is a 7PM–4AM shift from Lahore.
It also asks for your expected salary while publishing no range of its own.

None of that changes the build. The artefact is reusable for the other AI hiring-tech startups on
your shortlist regardless of what Caprae decides. But go into the 10-minute screening with those two
questions ready, because they determine whether any of this leads anywhere.
