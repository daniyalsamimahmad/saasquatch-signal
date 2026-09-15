import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Profile, password, and preferences." />
      <ComingSoon sprint={5} what="Profile and preference controls" />
    </div>
  );
}
