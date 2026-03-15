import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDemoWorkspaceContext, isUnauthorizedError } from "@/lib/api-context";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const { user } = await getDemoWorkspaceContext();

    const invite = await prisma.workspaceInvite.findUnique({ where: { token } });

    if (!invite || invite.revokedAt) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Invite not found" } },
        { status: 404 },
      );
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Invite expired" } },
        { status: 403 },
      );
    }

    const existingMembership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id } },
    });

    const membership = existingMembership
      ? existingMembership
      : await prisma.workspaceMember.create({
          data: {
            workspaceId: invite.workspaceId,
            userId: user.id,
            role: invite.role,
          },
        });

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastWorkspaceId: invite.workspaceId },
      });
    } catch {
      // Backward compatibility when DB schema hasn't been synced yet.
    }

    return NextResponse.json({ success: true, data: membership });
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
