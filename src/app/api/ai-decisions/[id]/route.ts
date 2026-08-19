import { NextRequest } from "next/server";
import { db } from "@/db";
import { aiDecisions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, handleApiError } from "@/lib/response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const { action } = body; // "approve" | "reject"

    if (!["approve", "reject"].includes(action)) {
      return badRequest("Action must be 'approve' or 'reject'");
    }

    const [existing] = await db.select().from(aiDecisions).where(eq(aiDecisions.id, parseInt(id))).limit(1);
    if (!existing) return notFound("Decision not found");
    if (existing.status !== "pending") return badRequest("Decision already resolved");

    const [updated] = await db
      .update(aiDecisions)
      .set({
        status: action === "approve" ? "approved" : "rejected",
        approvedBy: session.userId,
        approvedAt: new Date(),
      })
      .where(eq(aiDecisions.id, parseInt(id)))
      .returning();

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
