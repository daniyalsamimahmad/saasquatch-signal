"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { addContactsToCampaign } from "@/lib/actions/campaign-actions";
import type { CampaignSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AddToCampaignDialog({
  open,
  onOpenChange,
  campaigns,
  contactIds,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaigns: CampaignSummary[];
  contactIds: string[];
  onAdded?: () => void;
}) {
  const [target, setTarget] = React.useState<string>(campaigns[0]?.id ?? "");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) setTarget(campaigns[0]?.id ?? "");
  }, [open, campaigns]);

  const add = async () => {
    if (!target || busy) return;
    setBusy(true);
    const result = await addContactsToCampaign(target, { contactIds });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const added = result.data!.added;
    toast.success(
      added === 0
        ? "Those contacts are already in the campaign."
        : `Added ${added} ${added === 1 ? "contact" : "contacts"} to the campaign.`,
    );
    onOpenChange(false);
    onAdded?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Add {contactIds.length} {contactIds.length === 1 ? "contact" : "contacts"} to a campaign
          </DialogTitle>
          <DialogDescription>
            The campaign generates a personalized draft for each contact before
            anything is sent.
          </DialogDescription>
        </DialogHeader>
        {campaigns.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-center">
            <p className="text-sm text-text-2">No campaigns yet.</p>
            <Button asChild size="sm" className="mt-2">
              <Link href="/campaigns/new">
                <Sparkles className="size-3.5" aria-hidden />
                Create your first campaign
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Campaign</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name} ({campaign._count.contacts})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={add} disabled={busy || !target}>
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Add to campaign
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
