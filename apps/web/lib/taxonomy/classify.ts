import { RULES, NON_SOFTWARE_RULES, SOFTWAREISH } from "./canon";

/**
 * Ordered-rule classification of a normalised+spellfixed industry string.
 * Shared by the taxonomy build script and the seed generator (which uses it
 * to hand each synthetic company a messy rawIndustry from the right bucket).
 */
export function classify(fixed: string): string | null {
  const ruleSet = SOFTWAREISH.test(fixed) ? RULES : NON_SOFTWARE_RULES;
  for (const [pattern, id] of ruleSet) {
    if (pattern.test(fixed)) return id;
  }
  if (SOFTWAREISH.test(fixed)) return "software-development";
  return null;
}
