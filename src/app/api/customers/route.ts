import { NextRequest } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq, ilike, or, and, sql, asc, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, created, badRequest, handleApiError } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const churnRisk = searchParams.get("churnRisk") || "all";
    const tier = searchParams.get("tier") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [];

    if (search) {
      conditions.push(
        or(
          ilike(customers.name, `%${search}%`),
          ilike(customers.email, `%${search}%`),
          ilike(customers.phone, `%${search}%`)
        )! as ReturnType<typeof eq>
      );
    }
    if (churnRisk !== "all") {
      conditions.push(eq(customers.churnRisk, churnRisk as "low" | "medium" | "high"));
    }
    if (tier !== "all") {
      conditions.push(eq(customers.loyaltyTier, tier as "bronze" | "silver" | "gold" | "platinum"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(whereClause);

    const total = Number(countResult.count);

    const items = await db
      .select()
      .from(customers)
      .where(whereClause)
      .orderBy(desc(customers.ltv))
      .limit(limit)
      .offset(offset);

    return ok({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const { name, email, phone, notes } = body;

    if (!name?.trim()) return badRequest("Customer name is required");

    const [customer] = await db
      .insert(customers)
      .values({
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        notes: notes?.trim() || null,
        loyaltyTier: "bronze",
        churnRisk: "low",
        totalOrders: 0,
        totalSpend: "0",
        ltv: "0",
        avgOrderValue: "0",
        loyaltyPoints: 0,
        daysSinceLastVisit: 0,
      })
      .returning();

    return created(customer);
  } catch (error) {
    return handleApiError(error);
  }
}
