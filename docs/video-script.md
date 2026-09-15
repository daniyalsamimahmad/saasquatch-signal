# Video walkthrough — script (90 seconds, one take)

Use the Sprint-0 screen recording of their live app for the opening 20 seconds
(`Screen Recording 2026-09-15…` on the Desktop), then switch to the deployed demo.

---

**[0:00–0:20] Open on their bug — footage of the live app.**

> "Before I show you what I built — this is your live app, recorded before I wrote any code.
> I'm searching Computer Software companies in Austin, picked from your own autocomplete.
> Every one of the 150 results is a law firm, and no error is shown. I captured the request:
> the endpoint is namespaced *slash-NAICS*, but the industry never resolves to a NAICS code —
> the query silently falls through. Here's the fix."

**[0:20–0:50] The resolver — switch to the demo, type `computr software` on /find.**

> "Your industry picker offers 287 raw options for the word 'software' — with case-duplicates
> and typos that shipped to production. I captured all of them, unedited, and collapsed them
> into 32 canonical industries, each mapped to a real NAICS code — six of your production typos
> corrected along the way.
> Now when I type — misspelled on purpose — it corrects, resolves at 95%, and shows the full
> derivation down to the NAICS code.
> *(click the `lawnkare softwear` chip)* And when confidence drops below 60, it refuses to
> guess — it blocks and offers alternatives. That's the whole thesis: a lead tool's currency
> is trust, and trust comes from showing your work."

**[0:50–1:15] The workflow — select rows, save, open outreach.**

> "I also reorganised the navigation around the job: find, then act. In your app a search
> returns 150 companies and the dashboard still reads zero — results aren't saved anywhere.
> Here they go to a list in one click, with undo. And outreach is prefilled from the lead data
> the app already holds — industry, size, location — instead of asking the user to type sixty
> words of context per lead. Your product makes the human do the personalisation and the AI do
> the paraphrasing. That's backwards, so I reversed it."

**[1:15–1:30] Craft and close — flip the theme, show the dashboard.**

> "Full auth with a one-click demo account, light and dark, responsive to 375 pixels, a
> keyboard-accessible combobox — yours never closes and covers the submit button — and
> Lighthouse accessibility 100. No API keys and no inference cost: the resolver is
> deterministic and runs offline. I've watched a lot of people build target lists for a
> living — silent wrong results are the failure mode that quietly kills trust in a sourcing
> tool. That's why I fixed that first."

---

## Recording checklist

- [ ] 1440px window, dark theme (matches the before footage), demo account signed in
- [ ] Tabs pre-opened: their recording · /find · /outreach · /dashboard
- [ ] Mic check; one rehearsal; **one take is fine — stop at 2 minutes**

## If the screening interview digs in — talking points

- **Found by using it:** payload captured live; the /naics/ namespace proves the resolution
  layer was the intended design. All evidence committed before any code (git history shows it).
- **Algorithm:** normalise → observed-typo dictionary → conservative Levenshtein → canonical
  collapse → exact/alias/weighted-fuzzy resolve; confidence = (1−score)×100, damped by a
  token-coverage guard so generic-token overlap ("software") can never fake a confident match —
  our own first version rated gibberish 97% Healthcare; the guard plus a regression test is
  the difference between using a fuzzy library and shipping an algorithm.
- **The low band is a product decision,** not a technical one: their app returns 150 wrong rows
  rather than admit uncertainty; ours blocks and offers alternatives + an honest keyword-only
  escape hatch.
- **What I didn't build:** AI scoring (your toolbar already has the button — building it would
  prove I never looked), more data sources (wrong lane), integrations (unverifiable).
- **Serverless SQLite trade-off,** stated honestly: /tmp copy per instance, demo resets,
  orphaned-JWT handling; swap-in path to `fetch_leads` and Postgres.
- **Time:** ~4½ tracked hours across sessions — log committed in the repo.
