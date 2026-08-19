"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Plus, Users, TrendingDown, Edit, Trash2 } from "lucide-react";
import { Card, SectionHeader, Badge, LoadingSpinner, Modal, Input, Select, EmptyState } from "@/components/ui";

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  loyaltyTier: "bronze" | "silver" | "gold" | "platinum";
  churnRisk: "low" | "medium" | "high";
  totalOrders: number;
  totalSpend: string;
  ltv: string;
  avgOrderValue: string;
  loyaltyPoints: number;
  daysSinceLastVisit: number;
  lastVisitAt: string | null;
  notes: string | null;
}

const TIER_CONFIG = {
  bronze: { color: "text-orange-700", badge: "bg-orange-500/15 text-orange-600 border-orange-500/25" },
  silver: { color: "text-gray-300", badge: "bg-gray-500/15 text-gray-300 border-gray-500/25" },
  gold: { color: "text-yellow-400", badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25" },
  platinum: { color: "text-violet-400", badge: "bg-violet-500/15 text-violet-400 border-violet-500/25" },
};

const CHURN_CONFIG = {
  low: { label: "Healthy", variant: "success" as const },
  medium: { label: "Medium Risk", variant: "warning" as const },
  high: { label: "High Risk", variant: "danger" as const },
};

export default function CustomerModule() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [notification, setNotification] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "churn" | "ltv">("overview");

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ search, churnRisk: filterRisk, page: String(page), limit: "20" });
      const res = await fetch(`/api/customers?${params}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setCustomers(json.data.items);
      setTotal(json.data.total);
      setPages(json.data.pages);
    } catch {
      setError("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [search, filterRisk, page]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  function showNotif(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete customer "${name}"?`)) return;
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (res.ok) { showNotif("Customer deleted"); fetchCustomers(); }
    else { const j = await res.json(); setError(j.error || "Delete failed"); }
  }

  const churnCount = customers.filter(c => c.churnRisk !== "low").length;
  const avgLTV = customers.length > 0
    ? customers.reduce((a, c) => a + parseFloat(c.ltv), 0) / customers.length
    : 0;
  const totalLTV = customers.reduce((a, c) => a + parseFloat(c.ltv), 0);

  return (
    <div className="space-y-5">
      {notification && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-medium shadow-lg">
          ✓ {notification}
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Customers", value: total, color: "text-white" },
          { label: "Avg Lifetime Value", value: `AED ${avgLTV.toLocaleString("en", { maximumFractionDigits: 0 })}`, color: "text-blue-400" },
          { label: "Churn Risk", value: churnCount, color: churnCount > 0 ? "text-red-400" : "text-green-400" },
          { label: "Total LTV", value: `AED ${totalLTV.toLocaleString("en", { maximumFractionDigits: 0 })}`, color: "text-green-400" },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-gray-500 text-[10px] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {(["overview", "churn", "ltv"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize ${activeTab === tab ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-gray-500 hover:text-gray-300"}`}
          >
            {tab === "ltv" ? "LTV Leaderboard" : tab === "churn" ? "Churn Risk" : "Overview"}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl flex-1 min-w-48">
          <Search size={14} className="text-gray-500" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search customers..."
            className="bg-transparent text-gray-300 text-sm outline-none flex-1 placeholder:text-gray-600"
          />
        </div>
        {activeTab === "overview" && (
          <div className="flex gap-1">
            {["all", "high", "medium", "low"].map(r => (
              <button
                key={r}
                onClick={() => { setFilterRisk(r); setPage(1); }}
                className={`px-3 py-2 rounded-xl text-xs font-medium border ${filterRisk === r ? "border-blue-500/50 bg-blue-500/15 text-blue-400" : "border-gray-700 text-gray-500 hover:border-gray-600"}`}
              >
                {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1) + " Risk"}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium"
        >
          <Plus size={14} /> Add Customer
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error} <button onClick={() => setError("")} className="ml-2 opacity-60">×</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size={28} /></div>
      ) : customers.length === 0 ? (
        <EmptyState icon={<Users />} title="No customers found" />
      ) : activeTab === "ltv" ? (
        /* LTV Leaderboard */
        <Card>
          <SectionHeader title="Customer LTV Leaderboard" subtitle="Ranked by lifetime value" />
          <div className="space-y-2">
            {[...customers].sort((a, b) => parseFloat(b.ltv) - parseFloat(a.ltv)).map((c, i) => {
              const maxLtv = parseFloat(customers.reduce((m, x) => parseFloat(x.ltv) > parseFloat(m.ltv) ? x : m, customers[0]).ltv);
              const pct = (parseFloat(c.ltv) / maxLtv) * 100;
              const tier = TIER_CONFIG[c.loyaltyTier];
              return (
                <div key={c.id} className="flex items-center gap-3 py-2 border-b border-gray-800/50 last:border-0">
                  <span className="text-gray-600 text-sm w-5 text-center">{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium">{c.name}</div>
                    <div className="h-1.5 bg-gray-800 rounded-full mt-1">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 text-sm font-semibold">AED {parseFloat(c.ltv).toLocaleString("en", { maximumFractionDigits: 0 })}</div>
                    <span className={`inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded border ${tier.badge} uppercase`}>{c.loyaltyTier}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : activeTab === "churn" ? (
        /* Churn Risk */
        <div className="space-y-4">
          <Card>
            <SectionHeader title="High & Medium Risk Customers" subtitle="Customers at risk of churning" />
            <div className="space-y-2">
              {customers.filter(c => c.churnRisk !== "low").length === 0 ? (
                <div className="text-center py-6 text-green-400 text-sm">✓ No at-risk customers right now</div>
              ) : (
                customers.filter(c => c.churnRisk !== "low").map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-gray-800/50 last:border-0">
                    <div>
                      <div className="text-white text-sm font-medium">{c.name}</div>
                      <div className="text-gray-500 text-xs">
                        Inactive {c.daysSinceLastVisit} days · AED {parseFloat(c.ltv).toLocaleString("en", { maximumFractionDigits: 0 })} LTV at risk
                      </div>
                    </div>
                    <Badge variant={CHURN_CONFIG[c.churnRisk].variant}>{CHURN_CONFIG[c.churnRisk].label}</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Re-Engagement Playbook" subtitle="AI-suggested actions" />
            <div className="space-y-2">
              {[
                { trigger: "Inactive 14+ days", action: "Send personalized product recommendation", impact: "~40% re-engagement" },
                { trigger: "Inactive 30+ days", action: "Send win-back offer with 15% discount", impact: "~25% recovery" },
                { trigger: "Inactive 60+ days", action: "Final loyalty bonus offer", impact: "~12% last-chance save" },
              ].map((play, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-gray-800/50 last:border-0">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <div>
                    <div className="text-yellow-400 text-xs font-medium">TRIGGER: {play.trigger}</div>
                    <div className="text-gray-300 text-xs">→ {play.action}</div>
                    <div className="text-gray-500 text-[10px]">Expected: {play.impact}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        /* Overview */
        <div className="space-y-2">
          {customers.map((customer) => {
            const tier = TIER_CONFIG[customer.loyaltyTier];
            const churn = CHURN_CONFIG[customer.churnRisk];
            const isSelected = selectedCustomer?.id === customer.id;
            return (
              <div
                key={customer.id}
                className={`bg-gray-900 border rounded-xl p-4 cursor-pointer ${isSelected ? "border-blue-500/40" : "border-gray-800 hover:border-gray-700"}`}
                onClick={() => setSelectedCustomer(isSelected ? null : customer)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {customer.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{customer.name}</span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${tier.badge} uppercase`}>{customer.loyaltyTier}</span>
                      <Badge variant={churn.variant}>{churn.label}</Badge>
                    </div>
                    <div className="text-gray-500 text-xs">
                      {customer.email} · Last visit: {customer.daysSinceLastVisit}d ago
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 text-sm font-semibold">AED {parseFloat(customer.ltv).toLocaleString("en", { maximumFractionDigits: 0 })}</div>
                    <div className="text-gray-500 text-[10px]">Lifetime Value</div>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-800 rounded-lg p-2.5 text-center">
                        <div className="text-white font-bold text-sm">{customer.totalOrders}</div>
                        <div className="text-gray-500 text-[10px]">Total Orders</div>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-2.5 text-center">
                        <div className="text-white font-bold text-sm">AED {parseFloat(customer.avgOrderValue).toFixed(0)}</div>
                        <div className="text-gray-500 text-[10px]">Avg Order</div>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-2.5 text-center">
                        <div className="text-white font-bold text-sm">{customer.loyaltyPoints}</div>
                        <div className="text-gray-500 text-[10px]">Points</div>
                      </div>
                    </div>
                    <div className={`px-3 py-2 rounded-lg ${customer.churnRisk === "high" ? "bg-red-500/10 border border-red-500/20 text-red-400" : customer.churnRisk === "medium" ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400" : "bg-green-500/10 border border-green-500/20 text-green-400"} text-xs`}>
                      {customer.churnRisk === "high" && `⚡ Customer inactive ${customer.daysSinceLastVisit} days. Send personalized win-back offer with 15% discount.`}
                      {customer.churnRisk === "medium" && `📬 Customer cooling off. Trigger reminder with loyalty points update.`}
                      {customer.churnRisk === "low" && `🌟 Active and healthy. Consider loyalty reward to increase basket size.`}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setEditCustomer(customer); }} className="px-3 py-1.5 bg-blue-500/15 text-blue-400 rounded-lg text-xs border border-blue-500/25 hover:bg-blue-500/25">
                        Edit
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(customer.id, customer.name); }} className="px-3 py-1.5 bg-red-500/15 text-red-400 rounded-lg text-xs border border-red-500/25 hover:bg-red-500/25">
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-sm disabled:opacity-40">Previous</button>
          <span className="text-gray-500 text-sm">Page {page} of {pages}</span>
          <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-sm disabled:opacity-40">Next</button>
        </div>
      )}

      {(showAddModal || editCustomer) && (
        <CustomerFormModal
          customer={editCustomer}
          onClose={() => { setShowAddModal(false); setEditCustomer(null); }}
          onSaved={() => { setShowAddModal(false); setEditCustomer(null); fetchCustomers(); showNotif(editCustomer ? "Customer updated" : "Customer added"); }}
        />
      )}
    </div>
  );
}

function CustomerFormModal({ customer, onClose, onSaved }: { customer: Customer | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    loyaltyTier: customer?.loyaltyTier || "bronze",
    notes: customer?.notes || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    setLoading(true); setError("");
    try {
      const url = customer ? `/api/customers/${customer.id}` : "/api/customers";
      const method = customer ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Save failed"); return; }
      onSaved();
    } catch { setError("Connection error"); } finally { setLoading(false); }
  }

  return (
    <Modal isOpen title={customer ? "Edit Customer" : "Add Customer"} onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-800 text-gray-400 rounded-xl text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {loading ? "Saving..." : customer ? "Update" : "Add Customer"}
          </button>
        </div>
      }
    >
      {error && <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
      <div className="space-y-3">
        <Input label="Full Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Sarah Al Mansouri" />
        <Input label="Email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="sarah@example.ae" />
        <Input label="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+971-50-xxx-xxxx" />
        {customer && (
          <Select
            label="Loyalty Tier"
            value={form.loyaltyTier}
            onChange={e => setForm(p => ({ ...p, loyaltyTier: e.target.value as "bronze" | "silver" | "gold" | "platinum" }))}
            options={[
              { value: "bronze", label: "Bronze" },
              { value: "silver", label: "Silver" },
              { value: "gold", label: "Gold" },
              { value: "platinum", label: "Platinum" },
            ]}
          />
        )}
        <Input label="Notes (optional)" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="VIP customer, prefers organic..." />
      </div>
    </Modal>
  );
}
