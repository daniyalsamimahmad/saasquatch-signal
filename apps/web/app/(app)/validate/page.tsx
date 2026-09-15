import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import type { ValidationRecord } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmailValidator } from "@/components/validate/email-validator";
import { PhoneValidator } from "@/components/validate/phone-validator";
import { BulkValidator } from "@/components/validate/bulk-validator";

export const metadata: Metadata = { title: "Validate" };

const VERDICT_STYLE: Record<string, string> = {
  valid: "border-conf-high/40 text-conf-high",
  risky: "border-conf-mid/40 text-conf-mid",
  invalid: "border-conf-low/40 text-conf-low",
  unknown: "text-text-2",
};

export default async function ValidatePage() {
  const session = await requireSession();
  const history = await apiFetch<ValidationRecord[]>("/validate/history", {
    token: session.apiToken,
  });

  return (
    <>
      <PageHeader
        title="Validate"
        description="Check emails and phone numbers before they burn your sender reputation."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <EmailValidator />
        <PhoneValidator />
      </div>

      <div className="mt-4">
        <BulkValidator />
      </div>

      {history.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recent checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Input</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Verdict</TableHead>
                    <TableHead className="text-right">When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.slice(0, 20).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="max-w-64 truncate font-mono text-xs">
                        {record.input}
                      </TableCell>
                      <TableCell className="text-sm text-text-2 capitalize">
                        {record.kind}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tnum">
                        {record.score}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={VERDICT_STYLE[record.verdict] ?? "text-text-2"}
                        >
                          {record.verdict}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-text-3">
                        {new Date(record.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
