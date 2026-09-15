# Live product findings — verified evidence

All findings reproduced in a live session on a real account at `app.saasquatchleads.com`
on **15 September 2026** (Free Plan account, evidence captured before any rebuild code was written).
Screenshots referenced below live in this folder.

---

## F-01 · CRITICAL — The industry filter does not filter

**Repro:** Company Finder (`/scraper`) → Industry: `Computer Software` (picked from their own
autocomplete) → Location: `Austin, TX` (picked from their own suggestions) → Find Companies.

**Network capture:**

```
POST https://data.saasquatchleads.com/api/naics/fetch_leads   → 200
```

**Result: "Showing 1-25 of 150 results" — and not one is a software company.**

First 8 rows, scraped verbatim from the results DOM:

| Company | Industry |
|---|---|
| Law Offices of William Schmidt | Lawyers |
| The Texas Probate | Legalattorney |
| Davis & Wilkerson, P.C. | Legalattorney |
| Selman Munson & Lerner P.C. | Legalattorney |
| GoransonBain Ausley | Legalattorney |
| Byrd Davis Alden & Henrichson, LLP | Legalattorney |
| Winstead PC | Legalattorney |
| Bemis Roach and Reed | Legalattorney |

Page-1 industry distribution (25 rows): `Legalattorney: 17 · Lawyers: 4 · Business Law
Attorneys: 3 · Professional Services: 1`. **Zero software companies. No error. No warning.**

The endpoint is namespaced `/naics/` — an industry-phrase → NAICS resolution layer was clearly
the intended design. It does not exist, so the query silently falls through.

Screenshots: `f01-law-firm-results.png` (form + results + toolbar in one frame),
`f01-150-results.png` ("Showing 1-25 of 150 results" with 6 pages of law firms)

## F-02 · CRITICAL — Autocomplete dropdowns never close and cover the submit button

With the industry dropdown open (287 options):

- Pressed `Escape` → **287 options still visible**
- Clicked empty page space → **287 options still visible**
- The industry input carries **no ARIA attributes at all** (`role`, `aria-expanded`,
  `aria-autocomplete`, `aria-controls` all null) — no keyboard navigation, no combobox pattern

With the location suggestions open, `document.elementFromPoint()` at the centre of the
**Find Companies** button returned:

```
<li class="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground …">
  "Austin County, TX"
```

The dropdown is physically on top of the submit button. A first-time user filling the form
top-to-bottom cannot click submit.

Screenshots: `f02-dropdown-covers-button.png`

## F-03 · HIGH — The industry list is an ungoverned dump of raw DB strings

Typing `Software` returns exactly **287 options** (counted in the DOM). The complete list is
committed, unedited, as [`data/raw-industries.json`](../../data/raw-industries.json). Verified
live in production:

- **7 case-duplicates** — e.g. `Business Software` / `Business software`,
  `Security Software` / `security software`, `Vertical Software` / `vertical Software`
- **Typos shipped to production:** `Busines software`, `Business/Producitvity Software`,
  `Verical Saas – Landscaping Software`, `Niche Industry/Verical Software`,
  `Real Esate Software`, `Emergy Management Software`, `Healthcare Softwares`
- **Free text as categories:** `utility software, and infrastructure maintenance`,
  `AI-powered mission management software`, `Shipping and fulfillment software solutions`,
  `DevOps / Infrastructure Software /` (trailing slash), `Perusahaan Software`
  (Indonesian for "software company")
- **Mangled slug in the results grid:** `Legalattorney` (should be "Legal / Attorney")

This is the root cause under F-01.

Screenshots: `f03-287-options.png`

## F-04 · HIGH — Search results evaporate

- Search returned 150 results → navigated to Home → dashboard reads **`Total Leads: 0`**
- `/lead/companies` reads **`Showing 1–0 of 0 results`** (the "1–0" is itself a bug)
- No save-to-list action exists on any results row

The core loop (find → keep → act) has a missing middle.

Screenshots: `f04-dashboard-zero.png`

## F-06 · MED — Empty columns shipped as schema

On all 150 rows, in both the results grid and the Data Enhancement view:
`Street: N/A · BBB Rating: N/A · Company Phone: N/A`. A third of the table is dead weight.

## F-07 · MED — Search is three inputs

Industry, Product (optional), Location. No headcount, revenue, funding, founded-year, or
keyword. A buy box cannot be expressed.

## Other observations captured

- **AI Scoring already exists** — an `AI Scoring` button ships in the results toolbar
  (visible in `f01-law-firm-results.png`). Building "AI lead scoring" would duplicate a
  shipped feature.
- Browser tab title still reads **"LeadGenAI - B2B Lead Generation & Enrichment"** while the
  page brands "SaaSquatch Leads" — the white-label rename was never finished.
- Navigation scatters 12 destinations across two mega-dropdowns, including two unbuilt
  modules badged "Soon" (AI Web Scanner, Financial Analysis).
- Searching costs no credits (credits gate enrichment), so the broken search is free to hit —
  every user meets F-01 before ever paying.

All stills in this folder are frames extracted from a continuous 3:43 screen recording of the
live session (retained outside the repo — it is the source footage for the video walkthrough's
opening segment).
