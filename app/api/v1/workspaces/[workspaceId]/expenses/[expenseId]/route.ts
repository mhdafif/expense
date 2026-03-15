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

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }

  const fallback = new Date(raw);
  if (!Number.isNaN(fallback.getTime())) return fallback;

  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; expenseId: string }> },
) {
  try {
    const { workspaceId, expenseId } = await params;
    const { workspace } = await getDemoWorkspaceContext();

    if (workspaceId !== workspace.id) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Workspace access denied" } },
        { status: 403 },
      );
    }

    const exists = await prisma.expense.findFirst({ where: { id: expenseId, workspaceId } });
    if (!exists) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Expense not found" } },
        { status: 404 },
      );
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) return badRequest("title cannot be empty");
      data.title = title;
    }

    if (body.amount !== undefined) {
      const amount = Number(body.amount);
      if (Number.isNaN(amount) || amount <= 0) return badRequest("amount must be > 0");
      data.amount = amount;
    }

    if (body.category !== undefined) data.category = String(body.category || "Other");

    if (body.paymentMethod !== undefined) {
      const paymentMethod = String(body.paymentMethod) as PaymentMethod;
      if (!Object.values(PaymentMethod).includes(paymentMethod)) {
        return badRequest("Invalid paymentMethod");
      }
      data.paymentMethod = paymentMethod;
    }

    if (body.expenseDate !== undefined) {
      const parsedDate = parseExpenseDate(String(body.expenseDate));
      if (!parsedDate) return badRequest("Invalid expenseDate");
      data.expenseDate = parsedDate;
    }

    if (body.note !== undefined) data.note = body.note ? String(body.note) : null;

    const updated = await prisma.expense.update({ where: { id: expenseId }, data });
    return NextResponse.json({ success: true, data: updated });
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
  { params }: { params: Promise<{ workspaceId: string; expenseId: string }> },
) {
  try {
    const { workspaceId, expenseId } = await params;
    const { workspace } = await getDemoWorkspaceContext();

    if (workspaceId !== workspace.id) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Workspace access denied" } },
        { status: 403 },
      );
    }

    const exists = await prisma.expense.findFirst({ where: { id: expenseId, workspaceId } });
    if (!exists) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Expense not found" } },
        { status: 404 },
      );
    }

    await prisma.expense.delete({ where: { id: expenseId } });
    return NextResponse.json({ success: true, data: { id: expenseId } });
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
