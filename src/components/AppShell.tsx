"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar, { type ModuleId } from "./Sidebar";
import Dashboard from "@/modules/Dashboard";
import InventoryModule from "@/modules/InventoryModule";
import CustomerModule from "@/modules/CustomerModule";
import SupplierModule from "@/modules/SupplierModule";
import AIDecisionModule from "@/modules/AIDecisionModule";
import CashFlowModule from "@/modules/CashFlowModule";
import POSModule from "@/modules/POSModule";
import PlaceholderModule from "@/modules/PlaceholderModule";

interface AppShellProps {
  user: { name: string; role: string };
}

const MODULE_TITLES: Partial<Record<ModuleId, string>> = {
  dashboard: "Dashboard",
  inventory: "Inventory Intelligence",
  customers: "Customer Value Engine",
  suppliers: "Supplier Intelligence",
  "ai-center": "AI Decision Center",
  "cash-flow": "Cash Flow Forecast",
  pos: "Point of Sale",
  "profit-autopilot": "Profit Autopilot",
  analytics: "Analytics",
  simulation: "Simulation Lab",
  "ai-agents": "AI Agents",
  "business-memory": "Business Memory",
  alerts: "Alerts",
  settings: "Settings",
  security: "Security",
};

export default function AppShell({ user }: AppShellProps) {
  const router = useRouter();
  const [activeModule, setActiveModule] = useState<ModuleId>("dashboard");
  const [pendingDecisions, setPendingDecisions] = useState(0);

  const fetchPendingDecisions = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-decisions");
      if (!res.ok) return;
      const json = await res.json();
      const pending = json.data.items.filter((d: { status: string }) => d.status === "pending").length;
      setPendingDecisions(pending);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPendingDecisions();
    const interval = setInterval(fetchPendingDecisions, 30_000);
    return () => clearInterval(interval);
  }, [fetchPendingDecisions]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  function renderModule() {
    switch (activeModule) {
      case "dashboard": return <Dashboard />;
      case "inventory": return <InventoryModule />;
      case "customers": return <CustomerModule />;
      case "suppliers": return <SupplierModule />;
      case "ai-center": return <AIDecisionModule />;
      case "cash-flow": return <CashFlowModule />;
      case "pos": return <POSModule />;
      case "profit-autopilot": return <PlaceholderModule name="Profit Autopilot" icon="📈" description="AI-powered profit optimization suggestions based on margins, costs, and market data. Coming soon." />;
      case "analytics": return <PlaceholderModule name="Analytics" icon="📊" description="Deep analytics on sales trends, category performance, and customer behavior." />;
      case "simulation": return <PlaceholderModule name="Simulation Lab" icon="🧪" description="Test pricing, inventory, and expansion decisions safely before executing." />;
      case "ai-agents": return <PlaceholderModule name="AI Agents" icon="🤖" description="Autonomous AI agents that monitor your business 24/7 and generate recommendations." />;
      case "business-memory": return <PlaceholderModule name="Business Memory" icon="🧠" description="Historical context and pattern memory to improve AI recommendations over time." />;
      case "alerts": return <PlaceholderModule name="Alerts" icon="🔔" description="Configure automated alerts for stock levels, customer churn, and financial thresholds." />;
      case "settings": return <PlaceholderModule name="Settings" icon="⚙️" description="Configure your store, branches, users, and system preferences." />;
      case "security": return <PlaceholderModule name="Security" icon="🔒" description="User management, role permissions, audit logs, and access control." />;
      default: return <Dashboard />;
    }
  }

  const sidebarWidth = "14rem"; // handled inside Sidebar with collapse

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <Sidebar
        activeModule={activeModule}
        onNavigate={(id) => setActiveModule(id)}
        pendingDecisions={pendingDecisions}
        userName={user.name}
        userRole={user.role}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-auto" style={{ marginLeft: "14rem", transition: "margin-left 200ms" }}>
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-[#0a0a0f]/95 backdrop-blur border-b border-gray-800/60 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">
                {MODULE_TITLES[activeModule] || activeModule}
              </h1>
              <p className="text-gray-500 text-xs mt-0.5 capitalize">{user.role} · SmartStock AI</p>
            </div>
            <div className="flex items-center gap-3">
              {pendingDecisions > 0 && (
                <button
                  onClick={() => setActiveModule("ai-center")}
                  className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/15 border border-yellow-500/25 text-yellow-400 rounded-lg text-xs font-medium hover:bg-yellow-500/25"
                >
                  <span className="w-4 h-4 rounded-full bg-yellow-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {pendingDecisions}
                  </span>
                  AI Decisions Pending
                </button>
              )}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
            </div>
          </div>
        </div>

        {/* Module Content */}
        <div className="p-6">
          {renderModule()}
        </div>
      </main>
    </div>
  );
}
