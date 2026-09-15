import type { Metadata } from "next";
import { auth } from "@/auth";
import { PageHeader } from "@/components/page-header";
import {
  ProfileForm,
  PasswordForm,
  AppearanceForm,
} from "@/components/settings/settings-forms";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" description="Profile, password, and appearance." />
      <div className="space-y-4">
        <ProfileForm
          initialName={session?.user?.name ?? ""}
          email={session?.user?.email ?? ""}
        />
        <PasswordForm />
        <AppearanceForm />
      </div>
    </div>
  );
}
