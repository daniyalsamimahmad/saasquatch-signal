import type { Metadata } from "next";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import {
  ProfileForm,
  PasswordForm,
  AppearanceForm,
} from "@/components/settings/settings-forms";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  const profile = getUserProfile(session!.user!.id!);

  return (
    <div className="max-w-5xl">
      <PageHeader title="Settings" description="Profile, password, and appearance." />
      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileForm
          initialName={profile?.name ?? ""}
          email={profile?.email ?? ""}
        />
        <PasswordForm />
        <div className="lg:col-span-2">
          <AppearanceForm />
        </div>
      </div>
    </div>
  );
}
