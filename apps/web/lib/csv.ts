/**
 * CSV building. RFC 4180 quoting, CRLF line ends, a UTF-8 BOM so Excel
 * opens files cleanly, and an OWASP formula-injection guard: leading
 * = + - @ tab CR are neutralised, because exported lead data ends up in
 * spreadsheets and must never execute there.
 */

export function escapeCsvCell(value: string | number): string {
  const raw = String(value);
  const guarded = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/.test(guarded)
    ? `"${guarded.replace(/"/g, '""')}"`
    : guarded;
}

export function buildCsv(
  header: string[],
  rows: Array<Array<string | number>>,
): string {
  const lines = [
    header.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  return "﻿" + lines.join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
