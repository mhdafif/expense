import { NextRequest, NextResponse } from "next/server";
import { WorkspaceRole } from "@prisma/client";
import { isUnauthorizedError } from "@/lib/api-context";
import { prisma } from "@/lib/prisma";
import { canManageMembers, getMembershipOrNull } from "@/lib/workspace-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> },
) {
  try {
    const { workspaceId, memberId } = await params;
    const membership = await getMembershipOrNull(workspaceId);

    if (!membership || !canManageMembers(membership.role)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only owner can update member role" } },
        { status: 403 },
      );
    }

    const body = await req.json();
    const role = String(body?.role || "") as WorkspaceRole;

    if (!Object.values(WorkspaceRole).includes(role) || role === "OWNER") {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid role" } },
        { status: 400 },
      );
    }

    const target = await prisma.workspaceMember.findFirst({ where: { id: memberId, workspaceId } });
    if (!target) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Member not found" } },
        { status: 404 },
      );
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        role: updated.role,
        user: { id: updated.user.id, email: updated.user.email, name: updated.user.name },
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> },
) {
  try {
    const { workspaceId, memberId } = await params;
    const membership = await getMembershipOrNull(workspaceId);

    if (!membership || !canManageMembers(membership.role)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only owner can remove member" } },
        { status: 403 },
      );
    }

    const target = await prisma.workspaceMember.findFirst({ where: { id: memberId, workspaceId } });
    if (!target) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Member not found" } },
        { status: 404 },
      );
    }

    if (target.role === "OWNER") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Cannot remove owner" } },
        { status: 403 },
      );
    }

    await prisma.workspaceMember.delete({ where: { id: memberId } });
    return NextResponse.json({ success: true, data: { id: memberId } });
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
