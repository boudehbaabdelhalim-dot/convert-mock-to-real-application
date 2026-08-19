import { NextRequest } from "next/server";
import { db } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, handleApiError } from "@/lib/response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const { quantity, type, reason } = body;

    if (!quantity || isNaN(parseInt(quantity))) return badRequest("Valid quantity is required");
    if (!type) return badRequest("Movement type is required");

    const qty = parseInt(quantity);

    const [product] = await db.select().from(products).where(eq(products.id, parseInt(id))).limit(1);
    if (!product) return notFound("Product not found");

    const newStock = product.stock + qty;
    if (newStock < 0) return badRequest("Insufficient stock. Available: " + product.stock);

    // Determine new status
    let status: "healthy" | "low_stock" | "critical" | "dead_stock" = "healthy";
    if (newStock === 0) status = "dead_stock";
    else if (newStock <= product.minStock * 0.5) status = "critical";
    else if (newStock <= product.minStock) status = "low_stock";

    const healthScore = status === "healthy" ? Math.min(100, 70 + Math.round((newStock / product.maxStock) * 30))
      : status === "low_stock" ? 50
      : status === "critical" ? 25
      : 5;

    // Transaction: update stock + record movement
    await db.transaction(async (tx) => {
      await tx
        .update(products)
        .set({ stock: newStock, status, healthScore, updatedAt: new Date() })
        .where(eq(products.id, parseInt(id)));

      await tx.insert(stockMovements).values({
        productId: parseInt(id),
        type: type as "purchase" | "sale" | "adjustment" | "waste" | "return",
        quantity: qty,
        reason: reason || null,
        createdBy: session.userId,
      });
    });

    return ok({ stock: newStock, status, healthScore });
  } catch (error) {
    return handleApiError(error);
  }
}
