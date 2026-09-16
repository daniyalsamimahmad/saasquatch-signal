import type { Metadata } from "next";
import { CheckCircle2, Circle } from "lucide-react";
import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import type { IntegrationsStatus, UserProfile } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileForms } from "@/components/settings/profile-forms";
import { AiBriefForm } from "@/components/settings/ai-brief-form";
import { PlanPicker } from "@/components/settings/plan-picker";

export const metadata: Metadata = { title: "Settings" };

const INTEGRATION_LABEL: Record<string, string> = {
  apollo: "Apollo",
  hunter: "Hunter.io",
  email: "Email delivery",
  ai: "AI writer",
  zerobounce: "ZeroBounce",
};

export default async function SettingsPage() {
  const session = await requireSession();
  const [profile, integrations] = await Promise.all([
    apiFetch<UserProfile>("/auth/me", { token: session.apiToken }),
    apiFetch<IntegrationsStatus>("/integrations/status", { token: session.apiToken }),
  ]);

  return (
    <>
      <PageHeader title="Settings" description="Account, AI defaults, and connected services." />

      <div className="max-w-4xl space-y-4">
        <ProfileForms name={profile.name} email={profile.email} />

        <AiBriefForm brief={profile.aiBrief} />

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Integrations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {Object.entries(integrations).map(([key, integration]) => (
                <div key={key} className="flex items-start gap-2.5">
                  {integration.configured ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-conf-high" aria-hidden />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 text-text-3" aria-hidden />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {INTEGRATION_LABEL[key] ?? key}
                      {integration.mode && (
                        <span className="ml-1.5 rounded-sm bg-surface-2 px-1.5 py-0.5 text-[11px] font-normal text-text-2">
                          {integration.mode}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-text-2">{integration.capability}</p>
                  </div>
                </div>
              ))}
              <p className="border-t pt-2.5 text-xs text-text-3">
                Keys live in the API&apos;s environment and never reach the browser.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {/* Plan */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <PlanPicker current={profile.plan} />
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Appearance</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-sm text-text-2">Light, dark, or follow the system.</p>
                <ThemeToggle />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
