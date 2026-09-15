"use client";

import * as React from "react";
import { Mail, ChevronDown, Loader2, Check } from "lucide-react";
import { LinkedinIcon } from "@/components/icons/linkedin";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CampaignStep } from "@/lib/types";
import { updateStep } from "@/lib/actions/campaign-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function StepCard({ campaignId, step }: { campaignId: string; step: CampaignStep }) {
  const [open, setOpen] = React.useState(step.order === 1);
  const [subject, setSubject] = React.useState(step.subjectTpl);
  const [body, setBody] = React.useState(step.bodyTpl);
  const [waitDays, setWaitDays] = React.useState(String(step.waitDays));
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const dirty =
    subject !== step.subjectTpl ||
    body !== step.bodyTpl ||
    Number(waitDays) !== step.waitDays;

  const save = async () => {
    if (!dirty || busy) return;
    setBusy(true);
    const result = await updateStep(campaignId, step.id, {
      subjectTpl: subject,
      bodyTpl: body,
      waitDays: Math.max(0, Math.min(30, Number(waitDays) || 0)),
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const isEmail = step.channel === "EMAIL";

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md",
            isEmail
              ? "bg-brand-50 text-brand-600 dark:bg-brand-50/10 dark:text-brand-500"
              : "bg-[#0a66c2]/10 text-[#0a66c2]",
          )}
        >
          {isEmail ? <Mail className="size-3.5" aria-hidden /> : <LinkedinIcon className="size-3.5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">
            Step {step.order} · {isEmail ? "Email" : "LinkedIn"}
          </span>
          <span className="block truncate text-xs text-text-2">
            {step.order === 1
              ? "Sends on launch"
              : `Waits ${step.waitDays} day${step.waitDays === 1 ? "" : "s"}`}
            {isEmail && step.subjectTpl ? ` · ${step.subjectTpl}` : ""}
          </span>
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-text-3 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div className="space-y-3 border-t px-4 py-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
            {isEmail ? (
              <div className="space-y-1.5">
                <Label htmlFor={`subject-${step.id}`}>Subject</Label>
                <Input
                  id={`subject-${step.id}`}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
            ) : (
              <p className="self-end pb-2 text-xs text-text-3">
                LinkedIn messages have no subject — keep it under 280 characters.
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor={`wait-${step.id}`}>Wait (days)</Label>
              <Input
                id={`wait-${step.id}`}
                type="number"
                min={0}
                max={30}
                value={waitDays}
                onChange={(e) => setWaitDays(e.target.value)}
                disabled={step.order === 1}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`body-${step.id}`}>Body</Label>
            <Textarea
              id={`body-${step.id}`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="font-mono text-xs leading-relaxed"
            />
            <p className="text-xs text-text-3">
              {"{{first_name}}, {{company}}, and {{title}} fill in per contact. Step 1 emails are fully AI-personalized per lead instead."}
            </p>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={save} disabled={!dirty || busy}>
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : saved ? (
                <Check className="size-3.5" aria-hidden />
              ) : null}
              {saved ? "Saved" : "Save step"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function StepsEditor({
  campaignId,
  steps,
}: {
  campaignId: string;
  steps: CampaignStep[];
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Sequence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step) => (
          <StepCard key={step.id} campaignId={campaignId} step={step} />
        ))}
      </CardContent>
    </Card>
  );
}
