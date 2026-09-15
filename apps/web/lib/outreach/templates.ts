import type { CompanyRow } from "@/lib/search";
import type { CanonicalIndustry } from "@/lib/taxonomy/types";

/**
 * Deterministic outreach prefill — the F-05 fix.
 *
 * Their Email Generator demands three hand-typed "context points" of 20+
 * words each: the human does the personalisation, the AI paraphrases it.
 * That's backwards. The tool already knows the industry, NAICS sector, size,
 * age, and location of every lead — so it writes the first draft and the
 * human edits. No LLM anywhere: template variants over data we hold, fully
 * deterministic, zero inference cost, runs offline.
 */

export type Contact = { name: string; title: string; email: string };

function sizeWord(employees: number): string {
  if (employees <= 10) return "a small team";
  if (employees <= 50) return "a compact team";
  if (employees <= 200) return "a mid-sized company";
  if (employees <= 1000) return "a scaling organisation";
  return "a large organisation";
}

function ageWord(foundedYear: number): string {
  const age = new Date().getFullYear() - foundedYear;
  if (age <= 4) return "an early-stage company";
  if (age <= 10) return "a growth-stage business";
  if (age <= 20) return "an established business";
  return `a ${age}-year-old institution in its market`;
}

// One market note per state — regional flavour without pretending to know
// more than the data does.
const STATE_MARKET: Record<string, string> = {
  TX: "one of the fastest-growing B2B markets in the country",
  CA: "the most competitive software market in the US",
  WA: "a dense enterprise-technology market",
  NY: "a market where buyers see a lot of cold outreach",
  MA: "a market with deep technical talent",
  CO: "a fast-maturing technology market",
  GA: "a strong operational and logistics hub",
  FL: "a market growing faster than its vendor coverage",
  IL: "a pragmatic, ROI-driven buyer market",
};

export function generateContextPoints(
  company: CompanyRow,
  canonical: CanonicalIndustry | null,
  variant: number,
): [string, string, string] {
  const label = canonical?.label ?? company.industryId;
  const sector = canonical?.sector ?? "their sector";
  const naics = canonical
    ? `NAICS ${canonical.naicsCode} (${canonical.naicsTitle})`
    : `NAICS ${company.naicsCode}`;
  const market =
    STATE_MARKET[company.state] ?? "a market with room for a sharper playbook";

  const p1 = [
    `${company.name} operates in ${label} — ${sector} — classified under ${naics}, a segment where operators typically buy on trust and referrals rather than cold volume.`,
    `As a ${label} company (${naics}), ${company.name} sits in the ${sector} segment, where tooling decisions tend to be made by a small group of operators.`,
    `${company.name} is a ${label} business — ${naics} — and companies in this slice of ${sector} usually feel the same growth constraints at the same stages.`,
  ][variant % 3];

  const p2 = [
    `With roughly ${company.employeeCount.toLocaleString("en-US")} people and founded in ${company.foundedYear}, they're ${sizeWord(company.employeeCount)} — ${ageWord(company.foundedYear)} — which usually means the founding team still feels every operational bottleneck personally.`,
    `They employ around ${company.employeeCount.toLocaleString("en-US")} people (founded ${company.foundedYear}) — ${sizeWord(company.employeeCount)} at the stage where manual processes start costing real money.`,
    `Founded in ${company.foundedYear} with ~${company.employeeCount.toLocaleString("en-US")} employees, they're ${ageWord(company.foundedYear)}, big enough to have the problem and small enough to fix it quickly.`,
  ][variant % 3];

  const p3 = [
    `They're based in ${company.city}, ${company.state} — ${market} — so timing and local proof points matter more than generic case studies.`,
    `Being in ${company.city}, ${company.state} puts them in ${market}, where peers talk and a good reference travels fast.`,
    `${company.city}, ${company.state} is ${market}; companies there tend to respond to specific, local relevance over volume outreach.`,
  ][variant % 3];

  return [p1, p2, p3];
}

export function generateEmail(
  company: CompanyRow,
  contact: Contact | null,
  canonical: CanonicalIndustry | null,
  points: [string, string, string],
  variant: number,
): { subject: string; body: string } {
  const firstName = contact?.name.split(" ")[0] ?? "there";
  const label = canonical?.label ?? "your industry";

  const subject = [
    `Quick question about ${company.name}`,
    `${company.name} × a thought on ${label.toLowerCase()}`,
    `Idea for ${company.name}`,
  ][variant % 3];

  const body = `Hi ${firstName},

${points[0]}

${points[1]}

${points[2]}

If any of that resonates, I'd value 15 minutes to compare notes — and if not, a one-line "not for us" is genuinely useful too.

Best,
Daniyal`;

  return { subject, body };
}
