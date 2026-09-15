"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveBrief } from "@/lib/actions/settings-actions";
import type { WritingBrief } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
 * The reusable writing brief: every AI draft — campaign steps, personalized
 * step-1 emails, LinkedIn messages — starts from these guardrails, so the
 * copy sounds like you, not like a template.
 */
export function AiBriefForm({ brief }: { brief: WritingBrief | null }) {
  const router = useRouter();
  // A saved tone that predates (or goes beyond) the preset list still shows.
  const tones = React.useMemo(
    () => Array.from(new Set([...TONES, ...(brief?.tone ? [brief.tone] : [])])),
    [brief?.tone],
  );
  const [offer, setOffer] = React.useState(brief?.offer ?? "");
  const [audience, setAudience] = React.useState(brief?.audience ?? "");
  const [tone, setTone] = React.useState(brief?.tone ?? "direct");
  const [cta, setCta] = React.useState(brief?.cta ?? "");
  const [avoidWords, setAvoidWords] = React.useState(brief?.avoidWords ?? "");
  const [busy, setBusy] = React.useState(false);

  const save = async () => {
    if (!offer.trim() || busy) return;
    setBusy(true);
    const result = await saveBrief({
      offer: offer.trim(),
      audience: audience.trim() || undefined,
      tone,
      cta: cta.trim() || undefined,
      avoidWords: avoidWords.trim() || undefined,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Writing brief saved — new campaigns start from it.");
    router.refresh();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="size-4 text-brand-500" aria-hidden />
          AI writing brief
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="brief-offer">Your offer</Label>
          <Textarea
            id="brief-offer"
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            placeholder="What you sell and the concrete outcome it buys."
            rows={2}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="brief-audience">Audience</Label>
            <Input
              id="brief-audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Who the messages target"
            />
          </div>
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
            <Label htmlFor="brief-cta">Call to action</Label>
            <Input
              id="brief-cta"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="Book a 15-minute call"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brief-avoid">Words to avoid</Label>
            <Input
              id="brief-avoid"
              value={avoidWords}
              onChange={(e) => setAvoidWords(e.target.value)}
              placeholder="synergy, revolutionize, …"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={save} disabled={busy || !offer.trim()}>
            {busy && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
            Save brief
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
