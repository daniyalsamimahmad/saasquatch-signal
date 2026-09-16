"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Layers, Loader2, FileDown } from "lucide-react";
import { toast } from "sonner";
import { validateBulk } from "@/lib/actions/validate-actions";
import type { EmailVerdict, PhoneVerdict } from "@/lib/types";
import { buildCsv, downloadCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const VERDICT_STYLE: Record<string, string> = {
  valid: "border-conf-high/40 text-conf-high",
  risky: "border-conf-mid/40 text-conf-mid",
  invalid: "border-conf-low/40 text-conf-low",
  unknown: "text-text-2",
};

export function BulkValidator() {
  const router = useRouter();
  const [kind, setKind] = React.useState<"email" | "phone">("email");
  const [raw, setRaw] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [results, setResults] = React.useState<Array<EmailVerdict | PhoneVerdict>>([]);

  const values = raw
    .split(/[\n,;]+/)
    .map((v) => v.trim())
    .filter(Boolean);

  const run = async () => {
    if (values.length === 0 || busy) return;
    if (values.length > 25) {
      toast.error("That's over the 25 per batch limit. Trim the list and run again.");
      return;
    }
    setBusy(true);
    const response = await validateBulk(kind, values);
    setBusy(false);
    if (!response.ok) {
      toast.error(response.error);
      return;
    }
    setResults(response.data.results);
    router.refresh();
  };

  const exportCsv = () => {
    const csv = buildCsv(
      ["Input", "Normalized", "Verdict", "Score"],
      results.map((r) => [r.input, r.normalized ?? "", r.verdict, r.score]),
    );
    downloadCsv(`validated-${kind}s.csv`, csv);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Layers className="size-4" aria-hidden />
          Bulk check
          <span className="ml-auto font-normal text-text-3">up to 25 per batch</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <Tabs value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
              <TabsList>
                <TabsTrigger value="email">Emails</TabsTrigger>
                <TabsTrigger value="phone">Phones</TabsTrigger>
              </TabsList>
            </Tabs>
            <Textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={
                kind === "email"
                  ? "one@company.com\ntwo@startup.io\n…one per line"
                  : "(512) 555-2368\n+1 415 555 0100\n…one per line"
              }
              rows={7}
              className="font-mono text-xs"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-3">
                <span className="font-mono tnum">{values.length}</span> to check
              </p>
              <Button size="sm" onClick={run} disabled={busy || values.length === 0}>
                {busy && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
                Validate all
              </Button>
            </div>
          </div>

          <div>
            {results.length === 0 ? (
              <div className="flex h-full min-h-40 items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-text-3">Results land here.</p>
              </div>
            ) : (
              <>
                <div className="max-h-64 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Input</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-right">Verdict</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((r, i) => (
                        <TableRow key={`${r.input}-${i}`}>
                          <TableCell className="max-w-52 truncate font-mono text-xs">
                            {r.input}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs tnum">
                            {r.score}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="outline"
                              className={VERDICT_STYLE[r.verdict] ?? "text-text-2"}
                            >
                              {r.verdict}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end pt-2">
                  <Button size="sm" variant="outline" onClick={exportCsv}>
                    <FileDown className="size-3.5" aria-hidden />
                    Export results
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
