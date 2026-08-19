"use client";

import { useState } from "react";
import {
  BarChart3, Package, Users, Truck, Brain, TrendingUp,
  DollarSign, FlaskConical, Bot, Database, ChevronLeft,
  ChevronRight, Bell, Settings, Shield, ShoppingCart, LogOut
} from "lucide-react";

export type ModuleId =
  | "dashboard" | "inventory" | "customers" | "suppliers"
  | "ai-center" | "profit-autopilot" | "cash-flow" | "analytics"
  | "simulation" | "ai-agents" | "business-memory" | "pos"
  | "alerts" | "security" | "settings";

interface NavItem {
  id: ModuleId;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={18} /> },
  { id: "inventory", label: "Inventory", icon: <Package size={18} /> },
  { id: "pos", label: "Point of Sale", icon: <ShoppingCart size={18} /> },
  { id: "customers", label: "Customers", icon: <Users size={18} /> },
  { id: "suppliers", label: "Suppliers", icon: <Truck size={18} /> },
  { id: "ai-center", label: "AI Decisions", icon: <Brain size={18} /> },
  { id: "profit-autopilot", label: "Profit Autopilot", icon: <TrendingUp size={18} /> },
  { id: "cash-flow", label: "Cash Flow", icon: <DollarSign size={18} /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={18} /> },
  { id: "simulation", label: "Simulation Lab", icon: <FlaskConical size={18} /> },
  { id: "ai-agents", label: "AI Agents", icon: <Bot size={18} /> },
  { id: "business-memory", label: "Business Memory", icon: <Database size={18} /> },
  { id: "alerts", label: "Alerts", icon: <Bell size={18} /> },
  { id: "settings", label: "Settings", icon: <Settings size={18} /> },
];

interface SidebarProps {
  activeModule: ModuleId;
  onNavigate: (id: ModuleId) => void;
  pendingDecisions?: number;
  userName?: string;
  userRole?: string;
  onLogout: () => void;
}

export default function Sidebar({ activeModule, onNavigate, pendingDecisions = 0, userName, userRole, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="fixed left-0 top-0 h-full bg-[#0d0d1a] border-r border-gray-800/60 flex flex-col z-40"
      style={{ width: collapsed ? "4rem" : "14rem", transition: "width 200ms" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-4 border-b border-gray-800/60">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
          <BarChart3 size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-white font-bold text-sm truncate">SmartStock</div>
            <div className="text-gray-500 text-[10px]">AI Business OS</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeModule === item.id;
          const badge = item.id === "ai-center" ? pendingDecisions : item.badge;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left relative group ${
                isActive
                  ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                  : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 border border-transparent"
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="text-xs font-medium truncate">{item.label}</span>
              )}
              {badge != null && badge > 0 && (
                <span className="ml-auto flex-shrink-0 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 border border-gray-700">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User + Collapse */}
      <div className="border-t border-gray-800/60 p-2 space-y-1">
        {!collapsed && userName && (
          <div className="px-2.5 py-2">
            <div className="text-white text-xs font-medium truncate">{userName}</div>
            <div className="text-gray-500 text-[10px] capitalize">{userRole}</div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-xs font-medium">Sign Out</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center px-2.5 py-2 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-gray-800/50"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
