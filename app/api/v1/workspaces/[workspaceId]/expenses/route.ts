import { NextRequest, NextResponse } from "next/server";
import { PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDemoWorkspaceContext, isUnauthorizedError } from "@/lib/api-context";

function badRequest(message: string) {
  return NextResponse.json(
    { success: false, error: { code: "VALIDATION_ERROR", message } },
    { status: 400 },
  );
}

function parseExpenseDate(input: string) {
  const raw = String(input || "").trim();
  if (!raw) return null;

  // expected from datetime-local
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // fallback for locale-like values e.g. 03/14/2026, 10:39 PM
  const fallback = new Date(raw);
  if (!Number.isNaN(fallback.getTime())) return fallback;

  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    const { workspace } = await getDemoWorkspaceContext();

    if (workspaceId !== workspace.id) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Workspace access denied" } },
        { status: 403 },
      );
    }

    const { searchParams } = req.nextUrl;
    const year = Number(searchParams.get("year") || new Date().getUTCFullYear());
    const month = Number(searchParams.get("month") || new Date().getUTCMonth() + 1);
    const category = searchParams.get("category") || undefined;
    const paymentMethod = searchParams.get("paymentMethod") as PaymentMethod | null;
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));

    if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
      return badRequest("Invalid year/month filter");
    }

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const where = {
      workspaceId,
      expenseDate: { gte: start, lt: end },
      ...(category ? { category } : {}),
      ...(paymentMethod ? { paymentMethod } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        // Sort feed by creation time so latest inserted data appears first.
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { items, page, limit, total },
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
    const { workspace, user } = await getDemoWorkspaceContext();

    if (workspaceId !== workspace.id) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Workspace access denied" } },
        { status: 403 },
      );
    }

    const body = await req.json();
    const amount = Number(body?.amount ?? 0);
    const title = String(body?.title ?? "").trim();
    const category = String(body?.category ?? "Other");
    const paymentMethod = String(body?.paymentMethod ?? "CASH") as PaymentMethod;
    const expenseDateRaw = String(body?.expenseDate ?? "");
    const note = body?.note ? String(body.note) : null;

    if (!title) return badRequest("title is required");
    if (!amount || Number.isNaN(amount) || amount <= 0) return badRequest("amount must be > 0");
    if (!expenseDateRaw) return badRequest("expenseDate is required");
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      return badRequest("Invalid paymentMethod");
    }

    const parsedDate = parseExpenseDate(expenseDateRaw);
    if (!parsedDate) return badRequest("Invalid expenseDate");

    const expense = await prisma.expense.create({
      data: {
        workspaceId,
        paidByUserId: user.id,
        amount,
        title,
        category,
        paymentMethod,
        expenseDate: parsedDate,
        note,
        source: "MANUAL",
      },
    });

    return NextResponse.json({ success: true, data: expense }, { status: 201 });
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
