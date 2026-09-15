/**
 * Step 2: correct typos.
 * First an explicit dictionary of misspellings observed in their production
 * data (see data/raw-industries.json — captured live, unedited), then
 * Levenshtein distance ≤ 2 against the canonical vocabulary for the rest.
 * Every correction is logged; the log is a README artefact.
 */

// Observed in production on 2026-09-15. Not hypothetical.
// ("busine" is "Busines" after the normaliser's plural pass.)
const OBSERVED_TYPOS: Record<string, string> = {
  busines: "business",
  busine: "business",
  producitvity: "productivity",
  verical: "vertical",
  esate: "estate",
  emergy: "energy",
  softwares: "software",
};

export type Correction = { from: string; to: string };

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = curr;
  }
  return prev[n];
}

/**
 * Correct each token of a normalised string.
 * @param vocabulary known-good words (built from canonical labels + aliases)
 */
export function spellfix(
  normalised: string,
  vocabulary: Set<string>,
): { fixed: string; corrections: Correction[] } {
  const corrections: Correction[] = [];

  const fixed = normalised
    .split(" ")
    .map((tok) => {
      if (vocabulary.has(tok)) return tok;

      const dictFix = OBSERVED_TYPOS[tok];
      if (dictFix) {
        corrections.push({ from: tok, to: dictFix });
        return dictFix;
      }

      // Fuzzy pass is deliberately conservative — a false correction is worse
      // than a missed one (the whole point of this project). Short tokens are
      // never touched; medium tokens only accept distance 1.
      if (tok.length < 5) return tok;
      const maxDist = tok.length >= 8 ? 2 : 1;

      let best: string | null = null;
      let bestDist = maxDist + 1;
      for (const word of vocabulary) {
        if (Math.abs(word.length - tok.length) > maxDist) continue;
        const d = levenshtein(tok, word);
        if (d < bestDist) {
          bestDist = d;
          best = word;
          if (d === 1) break; // can't beat 1 meaningfully — take it
        }
      }
      if (best && best !== tok) {
        corrections.push({ from: tok, to: best });
        return best;
      }
      return tok;
    })
    .join(" ");

  return { fixed, corrections };
}

/** Core vocabulary: common correct words in this domain, used before the
 * taxonomy exists (build time) and merged with taxonomy vocabulary after. */
export const BASE_VOCABULARY = new Set(
  (
    "software service business productivity vertical horizontal saas company development developer " +
    "computer information technology internet web application platform enterprise solution system " +
    "healthcare health medical patient clinical mental veterinary senior living practice " +
    "finance financial fintech trading mortgage lending banking investment insurance payment " +
    "legal law attorney compliance governance risk regulatory audit credentialing certification " +
    "government municipal safety emergency defense aerospace mission maritime " +
    "education educational school student learning training institute childcare " +
    "real estate property construction contractor bidding accounting billing " +
    "supply chain logistics transportation shipping fulfillment freight " +
    "human resource workforce recruiting recruitment talent employee performance career " +
    "customer relationship engagement sales marketing advertising survey demo review " +
    "commerce ecommerce retail merchandising order procurement point sale " +
    "energy utility utilities oil gas pipeline solar electric management " +
    "sustainability carbon environmental green waste climate " +
    "manufacturing industrial maintenance facility museum membership association volunteer " +
    "security cybersecurity network wireless server storage monitoring infrastructure cloud devops " +
    "data database analytics intelligence collection research hosting " +
    "telecom communication multimedia media content email messaging voip videoconferencing " +
    "consulting outsourcing managed distribution wholesale publisher publishing testing quality " +
    "engineering programming custom open source workflow project document collaboration " +
    "landscaping laundry cannabis niche automation modernization onboarding clienteling " +
    "internal financing lead tool tools file other order trade wholesaler directory provider ebusiness " +
    "preparedness geolocation iot itam itsm msp cpq crm scm erp voip devops regtech proptech " +
    "govtech insurtech blockchain api navigation autonomous instrumentation calibration " +
    "equipment inspection experts expert simplified alternative pricing optimization cost"
  )
    .split(/\s+/)
    .filter(Boolean),
);
