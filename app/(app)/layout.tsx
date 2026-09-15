import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getNavCounts } from "@/lib/queries";
import { signOutAction } from "@/lib/actions/auth-actions";
import { AppShell } from "@/components/shell/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login"); // middleware backstop

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
