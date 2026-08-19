"use client";

import { useEffect, useState, useCallback } from "react";
import { DollarSign, Plus, CheckCircle, Trash2 } from "lucide-react";
import { Card, SectionHeader, Badge, LoadingSpinner, Modal, Input, Select, EmptyState } from "@/components/ui";

interface Expense {
  id: number;
  name: string;
  amount: string;
  category: string | null;
  type: string;
  dueDay: number | null;
  isPaid: boolean;
  month: number;
  year: number;
  notes: string | null;
}

interface ExpenseData {
  items: Expense[];
  total: number;
  paid: number;
  remaining: number;
  month: number;
  year: number;
}

export default function CashFlowModule() {
  const [data, setData] = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState("");
  const [error, setError] = useState("");

  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/expenses?month=${month}&year=${year}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setData(json.data);
    } catch {
      setError("Failed to load cash flow data");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  function showNotif(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  }

  async function togglePaid(expense: Expense) {
    const res = await fetch(`/api/expenses/${expense.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPaid: !expense.isPaid }),
    });
    if (res.ok) {
      fetchExpenses();
      showNotif(expense.isPaid ? "Marked as unpaid" : "Marked as paid");
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete expense "${name}"?`)) return;
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) { fetchExpenses(); showNotif("Expense deleted"); }
  }

  const fmtAED = (n: number) => `AED ${n.toLocaleString("en", { maximumFractionDigits: 0 })}`;
  const monthName = new Date(year, month - 1).toLocaleDateString("en", { month: "long", year: "numeric" });

  return (
    <div className="space-y-5">
      {notification && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-medium shadow-lg">
          ✓ {notification}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-500/20 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
            <DollarSign size={20} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold">Cash Flow Forecast</div>
            <div className="text-emerald-300 text-xs">{monthName} — Payment Schedule</div>
          </div>
        </div>

        {loading ? <LoadingSpinner size={20} /> : data && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-900/60 rounded-lg p-2.5 text-center">
              <div className="text-red-400 text-xl font-bold">{fmtAED(data.total)}</div>
              <div className="text-gray-500 text-[10px]">Total Obligations</div>
            </div>
            <div className="bg-gray-900/60 rounded-lg p-2.5 text-center">
              <div className="text-green-400 text-xl font-bold">{fmtAED(data.paid)}</div>
              <div className="text-gray-500 text-[10px]">Paid</div>
            </div>
            <div className="bg-gray-900/60 rounded-lg p-2.5 text-center">
              <div className="text-yellow-400 text-xl font-bold">{fmtAED(data.remaining)}</div>
              <div className="text-gray-500 text-[10px]">Remaining</div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium"
        >
          <Plus size={14} /> Add Expense
        </button>
      </div>

      {error && <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size={28} /></div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon="💸" title="No expenses recorded" description="Add your monthly expenses to track cash flow" />
      ) : (
        <div className="space-y-3">
          <Card>
            <SectionHeader title="Payment Schedule" subtitle={`${data.items.length} obligations this month`} />
            <div className="space-y-2">
              {data.items.map((expense) => (
                <div
                  key={expense.id}
                  className={`flex items-center gap-3 py-3 border-b border-gray-800/50 last:border-0 ${expense.isPaid ? "opacity-60" : ""}`}
                >
                  <span className="text-xl">{expense.type === "supplier" ? "🚚" : expense.category === "Payroll" ? "👥" : expense.category === "Rent" ? "🏢" : "📋"}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${expense.isPaid ? "text-gray-500 line-through" : "text-white"}`}>
                      {expense.name}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {expense.dueDay ? `Due: Day ${expense.dueDay}` : "No due date"} · {expense.category}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${expense.isPaid ? "text-gray-500" : expense.type === "fixed" && parseFloat(expense.amount) > 10000 ? "text-red-400" : "text-orange-400"}`}>
                      {fmtAED(parseFloat(expense.amount))}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {expense.isPaid ? "✓ Paid" : expense.type === "fixed" && parseFloat(expense.amount) > 20000 ? "Large" : "Planned"}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => togglePaid(expense)}
                      className={`p-1.5 rounded-lg ${expense.isPaid ? "text-green-400 bg-green-500/15 border border-green-500/25" : "text-gray-500 hover:text-green-400 hover:bg-green-500/10"}`}
                    >
                      <CheckCircle size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id, expense.name)}
                      className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Progress Bar */}
          <Card>
            <SectionHeader title="Payment Progress" subtitle={`${Math.round((data.paid / Math.max(1, data.total)) * 100)}% of obligations paid`} />
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
                style={{ width: `${Math.min(100, (data.paid / Math.max(1, data.total)) * 100)}%`, transition: "width 500ms" }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>{fmtAED(data.paid)} paid</span>
              <span>{fmtAED(data.remaining)} remaining</span>
            </div>
          </Card>
        </div>
      )}

      {showAddModal && (
        <AddExpenseModal
          month={month}
          year={year}
          onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); fetchExpenses(); showNotif("Expense added"); }}
        />
      )}
    </div>
  );
}

function AddExpenseModal({ month, year, onClose, onSaved }: { month: number; year: number; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "", amount: "", category: "Supplier", type: "supplier", dueDay: "", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name required"); return; }
    if (!form.amount || isNaN(parseFloat(form.amount))) { setError("Valid amount required"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, month, year }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Failed"); return; }
      onSaved();
    } catch { setError("Connection error"); } finally { setLoading(false); }
  }

  const f = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Modal isOpen title="Add Expense" onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-800 text-gray-400 rounded-xl text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </div>
      }
    >
      {error && <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
      <div className="space-y-3">
        <Input label="Expense Name" value={form.name} onChange={e => f("name", e.target.value)} placeholder="Al Rawabi Dairy" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Amount (AED)" type="number" step="0.01" value={form.amount} onChange={e => f("amount", e.target.value)} placeholder="18400" />
          <Input label="Due Day of Month" type="number" min="1" max="31" value={form.dueDay} onChange={e => f("dueDay", e.target.value)} placeholder="5" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" value={form.category} onChange={e => f("category", e.target.value)} options={[
            { value: "Supplier", label: "Supplier" },
            { value: "Rent", label: "Rent" },
            { value: "Utilities", label: "Utilities" },
            { value: "Payroll", label: "Payroll" },
            { value: "Operations", label: "Operations" },
            { value: "Other", label: "Other" },
          ]} />
          <Select label="Type" value={form.type} onChange={e => f("type", e.target.value)} options={[
            { value: "supplier", label: "Supplier" },
            { value: "fixed", label: "Fixed Cost" },
            { value: "variable", label: "Variable" },
          ]} />
        </div>
        <Input label="Notes (optional)" value={form.notes} onChange={e => f("notes", e.target.value)} placeholder="Monthly delivery payment" />
      </div>
    </Modal>
  );
}
