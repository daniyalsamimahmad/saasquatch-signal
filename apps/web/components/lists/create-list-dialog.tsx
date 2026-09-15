"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createList } from "@/lib/actions/list-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CreateListDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState<"people" | "companies">("people");
  const [busy, setBusy] = React.useState(false);

  const create = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    const result = await createList(name.trim(), kind);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setOpen(false);
    setName("");
    router.push(`/lists/${result.data!.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" aria-hidden />
          New list
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New list</DialogTitle>
          <DialogDescription>
            A home for one segment — a persona, a territory, a play.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="list-name">Name</Label>
            <Input
              id="list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  create();
                }
              }}
              placeholder={kind === "people" ? "Q4 fintech CTOs" : "Austin SaaS targets"}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Tabs value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
              <TabsList className="w-full">
                <TabsTrigger value="people" className="flex-1">People</TabsTrigger>
                <TabsTrigger value="companies" className="flex-1">Companies</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <Button className="w-full" onClick={create} disabled={busy || !name.trim()}>
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Create list
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
