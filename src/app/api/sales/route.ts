import { NextRequest } from "next/server";
import { db } from "@/db";
import { sales, saleItems, products, customers, stockMovements } from "@/db/schema";
import { eq, sql, desc, and, gte } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, created, badRequest, handleApiError } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));
    const offset = (page - 1) * limit;

    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(sales);
    const total = Number(countResult.count);

    const items = await db
      .select({
        id: sales.id,
        customerId: sales.customerId,
        userId: sales.userId,
        subtotal: sales.subtotal,
        discount: sales.discount,
        total: sales.total,
        paymentMethod: sales.paymentMethod,
        notes: sales.notes,
        createdAt: sales.createdAt,
        customerName: customers.name,
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .orderBy(desc(sales.createdAt))
      .limit(limit)
      .offset(offset);

    return ok({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { customerId, items, paymentMethod, discount, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return badRequest("At least one item is required");
    }

    // Validate all items
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return badRequest("Each item must have a valid productId and quantity");
      }
    }

    let saleId: number | null = null;

    await db.transaction(async (tx) => {
      let subtotal = 0;

      // Verify stock and prices
      const productData = await Promise.all(
        items.map(async (item: { productId: number; quantity: number }) => {
          const [product] = await tx
            .select()
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);

          if (!product) throw new Error(`Product ${item.productId} not found`);
          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
          }
          return { product, quantity: item.quantity };
        })
      );

      // Calculate subtotal
      productData.forEach(({ product, quantity }) => {
        subtotal += parseFloat(product.price) * quantity;
      });

      const discountAmount = parseFloat(discount) || 0;
      const total = Math.max(0, subtotal - discountAmount);

      // Create sale
      const [sale] = await tx
        .insert(sales)
        .values({
          customerId: customerId ? parseInt(customerId) : null,
          userId: session.userId,
          subtotal: subtotal.toFixed(2),
          discount: discountAmount.toFixed(2),
          total: total.toFixed(2),
          paymentMethod: paymentMethod || "cash",
          notes: notes?.trim() || null,
        })
        .returning();

      saleId = sale.id;

      // Create sale items + update stock
      for (const { product, quantity } of productData) {
        await tx.insert(saleItems).values({
          saleId: sale.id,
          productId: product.id,
          quantity,
          unitPrice: product.price,
          unitCost: product.cost,
          total: (parseFloat(product.price) * quantity).toFixed(2),
        });

        const newStock = product.stock - quantity;
        let status: "healthy" | "low_stock" | "critical" | "dead_stock" = "healthy";
        if (newStock === 0) status = "dead_stock";
        else if (newStock <= product.minStock * 0.5) status = "critical";
        else if (newStock <= product.minStock) status = "low_stock";

        await tx.update(products).set({ stock: newStock, status, updatedAt: new Date() }).where(eq(products.id, product.id));

        await tx.insert(stockMovements).values({
          productId: product.id,
          type: "sale",
          quantity: -quantity,
          reason: `Sale #${sale.id}`,
          referenceId: sale.id,
          createdBy: session.userId,
        });
      }

      // Update customer stats
      if (customerId) {
        const [customer] = await tx.select().from(customers).where(eq(customers.id, parseInt(customerId))).limit(1);
        if (customer) {
          const newTotalOrders = (customer.totalOrders || 0) + 1;
          const newTotalSpend = parseFloat(customer.totalSpend || "0") + total;
          const newLtv = newTotalSpend * 1.05;
          const newAvgOrder = newTotalSpend / newTotalOrders;
          const newPoints = (customer.loyaltyPoints || 0) + Math.floor(total);

          let tier: "bronze" | "silver" | "gold" | "platinum" = "bronze";
          if (newLtv >= 15000) tier = "platinum";
          else if (newLtv >= 8000) tier = "gold";
          else if (newLtv >= 3000) tier = "silver";

          let churnRisk: "low" | "medium" | "high" = "low";

          await tx.update(customers).set({
            totalOrders: newTotalOrders,
            totalSpend: newTotalSpend.toFixed(2),
            ltv: newLtv.toFixed(2),
            avgOrderValue: newAvgOrder.toFixed(2),
            loyaltyPoints: newPoints,
            loyaltyTier: tier,
            churnRisk,
            daysSinceLastVisit: 0,
            lastVisitAt: new Date(),
            updatedAt: new Date(),
          }).where(eq(customers.id, parseInt(customerId)));
        }
      }
    });

    return created({ saleId, message: "Sale created successfully" });
  } catch (error) {
    if (error instanceof Error && (error.message.includes("Insufficient") || error.message.includes("not found"))) {
      return badRequest(error.message);
    }
    return handleApiError(error);
  }
}
