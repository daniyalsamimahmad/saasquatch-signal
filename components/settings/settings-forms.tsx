"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Loader2, Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateProfile, changePassword } from "@/lib/actions/settings-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function ProfileForm({ initialName, email }: { initialName: string; email: string }) {
  const router = useRouter();
  const [name, setName] = React.useState(initialName);
  const [pending, setPending] = React.useState(false);

  return (
    <Card>
      <CardContent>
        <h2 className="text-base font-semibold">Profile</h2>
        <form
          className="mt-4 max-w-sm space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            const result = await updateProfile(name);
            setPending(false);
            if (result.ok) {
              toast.success("Profile updated — shows after your next sign-in");
              router.refresh();
            } else {
              toast.error(result.error);
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={email} disabled aria-readonly />
            <p className="text-xs text-text-3">
              Email is fixed in the prototype — it&apos;s the sign-in identity.
            </p>
          </div>
          <Button type="submit" disabled={pending || name.trim() === initialName}>
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Save profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function PasswordForm() {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [pending, setPending] = React.useState(false);

  return (
    <Card>
      <CardContent>
        <h2 className="text-base font-semibold">Password</h2>
        <form
          className="mt-4 max-w-sm space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (next !== confirm) {
              toast.error("New passwords don't match.");
              return;
            }
            setPending(true);
            const result = await changePassword(current, next);
            setPending(false);
            if (result.ok) {
              toast.success("Password changed");
              setCurrent("");
              setNext("");
              setConfirm("");
            } else {
              toast.error(result.error);
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="pw-current">Current password</Label>
            <Input
              id="pw-current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw-next">New password</Label>
            <Input
              id="pw-next"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw-confirm">Confirm new password</Label>
            <Input
              id="pw-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Change password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function AppearanceForm() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <Card>
      <CardContent>
        <h2 className="text-base font-semibold">Appearance</h2>
        <div
          className="mt-4 flex flex-wrap gap-2"
          role="radiogroup"
          aria-label="Theme"
        >
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = mounted && theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(option.value)}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-brand-500 bg-brand-50/40 dark:bg-brand-50/20"
                    : "hover:bg-surface-2",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-text-3">
          Both themes are first-class — every confidence colour is re-derived
          for dark, not inverted.
        </p>
      </CardContent>
    </Card>
  );
}
