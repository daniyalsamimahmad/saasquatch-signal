"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import { changePlan } from "@/lib/actions/settings-actions";
import type { Plan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TIERS: Array<{
  id: Plan;
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  highlight?: boolean;
}> = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Everything you need to try the platform.",
    features: [
      "People and company search with filters",
      "3 saved lists",
      "Email and phone validation",
      "CSV export",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    cadence: "per month",
    blurb: "For a founder or SDR running a real pipeline.",
    highlight: true,
    features: [
      "Everything in Free",
      "Unlimited lists and campaigns",
      "AI-personalized email sequences",
      "LinkedIn outreach tasks",
      "Live enrichment credits",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: "$149",
    cadence: "per month",
    blurb: "Shared pipeline for small go-to-market teams.",
    features: [
      "Everything in Pro",
      "5 seats with shared lists",
      "Deep email verification",
      "API access",
    ],
  },
];

const PLAN_LABEL: Record<Plan, string> = {
  free: "Free Plan",
  pro: "Pro Plan",
  team: "Team Plan",
};

export function PlanChip({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState<Plan | null>(null);

  const pick = async (tier: Plan) => {
    setPending(tier);
    const result = await changePlan(tier);
    setPending(null);
    if (result.ok) {
      toast.success(
        tier === "free"
          ? "You're back on the Free plan"
          : `Welcome to the ${PLAN_LABEL[tier]}. No card was charged, billing is simulated here.`,
      );
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5 rounded-full",
            plan !== "free" && "border-brand-500/50 text-brand-600 dark:text-brand-500",
          )}
        >
          <Gem className="size-3.5" aria-hidden />
          {PLAN_LABEL[plan]}
          {plan === "free" && (
            <span className="ml-0.5 font-semibold text-brand-600 dark:text-brand-500">
              Upgrade
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose your plan</DialogTitle>
          <DialogDescription>
            Billing is simulated in this build. Picking a plan switches your
            account instantly and nothing is charged.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          {TIERS.map((tier) => {
            const current = tier.id === plan;
            return (
              <div
                key={tier.id}
                className={cn(
                  "flex flex-col rounded-lg border p-4",
                  tier.highlight && "border-brand-500/60 bg-brand-50/30 dark:bg-brand-50/10",
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="font-display font-semibold">{tier.name}</p>
                  {tier.highlight && (
                    <Badge className="bg-brand-600 text-white dark:bg-brand-500 dark:text-[#06211d]">
                      Popular
                    </Badge>
                  )}
                </div>
                <p className="mt-2">
                  <span className="font-display text-xl font-bold tnum">{tier.price}</span>{" "}
                  <span className="text-xs text-text-3">{tier.cadence}</span>
                </p>
                <p className="mt-1 text-xs text-text-2">{tier.blurb}</p>
                <ul className="mt-3 flex-1 space-y-1.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-1.5 text-xs text-text-2">
                      <Check className="mt-0.5 size-3 shrink-0 text-conf-high" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-4"
                  size="sm"
                  variant={current ? "outline" : tier.highlight ? "default" : "secondary"}
                  disabled={current || pending !== null}
                  onClick={() => pick(tier.id)}
                >
                  {pending === tier.id && (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  )}
                  {current ? "Current plan" : tier.id === "free" ? "Downgrade" : "Upgrade"}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
