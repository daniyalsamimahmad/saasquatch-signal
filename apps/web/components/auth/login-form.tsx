"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Loader2, Play } from "lucide-react";
import {
  loginAction,
  demoLoginAction,
  type AuthFormState,
} from "@/lib/actions/auth-actions";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p className="text-sm text-conf-low" role="alert">
      {messages[0]}
    </p>
  );
}

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    loginAction,
    {},
  );
  const [demoState, demoAction, demoPending] = useActionState<
    AuthFormState,
    FormData
  >(async () => demoLoginAction(), {});

  return (
    <div>
      <h1 className="text-xl font-bold">Sign in</h1>
      <p className="mt-1 text-sm text-text-2">
        New here? The demo account gets you in with one click.
      </p>

      {/* The single most important element on this screen: zero-friction entry */}
      <form action={demoAction} className="mt-6">
        <div className="rounded-lg border border-brand-500/40 bg-brand-50/50 p-4 dark:bg-brand-50/20">
          <Button type="submit" className="w-full" size="lg" disabled={demoPending}>
            {demoPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Play className="size-4" aria-hidden />
            )}
            Sign in as demo
          </Button>
          <p className="mt-3 text-center font-mono text-xs text-text-2 tnum">
            {DEMO_EMAIL} · {DEMO_PASSWORD}
          </p>
        </div>
        <div aria-live="polite">
          {demoState.error && (
            <p className="mt-2 text-sm text-conf-low" role="alert">
              {demoState.error}
            </p>
          )}
        </div>
      </form>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="label-caps">or with email</span>
        <Separator className="flex-1" />
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
          />
          <FieldError messages={state.fieldErrors?.email} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <FieldError messages={state.fieldErrors?.password} />
        </div>
        <div aria-live="polite">
          {state.error && (
            <p className="text-sm text-conf-low" role="alert">
              {state.error}
            </p>
          )}
        </div>
        <Button
          type="submit"
          variant="secondary"
          className="w-full"
          disabled={pending}
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-2">
        No account?{" "}
        <Link
          href="/signup"
          className="font-medium text-brand-600 underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
