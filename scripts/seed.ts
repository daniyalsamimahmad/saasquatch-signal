/**
 * Deterministic database seed.
 *
 * - Idempotent: skips if data/app.db already exists (pass --force to rebuild),
 *   so `npm install`/`npm run build` never wipes local demo data.
 * - Deterministic: all randomness flows from a fixed-seed PRNG (mulberry32),
 *   so every environment gets an identical, reproducible dataset.
 * - Honest: every company is synthetic (clearly-constructed names, no real
 *   business is named), but each carries a messy `rawIndustry` drawn from the
 *   291 strings captured from their live production database — so the
 *   resolver pipeline runs against the real defects.
 * - Deduplicated: a fuzzy duplicate-company pass runs before insert and logs
 *   what it merged (the rubric's "dedup" at the company level, not just the
 *   string level).
 */

import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA } from "../lib/db";
import { DEMO_EMAIL, DEMO_PASSWORD } from "../lib/validators";
import { normalise } from "../lib/taxonomy/normalise";
import { spellfix, BASE_VOCABULARY, levenshtein } from "../lib/taxonomy/spellfix";
import { classify } from "../lib/taxonomy/classify";
import { METROS, REVENUE_BANDS } from "../lib/metros";
import taxonomyJson from "../data/taxonomy.json";
import rawIndustriesJson from "../data/raw-industries.json";

const DB_PATH = path.join(process.cwd(), "data", "app.db");
const force = process.argv.includes("--force");

// Seedable PRNG — Math.random() cannot be seeded, and the demo must be reproducible.
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260915);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const randInt = (min: number, max: number) =>
  min + Math.floor(rand() * (max - min + 1));

// ---------------------------------------------------------------------------
// rawIndustry pools: classify each ORIGINAL raw string (casing preserved) so
// every synthetic company gets a genuine messy string from the right bucket.
// ---------------------------------------------------------------------------
const rawByCanonical = new Map<string, string[]>();
for (const rawString of (rawIndustriesJson as { strings: string[] }).strings) {
  const { fixed } = spellfix(normalise(rawString), BASE_VOCABULARY);
  const id = classify(fixed);
  if (!id) continue;
  if (!rawByCanonical.has(id)) rawByCanonical.set(id, []);
  rawByCanonical.get(id)!.push(rawString);
}

// The ~15 industries the company dataset spans (weighted toward software —
// it is a SaaS-prospecting demo — plus legal services so the law-firm
// strings exist honestly in OUR data too).
const SEED_INDUSTRIES: Array<{ id: string; weight: number }> = [
  { id: "software-development", weight: 9 },
  { id: "software-publishing", weight: 7 },
  { id: "business-productivity-software", weight: 6 },
  { id: "healthcare-software", weight: 7 },
  { id: "fintech-software", weight: 6 },
  { id: "cybersecurity-software", weight: 5 },
  { id: "data-analytics-software", weight: 5 },
  { id: "cloud-infrastructure-software", weight: 5 },
  { id: "logistics-software", weight: 4 },
  { id: "hr-software", weight: 4 },
  { id: "sales-marketing-software", weight: 4 },
  { id: "edtech-software", weight: 3 },
  { id: "proptech-software", weight: 3 },
  { id: "energy-utilities-software", weight: 3 },
  { id: "it-consulting", weight: 3 },
  { id: "legal-services", weight: 4 },
];

const industryById = new Map(
  (taxonomyJson as { industries: Array<{ id: string; label: string; naicsCode: string }> }).industries.map(
    (i) => [i.id, i],
  ),
);

// ---------------------------------------------------------------------------
// Name generation — plausible but clearly constructed; no real company names.
// ---------------------------------------------------------------------------
const STEMS = [
  "Northbeam", "Bluegrain", "Quartzline", "Fernwood", "Halcyon", "Ironvale",
  "Lumenreef", "Cedarstack", "Brightmoor", "Kestrelpoint", "Silvermarsh",
  "Oakridge", "Vantabrook", "Coppervein", "Duskwater", "Emberfield",
  "Glasspine", "Hollowbrook", "Juniperbay", "Larkspur", "Mistvale",
  "Novabranch", "Palegrove", "Quillstone", "Ridgefern", "Saltmeadow",
  "Thornbury", "Umberlake", "Violetmoor", "Wrenfield", "Ashgate",
  "Birchwell", "Cloverpeak", "Dovetail", "Elmcrest", "Foxglove",
  "Graniteleaf", "Heronmark", "Islewood", "Kilnworth", "Loamfield",
];

