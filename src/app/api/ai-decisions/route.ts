import { NextRequest } from "next/server";
import { db } from "@/db";
import { aiDecisions } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, created, badRequest, handleApiError } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));
    const offset = (page - 1) * limit;

    let query = db.select().from(aiDecisions);

    const items = await db
      .select()
      .from(aiDecisions)
      .orderBy(desc(aiDecisions.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(aiDecisions);

    const filtered = filter === "all" ? items : items.filter(d =>
      d.priority === filter || d.type === filter || d.status === filter
    );

    return ok({
      items: filtered,
      total: Number(countResult.count),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
