"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle } from "lucide-react";
import { LoadingSpinner, Select } from "@/components/ui";

interface Product {
  id: number;
  name: string;
  sku: string;
  price: string;
  cost: string;
  stock: number;
  unit: string;
  image: string | null;
  status: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Customer {
  id: number;
  name: string;
  loyaltyPoints: number;
}

export default function POSModule() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState("0");
  const [success, setSuccess] = useState<number | null>(null);
  const [error, setError] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ search, status: "all", limit: "50" });
      if (search === "") params.set("status", "healthy");
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setProducts(json.data.items.filter((p: Product) => p.stock > 0));
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/customers?limit=100");
      if (!res.ok) return;
      const json = await res.json();
      setCustomers(json.data.items);
    } catch {}
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }

  function updateQty(id: number, delta: number) {
    setCart(prev => {
      return prev.map(i => {
        if (i.id !== id) return i;
        const newQty = i.quantity + delta;
        if (newQty <= 0) return i;
        if (newQty > i.stock) return i;
        return { ...i, quantity: newQty };
      });
    });
  }

  function removeFromCart(id: number) {
    setCart(prev => prev.filter(i => i.id !== id));
  }

  const subtotal = cart.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
  const discountAmount = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - discountAmount);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) { setError("Cart is empty"); return; }
    if (submitting) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer || null,
          items: cart.map(i => ({ productId: i.id, quantity: i.quantity })),
          paymentMethod,
          discount: discountAmount.toFixed(2),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Checkout failed"); return; }

      setSuccess(json.data.saleId);
      setCart([]);
      setDiscount("0");
      setSelectedCustomer("");
      fetchProducts(); // Refresh stock
    } catch {
      setError("Connection error during checkout");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-green-400" />
        </div>
        <h2 className="text-white text-xl font-bold mb-1">Sale Complete!</h2>
        <p className="text-gray-400 text-sm mb-2">Sale #{success} recorded</p>
        <p className="text-green-400 font-semibold text-lg mb-6">AED {total.toFixed(2)}</p>
        <button
          onClick={() => setSuccess(null)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
        >
          New Sale
        </button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-5 gap-4 h-full">
      {/* Products Panel */}
      <div className="md:col-span-3 space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl">
          <Search size={14} className="text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products by name or SKU..."
            className="bg-transparent text-gray-300 text-sm outline-none flex-1 placeholder:text-gray-600"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size={28} /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            {search ? "No matching products with stock" : "No products in stock"}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
            {products.map((product) => {
              const inCart = cart.find(i => i.id === product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={inCart ? inCart.quantity >= product.stock : false}
                  className={`bg-gray-900 border rounded-xl p-3 text-left hover:border-blue-500/50 transition-all ${inCart ? "border-blue-500/40 bg-blue-500/5" : "border-gray-800"} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{product.image || "📦"}</span>
                    <div className="min-w-0">
                      <div className="text-white text-xs font-medium truncate">{product.name}</div>
                      <div className="text-gray-500 text-[10px]">{product.sku}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 text-sm font-bold">AED {parseFloat(product.price).toFixed(2)}</span>
                    <span className={`text-[10px] ${product.stock <= 10 ? "text-red-400" : "text-gray-500"}`}>
                      {product.stock} {product.unit}
                    </span>
                  </div>
                  {inCart && (
                    <div className="mt-1 text-[10px] text-blue-400 font-medium">
                      × {inCart.quantity} in cart
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Panel */}
      <div className="md:col-span-2">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart size={16} className="text-blue-400" />
            <span className="text-white font-semibold text-sm">Cart</span>
            {cart.length > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">
                {cart.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
              Select products to add to cart
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 mb-3">
              {cart.map((item) => (
                <div key={item.id} className="bg-gray-800 rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white text-xs font-medium flex-1 truncate">{item.name}</span>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-600 hover:text-red-400 ml-1">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => item.quantity <= 1 ? removeFromCart(item.id) : updateQty(item.id, -1)}
                        className="w-6 h-6 rounded bg-gray-700 text-gray-300 flex items-center justify-center hover:bg-gray-600"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-white text-xs w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-6 h-6 rounded bg-gray-700 text-gray-300 flex items-center justify-center hover:bg-gray-600 disabled:opacity-40"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                    <span className="text-blue-400 text-xs font-semibold">
                      AED {(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Checkout Form */}
          <form onSubmit={handleCheckout} className="space-y-3 border-t border-gray-800 pt-3">
            <Select
              label="Customer (optional)"
              value={selectedCustomer}
              onChange={e => setSelectedCustomer(e.target.value)}
              options={[
                { value: "", label: "Walk-in Customer" },
                ...customers.map(c => ({ value: String(c.id), label: c.name })),
              ]}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                label="Payment"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                options={[
                  { value: "cash", label: "💵 Cash" },
                  { value: "card", label: "💳 Card" },
                  { value: "bank_transfer", label: "🏦 Bank Transfer" },
                ]}
              />
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Discount AED</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:border-blue-500"
                />
              </div>
            </div>

            {cart.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-3 space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Subtotal</span><span>AED {subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-green-400">
                    <span>Discount</span><span>−AED {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-white border-t border-gray-700 pt-1 mt-1">
                  <span>Total</span><span className="text-blue-400">AED {total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {error && <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">{error}</div>}

            <button
              type="submit"
              disabled={cart.length === 0 || submitting}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            >
              {submitting ? "Processing..." : `Complete Sale · AED ${total.toFixed(2)}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
