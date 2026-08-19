import { NextRequest } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, handleApiError } from "@/lib/response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const [customer] = await db.select().from(customers).where(eq(customers.id, parseInt(id))).limit(1);
    if (!customer) return notFound("Customer not found");
    return ok(customer);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const { name, email, phone, loyaltyTier, notes } = body;

    if (!name?.trim()) return badRequest("Customer name is required");

    const [existing] = await db.select().from(customers).where(eq(customers.id, parseInt(id))).limit(1);
    if (!existing) return notFound("Customer not found");

    const [updated] = await db
      .update(customers)
      .set({
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        loyaltyTier: loyaltyTier || existing.loyaltyTier,
        notes: notes?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, parseInt(id)))
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
    const [existing] = await db.select().from(customers).where(eq(customers.id, parseInt(id))).limit(1);
    if (!existing) return notFound("Customer not found");
    await db.delete(customers).where(eq(customers.id, parseInt(id)));
    return ok({ message: "Customer deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
