export type CanonicalIndustry = {
  id: string; // "software-development"
  label: string; // "Software Development"
  aliases: string[]; // normalised raw strings that collapse into this entry
  naicsCode: string; // "541511"
  naicsTitle: string; // "Custom Computer Programming Services"
  sector: string; // "Software & IT"
};

export type Taxonomy = {
  builtFrom: { rawStrings: number; source: string };
  metrics: {
    rawStrings: number;
    canonicalIndustries: number;
    caseDuplicatesCollapsed: number;
    typosCorrected: number;
    naicsCoveragePct: number;
  };
  corrections: Array<{ from: string; to: string; raw: string }>;
  industries: CanonicalIndustry[];
};

export type ConfidenceBand = "high" | "medium" | "low";

export type ResolveResult = {
  query: string; // what the user typed
  normalised: string; // after normalisation
  corrections: string[]; // "computr → computer" — feeds the "why" popover
  match: CanonicalIndustry | null;
  confidence: number; // 0–100
  band: ConfidenceBand;
  alternatives: Array<{ industry: CanonicalIndustry; confidence: number }>;
  /** which step produced the match — rendered in the derivation chain */
  method: "exact-label" | "exact-alias" | "fuzzy" | "none";
};
