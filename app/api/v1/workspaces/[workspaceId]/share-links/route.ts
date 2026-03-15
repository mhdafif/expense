import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { ShareResourceType } from "@prisma/client";
import { isUnauthorizedError } from "@/lib/api-context";
import { prisma } from "@/lib/prisma";
import { getMembershipOrNull } from "@/lib/workspace-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    const membership = await getMembershipOrNull(workspaceId);

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Workspace access denied" } },
        { status: 403 },
      );
    }

    const body = await req.json();
    const resourceType = String(body?.resourceType || "MONTHLY_REPORT") as ShareResourceType;
    const reportSnapshotId = body?.reportSnapshotId ? String(body.reportSnapshotId) : null;
    const expiresAt = body?.expiresAt ? new Date(String(body.expiresAt)) : null;

    if (!Object.values(ShareResourceType).includes(resourceType)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid resourceType" } },
        { status: 400 },
      );
    }

    if (resourceType === "MONTHLY_REPORT" && !reportSnapshotId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "reportSnapshotId is required" } },
        { status: 400 },
      );
    }

    const token = randomBytes(18).toString("base64url");

    const link = await prisma.shareLink.create({
      data: {
        workspaceId,
        reportSnapshotId,
        createdById: membership.userId,
        resourceType,
        token,
        expiresAt,
      },
    });

    const baseUrl = process.env.PUBLIC_SHARE_BASE_URL || req.nextUrl.origin;
    return NextResponse.json({
      success: true,
      data: {
        id: link.id,
        token: link.token,
        url: `${baseUrl}/api/v1/public/share/${link.token}`,
        expiresAt: link.expiresAt,
      },
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
