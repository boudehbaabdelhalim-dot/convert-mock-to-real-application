import { NextRequest } from "next/server";
import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, handleApiError } from "@/lib/response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, parseInt(id))).limit(1);
    if (!supplier) return notFound("Supplier not found");
    return ok(supplier);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const { name, category, contactEmail, contactPhone, leadTimeDays, paymentTerms, priceScore, reliabilityScore, deliveryScore, defectRate, status, notes } = body;

    if (!name?.trim()) return badRequest("Supplier name is required");

    const [existing] = await db.select().from(suppliers).where(eq(suppliers.id, parseInt(id))).limit(1);
    if (!existing) return notFound("Supplier not found");

    const [updated] = await db
      .update(suppliers)
      .set({
        name: name.trim(),
        category: category?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
        leadTimeDays: leadTimeDays ? parseInt(leadTimeDays) : existing.leadTimeDays,
        paymentTerms: paymentTerms?.trim() || existing.paymentTerms,
        priceScore: priceScore ? parseInt(priceScore) : existing.priceScore,
        reliabilityScore: reliabilityScore ? parseInt(reliabilityScore) : existing.reliabilityScore,
        deliveryScore: deliveryScore ? parseInt(deliveryScore) : existing.deliveryScore,
        defectRate: defectRate !== undefined ? parseFloat(defectRate).toFixed(2) : existing.defectRate,
        status: status || existing.status,
        notes: notes?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, parseInt(id)))
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
    const [existing] = await db.select().from(suppliers).where(eq(suppliers.id, parseInt(id))).limit(1);
    if (!existing) return notFound("Supplier not found");
    await db.delete(suppliers).where(eq(suppliers.id, parseInt(id)));
    return ok({ message: "Supplier deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
