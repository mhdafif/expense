import { WorkspaceRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDemoWorkspaceContext } from "@/lib/api-context";

export async function getMembershipOrNull(workspaceId: string) {
  const { user } = await getDemoWorkspaceContext();
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: user.id } },
    include: { user: true, workspace: true },
  });
  return membership;
}

export function canManageMembers(role: WorkspaceRole) {
  return role === "OWNER";
}

export function canCreateInvites(role: WorkspaceRole) {
  return role === "OWNER";
}

export function canEditWorkspace(role: WorkspaceRole) {
  return role === "OWNER" || role === "EDITOR";
}
