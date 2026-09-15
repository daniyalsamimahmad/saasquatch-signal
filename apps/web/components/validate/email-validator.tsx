"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { validateEmail } from "@/lib/actions/validate-actions";
import type { EmailVerdict } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VerdictBadge, CheckRow } from "./verdict-badge";

export function EmailValidator() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<EmailVerdict | null>(null);

  const run = async () => {
    const value = email.trim();
    if (!value || busy) return;
    setBusy(true);
    const response = await validateEmail(value);
    setBusy(false);
    if (!response.ok) {
      toast.error(response.error);
      return;
    }
    setResult(response.data);
    router.refresh(); // history table below
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Mail className="size-4" aria-hidden />
          Email validator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                run();
              }
            }}
            placeholder="jane@company.com"
            type="email"
            inputMode="email"
          />
          <Button onClick={run} disabled={busy || !email.trim()}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Check"}
          </Button>
        </div>
        <p className="text-xs text-text-3">
          Syntax, live MX lookup, disposable-domain and role-account checks —
          instant and unlimited.
        </p>

        {result && (
          <div className="rounded-md border bg-surface-2/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate font-mono text-sm">{result.normalized}</p>
              <VerdictBadge verdict={result.verdict} score={result.score} />
            </div>
            <div className="mt-2 divide-y border-t pt-1">
              <CheckRow label="Syntax" pass={result.checks.syntax} />
              <CheckRow
                label="Domain accepts mail (MX)"
                pass={result.checks.domainHasMx}
              />
              <CheckRow
                label="Disposable domain"
                pass={!result.checks.disposable}
                detail={result.checks.disposable ? "Yes — burner" : "No"}
              />
              <CheckRow
                label="Role account (info@, sales@…)"
                pass={!result.checks.roleAccount}
                detail={result.checks.roleAccount ? "Yes" : "No"}
              />
              {result.checks.deep && (
                <CheckRow
                  label="Mailbox check (ZeroBounce)"
                  pass={result.checks.deep.status === "valid"}
                  detail={result.checks.deep.status}
                />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
