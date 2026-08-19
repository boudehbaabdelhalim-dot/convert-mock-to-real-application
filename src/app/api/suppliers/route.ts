import { NextRequest } from "next/server";
import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { ilike, or, and, sql, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, created, badRequest, handleApiError } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) {
      conditions.push(or(ilike(suppliers.name, `%${search}%`), ilike(suppliers.category, `%${search}%`))!);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(suppliers)
      .where(whereClause);

    const items = await db.select().from(suppliers).where(whereClause).orderBy(asc(suppliers.name)).limit(limit).offset(offset);

    return ok({ items, page, limit, total: Number(countResult.count), pages: Math.ceil(Number(countResult.count) / limit) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const { name, category, contactEmail, contactPhone, leadTimeDays, paymentTerms, notes } = body;

    if (!name?.trim()) return badRequest("Supplier name is required");

    const [supplier] = await db
      .insert(suppliers)
      .values({
        name: name.trim(),
        category: category?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
        leadTimeDays: leadTimeDays ? parseInt(leadTimeDays) : 7,
        paymentTerms: paymentTerms?.trim() || "Net 30",
        notes: notes?.trim() || null,
        status: "active",
        defectRate: "0",
        priceScore: 70,
        reliabilityScore: 70,
        deliveryScore: 70,
        totalSpend: "0",
      })
      .returning();

    return created(supplier);
  } catch (error) {
    return handleApiError(error);
  }
}
