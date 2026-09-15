import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { getNavCounts, userExists } from "@/lib/queries";
import { signOutAction } from "@/lib/actions/auth-actions";
import { AppShell } from "@/components/shell/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login"); // middleware backstop

  // The hosted demo's database resets per instance while 30-day JWT cookies
  // outlive it: a session can reference a user that no longer exists. Sign
  // those sessions out cleanly instead of letting writes fail downstream.
  if (!userExists(session.user.id)) {
    await signOut({ redirectTo: "/login" });
  }

  const counts = getNavCounts(session.user.id);

  return (
    <AppShell
      user={{
        name: session.user.name ?? "User",
        email: session.user.email ?? "",
      }}
      counts={counts}
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}
