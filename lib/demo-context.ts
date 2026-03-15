import { prisma } from "@/lib/prisma";
import { getRequiredAuthSession } from "@/lib/auth-session";

export async function ensureDemoContext() {
  const session = await getRequiredAuthSession();

  let user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || "User",
        image: session.user.image || null,
        emailVerified: true,
      },
    });
  }

  let currentUser = user;

  let memberships = await prisma.workspaceMember.findMany({
    where: { userId: currentUser.id },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  });

  if (memberships.length === 0) {
    const workspace = await prisma.workspace.create({
      data: {
        name: "Personal Expense",
        type: "PERSONAL",
      },
    });

    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: currentUser.id,
        role: "OWNER",
      },
      include: { workspace: true },
    });

    memberships = [member];
  }

  const activeMembership = memberships.find((m) => m.workspaceId === currentUser.lastWorkspaceId) || memberships[0];

  if (currentUser.lastWorkspaceId !== activeMembership.workspaceId) {
    try {
      currentUser = await prisma.user.update({
        where: { id: currentUser.id },
        data: { lastWorkspaceId: activeMembership.workspaceId },
      });
    } catch {
      // Ignore schema drift in local runtime.
    }
  }

  return {
    user: currentUser,
    workspace: activeMembership.workspace,
    memberships,
  };
}
