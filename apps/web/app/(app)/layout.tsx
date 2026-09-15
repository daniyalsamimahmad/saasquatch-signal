import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getNavCounts,
  getUserProfile,
  getNotifications,
} from "@/lib/queries";
import { signOutAction } from "@/lib/actions/auth-actions";
import { AppShell } from "@/components/shell/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login"); // middleware backstop

  // Profile comes from the database, not the JWT, so renames show instantly.
  // A missing profile means the session outlived a database reset: sign it
  // out cleanly (cookie clearing must happen in a route handler, not here).
  const profile = getUserProfile(session.user.id);
  if (!profile) {
    redirect("/api/auth/stale");
  }

  const counts = getNavCounts(session.user.id);
  const notifications = getNotifications(session.user.id);

  return (
    <AppShell
      user={{ name: profile.name, email: profile.email }}
      counts={counts}
      plan={profile.plan}
      notifications={notifications}
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}
