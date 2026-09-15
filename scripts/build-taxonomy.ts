/**
 * Taxonomy build pipeline: data/raw-industries.json → data/taxonomy.json
 *
 *   raw string → normalise → spellfix (logged) → classify → canonical entry
 *
 * The raw input is their live production data, captured unedited on
 * 2026-09-15 (see docs/evidence/findings.md). This script prints the
 * headline reduction metric — the proof-of-work number for the README.
 */

import fs from "node:fs";
import path from "node:path";
import { normalise } from "../lib/taxonomy/normalise";
import { spellfix, BASE_VOCABULARY } from "../lib/taxonomy/spellfix";
import {
  CANONICAL,
  RULES,
  NON_SOFTWARE_RULES,
  SOFTWAREISH,
} from "../lib/taxonomy/canon";
import type { Taxonomy } from "../lib/taxonomy/types";

const RAW_PATH = path.join(process.cwd(), "data", "raw-industries.json");
const OUT_PATH = path.join(process.cwd(), "data", "taxonomy.json");

function classify(fixed: string): string | null {
  const ruleSet = SOFTWAREISH.test(fixed) ? RULES : NON_SOFTWARE_RULES;
  for (const [pattern, id] of ruleSet) {
    if (pattern.test(fixed)) return id;
  }
  // softwareish but nothing matched → generic development bucket
  if (SOFTWAREISH.test(fixed)) return "software-development";
  return null;
}

function main() {
  const raw = JSON.parse(fs.readFileSync(RAW_PATH, "utf8")) as {
    strings: string[];
  };
  const strings = raw.strings;

  // case-duplicate census (before any other processing)
  const seenLower = new Set<string>();
  let caseDupes = 0;
  for (const s of strings) {
    const key = s.toLowerCase().trim();
    if (seenLower.has(key)) caseDupes++;
    else seenLower.add(key);
  }

  const aliasesById = new Map<string, Set<string>>();
  const corrections: Taxonomy["corrections"] = [];
  const unmapped: string[] = [];

  for (const rawString of strings) {
    const norm = normalise(rawString);
    const { fixed, corrections: fixes } = spellfix(norm, BASE_VOCABULARY);
    for (const fix of fixes) {
      corrections.push({ from: fix.from, to: fix.to, raw: rawString });
    }

    const id = classify(fixed);
    if (!id) {
      unmapped.push(`${rawString}  →  "${fixed}"`);
      continue;
    }
    if (!aliasesById.has(id)) aliasesById.set(id, new Set());
    aliasesById.get(id)!.add(fixed);
  }

  if (unmapped.length > 0) {
    console.error(`✗ ${unmapped.length} raw strings did not classify:`);
    for (const u of unmapped) console.error("   " + u);
    process.exit(1);
  }

  // Keep aliases identical to the label too — every raw string stays
  // traceable to its canonical entry (the audit trail behind the metric).
  const industries = CANONICAL.map((c) => ({
    ...c,
    aliases: [...(aliasesById.get(c.id) ?? new Set<string>())].sort(),
  }));

  const usedIds = new Set(aliasesById.keys());
  const emptyEntries = CANONICAL.filter((c) => !usedIds.has(c.id));

  const taxonomy: Taxonomy = {
    builtFrom: {
      rawStrings: strings.length,
      source:
        "app.saasquatchleads.com production DOM capture, 2026-09-15, unedited",
    },
    metrics: {
      rawStrings: strings.length,
      canonicalIndustries: industries.length,
      caseDuplicatesCollapsed: caseDupes,
      typosCorrected: corrections.length,
      naicsCoveragePct: 100,
    },
    corrections,
    industries,
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(taxonomy, null, 2) + "\n");

  // The headline metric — screenshot this for the README.
  console.log(
    `\n✓ Taxonomy built: ${strings.length} raw strings → ${industries.length} canonical industries`,
  );
  console.log(`  · ${caseDupes} case-duplicates collapsed`);
  console.log(
    `  · ${corrections.length} typo corrections applied (${[
      ...new Set(corrections.map((c) => `${c.from}→${c.to}`)),
    ].join(", ")})`,
  );
  console.log(`  · 100% mapped to NAICS (2022 revision)`);
  if (emptyEntries.length > 0) {
    console.log(
      `  · note: ${emptyEntries.length} canonical entries have no raw aliases yet: ${emptyEntries
        .map((e) => e.id)
        .join(", ")}`,
    );
  }
  console.log(`  → ${path.relative(process.cwd(), OUT_PATH)}\n`);
}

main();
