"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Package, Users, Brain, DollarSign, AlertTriangle } from "lucide-react";
import { Card, SectionHeader, StatCard, LoadingSpinner, Badge } from "@/components/ui";

interface DashboardData {
  revenue: { thisMonth: number; lastMonth: number; growth: number; orders: number };
  profit: { gross: number; net: number; margin: number };
  inventory: { total: number; critical: number; lowStock: number; healthy: number; deadStock: number };
  customers: { total: number; highRisk: number };
  expenses: { total: number; paid: number };
  aiDecisions: { pending: number; total: number };
  healthScores: { profit: number; cashFlow: number; inventory: number; customers: number };
  recentSales: Array<{ id: number; total: string; paymentMethod: string; createdAt: string; customerName: string | null }>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchDashboard() {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to load dashboard");
      const json = await res.json();
      setData(json.data);
    } catch (e) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12 text-red-400">
        <AlertTriangle size={32} className="mx-auto mb-2" />
        <p>{error || "Failed to load"}</p>
        <button onClick={fetchDashboard} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
          Retry
        </button>
      </div>
    );
  }

  const fmtAED = (n: number) => `AED ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

  return (
    <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
          <div className="relative">
            <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
              <DollarSign size={12} /> Revenue (MTD)
            </div>
            <div className="text-2xl font-bold text-white">{fmtAED(data.revenue.thisMonth)}</div>
            <div className={`text-xs mt-1 flex items-center gap-1 ${data.revenue.growth >= 0 ? "text-green-400" : "text-red-400"}`}>
              {data.revenue.growth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {fmtPct(data.revenue.growth)} vs last month
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
          <div className="relative">
            <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
              <TrendingUp size={12} /> Net Profit (MTD)
            </div>
            <div className={`text-2xl font-bold ${data.profit.net >= 0 ? "text-green-400" : "text-red-400"}`}>
              {fmtAED(data.profit.net)}
            </div>
            <div className="text-gray-500 text-xs mt-1">
              Margin: {data.profit.margin.toFixed(1)}%
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent" />
          <div className="relative">
            <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
              <Package size={12} /> Inventory
            </div>
            <div className="text-2xl font-bold text-white">{data.inventory.total}</div>
            <div className="text-xs mt-1">
              {data.inventory.critical > 0 && (
                <span className="text-red-400">{data.inventory.critical} critical · </span>
              )}
              <span className="text-yellow-400">{data.inventory.lowStock} low</span>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
          <div className="relative">
            <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
              <Brain size={12} /> AI Decisions
            </div>
            <div className="text-2xl font-bold text-white">{data.aiDecisions.pending}</div>
            <div className="text-xs mt-1 text-yellow-400">
              Pending approval
            </div>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Business Health */}
        <Card>
          <SectionHeader title="Business Health Score" subtitle="Real-time composite metrics" />
          <div className="space-y-3">
            {[
              { label: "Profit Health", score: data.healthScores.profit, color: "bg-blue-500" },
              { label: "Cash Flow", score: data.healthScores.cashFlow, color: "bg-green-500" },
              { label: "Inventory Health", score: data.healthScores.inventory, color: "bg-yellow-500" },
              { label: "Customer Health", score: data.healthScores.customers, color: "bg-violet-500" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400 text-xs">{item.label}</span>
                  <span className={`text-xs font-bold ${item.score >= 70 ? "text-green-400" : item.score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                    {item.score}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.score}%`, transition: "width 500ms ease" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Inventory Alerts */}
        <Card>
          <SectionHeader
            title="Inventory Alerts"
            subtitle="Items requiring attention"
            badge={
              data.inventory.critical > 0 ? (
                <Badge variant="danger">{data.inventory.critical} Critical</Badge>
              ) : undefined
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              label="Critical Stock"
              value={data.inventory.critical}
              color={data.inventory.critical > 0 ? "text-red-400" : "text-green-400"}
              sub="Stockout risk"
            />
            <StatCard
              label="Low Stock"
              value={data.inventory.lowStock}
              color={data.inventory.lowStock > 0 ? "text-yellow-400" : "text-green-400"}
              sub="Reorder needed"
            />
            <StatCard
              label="Healthy"
              value={data.inventory.healthy}
              color="text-green-400"
              sub="Normal levels"
            />
            <StatCard
              label="Dead Stock"
              value={data.inventory.deadStock}
              color="text-gray-400"
              sub="No movement"
            />
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Financials */}
        <Card>
          <SectionHeader title="Financial Summary" subtitle="Month to date" />
          <div className="space-y-2">
            {[
              { label: "Revenue", value: fmtAED(data.revenue.thisMonth), color: "text-blue-400" },
              { label: "Cost of Goods", value: fmtAED(data.revenue.thisMonth - data.profit.gross), color: "text-orange-400" },
              { label: "Gross Profit", value: fmtAED(data.profit.gross), color: "text-green-400" },
              { label: "Total Expenses", value: fmtAED(data.expenses.total), color: "text-red-400" },
              { label: "Net Profit", value: fmtAED(data.profit.net), color: data.profit.net >= 0 ? "text-green-400" : "text-red-400" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 last:border-0">
                <span className="text-gray-400 text-xs">{row.label}</span>
                <span className={`text-xs font-semibold ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Sales */}
        <Card>
          <SectionHeader title="Recent Sales" subtitle={`${data.revenue.orders} orders this month`} />
          {data.recentSales.length === 0 ? (
            <div className="text-center py-6 text-gray-600 text-sm">No sales yet this month</div>
          ) : (
            <div className="space-y-2">
              {data.recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 last:border-0">
                  <div>
                    <div className="text-white text-xs font-medium">
                      {sale.customerName || "Walk-in Customer"}
                    </div>
                    <div className="text-gray-500 text-[10px]">
                      {new Date(sale.createdAt).toLocaleDateString()} · {sale.paymentMethod}
                    </div>
                  </div>
                  <div className="text-green-400 text-xs font-semibold">
                    AED {parseFloat(sale.total).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Customers & Expenses summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Customers" value={data.customers.total} color="text-violet-400" />
        <StatCard label="At-Risk Customers" value={data.customers.highRisk} color={data.customers.highRisk > 0 ? "text-red-400" : "text-green-400"} />
        <StatCard label="Monthly Expenses" value={fmtAED(data.expenses.total)} color="text-red-400" />
        <StatCard label="Expenses Paid" value={fmtAED(data.expenses.paid)} color="text-green-400" />
      </div>
    </div>
  );
}
