import { NextRequest } from "next/server";
import { db } from "@/db";
import { products, sales, customers, aiDecisions, expenses, saleItems } from "@/db/schema";
import { eq, sql, and, gte, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/response";

export async function GET(_req: NextRequest) {
  try {
    await requireAuth();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Sales this month
    const [salesThisMonth] = await db
      .select({
        total: sql<number>`coalesce(sum(total::numeric), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(sales)
      .where(gte(sales.createdAt, startOfMonth));

    // Sales last month
    const [salesLastMonth] = await db
      .select({
        total: sql<number>`coalesce(sum(total::numeric), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(sales)
      .where(and(gte(sales.createdAt, startOfLastMonth), sql`${sales.createdAt} < ${startOfMonth}`));

    // Inventory stats
    const [inventoryStats] = await db
      .select({
        total: sql<number>`count(*)`,
        critical: sql<number>`count(*) filter (where status = 'critical')`,
        lowStock: sql<number>`count(*) filter (where status = 'low_stock')`,
        healthy: sql<number>`count(*) filter (where status = 'healthy')`,
        deadStock: sql<number>`count(*) filter (where status = 'dead_stock')`,
      })
      .from(products)
      .where(eq(products.isActive, true));

    // Customer count
    const [customerStats] = await db
      .select({
        total: sql<number>`count(*)`,
        highRisk: sql<number>`count(*) filter (where churn_risk = 'high')`,
      })
      .from(customers);

    // AI decisions pending
    const [decisionStats] = await db
      .select({
        pending: sql<number>`count(*) filter (where status = 'pending')`,
        total: sql<number>`count(*)`,
      })
      .from(aiDecisions);

    // Expenses this month
    const [expenseStats] = await db
      .select({
        total: sql<number>`coalesce(sum(amount::numeric), 0)`,
        paid: sql<number>`coalesce(sum(amount::numeric) filter (where is_paid = true), 0)`,
      })
      .from(expenses)
      .where(and(eq(expenses.month, now.getMonth() + 1), eq(expenses.year, now.getFullYear())));

    // Gross profit this month
    const profitData = await db
      .select({
        revenue: sql<number>`coalesce(sum(${saleItems.total}::numeric), 0)`,
        cost: sql<number>`coalesce(sum(${saleItems.unitCost}::numeric * ${saleItems.quantity}), 0)`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(gte(sales.createdAt, startOfMonth));

    const revenue = Number(profitData[0]?.revenue || 0);
    const cogs = Number(profitData[0]?.cost || 0);
    const grossProfit = revenue - cogs;
    const totalExpenses = Number(expenseStats.total);
    const netProfit = grossProfit - totalExpenses;

    // Recent sales
    const recentSales = await db
      .select({
        id: sales.id,
        total: sales.total,
        paymentMethod: sales.paymentMethod,
        createdAt: sales.createdAt,
        customerName: customers.name,
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .orderBy(desc(sales.createdAt))
      .limit(5);

    // Business health scores (computed from real data)
    const inventoryScore = Math.round(
      (Number(inventoryStats.healthy) / Math.max(1, Number(inventoryStats.total))) * 100
    );
    const customerScore = Math.round(
      ((Number(customerStats.total) - Number(customerStats.highRisk)) / Math.max(1, Number(customerStats.total))) * 100
    );
    const profitScore = netProfit > 0 ? Math.min(100, Math.round((netProfit / Math.max(1, revenue)) * 200)) : 20;
    const cashFlowScore = Math.round(
      (Number(expenseStats.paid) / Math.max(1, Number(expenseStats.total))) * 100
    );

    const salesGrowth = Number(salesLastMonth.total) > 0
      ? ((Number(salesThisMonth.total) - Number(salesLastMonth.total)) / Number(salesLastMonth.total)) * 100
      : 0;

    return ok({
      revenue: {
        thisMonth: Number(salesThisMonth.total),
        lastMonth: Number(salesLastMonth.total),
        growth: salesGrowth,
        orders: Number(salesThisMonth.count),
      },
      profit: {
        gross: grossProfit,
        net: netProfit,
        margin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      },
      inventory: {
        total: Number(inventoryStats.total),
        critical: Number(inventoryStats.critical),
        lowStock: Number(inventoryStats.lowStock),
        healthy: Number(inventoryStats.healthy),
        deadStock: Number(inventoryStats.deadStock),
      },
      customers: {
        total: Number(customerStats.total),
        highRisk: Number(customerStats.highRisk),
      },
      expenses: {
        total: totalExpenses,
        paid: Number(expenseStats.paid),
      },
      aiDecisions: {
        pending: Number(decisionStats.pending),
        total: Number(decisionStats.total),
      },
      healthScores: {
        profit: profitScore,
        cashFlow: cashFlowScore,
        inventory: inventoryScore,
        customers: customerScore,
      },
      recentSales,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
