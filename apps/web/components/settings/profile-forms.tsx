"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateProfile, changePassword } from "@/lib/actions/settings-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForms({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [draftName, setDraftName] = React.useState(name);
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [busy, setBusy] = React.useState<"profile" | "password" | null>(null);

  const saveProfile = async () => {
    if (busy || draftName.trim().length < 2) return;
    setBusy("profile");
    const result = await updateProfile(draftName.trim());
    setBusy(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Profile updated.");
    router.refresh();
  };

  const savePassword = async () => {
    if (busy) return;
    if (next.length < 8) {
      toast.error("New password needs at least 8 characters.");
      return;
    }
    setBusy("password");
    const result = await changePassword(current, next);
    setBusy(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Password changed.");
    setCurrent("");
    setNext("");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={email} disabled />
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={saveProfile}
              disabled={busy !== null || draftName.trim() === name}
            >
              {busy === "profile" && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="password-current">Current password</Label>
            <Input
              id="password-current"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password-next">New password</Label>
            <Input
              id="password-next"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={savePassword}
              disabled={busy !== null || !current || !next}
            >
              {busy === "password" && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
              Change password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
