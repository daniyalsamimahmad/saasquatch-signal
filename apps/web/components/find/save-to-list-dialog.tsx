"use client";

import * as React from "react";
import { FolderPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveToList } from "@/lib/actions/list-actions";
import type { ListSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const NEW = "__new__";

export function SaveToListDialog({
  open,
  onOpenChange,
  lists,
  kind,
  contactIds,
  companyIds,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lists: ListSummary[];
  kind: "people" | "companies";
  contactIds?: string[];
  companyIds?: string[];
  onSaved?: () => void;
}) {
  const [target, setTarget] = React.useState<string>(lists[0]?.id ?? NEW);
  const [newName, setNewName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const count = (contactIds?.length ?? 0) + (companyIds?.length ?? 0);

  React.useEffect(() => {
    if (open) setTarget(lists[0]?.id ?? NEW);
  }, [open, lists]);

  const save = async () => {
    if (busy) return;
    if (target === NEW && !newName.trim()) {
      toast.error("Give the new list a name.");
      return;
    }
    setBusy(true);
    const result = await saveToList({
      listId: target === NEW ? undefined : target,
      newListName: target === NEW ? newName.trim() : undefined,
      kind,
      contactIds,
      companyIds,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const { added } = result.data!;
    toast.success(
      added === 0
        ? "Already in that list, nothing new to add."
        : `Saved ${added} ${added === 1 ? "lead" : "leads"} to the list.`,
    );
    setNewName("");
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Save {count} {count === 1 ? "lead" : "leads"} to a list
          </DialogTitle>
          <DialogDescription>
            Lists feed campaigns. Save now, launch outreach from the list later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>List</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lists.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    {list.name} ({list._count.items})
                  </SelectItem>
                ))}
                <SelectItem value={NEW}>
                  <span className="flex items-center gap-1.5">
                    <FolderPlus className="size-3.5" aria-hidden />
                    New list…
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {target === NEW && (
            <div className="space-y-1.5">
              <Label htmlFor="new-list-name">Name</Label>
              <Input
                id="new-list-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={kind === "people" ? "Q4 fintech CTOs" : "Austin SaaS targets"}
                autoFocus
              />
            </div>
          )}
          <Button className="w-full" onClick={save} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
