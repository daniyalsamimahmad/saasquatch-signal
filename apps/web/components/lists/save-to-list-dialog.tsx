"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FolderPlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveToList, undoSaveToList } from "@/lib/actions/list-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ListOption = { id: string; name: string; count: number };

export function SaveToListDialog({
  lists,
  companyIds,
  open,
  onOpenChange,
  onSaved,
}: {
  lists: ListOption[];
  companyIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [target, setTarget] = React.useState<string>(lists[0]?.id ?? "new");
  const [newName, setNewName] = React.useState("");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (open) setTarget(lists[0]?.id ?? "new");
  }, [open, lists]);

  const save = async () => {
    setPending(true);
    const isNew = target === "new";
    const result = await saveToList({
      listId: isNew ? undefined : target,
      newListName: isNew ? newName : undefined,
      companyIds,
    });
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    onOpenChange(false);
    setNewName("");
    onSaved?.();

    if (result.added === 0) {
      // Everything selected was already in the list — nothing to undo,
      // so no Undo action (it must never touch pre-existing entries).
      toast(`Already in ${result.listName}. Nothing new to add.`);
      router.refresh();
      return;
    }

    const noun = result.added === 1 ? "company" : "companies";
    toast.success(`${result.added} ${noun} saved to ${result.listName}`, {
      action: {
        label: "Undo",
        onClick: async () => {
          // Only the ids this save actually inserted — never the full
          // selection, which may overlap companies saved long before.
          const undo = await undoSaveToList({
            listId: result.listId,
            companyIds: result.insertedIds,
            deleteListIfEmpty: isNew,
          });
          if (undo.ok) {
            toast(`Removed ${result.added} ${noun} from ${result.listName}`);
            if (
              isNew &&
              window.location.pathname === `/lists/${result.listId}`
            ) {
              // The undone list may no longer exist — don't leave the user on a 404.
              router.push("/lists");
            } else {
              router.refresh();
            }
          } else {
            toast.error(undo.error);
          }
        },
      },
    });
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save {companyIds.length} to a list</DialogTitle>
          <DialogDescription>
            Pick a list, or start a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2" role="radiogroup" aria-label="Destination list">
          {lists.map((list) => (
            <button
              key={list.id}
              type="button"
              role="radio"
              aria-checked={target === list.id}
              onClick={() => setTarget(list.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-sm transition-colors",
                target === list.id
                  ? "border-brand-500 bg-brand-50/40 dark:bg-brand-50/20"
                  : "hover:bg-surface-2",
              )}
            >
              <span className="font-medium">{list.name}</span>
              <span className="font-mono text-xs text-text-3 tnum">
                {list.count} saved
              </span>
            </button>
          ))}

          <button
            type="button"
            role="radio"
            aria-checked={target === "new"}
            onClick={() => setTarget("new")}
            className={cn(
              "flex w-full items-center gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors",
              target === "new"
                ? "border-brand-500 bg-brand-50/40 dark:bg-brand-50/20"
                : "hover:bg-surface-2",
            )}
          >
            <FolderPlus className="size-4 text-brand-600" aria-hidden />
            <span className="font-medium">Create a new list</span>
          </button>

          {target === "new" && (
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="new-list-name">List name</Label>
              <Input
                id="new-list-name"
                placeholder="e.g. Austin SaaS Q4"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={pending || (target === "new" && !newName.trim())}
          >
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
