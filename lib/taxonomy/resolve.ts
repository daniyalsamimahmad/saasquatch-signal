import Fuse from "fuse.js";
import taxonomyData from "@/data/taxonomy.json";
import { normalise } from "./normalise";
import { spellfix, BASE_VOCABULARY } from "./spellfix";
import type {
  CanonicalIndustry,
  ConfidenceBand,
  ResolveResult,
  Taxonomy,
} from "./types";

export const TAXONOMY = taxonomyData as Taxonomy;
export const INDUSTRIES: CanonicalIndustry[] = TAXONOMY.industries;

// Vocabulary for the spellfix pass: base domain words + every word that
// appears in the canonical labels and aliases.
const VOCABULARY = new Set(BASE_VOCABULARY);
for (const ind of INDUSTRIES) {
  for (const word of normalise(ind.label).split(" ")) VOCABULARY.add(word);
  for (const alias of ind.aliases) {
    for (const word of alias.split(" ")) VOCABULARY.add(word);
  }
}

const labelIndex = new Map(INDUSTRIES.map((i) => [normalise(i.label), i]));
const aliasIndex = new Map<string, CanonicalIndustry>();
for (const ind of INDUSTRIES) {
  for (const alias of ind.aliases) aliasIndex.set(alias, ind);
}

// Built once at module scope — the index is reused across every request
// (and on Vercel, across invocations of a warm instance). Cited in the
// README's performance notes.
const fuse = new Fuse(INDUSTRIES, {
  keys: [
    { name: "label", weight: 0.7 },
    { name: "aliases", weight: 0.3 },
  ],
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
});

// Tokens too generic to carry meaning on their own. A fuzzy match that
// shares ONLY these with the query is not a match — that is precisely how
// their /naics/ search turned "Computer Software" into 150 law firms.
const GENERIC_TOKENS = new Set([
  "software", "service", "solution", "company", "tech", "technology",
  "platform", "saas", "system", "tool", "app", "application", "product",
  "provider", "business", "enterprise", "management", "&", "/", "and",
  "the", "of", "for",
]);

// token set per industry (label + aliases), cached once
const industryTokens = new Map<string, Set<string>>();
for (const ind of INDUSTRIES) {
  const set = new Set<string>();
  for (const word of normalise(ind.label).split(" ")) set.add(word);
  for (const alias of ind.aliases) {
    for (const word of alias.split(" ")) set.add(word);
  }
  industryTokens.set(ind.id, set);
}

/**
 * Fraction of the query's *informative* tokens the candidate actually
 * contains. No informative tokens (a purely generic query like "software")
 * counts as full coverage — generic queries legitimately match generic
 * entries via the exact/alias paths.
 */
function tokenCoverage(queryTokens: string[], industryId: string): number {
  const informative = queryTokens.filter((t) => !GENERIC_TOKENS.has(t));
  if (informative.length === 0) return 1;
  const known = industryTokens.get(industryId);
  if (!known) return 0;
  const hits = informative.filter((t) => known.has(t)).length;
  return hits / informative.length;
}

function bandFor(confidence: number): ConfidenceBand {
  if (confidence >= 85) return "high";
  if (confidence >= 60) return "medium";
  // F-01: their app answers a low-confidence industry query with 150
  // confidently-wrong law firms. This band exists to refuse that guess —
  // the caller must block the search and show alternatives instead.
  return "low";
}

export function resolveIndustry(input: string): ResolveResult {
  const query = input;
  const norm = normalise(input);
  const { fixed, corrections } = spellfix(norm, VOCABULARY);
  const correctionLabels = corrections.map((c) => `${c.from} → ${c.to}`);

  const empty: ResolveResult = {
    query,
    normalised: fixed,
    corrections: correctionLabels,
    match: null,
    confidence: 0,
    band: "low",
    alternatives: [],
    method: "none",
  };

  if (!fixed) return empty;

  // Fuzzy candidates double as the "also considered" list for every method.
  // Raw Fuse similarity is damped by token coverage: sharing only generic
  // tokens ("software") with an entry must not produce a confident match.
  const queryTokens = fixed.split(" ");
  const fuseResults = fuse.search(fixed, { limit: 8 });
  const scored = fuseResults
    .map((r) => {
      const textual = (1 - (r.score ?? 1)) * 100;
      const coverage = tokenCoverage(queryTokens, r.item.id);
      const confidence = Math.max(
        0,
        Math.min(99, Math.round(textual * (0.4 + 0.6 * coverage))),
      );
      return { industry: r.item, confidence };
    })
    .sort((a, b) => b.confidence - a.confidence);

  const alternativesExcluding = (id?: string) =>
    scored.filter((s) => s.industry.id !== id).slice(0, 3);

  // 1. Exact canonical label match → 100
  const labelHit = labelIndex.get(fixed);
  if (labelHit) {
    return {
      ...empty,
      match: labelHit,
      confidence: 100,
      band: "high",
      alternatives: alternativesExcluding(labelHit.id),
      method: "exact-label",
    };
  }

  // 2. Exact alias match (one of their 291 raw strings, normalised) → 95
  const aliasHit = aliasIndex.get(fixed);
  if (aliasHit) {
    return {
      ...empty,
      match: aliasHit,
      confidence: 95,
      band: "high",
      alternatives: alternativesExcluding(aliasHit.id),
      method: "exact-alias",
    };
  }

  // 3. Weighted fuzzy match
  const best = scored[0];
  if (!best) return empty;

  return {
    ...empty,
    match: best.industry,
    confidence: best.confidence,
    band: bandFor(best.confidence),
    alternatives: alternativesExcluding(best.industry.id),
    method: "fuzzy",
  };
}