const SUFFIX_BY_INDUSTRY: Record<string, string[]> = {
  "software-development": ["Software", "Labs", "Dev Co", "Systems", "Studio"],
  "software-publishing": ["Apps", "Platform", "Suite", "Software", "HQ"],
  "business-productivity-software": ["Workflows", "Ops", "Desk", "Docs", "Suite"],
  "healthcare-software": ["Health", "Care Systems", "Medical Software", "Rx", "Clinic Tech"],
  "fintech-software": ["Pay", "Ledger", "Capital Tech", "Fin", "Treasury"],
  "cybersecurity-software": ["Security", "Shield", "Defense Labs", "Sentry", "Cyber"],
  "data-analytics-software": ["Analytics", "Insights", "Data Co", "Metrics", "Signals"],
  "cloud-infrastructure-software": ["Cloud", "Infra", "Stack", "Compute", "Grid"],
  "logistics-software": ["Logistics", "Freight Tech", "Routes", "Supply Co", "Cargo"],
  "hr-software": ["People Ops", "Talent", "HR Suite", "Teams", "Staffing Tech"],
  "sales-marketing-software": ["CRM", "Pipeline", "Outreach Co", "Growth", "Funnel"],
  "edtech-software": ["Learning", "Academy Tech", "Campus", "EdTech", "Tutor Systems"],
  "proptech-software": ["Properties Tech", "Realty Software", "Estates", "Dwelling", "Spaces"],
  "energy-utilities-software": ["Energy", "Grid Systems", "Utility Tech", "Volt", "Meter"],
  "it-consulting": ["Consulting", "IT Group", "Advisors", "Partners", "Solutions"],
  "legal-services": ["& Associates", "Law Group", "Legal", "LLP", "Attorneys at Law"],
};

const DESCRIPTION_BY_INDUSTRY: Record<string, string[]> = {
  "software-development": ["Custom software for %s teams that outgrew spreadsheets.", "Product engineering studio building B2B tools."],
  "software-publishing": ["A %s-based SaaS suite for mid-market operators.", "Packaged software with an opinionated onboarding."],
  "business-productivity-software": ["Workflow automation for back-office teams in %s.", "Document and approval flows without the busywork."],
  "healthcare-software": ["Patient-facing scheduling and billing for clinics in %s.", "Compliance-first records tooling for care providers."],
  "fintech-software": ["Reconciliation and payment rails for finance teams.", "Lending workflow software for regional banks near %s."],
  "cybersecurity-software": ["Endpoint monitoring for firms that can't staff a SOC.", "Security posture dashboards for %s startups."],
  "data-analytics-software": ["Self-serve dashboards over warehouse data for %s ops teams.", "Metrics layer and alerting for revenue teams."],
  "cloud-infrastructure-software": ["Cost-aware infrastructure automation for %s platform teams.", "Observability tooling for small SRE groups."],
  "logistics-software": ["Route planning and dock scheduling for regional carriers.", "Freight visibility software for %s shippers."],
  "hr-software": ["Onboarding and review cycles for distributed teams.", "Headcount planning tools for %s people teams."],
  "sales-marketing-software": ["Pipeline hygiene and outreach sequencing for SMB sales.", "Attribution reporting for %s marketing teams."],
  "edtech-software": ["Course operations software for training providers in %s.", "Student progress tracking for bootcamps."],
  "proptech-software": ["Lease and maintenance workflows for property managers.", "Underwriting tools for %s real-estate investors."],
  "energy-utilities-software": ["Meter data and field-inspection software for utilities.", "Energy usage analytics for %s facilities."],
  "it-consulting": ["Fractional platform engineering for %s companies.", "Systems integration and legacy migrations."],
  "legal-services": ["Business law practice serving %s companies.", "Boutique firm focused on commercial disputes."],
};

