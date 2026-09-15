import { describe, it, expect } from "vitest";
import { normalise } from "@/lib/taxonomy/normalise";
import { spellfix, levenshtein, BASE_VOCABULARY } from "@/lib/taxonomy/spellfix";
import { resolveIndustry, INDUSTRIES, TAXONOMY } from "@/lib/taxonomy/resolve";

describe("normalise", () => {
  it("lowercases, trims, collapses whitespace and strips punctuation", () => {
    expect(normalise("  Business   Software!! ")).toBe("business software");
  });

  it("singularises trailing plurals but keeps domain words", () => {
    expect(normalise("Computer Software Developers")).toBe(
      "computer software developer",
    );
    expect(normalise("Data Analytics")).toBe("data analytics");
  });

  it("pads separators so tokens never fuse", () => {
    expect(normalise("Fintech Software/Legal Software")).toBe(
      "fintech software / legal software",
    );
  });
});

describe("spellfix", () => {
  it("corrects the typos observed in their production data", () => {
    const { fixed, corrections } = spellfix(
      normalise("Busines software"),
      BASE_VOCABULARY,
    );
    expect(fixed).toBe("business software");
    expect(corrections).toHaveLength(1);
  });

  it("corrects producitvity → productivity", () => {
    const { fixed } = spellfix(
      normalise("Business/Producitvity Software"),
      BASE_VOCABULARY,
    );
    expect(fixed).toContain("productivity");
  });

  it("never touches valid domain words", () => {
    const { corrections } = spellfix(
      normalise("Lead Distribution Software"),
      BASE_VOCABULARY,
    );
    expect(corrections).toHaveLength(0);
  });

  it("levenshtein distance is correct", () => {
    expect(levenshtein("computr", "computer")).toBe(1);
    expect(levenshtein("verical", "vertical")).toBe(1);
  });
});

describe("taxonomy build output", () => {
  it("collapsed their 291 raw strings into ~32 canonical industries, all NAICS-mapped", () => {
    expect(TAXONOMY.metrics.rawStrings).toBe(291);
    expect(INDUSTRIES.length).toBeLessThan(40);
    expect(INDUSTRIES.every((i) => /^\d{6}$/.test(i.naicsCode))).toBe(true);
  });
});

describe("resolveIndustry", () => {
  it("exact canonical label → confidence 100, high band", () => {
    const r = resolveIndustry("Software Development");
    expect(r.match?.id).toBe("software-development");
    expect(r.confidence).toBe(100);
    expect(r.band).toBe("high");
    expect(r.method).toBe("exact-label");
  });

  it("their raw string resolves as an alias → 95, high", () => {
    const r = resolveIndustry("Computer Software");
    expect(r.match?.id).toBe("software-development");
    expect(r.confidence).toBe(95);
    expect(r.method).toBe("exact-alias");
  });

  it("a misspelled query is corrected, then resolves (the F-01 fix)", () => {
    const r = resolveIndustry("computr software");
    expect(r.corrections).toContain("computr → computer");
    expect(r.match?.id).toBe("software-development");
    expect(r.band).toBe("high");
  });

  it("their production typo 'Verical Saas – Landscaping Software' resolves", () => {
    const r = resolveIndustry("Verical Saas – Landscaping Software");
    expect(r.corrections).toContain("verical → vertical");
    expect(r.match?.id).toBe("vertical-saas-other");
    expect(r.band).toBe("high");
  });

  it("the mangled 'Legalattorney' slug resolves to Legal Services", () => {
    const r = resolveIndustry("Legalattorney");
    expect(r.match?.id).toBe("legal-services");
    expect(r.band).toBe("high");
  });

  it("nonsense input refuses to guess: low band, so the search must block", () => {
    const r = resolveIndustry("zzqx warp drive farming");
    expect(r.band).toBe("low");
  });

  it("a match sharing only generic tokens with the query is damped to low — never a confident guess", () => {
    // Without the token-coverage guard, Fuse rated this 97% "Healthcare
    // Software" on letter-soup similarity — the exact F-01 failure mode.
    const r = resolveIndustry("lawnkare softwear");
    expect(r.band).toBe("low");
  });

  it("off-domain queries block instead of returning wrong industries", () => {
    expect(resolveIndustry("plumbing services").band).toBe("low");
    expect(resolveIndustry("law firm").band).toBe("low");
  });

  it("empty input yields no match", () => {
    const r = resolveIndustry("   ");
    expect(r.match).toBeNull();
    expect(r.band).toBe("low");
  });

  it("fuzzy matches carry up to 3 alternatives for the 'also considered' list", () => {
    const r = resolveIndustry("security sofware tools");
    expect(r.alternatives.length).toBeGreaterThan(0);
    expect(r.alternatives.length).toBeLessThanOrEqual(3);
  });
});
