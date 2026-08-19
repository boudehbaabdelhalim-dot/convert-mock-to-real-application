"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, BarChart3 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@smartstock.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");

    if (!email.trim()) { setError("Email is required"); return; }
    if (!password) { setError("Password is required"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 mb-4">
            <BarChart3 size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">SmartStock AI</h1>
          <p className="text-gray-400 text-sm mt-1">Intelligent Business Management</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Sign In</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus-within:border-blue-500">
                <Mail size={16} className="text-gray-500 flex-shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@smartstock.com"
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-600"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus-within:border-blue-500">
                <Lock size={16} className="text-gray-500 flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-600"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-gray-500 text-xs text-center">Demo Credentials</p>
            <div className="mt-2 space-y-1 text-xs text-gray-600 text-center">
              <div>Admin: admin@smartstock.com / admin123</div>
              <div>Manager: manager@smartstock.com / manager123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
