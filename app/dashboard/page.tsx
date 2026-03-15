import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureDemoContext } from "@/lib/demo-context";
import { getAuthSession } from "@/lib/auth-session";
import DashboardClient from "./dashboard-client";
import LogoutButton from "./logout-button";

export default async function DashboardPage() {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  const { workspace, memberships } = await ensureDemoContext();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:py-8 space-y-5">
      <header className="rounded-[28px] border border-white/70 bg-gradient-to-r from-indigo-600 to-fuchsia-600 p-5 text-white shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-indigo-100">Dashboard</p>
            <h1 className="text-2xl font-extrabold">Expense Tracker</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold">
              Back to Landing
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <DashboardClient
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        memberships={memberships.map((m) => ({
          workspaceId: m.workspaceId,
          role: m.role,
          workspaceName: m.workspace.name,
        }))}
      />
    </main>
  );
}
