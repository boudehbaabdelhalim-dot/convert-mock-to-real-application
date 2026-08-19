"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Plus, Truck, Edit, Trash2 } from "lucide-react";
import { Card, SectionHeader, Badge, LoadingSpinner, Modal, Input, Select, EmptyState } from "@/components/ui";

interface Supplier {
  id: number;
  name: string;
  category: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  leadTimeDays: number;
  paymentTerms: string | null;
  defectRate: string;
  priceScore: number;
  reliabilityScore: number;
  deliveryScore: number;
  totalSpend: string;
  status: "active" | "review" | "paused";
  notes: string | null;
}

const STATUS_CONFIG = {
  active: { label: "Active", variant: "success" as const },
  review: { label: "Under Review", variant: "warning" as const },
  paused: { label: "Paused", variant: "neutral" as const },
};

export default function SupplierModule() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [notification, setNotification] = useState("");
  const [error, setError] = useState("");

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ search, page: String(page) });
      const res = await fetch(`/api/suppliers?${params}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setSuppliers(json.data.items);
      setTotal(json.data.total);
      setPages(json.data.pages);
    } catch {
      setError("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  function showNotif(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete supplier "${name}"?`)) return;
    const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    if (res.ok) { showNotif("Supplier deleted"); fetchSuppliers(); }
    else { const j = await res.json(); setError(j.error || "Delete failed"); }
  }

  function overallScore(s: Supplier) {
    return Math.round(s.priceScore * 0.25 + s.reliabilityScore * 0.35 + s.deliveryScore * 0.25 + (100 - parseFloat(s.defectRate) * 10) * 0.15);
  }

  return (
    <div className="space-y-5">
      {notification && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-medium shadow-lg">
          ✓ {notification}
        </div>
      )}

      {/* AI Insight */}
      <div className="bg-gradient-to-r from-blue-900/30 to-violet-900/30 border border-blue-500/20 rounded-xl p-4">
        <div className="text-blue-400 text-xs font-semibold mb-2">🤖 AI Supplier Intelligence</div>
        <div className="space-y-1">
          {suppliers.filter(s => s.status === "review").length > 0 && (
            <div className="text-gray-300 text-xs">
              ⚠️ {suppliers.filter(s => s.status === "review").map(s => s.name).join(", ")} — defect rate exceeds threshold. Review recommended.
            </div>
          )}
          {suppliers.length > 0 && (
            <div className="text-gray-300 text-xs">
              📊 {suppliers.length} active suppliers · Total spend: AED {suppliers.reduce((a, s) => a + parseFloat(s.totalSpend), 0).toLocaleString("en", { maximumFractionDigits: 0 })}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl flex-1 min-w-48">
          <Search size={14} className="text-gray-500" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search suppliers..."
            className="bg-transparent text-gray-300 text-sm outline-none flex-1 placeholder:text-gray-600"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium"
        >
          <Plus size={14} /> Add Supplier
        </button>
      </div>

      {error && <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error} <button onClick={() => setError("")} className="ml-2 opacity-60">×</button></div>}

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size={28} /></div>
      ) : suppliers.length === 0 ? (
        <EmptyState icon={<Truck />} title="No suppliers found" />
      ) : (
        <div className="space-y-3">
          {suppliers.map((supplier) => {
            const status = STATUS_CONFIG[supplier.status];
            const score = overallScore(supplier);
            const scoreColor = score >= 85 ? "text-green-400" : score >= 70 ? "text-yellow-400" : "text-red-400";
            return (
              <div key={supplier.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold text-sm">{supplier.name}</span>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <div className="text-gray-500 text-xs">
                      {supplier.category} · Last order: {supplier.totalSpend !== "0" ? "Active" : "No orders"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${scoreColor}`}>{score}</div>
                    <div className="text-gray-600 text-[10px]">SCORE</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { label: "Price", score: supplier.priceScore },
                    { label: "Reliability", score: supplier.reliabilityScore },
                    { label: "Delivery", score: supplier.deliveryScore },
                    { label: "Quality", score: Math.max(0, 100 - parseFloat(supplier.defectRate) * 10) },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                        <span>{m.label}</span>
                        <span className="text-gray-300">{Math.round(m.score)}</span>
                      </div>
                      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${m.score >= 80 ? "bg-green-500" : m.score >= 60 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${m.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="bg-gray-800 rounded-lg p-2">
                    <div className="text-white text-xs font-semibold">{supplier.leadTimeDays}d</div>
                    <div className="text-gray-500 text-[10px]">Lead Time</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2">
                    <div className="text-white text-xs font-semibold">{supplier.defectRate}%</div>
                    <div className="text-gray-500 text-[10px]">Defect Rate</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2">
                    <div className="text-white text-xs font-semibold">{supplier.paymentTerms}</div>
                    <div className="text-gray-500 text-[10px]">Payment</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-gray-500 text-xs">
                    Total spend: AED {parseFloat(supplier.totalSpend).toLocaleString("en", { maximumFractionDigits: 0 })}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditSupplier(supplier)} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg">
                      <Edit size={12} />
                    </button>
                    <button onClick={() => handleDelete(supplier.id, supplier.name)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {supplier.status === "review" && (
                  <div className="mt-3 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-xs">
                    ⚠️ Defect rate ({supplier.defectRate}%) exceeds threshold. Review or trial alternative supplier.
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

      {(showAddModal || editSupplier) && (
        <SupplierFormModal
          supplier={editSupplier}
          onClose={() => { setShowAddModal(false); setEditSupplier(null); }}
          onSaved={() => { setShowAddModal(false); setEditSupplier(null); fetchSuppliers(); showNotif(editSupplier ? "Supplier updated" : "Supplier added"); }}
        />
      )}
    </div>
  );
}

function SupplierFormModal({ supplier, onClose, onSaved }: { supplier: Supplier | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: supplier?.name || "",
    category: supplier?.category || "",
    contactEmail: supplier?.contactEmail || "",
    contactPhone: supplier?.contactPhone || "",
    leadTimeDays: supplier?.leadTimeDays?.toString() || "7",
    paymentTerms: supplier?.paymentTerms || "Net 30",
    priceScore: supplier?.priceScore?.toString() || "70",
    reliabilityScore: supplier?.reliabilityScore?.toString() || "70",
    deliveryScore: supplier?.deliveryScore?.toString() || "70",
    defectRate: supplier?.defectRate || "0",
    status: supplier?.status || "active",
    notes: supplier?.notes || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    setLoading(true); setError("");
    try {
      const url = supplier ? `/api/suppliers/${supplier.id}` : "/api/suppliers";
      const method = supplier ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Save failed"); return; }
      onSaved();
    } catch { setError("Connection error"); } finally { setLoading(false); }
  }

  const f = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Modal isOpen title={supplier ? "Edit Supplier" : "Add Supplier"} onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-800 text-gray-400 rounded-xl text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {loading ? "Saving..." : supplier ? "Update" : "Add Supplier"}
          </button>
        </div>
      }
    >
      {error && <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
      <div className="space-y-3">
        <Input label="Supplier Name" value={form.name} onChange={e => f("name", e.target.value)} placeholder="Al Rawabi Dairy" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Category" value={form.category} onChange={e => f("category", e.target.value)} placeholder="Dairy" />
          <Input label="Lead Time (days)" type="number" value={form.leadTimeDays} onChange={e => f("leadTimeDays", e.target.value)} />
          <Input label="Email" type="email" value={form.contactEmail} onChange={e => f("contactEmail", e.target.value)} placeholder="orders@supplier.ae" />
          <Input label="Phone" value={form.contactPhone} onChange={e => f("contactPhone", e.target.value)} placeholder="+971-4-xxx-xxxx" />
          <Input label="Payment Terms" value={form.paymentTerms} onChange={e => f("paymentTerms", e.target.value)} placeholder="Net 30" />
          <Input label="Defect Rate (%)" type="number" step="0.1" value={form.defectRate} onChange={e => f("defectRate", e.target.value)} />
        </div>
        {supplier && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Price Score (0-100)" type="number" min="0" max="100" value={form.priceScore} onChange={e => f("priceScore", e.target.value)} />
              <Input label="Reliability (0-100)" type="number" min="0" max="100" value={form.reliabilityScore} onChange={e => f("reliabilityScore", e.target.value)} />
              <Input label="Delivery (0-100)" type="number" min="0" max="100" value={form.deliveryScore} onChange={e => f("deliveryScore", e.target.value)} />
            </div>
            <Select label="Status" value={form.status} onChange={e => f("status", e.target.value)} options={[
              { value: "active", label: "Active" },
              { value: "review", label: "Under Review" },
              { value: "paused", label: "Paused" },
            ]} />
          </>
        )}
        <Input label="Notes" value={form.notes} onChange={e => f("notes", e.target.value)} placeholder="Notes about this supplier..." />
      </div>
    </Modal>
  );
}