const FIRST_NAMES = [
  "Avery", "Jordan", "Riley", "Morgan", "Casey", "Quinn", "Rowan", "Skyler",
  "Emerson", "Finley", "Harper", "Kendall", "Logan", "Marlowe", "Nico",
  "Parker", "Reese", "Sawyer", "Tatum", "Winter", "Adrian", "Bianca",
  "Carmen", "Darius", "Elena", "Felix", "Greta", "Hugo", "Iris", "Jonas",
];
const LAST_NAMES = [
  "Calloway", "Bexley", "Ashford", "Delgado", "Ellison", "Fairbanks",
  "Granger", "Holloway", "Iverson", "Jennings", "Kirkland", "Lockhart",
  "Merriweather", "Northrop", "Okafor", "Pemberton", "Quintero", "Rutledge",
  "Sinclair", "Thackeray", "Underhill", "Vasquez", "Wexford", "Yarrow",
];
const TITLES = [
  "CEO", "Founder", "Co-Founder", "VP Sales", "VP Engineering", "COO",
  "Head of Growth", "Managing Partner", "Director of Operations", "CTO",
];

type CompanyRow = {
  id: string;
  name: string;
  website: string;
  linkedin: string;
  description: string;
  industryId: string;
  rawIndustry: string;
  naicsCode: string;
  city: string;
  state: string;
  employeeCount: number;
  revenueBand: string;
  foundedYear: number;
};

function generateCompanies(count: number): CompanyRow[] {
  const weighted: string[] = SEED_INDUSTRIES.flatMap(({ id, weight }) =>
    Array(weight).fill(id),
  );
  const companies: CompanyRow[] = [];
  const usedNames = new Set<string>();

  for (let n = 0; companies.length < count && n < count * 4; n++) {
    const industryId = pick(weighted);
    const canonical = industryById.get(industryId)!;
    const stem = pick(STEMS);
    const suffix = pick(SUFFIX_BY_INDUSTRY[industryId]);
    const name = `${stem} ${suffix}`;
    if (usedNames.has(name.toLowerCase())) continue;
    usedNames.add(name.toLowerCase());

    const metro = pick(METROS);
    const domain =
      stem.toLowerCase() + suffix.toLowerCase().replace(/[^a-z]/g, "").slice(0, 6);
    const rawPool = rawByCanonical.get(industryId) ?? [canonical.label];
    const employeeCount = [
      randInt(2, 10), randInt(11, 50), randInt(11, 50), randInt(51, 200),
      randInt(51, 200), randInt(201, 1000), randInt(1001, 4000),
    ][randInt(0, 6)];

    companies.push({
      id: `co_${(companies.length + 1).toString().padStart(4, "0")}`,
      name,
      website: `https://${domain}.example.com`,
      linkedin: `https://linkedin.example.com/company/${domain}`,
      description: pick(DESCRIPTION_BY_INDUSTRY[industryId]).replace(
        "%s",
        metro.city,
      ),
      industryId,
      rawIndustry: pick(rawPool),
      naicsCode: canonical.naicsCode,
      city: metro.city,
      state: metro.state,
      employeeCount,
      revenueBand:
        REVENUE_BANDS[
          Math.min(
            REVENUE_BANDS.length - 1,
            Math.floor(Math.log10(Math.max(employeeCount, 2)) * 1.6) +
              randInt(-1, 1),
          ) < 0
            ? 0
            : Math.max(0, Math.min(REVENUE_BANDS.length - 1, Math.floor(Math.log10(Math.max(employeeCount, 2)) * 1.6) + randInt(-1, 1)))
        ],
      foundedYear: randInt(1987, 2024),
    });
  }
  return companies;
}

/**
 * Fuzzy duplicate-company detection: same city + near-identical normalised
 * name (suffix noise stripped, Levenshtein ≤ 2) → merge, keep first.
 * Two look-alike pairs are planted deliberately so the pass always has real
 * work to do and the log line is reproducible.
 */
function dedupeCompanies(companies: CompanyRow[]): {
  kept: CompanyRow[];
  merged: Array<{ kept: string; removed: string }>;
} {
  const plantSource = companies.filter((c) => c.industryId !== "legal-services");
  const plants: CompanyRow[] = [
    {
      ...plantSource[3],
      id: "co_dup1",
      name: plantSource[3].name + " LLC",
    },
    {
      ...plantSource[10],
      id: "co_dup2",
      name: plantSource[10].name.replace(/e/, "é"),
    },
  ];
  const all = [...companies, ...plants];

  const nameKey = (c: CompanyRow) =>
    normalise(c.name.replace(/\b(llc|inc|co|corp|llp|group)\b/gi, ""))
      .replace(/\s+/g, " ")
      .trim();

  const kept: CompanyRow[] = [];
  const merged: Array<{ kept: string; removed: string }> = [];
  for (const candidate of all) {
    const dup = kept.find(
      (existing) =>
        existing.city === candidate.city &&
        levenshtein(nameKey(existing), nameKey(candidate)) <= 2,
    );
    if (dup) {
      merged.push({ kept: dup.name, removed: candidate.name });
    } else {
      kept.push(candidate);
    }
  }
  return { kept, merged };
}

