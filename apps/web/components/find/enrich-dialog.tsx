"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { enrichDomain } from "@/lib/actions/search-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Live import: pulls one company's real profile from Apollo (and people
 * from Hunter when configured) straight into the index.
 */
export function EnrichDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [domain, setDomain] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [report, setReport] = React.useState<Record<string, string> | null>(null);

  const run = async () => {
    const value = domain.trim().toLowerCase();
    if (!value || busy) return;
    setBusy(true);
    setReport(null);
    const result = await enrichDomain(value);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setReport(result.data.report);
    if (result.data.company) {
      toast.success(`Imported ${result.data.company.name} into the index.`);
      router.refresh();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setReport(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="size-4" aria-hidden />
          Import from web
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import a company by domain</DialogTitle>
          <DialogDescription>
            Pulls the live company profile from Apollo — and people with work
            emails via Hunter when a key is configured — into your index.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                run();
              }
            }}
            placeholder="stripe.com"
            autoFocus
          />
          <Button onClick={run} disabled={busy || !domain.trim()}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Import"}
          </Button>
        </div>
        {report && (
          <div className="rounded-md border bg-surface-2/50 p-3 text-sm">
            {Object.entries(report).map(([provider, note]) => (
              <p key={provider} className="flex justify-between gap-3 py-0.5">
                <span className="font-medium capitalize">{provider}</span>
                <span className="text-right text-text-2">{note}</span>
              </p>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
