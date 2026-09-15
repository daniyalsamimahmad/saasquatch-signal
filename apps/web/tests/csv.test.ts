import { describe, it, expect } from "vitest";
import { escapeCsvCell, buildCsv } from "@/lib/csv";

describe("CSV builder", () => {
  it("quotes cells containing commas, quotes, and newlines (RFC 4180)", () => {
    expect(escapeCsvCell("Davis & Wilkerson, P.C.")).toBe('"Davis & Wilkerson, P.C."');
    expect(escapeCsvCell('He said "hi"')).toBe('"He said ""hi"""');
  });

  it("neutralises formula-injection cells (OWASP)", () => {
    expect(escapeCsvCell("=cmd|'/C calc'!A0")).toMatch(/^'=/);
    expect(escapeCsvCell("+SUM(1,2)")).toMatch(/^"?'\+/);
    expect(escapeCsvCell("@import")).toMatch(/^'@/);
  });

  it("passes ordinary values through unchanged", () => {
    expect(escapeCsvCell("Software Development")).toBe("Software Development");
    expect(escapeCsvCell(541511)).toBe("541511");
  });

  it("builds a BOM-prefixed CRLF file", () => {
    const csv = buildCsv(["a", "b"], [["1", "2"]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain("a,b\r\n1,2");
  });
});
