/**
 * Step 1 of the pipeline: turn a raw industry string into a canonical-comparable form.
 * lowercase → trim → collapse whitespace → strip punctuation (keep & and /)
 * → expand abbreviations → singularise trailing plurals.
 */

const ABBREVIATIONS: Record<string, string> = {
  mfg: "manufacturing",
  svcs: "services",
  svc: "service",
  dev: "development",
  bi: "business intelligence",
  "e-commerce": "ecommerce",
  "e-discovery": "ediscovery",
  "e-mail": "email",
};

// Words where a trailing "s" is not a plural to strip.
const PLURAL_KEEP = new Set([
  "analytics",
  "logistics",
  "business",
  "saas",
  "gps",
  "pos",
  "grc",
  "esg",
  "aws",
  "its",
  "sales",
  "devops",
  "cannabis",
  "wireless",
  "autonomous",
  "services", // handled explicitly below so "services" → "service" stays predictable
]);

export function normalise(input: string): string {
  let s = input.toLowerCase().trim();

  // unify unicode dashes, strip punctuation except & and /
  s = s.replace(/[–—]/g, "-");
  s = s.replace(/[^\p{L}\p{N}&/\s-]/gu, " ");
  s = s.replace(/-/g, " ");
  // pad separators so they never fuse with a word ("software/" → "software /")
  s = s.replace(/\s*\/\s*/g, " / ").replace(/\s*&\s*/g, " & ");
  s = s.replace(/\s+/g, " ").trim();

  // expand abbreviations token-wise
  s = s
    .split(" ")
    .map((tok) => ABBREVIATIONS[tok] ?? tok)
    .join(" ");

  // singularise simple trailing plurals per token (developers → developer)
  s = s
    .split(" ")
    .map((tok) => {
      if (tok.length <= 3 || PLURAL_KEEP.has(tok)) {
        return tok === "services" ? "service" : tok;
      }
      if (tok.endsWith("ies")) return tok.slice(0, -3) + "y";
      if (tok.endsWith("sses") || tok.endsWith("shes") || tok.endsWith("ches"))
        return tok.slice(0, -2);
      if (tok.endsWith("s") && !tok.endsWith("ss")) return tok.slice(0, -1);
      return tok;
    })
    .join(" ");

  return s;
}

/** Split a normalised string into tokens on separators (&, /, comma already stripped). */
export function tokenise(normalised: string): string[] {
  return normalised
    .split(/[&/]| and /)
    .map((part) => part.trim())
    .filter(Boolean);
}
