import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const link = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      reportSnapshot: true,
      workspace: { select: { id: true, name: true, currency: true, timezone: true } },
    },
  });

  if (!link || link.revokedAt) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Share link not found" } },
      { status: 404 },
    );
  }

  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Share link expired" } },
      { status: 403 },
    );
  }

  if (!link.reportSnapshot) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Report snapshot not found" } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      workspace: link.workspace,
      period: {
        year: link.reportSnapshot.periodYear,
        month: link.reportSnapshot.periodMonth,
      },
      totalAmount: Number(link.reportSnapshot.totalAmount),
      payload: link.reportSnapshot.payloadJson,
      sharedAt: link.createdAt,
    },
  });
}
