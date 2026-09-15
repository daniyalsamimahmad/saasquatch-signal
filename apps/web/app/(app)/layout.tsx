import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { apiFetch, ApiError } from "@/lib/api";
import type { DashboardStats, NotificationItem, UserProfile } from "@/lib/types";
import { signOutAction } from "@/lib/actions/auth-actions";
import { AppShell } from "@/components/shell/app-shell";

const STATUS_TITLE: Record<string, string> = {
  OPENED: "Email opened",
  DELIVERED: "Email delivered",
  SENT: "Email sent",
  FAILED: "Send failed",
  COPIED: "LinkedIn message copied",
  QUEUED: "Email queued",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  // Profile comes from the API, not the JWT, so renames and plan changes
  // show instantly. A 401 means the token outlived a database reseed:
  // sign out cleanly (cookie clearing must happen in a route handler).
  let profile: UserProfile;
  let stats: DashboardStats;
  try {
    [profile, stats] = await Promise.all([
      apiFetch<UserProfile>("/auth/me", { token: session.apiToken }),
      apiFetch<DashboardStats>("/dashboard/stats", { token: session.apiToken }),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect("/api/auth/stale");
    }
    throw err;
  }

  const notifications: NotificationItem[] = stats.recentMessages
    .slice(0, 10)
    .map((message) => ({
      id: message.id,
      title: STATUS_TITLE[message.status] ?? `Message ${message.status.toLowerCase()}`,
      detail: `${message.contact.firstName} ${message.contact.lastName}${
        message.contact.company ? ` · ${message.contact.company.name}` : ""
      }`,
      href: "/campaigns",
      createdAt: message.sentAt ?? message.createdAt,
    }));

  return (
    <AppShell
      user={{ name: profile.name, email: profile.email }}
      counts={{
        lists: stats.pipeline.lists,
        campaigns: stats.pipeline.campaigns,
      }}
      plan={profile.plan}
      notifications={notifications}
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}