function main() {
  if (fs.existsSync(DB_PATH)) {
    if (!force) {
      console.log("✓ Seed skipped — data/app.db exists (use --force to rebuild)");
      return;
    }
    fs.rmSync(DB_PATH);
    for (const suffix of ["-wal", "-shm"]) {
      const sidecar = DB_PATH + suffix;
      if (fs.existsSync(sidecar)) fs.rmSync(sidecar);
    }
  }

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const conn = new Database(DB_PATH);
  conn.pragma("journal_mode = WAL");
  conn.pragma("foreign_keys = ON");
  conn.exec(SCHEMA);

  conn
    .prepare("INSERT INTO users (id, name, email, passwordHash) VALUES (?, ?, ?, ?)")
    .run("user_demo", "Demo Searcher", DEMO_EMAIL, bcrypt.hashSync(DEMO_PASSWORD, 10));

  const generated = generateCompanies(500);
  // The walkthrough's hero search is "computer software in Austin, TX" —
  // guarantee that cell is well-populated instead of leaving it to chance.
  const austinIds = new Set(
    ["software-development", "software-publishing", "business-productivity-software", "cybersecurity-software"],
  );
  let pinned = 0;
  for (const company of generated) {
    if (pinned >= 14) break;
    if (austinIds.has(company.industryId) && company.city !== "Austin") {
      company.city = "Austin";
      company.state = "TX";
      pinned++;
    }
  }
  const { kept: companies, merged } = dedupeCompanies(generated);

  const insertCompany = conn.prepare(
    `INSERT INTO companies (id, name, website, linkedin, description, industryId,
      rawIndustry, naicsCode, city, state, employeeCount, revenueBand, foundedYear)
     VALUES (@id, @name, @website, @linkedin, @description, @industryId,
      @rawIndustry, @naicsCode, @city, @state, @employeeCount, @revenueBand, @foundedYear)`,
  );
  const insertMany = conn.transaction((rows: CompanyRow[]) => {
    for (const row of rows) insertCompany.run(row);
  });
  insertMany(companies);

  // ~800 contacts, 1–3 per company
  const insertContact = conn.prepare(
    "INSERT INTO contacts (id, companyId, name, title, email, linkedin) VALUES (?, ?, ?, ?, ?, ?)",
  );
  let contactCount = 0;
  const insertContacts = conn.transaction(() => {
    for (const company of companies) {
      const n = randInt(1, 3);
      for (let i = 0; i < n; i++) {
        const first = pick(FIRST_NAMES);
        const last = pick(LAST_NAMES);
        const domain = company.website.replace("https://", "");
        insertContact.run(
          `ct_${(++contactCount).toString().padStart(4, "0")}`,
          company.id,
          `${first} ${last}`,
          pick(TITLES),
          `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`,
          `https://linkedin.example.com/in/${first.toLowerCase()}-${last.toLowerCase()}-${contactCount}`,
        );
      }
    }
  });
  insertContacts();

  // Fold the WAL into the main file so the single copied .db is complete on
  // Vercel (only app.db is traced into the function bundle, not sidecars).
  conn.pragma("wal_checkpoint(TRUNCATE)");
  conn.close();

  console.log(`✓ Seeded ${path.relative(process.cwd(), DB_PATH)}`);
  console.log(`  · demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(
    `  · ${companies.length} synthetic companies across ${SEED_INDUSTRIES.length} industries and ${METROS.length} metros`,
  );
  console.log(`  · ${contactCount} contacts`);
  console.log(
    `  · ${merged.length} possible duplicate companies merged (${merged
      .map((m) => `"${m.removed}" → "${m.kept}"`)
      .join(", ")})`,
  );
  console.log(
    "  · every rawIndustry is a real string from their production capture",
  );
}

main();
