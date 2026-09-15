"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Sparkles, Rocket, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { CampaignDetail, ListSummary } from "@/lib/types";
import {
  addContactsToCampaign,
  generateDrafts,
  launchCampaign,
} from "@/lib/actions/campaign-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

/**
 * The campaign's mission control: add contacts → generate drafts → launch.
 * While drafts are generating on the queue, the panel polls for fresh state.
 */
export function CampaignRunPanel({
  campaign,
  lists,
}: {
  campaign: CampaignDetail;
  lists: ListSummary[];
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = React.useState(false);
  const [listId, setListId] = React.useState(lists[0]?.id ?? "");
  const [busy, setBusy] = React.useState<"add" | "generate" | "launch" | null>(null);

  const total = campaign.contacts.length;
  const ready = campaign.contacts.filter((c) => c.status === "ready").length;
  const generating = campaign.contacts.filter(
    (c) => c.status === "generating" || c.status === "pending",
  ).length;

  const emailStats = campaign.messageStats.filter((s) => s.channel === "EMAIL");
  const stat = (status: string) =>
    emailStats.find((s) => s.status === status)?._count ?? 0;
  const drafts = stat("DRAFT");
  const queued = stat("QUEUED");
  const sent = stat("SENT") + stat("DELIVERED") + stat("OPENED");
  const delivered = stat("DELIVERED") + stat("OPENED");
  const opened = stat("OPENED");
  const failed = stat("FAILED");
  const launched = queued + sent + failed > 0;

  // Poll while the generate queue is working through contacts.
  React.useEffect(() => {
    if (generating === 0) return;
    const timer = setInterval(() => router.refresh(), 2500);
    return () => clearInterval(timer);
  }, [generating, router]);

  const addFromList = async () => {
    if (!listId || busy) return;
    setBusy("add");
    const result = await addContactsToCampaign(campaign.id, { listId });
    setBusy(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const added = result.data!.added;
    toast.success(
      added === 0
        ? "Everyone in that list is already in the campaign."
        : `Added ${added} contact${added === 1 ? "" : "s"}.`,
    );
    setAddOpen(false);
    router.refresh();
  };

  const generate = async () => {
    if (busy) return;
    setBusy("generate");
    const result = await generateDrafts(campaign.id);
    setBusy(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      `Writing drafts for ${result.data!.queued} contact${result.data!.queued === 1 ? "" : "s"} — step 1 is AI-personalized per lead.`,
    );
    router.refresh();
  };

  const launch = async () => {
    if (busy) return;
    setBusy("launch");
    const result = await launchCampaign(campaign.id);
    setBusy(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      `Launched — ${result.data!.queued} email${result.data!.queued === 1 ? "" : "s"} queued. Follow-ups schedule automatically.`,
    );
    router.refresh();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Run</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pipeline state */}
        <ol className="space-y-2 text-sm">
          <li className="flex items-center justify-between">
            <span className="text-text-2">1 · Contacts</span>
            <span className="font-mono text-xs tnum">{total}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-text-2">2 · Drafts ready</span>
            <span className="font-mono text-xs tnum">
              {generating > 0 ? (
                <span className="flex items-center gap-1.5 text-brand-600 dark:text-brand-500">
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                  {ready}/{total}
                </span>
              ) : (
                `${ready}/${total}`
              )}
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-text-2">3 · Delivery</span>
            <span className="font-mono text-xs tnum">
              {launched ? `${opened} opened · ${delivered} delivered` : "—"}
            </span>
          </li>
        </ol>
        {launched && (queued > 0 || failed > 0) && (
          <p className="text-xs text-text-3">
            {queued > 0 && `${queued} queued for later steps. `}
            {failed > 0 && <span className="text-conf-low">{failed} failed (no email).</span>}
          </p>
        )}

        <div className="space-y-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setAddOpen(true)}
          >
            <UserPlus className="size-3.5" aria-hidden />
            Add contacts from a list
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={generate}
            disabled={total === 0 || generating > 0 || busy !== null}
          >
            {busy === "generate" || generating > 0 ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="size-3.5" aria-hidden />
            )}
            {generating > 0 ? "Generating drafts…" : "Generate drafts"}
          </Button>
          <Button
            size="sm"
            className="w-full"
            onClick={launch}
            disabled={drafts === 0 || busy !== null}
          >
            {busy === "launch" ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Rocket className="size-3.5" aria-hidden />
            )}
            Launch {drafts > 0 ? `(${drafts} drafts)` : ""}
          </Button>
          <p className="text-center text-xs text-text-3">
            Sending is simulated in this environment — the full queue, delivery
            events, and stats are real.
          </p>
        </div>
      </CardContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add contacts from a list</DialogTitle>
            <DialogDescription>
              Everyone in the list joins the campaign; duplicates are skipped.
            </DialogDescription>
          </DialogHeader>
          {lists.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-center text-sm text-text-2">
              No people lists yet — save leads from a search first.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>List</Label>
                <Select value={listId} onValueChange={setListId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {lists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name} ({list._count.items})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={addFromList} disabled={busy === "add" || !listId}>
                {busy === "add" && <Loader2 className="size-4 animate-spin" aria-hidden />}
                Add contacts
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
