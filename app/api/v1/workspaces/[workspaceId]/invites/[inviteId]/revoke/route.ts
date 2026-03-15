import { NextResponse } from "next/server";
import { isUnauthorizedError } from "@/lib/api-context";
import { prisma } from "@/lib/prisma";
import { canCreateInvites, getMembershipOrNull } from "@/lib/workspace-auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string; inviteId: string }> },
) {
  try {
    const { workspaceId, inviteId } = await params;
    const membership = await getMembershipOrNull(workspaceId);

    if (!membership || !canCreateInvites(membership.role)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only owner can revoke invite" } },
        { status: 403 },
      );
    }

    const invite = await prisma.workspaceInvite.findFirst({ where: { id: inviteId, workspaceId } });
    if (!invite) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Invite not found" } },
        { status: 404 },
      );
    }

    const revoked = await prisma.workspaceInvite.update({
      where: { id: inviteId },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ success: true, data: revoked });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 },
      );
    }
    throw error;
  }
}
