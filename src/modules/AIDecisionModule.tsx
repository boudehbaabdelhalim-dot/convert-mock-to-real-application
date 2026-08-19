"use client";

import { useEffect, useState, useCallback } from "react";
import { Brain, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Card, SectionHeader, Badge, LoadingSpinner, EmptyState } from "@/components/ui";

interface AiDecision {
  id: number;
  title: string;
  description: string;
  type: string;
  agent: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "approved" | "rejected";
  recommendation: string | null;
  expectedImpact: string | null;
  confidence: number;
  risk: string;
  dataUsed: string | null;
  approvedAt: string | null;
  createdAt: string;
}

const PRIORITY_CONFIG = {
  critical: { label: "CRITICAL", variant: "danger" as const },
  high: { label: "HIGH", variant: "warning" as const },
  medium: { label: "MEDIUM", variant: "info" as const },
  low: { label: "LOW", variant: "neutral" as const },
};

const TYPE_ICONS: Record<string, string> = {
  purchase: "📦",
  pricing: "💰",
  promotion: "📣",
  inventory: "📊",
  hiring: "👤",
};

export default function AIDecisionModule() {
  const [decisions, setDecisions] = useState<AiDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [processing, setProcessing] = useState<number | null>(null);
  const [notification, setNotification] = useState("");
  const [error, setError] = useState("");

  const fetchDecisions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ai-decisions?filter=${filter}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setDecisions(json.data.items);
    } catch {
      setError("Failed to load AI decisions");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchDecisions(); }, [fetchDecisions]);

  function showNotif(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  }

  async function handleAction(id: number, action: "approve" | "reject") {
    if (processing) return;
    setProcessing(id);
    setError("");
    try {
      const res = await fetch(`/api/ai-decisions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Action failed"); return; }

      setDecisions(prev => prev.map(d => d.id === id ? { ...d, status: action === "approve" ? "approved" : "rejected" } : d));
      showNotif(action === "approve" ? "✓ Decision approved & queued for execution" : "Decision rejected");
    } catch {
      setError("Connection error");
    } finally {
      setProcessing(null);
    }
  }

  const pending = decisions.filter(d => d.status === "pending");
  const approved = decisions.filter(d => d.status === "approved");

  const filtered = filter === "all" ? decisions
    : decisions.filter(d => d.priority === filter || d.type === filter || d.status === filter);

  return (
    <div className="space-y-5">
      {notification && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-medium shadow-lg">
          {notification}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-violet-900/30 to-blue-900/30 border border-violet-500/20 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold">AI Decision Center</div>
            <div className="text-violet-300 text-xs">Human-in-the-loop approval workflow</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900/60 rounded-lg p-2.5 text-center">
            <div className={`text-xl font-bold ${pending.length > 0 ? "text-yellow-400" : "text-green-400"}`}>{pending.length}</div>
            <div className="text-gray-500 text-[10px]">Pending Approval</div>
          </div>
          <div className="bg-gray-900/60 rounded-lg p-2.5 text-center">
            <div className="text-xl font-bold text-green-400">{approved.length}</div>
            <div className="text-gray-500 text-[10px]">Approved</div>
          </div>
          <div className="bg-gray-900/60 rounded-lg p-2.5 text-center">
            <div className="text-xl font-bold text-blue-400">{decisions.length}</div>
            <div className="text-gray-500 text-[10px]">Total Decisions</div>
          </div>
        </div>
      </div>

      {/* Workflow */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="text-gray-400 text-xs font-medium mb-2">Approval Workflow</div>
        <div className="flex items-center gap-1">
          {["REQUEST", "REVIEW", "APPROVE", "EXECUTE", "AUDIT"].map((step, i) => (
            <div key={step} className="flex items-center gap-1 flex-1">
              <div className="flex-1 bg-gray-800 rounded-lg py-1.5 text-center text-[10px] text-gray-300 font-medium">
                {step}
              </div>
              {i < 4 && <div className="text-gray-600 text-xs">→</div>}
            </div>
          ))}
        </div>
        <div className="text-gray-600 text-[10px] mt-1 text-center">
          AI recommends → Human reviews → Human approves → System executes → Full audit trail
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {["all", "pending", "approved", "rejected", "critical", "high", "purchase", "pricing", "promotion"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border capitalize ${filter === f ? "border-violet-500/50 bg-violet-500/15 text-violet-400" : "border-gray-700 text-gray-500 hover:border-gray-600"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error} <button onClick={() => setError("")} className="ml-2 opacity-60">×</button></div>}

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size={28} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🤖" title="No decisions found" description="AI will generate recommendations based on your business data" />
      ) : (
        <div className="space-y-3">
          {filtered.map((decision) => {
            const priorityCfg = PRIORITY_CONFIG[decision.priority];
            const isExpanded = expandedId === decision.id;
            const dataUsed: string[] = decision.dataUsed ? JSON.parse(decision.dataUsed) : [];

            return (
              <div
                key={decision.id}
                className={`bg-gray-900 border rounded-xl p-4 ${decision.status === "pending" ? "border-yellow-500/20" : decision.status === "approved" ? "border-green-500/20" : "border-gray-800"}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{TYPE_ICONS[decision.type] || "🤖"}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={priorityCfg.variant}>{priorityCfg.label}</Badge>
                        <span className="text-gray-500 text-[10px]">{decision.agent}</span>
                        <span className="text-gray-600 text-[10px]">· {new Date(decision.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-white font-semibold text-sm mt-0.5">{decision.title}</div>
                    </div>
                  </div>
                  {decision.status === "approved" && <span className="text-green-400 text-xs font-medium flex items-center gap-1"><CheckCircle size={12} /> Approved</span>}
                  {decision.status === "rejected" && <span className="text-red-400 text-xs font-medium flex items-center gap-1"><XCircle size={12} /> Rejected</span>}
                </div>

                <p className="text-gray-400 text-xs mb-3">{decision.description}</p>

                {/* Recommendation Box */}
                <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3 mb-3">
                  <div className="text-blue-400 text-[10px] font-semibold mb-1">AI RECOMMENDATION</div>
                  <div className="text-gray-300 text-xs mb-2">{decision.recommendation}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400 text-xs font-medium">{decision.expectedImpact}</span>
                    <span className="text-blue-300 text-[10px]">{decision.confidence}% confidence</span>
                    <span className="text-gray-500 text-[10px]">Risk: {decision.risk}</span>
                  </div>
                </div>

                {/* Expandable Data */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : decision.id)}
                  className="flex items-center gap-1 text-gray-500 text-xs hover:text-gray-300 mb-3"
                >
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {isExpanded ? "Hide" : "Show"} data used
                </button>

                {isExpanded && dataUsed.length > 0 && (
                  <div className="mb-3 px-3 py-2 bg-gray-800 rounded-lg space-y-1">
                    <div className="text-gray-500 text-[10px] font-medium mb-1">DATA USED IN ANALYSIS</div>
                    {dataUsed.map((d, i) => (
                      <div key={i} className="text-gray-400 text-[10px] flex items-center gap-1.5">
                        <span className="text-blue-500">·</span> {d}
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {decision.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      disabled={processing === decision.id}
                      onClick={() => handleAction(decision.id, "approve")}
                      className="flex-1 py-2 bg-green-600/90 hover:bg-green-600 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle size={12} />
                      {processing === decision.id ? "Processing..." : "Approve & Execute"}
                    </button>
                    <button
                      disabled={processing === decision.id}
                      onClick={() => handleAction(decision.id, "reject")}
                      className="flex-1 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border border-red-500/25 disabled:opacity-50"
                    >
                      <XCircle size={12} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
