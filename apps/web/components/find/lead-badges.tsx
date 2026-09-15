import { BadgeCheck, HelpCircle, MailX, Flame, TrendingUp, Newspaper, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmailStatus, Signal } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Verified-email badge (Apollo/Hunter pattern): the status is the product —
 * a guessed address and a verified one are different assets.
 */
export function EmailStatusBadge({ status, email }: { status: EmailStatus; email: string | null }) {
  if (status === "VERIFIED") {
    return (
      <span className="flex items-center gap-1.5 text-sm">
        <BadgeCheck className="size-3.5 shrink-0 text-conf-high" aria-label="Verified email" />
        <span className="truncate">{email}</span>
      </span>
    );
  }
  if (status === "GUESSED") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-text-2">
        <HelpCircle className="size-3.5 shrink-0 text-conf-mid" aria-label="Guessed email" />
        <span className="truncate">{email}</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-sm text-text-3">
      <MailX className="size-3.5 shrink-0" aria-hidden />
      No email
    </span>
  );
}

const SIGNAL_ICON = {
  hiring: Flame,
  funding: TrendingUp,
  news: Newspaper,
  tech: Wrench,
} as const;

/**
 * Buying-signal chip (ZoomInfo pattern): the concrete fact the AI writer
 * cites in the opening line. Hover shows the full text.
 */
export function SignalChip({ signal, className }: { signal: Signal | null; className?: string }) {
  if (!signal) return null;
  const Icon = SIGNAL_ICON[signal.kind] ?? Newspaper;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex max-w-40 items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700 dark:bg-brand-50/10 dark:text-brand-500",
            className,
          )}
        >
          <Icon className="size-3 shrink-0" aria-hidden />
          <span className="truncate capitalize">{signal.kind}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-72">
        {signal.text}
      </TooltipContent>
    </Tooltip>
  );
}
