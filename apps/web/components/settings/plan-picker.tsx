"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { changePlan } from "@/lib/actions/settings-actions";
import type { Plan } from "@/lib/types";

const PLANS: Array<{ id: Plan; label: string; price: string }> = [
  { id: "free", label: "Free", price: "$0" },
  { id: "pro", label: "Pro", price: "$49/mo" },
  { id: "team", label: "Team", price: "$149/mo" },
];

export function PlanPicker({ current }: { current: Plan }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<Plan | null>(null);

  const pick = async (plan: Plan) => {
    if (plan === current || pending) return;
    setPending(plan);
    const result = await changePlan(plan);
    setPending(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Switched to the ${plan[0].toUpperCase()}${plan.slice(1)} plan. Billing is simulated, so nothing was charged.`);
    router.refresh();
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {PLANS.map((plan) => (
        <button
          key={plan.id}
          type="button"
          onClick={() => pick(plan.id)}
          disabled={pending !== null}
          className={cn(
            "rounded-md border px-2 py-2.5 text-center transition-colors",
            plan.id === current
              ? "border-brand-500 bg-brand-50 dark:bg-brand-50/10"
              : "hover:bg-surface-2",
          )}
          aria-pressed={plan.id === current}
        >
          {pending === plan.id ? (
            <Loader2 className="mx-auto size-4 animate-spin" aria-hidden />
          ) : (
            <>
              <span className="block text-sm font-semibold">{plan.label}</span>
              <span className="block font-mono text-xs text-text-2 tnum">
                {plan.price}
              </span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}
