"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Plus, Package, AlertTriangle, Edit, Trash2, ChevronDown } from "lucide-react";
import { Card, SectionHeader, Badge, LoadingSpinner, Modal, Input, Select, EmptyState } from "@/components/ui";

type Status = "healthy" | "low_stock" | "critical" | "dead_stock";

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  brand: string | null;
  price: string;
  cost: string;
  stock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  image: string | null;
  status: Status;
  dailySales: string;
  healthScore: number;
  categoryId: number | null;
  supplierId: number | null;
}

interface PageData {
  items: Product[];
  page: number;
  total: number;
  pages: number;
}

const STATUS_CONFIG: Record<Status, { label: string; variant: "success" | "warning" | "danger" | "neutral" }> = {
  healthy: { label: "Healthy", variant: "success" },
  low_stock: { label: "Low Stock", variant: "warning" },
  critical: { label: "Critical", variant: "danger" },
  dead_stock: { label: "Dead Stock", variant: "neutral" },
};

const EMOJIS = ["📦", "🥛", "🍞", "🫒", "🧀", "🍅", "🥕", "🌽", "🍊", "🥤", "🌻", "🍫", "☕", "🥚"];

export default function InventoryModule() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ search, status: filterStatus, page: String(page), limit: "20" });
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setData(json.data);
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  function showNotif(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      showNotif("Product deleted");
      fetchProducts();
    } else {
      const json = await res.json();
      setError(json.error || "Delete failed");
    }
  }

  const stats = data
    ? {
        total: data.total,
        healthy: data.items.filter(p => p.status === "healthy").length,
        lowStock: data.items.filter(p => p.status === "low_stock").length,
        critical: data.items.filter(p => p.status === "critical").length,
        deadStock: data.items.filter(p => p.status === "dead_stock").length,
      }
    : null;

  return (
    <div className="space-y-5">
      {notification && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-medium shadow-lg">
          ✓ {notification}
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: "Total SKUs", value: data?.total ?? 0, color: "text-white" },
          { label: "Healthy", value: stats?.healthy ?? 0, color: "text-green-400" },
          { label: "Low Stock", value: stats?.lowStock ?? 0, color: "text-yellow-400" },
          { label: "Critical", value: stats?.critical ?? 0, color: "text-red-400" },
          { label: "Dead Stock", value: stats?.deadStock ?? 0, color: "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-gray-500 text-[10px] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl flex-1 min-w-48">
          <Search size={14} className="text-gray-500" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, SKU or barcode..."
            className="bg-transparent text-gray-300 text-sm outline-none flex-1 placeholder:text-gray-600"
          />
        </div>
        <div className="flex gap-1">
          {["all", "healthy", "low_stock", "critical", "dead_stock"].map((s) => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-medium border ${filterStatus === s ? "border-blue-500/50 bg-blue-500/15 text-blue-400" : "border-gray-700 text-gray-500 hover:border-gray-600"}`}
            >
              {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium"
        >
          <Plus size={14} /> Add Product
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 opacity-60">×</button>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size={28} /></div>
      ) : data?.items.length === 0 ? (
        <EmptyState icon={<Package />} title="No products found" description="Try adjusting your search or filters" />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data?.items.map((product) => {
            const statusCfg = STATUS_CONFIG[product.status];
            const stockPct = Math.min((product.stock / Math.max(1, product.maxStock)) * 100, 100);
            const daysLeft = parseFloat(product.dailySales) > 0
              ? Math.ceil(product.stock / parseFloat(product.dailySales))
              : null;

            return (
              <div key={product.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{product.image || "📦"}</span>
                    <div>
                      <div className="text-white text-sm font-medium leading-tight">{product.name}</div>
                      <div className="text-gray-500 text-[10px]">{product.sku} {product.brand ? `· ${product.brand}` : ""}</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${product.healthScore >= 70 ? "text-green-400" : product.healthScore >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                      {product.healthScore}
                    </div>
                    <div className="text-gray-600 text-[9px]">HEALTH</div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Stock: <span className="text-white font-medium">{product.stock}</span></span>
                    <span>Max: {product.maxStock}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${product.status === "healthy" ? "bg-green-500" : product.status === "low_stock" ? "bg-yellow-500" : product.status === "critical" ? "bg-red-500" : "bg-gray-600"}`}
                      style={{ width: `${stockPct}%` }}
                    />
                  </div>
                  <div className="text-gray-600 text-[10px] mt-1">Min: {product.minStock} units</div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-gray-800/60 rounded-lg p-2 text-center">
                    <div className="text-white text-xs font-semibold">AED {parseFloat(product.price).toFixed(0)}</div>
                    <div className="text-gray-500 text-[9px]">Price</div>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg p-2 text-center">
                    <div className="text-green-400 text-xs font-semibold">
                      {product.price && product.cost ? `${(((parseFloat(product.price) - parseFloat(product.cost)) / parseFloat(product.price)) * 100).toFixed(0)}%` : "-"}
                    </div>
                    <div className="text-gray-500 text-[9px]">Margin</div>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg p-2 text-center">
                    <div className="text-blue-400 text-xs font-semibold">
                      {parseFloat(product.dailySales) > 0 ? `${parseFloat(product.dailySales)}/d` : "—"}
                    </div>
                    <div className="text-gray-500 text-[9px]">Velocity</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                    {daysLeft !== null && daysLeft <= 7 && (
                      <Badge variant="danger">{daysLeft}d left</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowStockModal(product)}
                      className="px-2 py-1 bg-green-500/15 text-green-400 rounded-lg text-[10px] font-medium hover:bg-green-500/25 border border-green-500/20"
                    >
                      + Stock
                    </button>
                    <button
                      onClick={() => setEditProduct(product)}
                      className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {(product.status === "critical" || product.status === "low_stock") && (
                  <div className="mt-2 px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="text-red-400 text-[10px] flex items-center gap-1">
                      <AlertTriangle size={10} />
                      {daysLeft !== null ? `Will deplete in ${daysLeft} days` : "Low stock — reorder needed"}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-gray-500 text-sm">Page {page} of {data.pages}</span>
          <button
            disabled={page === data.pages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {(showAddModal || editProduct) && (
        <ProductFormModal
          product={editProduct}
          onClose={() => { setShowAddModal(false); setEditProduct(null); }}
          onSaved={() => { setShowAddModal(false); setEditProduct(null); fetchProducts(); showNotif(editProduct ? "Product updated" : "Product created"); }}
        />
      )}

      {/* Stock Adjustment Modal */}
      {showStockModal && (
        <StockAdjustModal
          product={showStockModal}
          onClose={() => setShowStockModal(null)}
          onSaved={() => { setShowStockModal(null); fetchProducts(); showNotif("Stock updated"); }}
        />
      )}
    </div>
  );
}

// ─── Product Form Modal ───────────────────────────────────────────────────────
function ProductFormModal({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    barcode: product?.barcode || "",
    brand: product?.brand || "",
    price: product?.price ? parseFloat(product.price).toString() : "",
    cost: product?.cost ? parseFloat(product.cost).toString() : "",
    stock: product?.stock?.toString() || "0",
    minStock: product?.minStock?.toString() || "10",
    maxStock: product?.maxStock?.toString() || "200",
    unit: product?.unit || "unit",
    image: product?.image || "📦",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.sku.trim()) { setError("SKU is required"); return; }
    if (!form.price || isNaN(parseFloat(form.price))) { setError("Valid price is required"); return; }
    if (!form.cost || isNaN(parseFloat(form.cost))) { setError("Valid cost is required"); return; }

    setLoading(true);
    setError("");
    try {
      const url = product ? `/api/products/${product.id}` : "/api/products";
      const method = product ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Save failed"); return; }
      onSaved();
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  const f = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <Modal isOpen title={product ? "Edit Product" : "Add Product"} onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-800 text-gray-400 rounded-xl text-sm">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Saving..." : product ? "Update" : "Create"}
          </button>
        </div>
      }
    >
      {error && <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Product Name" value={form.name} onChange={e => f("name", e.target.value)} placeholder="Fresh Milk 1L" className="col-span-2" />
          <Input label="SKU" value={form.sku} onChange={e => f("sku", e.target.value)} placeholder="MLK-001" disabled={!!product} />
          <Input label="Barcode" value={form.barcode} onChange={e => f("barcode", e.target.value)} placeholder="6291003..." />
          <Input label="Brand" value={form.brand} onChange={e => f("brand", e.target.value)} placeholder="Al Rawabi" />
          <Input label="Unit" value={form.unit} onChange={e => f("unit", e.target.value)} placeholder="bottle" />
          <Input label="Price (AED)" type="number" step="0.01" value={form.price} onChange={e => f("price", e.target.value)} placeholder="5.50" />
          <Input label="Cost (AED)" type="number" step="0.01" value={form.cost} onChange={e => f("cost", e.target.value)} placeholder="3.20" />
          {!product && (
            <Input label="Initial Stock" type="number" value={form.stock} onChange={e => f("stock", e.target.value)} placeholder="100" />
          )}
          <Input label="Min Stock" type="number" value={form.minStock} onChange={e => f("minStock", e.target.value)} placeholder="10" />
          <Input label="Max Stock" type="number" value={form.maxStock} onChange={e => f("maxStock", e.target.value)} placeholder="200" />
        </div>
        <div>
          <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Emoji Icon</label>
          <div className="flex flex-wrap gap-1.5">
            {EMOJIS.map(em => (
              <button
                key={em}
                type="button"
                onClick={() => f("image", em)}
                className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center ${form.image === em ? "bg-blue-500/20 border border-blue-500/50" : "bg-gray-800 border border-gray-700 hover:border-gray-600"}`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Stock Adjustment Modal ───────────────────────────────────────────────────
function StockAdjustModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const [quantity, setQuantity] = useState("0");
  const [type, setType] = useState<"purchase" | "adjustment" | "waste" | "return">("purchase");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty === 0) { setError("Enter a non-zero quantity"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${product.id}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty, type, reason }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Failed"); return; }
      onSaved();
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen title={`Adjust Stock — ${product.name}`} onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-800 text-gray-400 rounded-xl text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {loading ? "Saving..." : "Update Stock"}
          </button>
        </div>
      }
    >
      {error && <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
      <div className="mb-4 px-3 py-2.5 bg-gray-800 rounded-xl">
        <span className="text-gray-400 text-sm">Current Stock: </span>
        <span className="text-white font-bold">{product.stock} {product.unit}</span>
      </div>
      <div className="space-y-3">
        <Select
          label="Movement Type"
          value={type}
          onChange={e => setType(e.target.value as typeof type)}
          options={[
            { value: "purchase", label: "📦 Purchase / Restock (+)" },
            { value: "return", label: "↩️ Customer Return (+)" },
            { value: "adjustment", label: "✏️ Manual Adjustment (±)" },
            { value: "waste", label: "🗑️ Waste / Damaged (−)" },
          ]}
        />
        <Input
          label={`Quantity (${type === "waste" ? "use negative" : "positive to add"})`}
          type="number"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          placeholder="e.g. 50"
        />
        <Input label="Reason (optional)" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Weekly restock from supplier" />
        {quantity && !isNaN(parseInt(quantity)) && (
          <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-sm">
            New stock will be: <strong>{product.stock + parseInt(quantity)}</strong> {product.unit}
          </div>
        )}
      </div>
    </Modal>
  );
}
