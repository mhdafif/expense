import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDemoWorkspaceContext, isUnauthorizedError } from "@/lib/api-context";

function badRequest(message: string) {
  return NextResponse.json(
    { success: false, error: { code: "VALIDATION_ERROR", message } },
    { status: 400 },
  );
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getDemoWorkspaceContext();
    const body = await req.json();

    const workspaceId = String(body?.workspaceId || "").trim();
    if (!workspaceId) return badRequest("workspaceId is required");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Workspace access denied" } },
        { status: 403 },
      );
    }

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastWorkspaceId: workspaceId },
      });
    } catch {
      // Backward compatibility when DB schema hasn't been synced yet.
    }

    return NextResponse.json({ success: true, data: { workspaceId } });
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
