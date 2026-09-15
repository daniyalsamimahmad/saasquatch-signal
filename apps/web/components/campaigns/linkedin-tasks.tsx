"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, ExternalLink } from "lucide-react";
import { LinkedinIcon } from "@/components/icons/linkedin";
import { toast } from "sonner";
import type { Message } from "@/lib/types";
import { markLinkedInCopied } from "@/lib/actions/campaign-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Compliant LinkedIn flow: the AI drafts the message, you send it yourself.
 * Copy puts it on the clipboard and opens the profile — no automation
 * touches LinkedIn (their ToS bans bots; accounts get banned for it).
 */
export function LinkedInTasks({
  campaignId,
  tasks,
}: {
  campaignId: string;
  tasks: Message[];
}) {
  const router = useRouter();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copy = async (task: Message) => {
    try {
      await navigator.clipboard.writeText(task.body);
    } catch {
      toast.error("Couldn't reach the clipboard — copy the text manually.");
      return;
    }
    setCopiedId(task.id);
    const profile =
      task.contact.linkedinUrl ??
      `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
        `${task.contact.firstName} ${task.contact.lastName}`,
      )}`;
    window.open(profile, "_blank", "noopener");
    if (task.status !== "COPIED") {
      await markLinkedInCopied(campaignId, task.id);
      router.refresh();
    }
  };

  const pending = tasks.filter((t) => t.status !== "COPIED");
  const done = tasks.filter((t) => t.status === "COPIED");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <LinkedinIcon className="size-4 text-[#0a66c2]" />
          LinkedIn tasks
          <span className="ml-auto font-mono text-xs font-normal text-text-3 tnum">
            {done.length}/{tasks.length} done
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-text-3">
          Copy opens the profile with the message on your clipboard — you paste
          and send it yourself, which keeps your account inside LinkedIn&apos;s
          terms.
        </p>
        {[...pending, ...done].map((task) => (
          <div
            key={task.id}
            className={`rounded-md border p-3 ${task.status === "COPIED" ? "opacity-60" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-medium">
                {task.contact.firstName} {task.contact.lastName}
                <span className="font-normal text-text-3">
                  {task.contact.company ? ` · ${task.contact.company.name}` : ""}
                </span>
              </p>
              <Button
                size="sm"
                variant={task.status === "COPIED" ? "ghost" : "outline"}
                className="h-7 shrink-0 gap-1.5 px-2 text-xs"
                onClick={() => copy(task)}
              >
                {copiedId === task.id || task.status === "COPIED" ? (
                  <Check className="size-3" aria-hidden />
                ) : (
                  <Copy className="size-3" aria-hidden />
                )}
                {task.status === "COPIED" ? "Copied" : "Copy & open"}
                <ExternalLink className="size-3" aria-hidden />
              </Button>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed whitespace-pre-wrap text-text-2">
              {task.body}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
