import { NextRequest } from "next/server";
import { db } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, handleApiError } from "@/lib/response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const [product] = await db.select().from(products).where(eq(products.id, parseInt(id))).limit(1);
    if (!product) return notFound("Product not found");
    return ok(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const { name, sku, barcode, brand, categoryId, supplierId, price, cost, minStock, maxStock, unit, image } = body;

    if (!name?.trim()) return badRequest("Product name is required");

    const [existing] = await db.select().from(products).where(eq(products.id, parseInt(id))).limit(1);
    if (!existing) return notFound("Product not found");

    const minStockNum = parseInt(minStock) || existing.minStock;
    const maxStockNum = parseInt(maxStock) || existing.maxStock;
    const currentStock = existing.stock;

    let status: "healthy" | "low_stock" | "critical" | "dead_stock" = "healthy";
    if (currentStock === 0) status = "dead_stock";
    else if (currentStock <= minStockNum * 0.5) status = "critical";
    else if (currentStock <= minStockNum) status = "low_stock";

    const [updated] = await db
      .update(products)
      .set({
        name: name.trim(),
        barcode: barcode?.trim() || null,
        brand: brand?.trim() || null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        supplierId: supplierId ? parseInt(supplierId) : null,
        price: price ? parseFloat(price).toFixed(2) : existing.price,
        cost: cost ? parseFloat(cost).toFixed(2) : existing.cost,
        minStock: minStockNum,
        maxStock: maxStockNum,
        unit: unit?.trim() || existing.unit,
        image: image || existing.image,
        status,
        updatedAt: new Date(),
      })
      .where(eq(products.id, parseInt(id)))
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
    const [existing] = await db.select().from(products).where(eq(products.id, parseInt(id))).limit(1);
    if (!existing) return notFound("Product not found");

    // Soft delete
    await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(eq(products.id, parseInt(id)));
    return ok({ message: "Product deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
