import { NextRequest } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { ok, created, badRequest, handleApiError } from "@/lib/response";

export async function GET() {
  try {
    await requireAuth();
    const items = await db.select().from(categories).orderBy(categories.name);
    return ok(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const { name } = body;
    if (!name?.trim()) return badRequest("Category name is required");
    const [category] = await db.insert(categories).values({ name: name.trim() }).returning();
    return created(category);
  } catch (error) {
    return handleApiError(error);
  }
}
