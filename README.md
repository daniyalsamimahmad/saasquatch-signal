# SaaSquatch Leads — quality-first rebuild

> **Live demo:** _coming in Sprint 1_ — one-click demo sign-in, no signup
> **Video (90s):** _coming at submission_
> **Run locally:** `npm i && npm run seed && npm run dev` → `demo@saasquatch.test` / `demo1234`

---

## The problem, in one search

Search the live product for **Industry: Computer Software** in **Austin, TX** and it returns
150 results — **every one of them a law firm.** No error, no warning. 150 confidently wrong rows.

<!-- BEFORE/AFTER PAIR — docs/evidence/before-law-firms.png vs after-software.png -->

The captured request behind that search:

```
POST https://data.saasquatchleads.com/api/naics/fetch_leads
{"industry":"Computer Software","location":"Austin, TX, USA"}

→ 150 results. First ten: Law Offices of William Schmidt (Lawyers),
  The Texas Probate (Legalattorney), Davis & Wilkerson, P.C. (Legalattorney), …
```

The endpoint is namespaced `/naics/` — the intended design resolves an industry phrase to a
NAICS code before searching. **That resolution layer doesn't exist.** The industry string falls
through unresolved, and the query silently returns whatever it finds. A searcher builds a target
list in the wrong industry and discovers it *after* outreach goes out. Silent wrongness destroys
trust in a sourcing tool faster than any error message could.

This rebuild fixes that: search that **resolves what the user meant, shows its work, refuses to
guess when it isn't confident**, and carries the lead's data forward into lists and outreach.

## What I built

_(filled in as sprints land — see [PLAN.md](PLAN.md) and [BUILD_SPEC.md](BUILD_SPEC.md); the
build is spec-driven: the brief was written before the code)_

1. **The Industry Resolver** — normalises ~300 raw industry strings (including the typos their
   production database actually ships), collapses them to ~40 canonical industries mapped to
   real NAICS codes, and resolves free-text input with a confidence score. Below 60%
   confidence it blocks the search and offers alternatives instead of guessing.
2. **The Continuous Workflow** — search → save to list → outreach with the lead's data carried
   through, so results stop evaporating and outreach drafts write themselves from data the app
   already holds.

## Data honesty

The company dataset is **synthetic and clearly labelled as such** — a `Demo data` badge sits in
the app header on every screen. The taxonomy pipeline, NAICS mapping, and resolver are real
algorithms over real NAICS codes (US Census Bureau, public domain). The architecture is designed
to swap the synthetic seed for the live `fetch_leads` endpoint. No real company is named.

## Architecture

_(completed at submission: UX design choices · backend architecture · data storage strategy ·
caching & performance · hosting · deployment process · cloud provider · scalability ·
enrichment & dedup)_

## Time log

Hands-on build time is tracked per sprint in [docs/time-log.md](docs/time-log.md).
