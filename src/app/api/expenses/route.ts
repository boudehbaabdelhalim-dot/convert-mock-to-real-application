import { NextRequest } from "next/server";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, created, badRequest, handleApiError } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()));

    const items = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.month, month), eq(expenses.year, year)))
      .orderBy(expenses.dueDay);

    const total = items.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const paid = items.filter(e => e.isPaid).reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return ok({ items, total, paid, remaining: total - paid, month, year });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const { name, amount, category, type, dueDay, month, year, notes } = body;

    if (!name?.trim()) return badRequest("Expense name is required");
    if (!amount || isNaN(parseFloat(amount))) return badRequest("Valid amount is required");

    const now = new Date();
    const [expense] = await db
      .insert(expenses)
      .values({
        name: name.trim(),
        amount: parseFloat(amount).toFixed(2),
        category: category?.trim() || "Other",
        type: type || "fixed",
        dueDay: dueDay ? parseInt(dueDay) : null,
        month: month ? parseInt(month) : now.getMonth() + 1,
        year: year ? parseInt(year) : now.getFullYear(),
        notes: notes?.trim() || null,
      })
      .returning();

    return created(expense);
  } catch (error) {
    return handleApiError(error);
  }
}
