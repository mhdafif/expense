import { NextRequest, NextResponse } from "next/server";
import { isUnauthorizedError } from "@/lib/api-context";
import { prisma } from "@/lib/prisma";
import { getMembershipOrNull } from "@/lib/workspace-auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; shareLinkId: string }> },
) {
  try {
    const { workspaceId, shareLinkId } = await params;
    const membership = await getMembershipOrNull(workspaceId);

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Workspace access denied" } },
        { status: 403 },
      );
    }

    const link = await prisma.shareLink.findFirst({ where: { id: shareLinkId, workspaceId } });
    if (!link) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Share link not found" } },
        { status: 404 },
      );
    }

    const updated = await prisma.shareLink.update({
      where: { id: shareLinkId },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ success: true, data: { id: updated.id, revokedAt: updated.revokedAt } });
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
