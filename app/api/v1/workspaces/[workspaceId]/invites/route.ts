import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { WorkspaceRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isUnauthorizedError } from "@/lib/api-context";
import { canCreateInvites, getMembershipOrNull } from "@/lib/workspace-auth";

function badRequest(message: string) {
  return NextResponse.json(
    { success: false, error: { code: "VALIDATION_ERROR", message } },
    { status: 400 },
  );
}

function getPublicBaseUrl(req: NextRequest) {
  // Prefer incoming host/proto so generated invite URL matches the URL user is currently accessing.
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  if (host) return `${proto}://${host}`;

  const explicit = process.env.PUBLIC_SHARE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit;

  return req.nextUrl.origin;
}

export async function GET(
  _req: NextRequest,
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

    const invites = await prisma.workspaceInvite.findMany({
      where: { workspaceId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    const baseUrl = getPublicBaseUrl(_req);
    return NextResponse.json({
      success: true,
      data: invites.map((invite) => ({
        ...invite,
        url: baseUrl ? `${baseUrl}/join/${invite.token}` : `/join/${invite.token}`,
      })),
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 },
      );
    }
    const message = error instanceof Error ? error.message : "Failed to load invites";
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message } },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    const membership = await getMembershipOrNull(workspaceId);

    if (!membership || !canCreateInvites(membership.role)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only owner can create invite" } },
        { status: 403 },
      );
    }

    const body = await req.json();
    const role = String(body?.role || "EDITOR") as WorkspaceRole;
    const expiresAt = body?.expiresAt ? new Date(String(body.expiresAt)) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (!Object.values(WorkspaceRole).includes(role)) return badRequest("Invalid role");
    if (role === "OWNER") return badRequest("Invite role OWNER is not allowed");
    if (Number.isNaN(expiresAt.getTime())) return badRequest("Invalid expiresAt");

    const token = randomBytes(24).toString("base64url");

    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId,
        createdById: membership.userId,
        role,
        token,
        expiresAt,
      },
    });

    const baseUrl = getPublicBaseUrl(req);

    return NextResponse.json({
      success: true,
      data: {
        ...invite,
        url: `${baseUrl}/join/${invite.token}`,
      },
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 },
      );
    }
    const message = error instanceof Error ? error.message : "Failed to create invite";
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message } },
      { status: 500 },
    );
  }
}
