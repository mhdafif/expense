import { NextRequest, NextResponse } from "next/server";
import { WorkspaceRole } from "@prisma/client";
import { isUnauthorizedError } from "@/lib/api-context";
import { prisma } from "@/lib/prisma";
import { canManageMembers, getMembershipOrNull } from "@/lib/workspace-auth";

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

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: members.map((m) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
        user: {
          id: m.user.id,
          email: m.user.email,
          name: m.user.name,
        },
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    const membership = await getMembershipOrNull(workspaceId);

    if (!membership || !canManageMembers(membership.role)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only owner can invite members" } },
        { status: 403 },
      );
    }

    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const role = String(body?.role || "EDITOR") as WorkspaceRole;

    if (!email) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "email is required" } },
        { status: 400 },
      );
    }

    if (!Object.values(WorkspaceRole).includes(role) || role === "OWNER") {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid role" } },
        { status: 400 },
      );
    }

    const user =
      (await prisma.user.findUnique({ where: { email } })) ||
      (await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          emailVerified: false,
        },
      }));

    const member = await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
      create: {
        workspaceId,
        userId: user.id,
        role,
      },
      update: { role },
      include: { user: true },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: member.id,
          role: member.role,
          user: { id: member.user.id, email: member.user.email, name: member.user.name },
        },
      },
      { status: 201 },
    );
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
