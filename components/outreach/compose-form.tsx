"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  RefreshCw,
  Sparkles,
  Save,
  Copy,
  Trash2,
  Loader2,
  ArrowLeft,
  Wand2,
} from "lucide-react";
import type { CompanyRow } from "@/lib/search";
import type { CanonicalIndustry } from "@/lib/taxonomy/types";
import {
  generateContextPoints,
  generateEmail,
  type Contact,
} from "@/lib/outreach/templates";
import { updateDraft, deleteDraft } from "@/lib/actions/outreach-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const POINT_LABELS = [
  "Context point 1 · industry & NAICS sector",
  "Context point 2 · size & founding year",
  "Context point 3 · location & regional market",
];

export function ComposeForm({
  draftId,
  company,
  contact,
  canonical,
  initialSubject,
  initialBody,
  initialPoints,
  initialStatus,
}: {
  draftId: string;
  company: CompanyRow;
  contact: Contact | null;
  canonical: CanonicalIndustry | null;
  initialSubject: string;
  initialBody: string;
  initialPoints: [string, string, string];
  initialStatus: string;
}) {
  const router = useRouter();
  const [subject, setSubject] = React.useState(initialSubject);
  const [body, setBody] = React.useState(initialBody);
  const [points, setPoints] = React.useState<[string, string, string]>(initialPoints);
  const [variants, setVariants] = React.useState<[number, number, number]>([0, 0, 0]);
  const [status, setStatus] = React.useState(initialStatus);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [bodyDirty, setBodyDirty] = React.useState(false);

  // F-05: their tool asks the human for 60+ typed words per lead. Here every
  // regenerate is a deterministic template pass over data the app holds.
  const regeneratePoint = (index: 0 | 1 | 2) => {
    // Walk variants until the text actually changes — state resets on reload,
    // so "the next variant" is defined by content, not by a counter.
    let nextVariant = (variants[index] + 1) % 3;
    let freshPoint = generateContextPoints(company, canonical, nextVariant)[index];
    for (let step = 0; step < 2 && freshPoint === points[index]; step++) {
      nextVariant = (nextVariant + 1) % 3;
      freshPoint = generateContextPoints(company, canonical, nextVariant)[index];
    }

    const nextPoints = [...points] as [string, string, string];
    nextPoints[index] = freshPoint;
    setVariants((prev) => {
      const next = [...prev] as [number, number, number];
      next[index] = nextVariant;
      return next;
    });
    setPoints(nextPoints);

    // Keep the email in sync unless the user hand-edited it — regenerated
    // points must never silently miss the copy that actually gets sent.
    if (!bodyDirty) {
      const email = generateEmail(company, contact, canonical, nextPoints, variants[0]);
      setBody(email.body);
    } else {
      toast("Point updated — body kept (you edited it). Use “Rebuild email from points” to sync.");
    }
  };

  const rebuildEmail = () => {
    const email = generateEmail(company, contact, canonical, points, variants[0]);
    setSubject(email.subject);
    setBody(email.body);
    setBodyDirty(false);
    toast("Email rebuilt from the three context points");
  };

  const save = async (nextStatus?: "draft" | "ready") => {
    setBusy("save");
    const result = await updateDraft({
      draftId,
      subject,
      body,
      contextPoints: points,
      status: (nextStatus ?? status) as "draft" | "ready",
    });
    setBusy(null);
    if (result.ok) {
      if (nextStatus) setStatus(nextStatus);
      toast.success(nextStatus === "ready" ? "Marked ready" : "Draft saved");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      toast.success("Email copied to clipboard");
    } catch {
      toast.error("Clipboard unavailable in this browser");
    }
  };

  const remove = async () => {
    setBusy("delete");
    const result = await deleteDraft(draftId);
    setBusy(null);
    if (result.ok) {
      toast(`Deleted draft for ${company.name}`);
      router.push("/outreach");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
            <Link href="/outreach">
              <ArrowLeft className="size-4" aria-hidden />
              Outreach queue
            </Link>
          </Button>
          <h1 className="text-xl font-bold">{company.name}</h1>
          <p className="mt-1 text-sm text-text-2">
            To:{" "}
            {contact ? (
              <>
                <span className="font-medium text-foreground">{contact.name}</span>{" "}
                · {contact.title} ·{" "}
                <span className="font-mono text-xs">{contact.email}</span>
              </>
            ) : (
              "no contact on record"
            )}
          </p>
        </div>
        <Badge
          variant="secondary"
          className={status === "ready" ? "bg-conf-high-subtle text-conf-high" : ""}
        >
          {status}
        </Badge>
      </div>

      {/* The three context points — the part their product makes humans type */}
      <div className="space-y-3">
        {points.map((point, index) => (
          <Card key={index}>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor={`point-${index}`} className="label-caps">
                  {POINT_LABELS[index]}
                </Label>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-sm bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-50/30 dark:text-brand-500">
                    <Sparkles className="size-3" aria-hidden />
                    generated from lead data
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => regeneratePoint(index as 0 | 1 | 2)}
                  >
                    <RefreshCw className="size-3.5" aria-hidden />
                    Regenerate
                  </Button>
                </div>
              </div>
              <Textarea
                id={`point-${index}`}
                value={point}
                onChange={(e) =>
                  setPoints((prev) => {
                    const next = [...prev] as [string, string, string];
                    next[index] = e.target.value;
                    return next;
                  })
                }
                rows={2}
                className="text-sm"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-3 flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={rebuildEmail}>
          <Wand2 className="size-4" aria-hidden />
          Rebuild email from points
        </Button>
      </div>

      <Separator className="my-6" />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="body">Email</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setBodyDirty(true);
            }}
            rows={14}
            className="font-mono text-sm leading-relaxed"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button onClick={() => save()} disabled={busy !== null}>
          {busy === "save" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Save className="size-4" aria-hidden />
          )}
          Save draft
        </Button>
        <Button
          variant="outline"
          onClick={() => save(status === "ready" ? "draft" : "ready")}
          disabled={busy !== null}
        >
          {status === "ready" ? "Back to draft" : "Mark ready"}
        </Button>
        <Button variant="outline" onClick={copyEmail}>
          <Copy className="size-4" aria-hidden />
          Copy email
        </Button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          onClick={remove}
          disabled={busy !== null}
          className="text-conf-low hover:text-conf-low"
        >
          {busy === "delete" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="size-4" aria-hidden />
          )}
          Delete
        </Button>
      </div>
    </div>
  );
}
