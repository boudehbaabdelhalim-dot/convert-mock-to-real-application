import { NextRequest } from "next/server";
import { db } from "@/db";
import { products, categories, suppliers } from "@/db/schema";
import { eq, ilike, or, and, sql, asc, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, created, badRequest, handleApiError } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const offset = (page - 1) * limit;

    const conditions = [];
    conditions.push(eq(products.isActive, true));

    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`),
          ilike(products.barcode, `%${search}%`)
        )!
      );
    }

    if (status !== "all") {
      conditions.push(eq(products.status, status as "healthy" | "low_stock" | "critical" | "dead_stock"));
    }

    const whereClause = and(...conditions);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);

    const total = Number(countResult.count);

    const items = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        barcode: products.barcode,
        brand: products.brand,
        price: products.price,
        cost: products.cost,
        stock: products.stock,
        minStock: products.minStock,
        maxStock: products.maxStock,
        unit: products.unit,
        image: products.image,
        status: products.status,
        dailySales: products.dailySales,
        healthScore: products.healthScore,
        categoryId: products.categoryId,
        supplierId: products.supplierId,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(whereClause)
      .orderBy(asc(products.name))
      .limit(limit)
      .offset(offset);

    return ok({
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const { name, sku, barcode, brand, categoryId, supplierId, price, cost, stock, minStock, maxStock, unit, image } = body;

    if (!name?.trim()) return badRequest("Product name is required");
    if (!sku?.trim()) return badRequest("SKU is required");
    if (!price || isNaN(parseFloat(price))) return badRequest("Valid price is required");
    if (!cost || isNaN(parseFloat(cost))) return badRequest("Valid cost is required");

    // Check SKU uniqueness
    const existing = await db.select().from(products).where(eq(products.sku, sku.trim())).limit(1);
    if (existing.length > 0) return badRequest("SKU already exists");

    const stockNum = parseInt(stock) || 0;
    const minStockNum = parseInt(minStock) || 10;
    const maxStockNum = parseInt(maxStock) || 200;

    let status: "healthy" | "low_stock" | "critical" | "dead_stock" = "healthy";
    if (stockNum === 0) status = "dead_stock";
    else if (stockNum <= minStockNum * 0.5) status = "critical";
    else if (stockNum <= minStockNum) status = "low_stock";

    const [product] = await db
      .insert(products)
      .values({
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        barcode: barcode?.trim() || null,
        brand: brand?.trim() || null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        supplierId: supplierId ? parseInt(supplierId) : null,
        price: parseFloat(price).toFixed(2),
        cost: parseFloat(cost).toFixed(2),
        stock: stockNum,
        minStock: minStockNum,
        maxStock: maxStockNum,
        unit: unit?.trim() || "unit",
        image: image || "📦",
        status,
        dailySales: "0",
        healthScore: status === "healthy" ? 80 : status === "low_stock" ? 50 : status === "critical" ? 25 : 5,
      })
      .returning();

    return created(product);
  } catch (error) {
    return handleApiError(error);
  }
}
