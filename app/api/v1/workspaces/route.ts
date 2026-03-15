import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDemoWorkspaceContext, isUnauthorizedError } from "@/lib/api-context";

export async function GET() {
  try {
    const { user } = await getDemoWorkspaceContext();

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: { workspace: true },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: memberships.map((m) => ({
        workspaceId: m.workspaceId,
        role: m.role,
        workspace: m.workspace,
        isActive: user.lastWorkspaceId === m.workspaceId,
      })),
    });
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
