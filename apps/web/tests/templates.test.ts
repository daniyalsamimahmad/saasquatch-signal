import { describe, it, expect } from "vitest";
import { generateContextPoints, generateEmail } from "@/lib/outreach/templates";
import { INDUSTRIES } from "@/lib/taxonomy/resolve";
import type { CompanyRow } from "@/lib/search";

const company: CompanyRow = {
  id: "co_test",
  name: "Testline Health",
  website: "https://testlinehealth.example.com",
  linkedin: "https://linkedin.example.com/company/testlinehealth",
  description: "Test",
  industryId: "healthcare-software",
  rawIndustry: "Healthcare Softwares",
  naicsCode: "513210",
  city: "Austin",
  state: "TX",
  employeeCount: 42,
  revenueBand: "$1–10M",
  foundedYear: 2015,
};

const canonical = INDUSTRIES.find((i) => i.id === "healthcare-software")!;

describe("outreach templates (F-05 fix)", () => {
  it("is deterministic — same inputs, same draft, no LLM", () => {
    const a = generateContextPoints(company, canonical, 0);
    const b = generateContextPoints(company, canonical, 0);
    expect(a).toEqual(b);
  });

  it("derives all three context points from data the app already holds", () => {
    const [industry, size, location] = generateContextPoints(company, canonical, 0);
    expect(industry).toContain("Healthcare Software");
    expect(industry).toContain("513210");
    expect(size).toContain("42");
    expect(size).toContain("2015");
    expect(location).toContain("Austin");
  });

  it("regenerate cycles distinct variants", () => {
    const v0 = generateContextPoints(company, canonical, 0);
    const v1 = generateContextPoints(company, canonical, 1);
    expect(v0[0]).not.toEqual(v1[0]);
  });

  it("builds a complete email addressed to the contact's first name", () => {
    const points = generateContextPoints(company, canonical, 0);
    const email = generateEmail(
      company,
      { name: "Avery Calloway", title: "CEO", email: "a@example.com" },
      canonical,
      points,
      0,
    );
    expect(email.subject.length).toBeGreaterThan(5);
    expect(email.body).toContain("Hi Avery,");
    expect(email.body).toContain(points[2]);
  });
});
