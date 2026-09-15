"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { signupAction, type AuthFormState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p className="text-sm text-conf-low" role="alert">
      {messages[0]}
    </p>
  );
}

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    signupAction,
    {},
  );

  return (
    <div>
      <h1 className="text-xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-text-2">
        Or skip the form —{" "}
        <Link
          href="/login"
          className="font-medium text-brand-600 underline-offset-4 hover:underline"
        >
          sign in as demo
        </Link>{" "}
        in one click.
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" autoComplete="name" placeholder="Alex Searcher" required />
          <FieldError messages={state.fieldErrors?.name} />
        </div>
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
            autoComplete="new-password"
            required
            minLength={8}
          />
          <FieldError messages={state.fieldErrors?.password} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
          />
          <FieldError messages={state.fieldErrors?.confirm} />
        </div>
        <div aria-live="polite">
          {state.error && (
            <p className="text-sm text-conf-low" role="alert">
              {state.error}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-2">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-600 underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
