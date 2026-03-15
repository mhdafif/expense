import { NextRequest, NextResponse } from "next/server";
import { isUnauthorizedError } from "@/lib/api-context";
import { prisma } from "@/lib/prisma";
import { canEditWorkspace, getMembershipOrNull } from "@/lib/workspace-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    const membership = await getMembershipOrNull(workspaceId);

    if (!membership || !canEditWorkspace(membership.role)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Workspace access denied" } },
        { status: 403 },
      );
    }

    const body = await req.json();
    const year = Number(body?.year);
    const month = Number(body?.month);

    if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid year/month" } },
        { status: 400 },
      );
    }

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const expenses = await prisma.expense.findMany({
      where: { workspaceId, expenseDate: { gte: start, lt: end } },
      select: {
        id: true,
        amount: true,
        category: true,
        paymentMethod: true,
        paidByUserId: true,
        expenseDate: true,
        title: true,
      },
    });

    const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const byCategory = Object.entries(
      expenses.reduce<Record<string, number>>((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
        return acc;
      }, {}),
    ).map(([category, amount]) => ({ category, amount }));

    const byPaymentMethod = Object.entries(
      expenses.reduce<Record<string, number>>((acc, e) => {
        acc[e.paymentMethod] = (acc[e.paymentMethod] || 0) + Number(e.amount);
        return acc;
      }, {}),
    ).map(([paymentMethod, amount]) => ({ paymentMethod, amount }));

    const payloadJson = {
      totalAmount,
      count: expenses.length,
      byCategory,
      byPaymentMethod,
    };

    const snapshot = await prisma.reportSnapshot.upsert({
      where: { workspaceId_periodYear_periodMonth: { workspaceId, periodYear: year, periodMonth: month } },
      create: {
        workspaceId,
        periodYear: year,
        periodMonth: month,
        totalAmount,
        payloadJson,
      },
      update: {
        totalAmount,
        payloadJson,
      },
    });

    return NextResponse.json({ success: true, data: snapshot });
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
