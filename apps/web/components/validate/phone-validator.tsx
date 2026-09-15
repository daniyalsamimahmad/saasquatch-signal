"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { validatePhone } from "@/lib/actions/validate-actions";
import type { PhoneVerdict } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VerdictBadge, CheckRow } from "./verdict-badge";

const COUNTRIES = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
  { code: "IN", label: "India" },
  { code: "PK", label: "Pakistan" },
];

export function PhoneValidator() {
  const router = useRouter();
  const [phone, setPhone] = React.useState("");
  const [country, setCountry] = React.useState("US");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<PhoneVerdict | null>(null);

  const run = async () => {
    const value = phone.trim();
    if (!value || busy) return;
    setBusy(true);
    const response = await validatePhone(value, country);
    setBusy(false);
    if (!response.ok) {
      toast.error(response.error);
      return;
    }
    setResult(response.data);
    router.refresh();
  };

  const details =
    result && "e164" in result.details ? result.details : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Phone className="size-4" aria-hidden />
          Phone validator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-24 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                run();
              }
            }}
            placeholder="(512) 555-2368"
            type="tel"
            inputMode="tel"
          />
          <Button onClick={run} disabled={busy || !phone.trim()}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Check"}
          </Button>
        </div>
        <p className="text-xs text-text-3">
          Format and allocated-range validation with line type — offline, so
          it proves the number is real, not that the line is live.
        </p>

        {result && (
          <div className="rounded-md border bg-surface-2/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate font-mono text-sm">
                {result.normalized ?? result.input}
              </p>
              <VerdictBadge verdict={result.verdict} score={result.score} />
            </div>
            {details && (
              <div className="mt-2 divide-y border-t pt-1">
                <CheckRow label="E.164" pass={true} detail={details.e164} />
                <CheckRow label="National format" pass={true} detail={details.national} />
                <CheckRow label="Country" pass={true} detail={details.country ?? "—"} />
                <CheckRow
                  label="Line type"
                  pass={true}
                  detail={details.type.replace(/_/g, " ").toLowerCase()}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
