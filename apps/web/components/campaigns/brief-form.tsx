"use client";

import * as React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createCampaign } from "@/lib/actions/campaign-actions";
import type { WritingBrief } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TONES = ["direct", "friendly", "formal", "casual"];

/**
 * The lemlist pattern: a four-field brief is all the AI needs to design the
 * whole sequence. The saved brief from Settings prefills it.
 */
export function BriefForm({ savedBrief }: { savedBrief: WritingBrief | null }) {
  // A saved tone outside the preset list still shows as a valid option.
  const tones = React.useMemo(
    () =>
      Array.from(new Set([...TONES, ...(savedBrief?.tone ? [savedBrief.tone] : [])])),
    [savedBrief?.tone],
  );
  const [offer, setOffer] = React.useState(savedBrief?.offer ?? "");
  const [audience, setAudience] = React.useState(savedBrief?.audience ?? "");
  const [tone, setTone] = React.useState(savedBrief?.tone ?? "direct");
  const [cta, setCta] = React.useState(savedBrief?.cta ?? "");
  const [steps, setSteps] = React.useState("3");
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async () => {
    if (!offer.trim() || busy) return;
    setBusy(true);
    const result = await createCampaign({
      name: name.trim() || undefined,
      brief: {
        offer: offer.trim(),
        audience: audience.trim() || undefined,
        tone,
        cta: cta.trim() || undefined,
      },
      steps: Number(steps),
    });
    // On success the action redirects; we only land here on failure.
    setBusy(false);
    if (result && !result.ok) toast.error(result.error);
  };

  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <div className="space-y-1.5">
          <Label htmlFor="brief-offer">
            What are you offering? <span className="text-conf-low">*</span>
          </Label>
          <Textarea
            id="brief-offer"
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            placeholder="We help B2B SaaS teams cut cloud spend 30% without touching product code…"
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="brief-audience">Who is it for?</Label>
          <Input
            id="brief-audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="CTOs and VPs of Engineering at 50-500 person software companies"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tones.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Steps in the sequence</Label>
            <Select value={steps} onValueChange={setSteps}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["2", "3", "4", "5"].map((n) => (
                  <SelectItem key={n} value={n}>
                    {n} steps
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="brief-cta">Call to action</Label>
          <Input
            id="brief-cta"
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            placeholder="Book a 15-minute call"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="brief-name">
            Campaign name <span className="text-text-3">(optional, the AI names it otherwise)</span>
          </Label>
          <Input
            id="brief-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Q4 fintech CTO push"
          />
        </div>

        <Button className="w-full" onClick={submit} disabled={busy || !offer.trim()}>
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Designing the sequence…
            </>
          ) : (
            <>
              <Sparkles className="size-4" aria-hidden />
              Generate campaign
            </>
          )}
        </Button>
        <p className="text-center text-xs text-text-3">
          Nothing sends until you add contacts, review the drafts, and hit Launch.
        </p>
      </CardContent>
    </Card>
  );
}
