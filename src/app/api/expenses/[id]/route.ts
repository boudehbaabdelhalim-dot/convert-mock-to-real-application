import { NextRequest } from "next/server";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, notFound, handleApiError } from "@/lib/response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const [existing] = await db.select().from(expenses).where(eq(expenses.id, parseInt(id))).limit(1);
    if (!existing) return notFound("Expense not found");

    const [updated] = await db
      .update(expenses)
      .set({
        ...body,
        paidAt: body.isPaid ? new Date() : null,
      })
      .where(eq(expenses.id, parseInt(id)))
      .returning();

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const [existing] = await db.select().from(expenses).where(eq(expenses.id, parseInt(id))).limit(1);
    if (!existing) return notFound("Expense not found");
    await db.delete(expenses).where(eq(expenses.id, parseInt(id)));
    return ok({ message: "Expense deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
