# Business understanding — submission answers

*Drafts for the handbook's written questions. Personal details are yours to adjust —
the argumentation is grounded in the build.*

---

## What is Caprae's mission?

Caprae Capital is an entrepreneurship-through-acquisition firm with an unusual center of
gravity: it treats the *post*-acquisition phase — not the deal — as where value is actually
created. The mission, as I read it, is to buy good small and mid-sized businesses and make them
durably better, using AI as the lever that lets a lean team do operator-grade work: finding and
qualifying targets, understanding a company's real position, and then modernising its
operations after close. The "AI-readiness" framing of this very challenge says it plainly —
Caprae isn't collecting engineers who can build demos; it's building a bench of people who can
take messy, real-world business data and turn it into decisions an investor or operator can
trust.

That reading shaped what I built. A lead tool for acquisition search lives or dies on trust:
every wrong row costs an analyst's hour or a founder-facing embarrassment. So instead of adding
another AI feature, I fixed the layer that makes the existing product's output trustworthy —
the industry resolution between what a searcher means and what the database contains — and made
the tool show its work. That is, I think, the mission in miniature: not "more AI," but AI that
makes a real business process verifiably better.

## Why do you want to work at Caprae Capital?

Because the work sits exactly at the intersection I want to build in: real businesses, messy
data, and software that has to earn trust rather than assume it. Most engineering jobs offer
either interesting technology on a product with no stakes, or high stakes with no room to build.
Searching, evaluating, and operating acquired companies offers both — every pipeline, resolver,
or scoring model lands on a decision someone makes with real money.

The pre-work itself was a signal. Most hiring processes test whether you can code; this one
tests whether you can find the *right* problem — the handbook explicitly rewards business
understanding over raw implementation. Working through it, I used the live product, captured
its real failure (150 law firms for a software search, silently), traced it to a missing
resolution layer the API's own naming implies was always intended, and shipped the fix
end-to-end in under five tracked hours. If that's the shape of the day-to-day — short loops
from a business problem to shipped, verifiable software — that's the environment I do my best
work in, and the 2–3 month intensive training period reads as a feature, not a cost.

## How is Caprae changing the ETA space and broader PE?

Traditional search — whether a self-funded searcher or a classic PE associate pool — spends
most of its human hours on work that is neither judgment nor relationship: assembling target
lists, cleaning firmographic data, hand-writing first-touch outreach. Caprae's bet is that this
layer should be software. Tools like SaaSquatch Leads compress the find-qualify-contact loop so
a small team can run a search process that used to take an army of analysts, and — more
importantly for PE broadly — extend the same AI leverage past the close, into how the acquired
company itself operates. That flips ETA's economics: deal flow stops being gated by headcount,
and the firm's edge compounds in its tooling.

The catch — and I say this as the person who just rebuilt part of that tool — is that
automation at this layer is only leverage if its output is trustworthy. A pipeline that emits
150 wrong companies silently doesn't compress the loop; it moves the cost downstream to
outreach, reputation, and missed deals. So the version of this change that actually wins is the
one that pairs scale with verifiability: resolvers that say how confident they are, tools that
refuse to guess, interfaces that show their work. That's the discipline I tried to demonstrate
in this submission, and it's the discipline that would make Caprae's model not just faster than
traditional PE, but more accurate.

---

## Brief answers (fill in before sending)

- **Current working status in the US:** *[your status — e.g. based in Lahore, Pakistan; would
  require sponsorship / remote engagement]*
- **40+ hours/week, 9AM–6PM EST during training:** *[confirm honestly — note this is a
  7PM–4AM shift from Lahore if that's where you'll be]*
- **Expected salary:** *[your number/range]*
- **Acceptance of employment terms:** *[confirm]*

## Submission email

- To: `recruiting@capraecapital.com`
- Subject: `Full Stack Developer - Handbook Submission - Daniyal Samim`
- Attach: current resume, video link, repo link (`github.com/daniyalsamimahmad/saasquatch-signal`),
  live demo link (`saasquatch-signal.vercel.app`)
