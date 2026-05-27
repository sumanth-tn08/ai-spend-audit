import React, { useState, useEffect } from "react";
import SpendInputForm from "./components/SpendInputForm";
import AuditResults from "./components/AuditResults";
import { AuditInput, AuditResult } from "./types";
import { TrendingDown, Coins, Sparkles, Building, PlayCircle, Layers, CheckCircle } from "lucide-react";

export default function App() {
  const [activeAudit, setActiveAudit] = useState<AuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Simple client-side routing matching /share/:id or fallback query params
  useEffect(() => {
    const checkPathForShare = async () => {
      const path = window.location.pathname;
      const shareMatch = path.match(/\/share\/([a-zA-Z0-9_\-]+)/);
      const urlParams = new URLSearchParams(window.location.search);
      const queryAuditId = urlParams.get("auditId");
      const idToFetch = shareMatch ? shareMatch[1] : queryAuditId;

      if (idToFetch) {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/audit/${idToFetch}`);
          const data = await res.json();
          if (res.ok && data.success) {
            setActiveAudit(data.data);
          } else {
            setErrorMsg(data.error || "Shareable audit report not found.");
          }
        } catch (err) {
          setErrorMsg("Could not connect to server to fetch report.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    checkPathForShare();
  }, []);

  const handleRunAudit = async (input: AuditInput) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActiveAudit(data.data);
      } else {
        setErrorMsg(data.error || "An error occurred with the audit analysis calculations.");
      }
    } catch (err) {
      setErrorMsg("Failed to connect to the spend audit service.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setActiveAudit(null);
    setErrorMsg("");
    // Strip URL parameters securely to navigate back to clean home
    window.history.pushState({}, "", "/");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative overflow-hidden font-sans">
      {/* Subtle clean ambient background highlights */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Main Global Header Navigation */}
      <nav className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">
            <Coins size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 font-display flex items-center gap-1.5">
            SpendOptic <span className="text-indigo-600 text-[10px] uppercase tracking-wider bg-indigo-50 px-2.2 py-0.5 rounded-full font-mono font-bold border border-indigo-100">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
          <span className="hidden sm:inline">No login required</span>
          <div className="h-4 w-px bg-slate-200 hidden sm:inline"></div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Audit Engine 1.0
          </a>
        </div>
      </nav>

      {/* Primary Landing Page Hero Section */}
      <main className="flex-1 py-8 px-4 md:px-6 max-w-6xl w-full mx-auto space-y-12">
        {errorMsg && (
          <div className="w-full max-w-4xl mx-auto bg-red-50 border border-red-200 p-4 rounded-xl text-xs text-red-600">
            {errorMsg}
          </div>
        )}

        {isLoading ? (
          <div className="w-full max-w-md mx-auto text-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="text-lg font-display font-semibold text-slate-900">Analyzing AI Tool Subscriptions...</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Applying deterministic contract optimization rules, checking for seat-allocation runaways, and asking Gemini models backends for a strategic CFO audit layout paragraph. Just one moment.
            </p>
          </div>
        ) : activeAudit ? (
          <AuditResults audit={activeAudit} onReset={handleReset} />
        ) : (
          <div className="space-y-12">
            {/* Visual Header Text Section */}
            <div className="text-center max-w-3xl mx-auto space-y-4 pt-6">
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 text-xs text-indigo-600 font-semibold">
                <Sparkles size={14} className="text-indigo-500" />
                <span>Instant, Deterministic Cloud Tool Spend Assessment</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-slate-900">
                Audit your AI tool spend, <span className="text-indigo-600 underline decoration-indigo-500/35">instantly</span>.
              </h1>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
                No complex billing or credential sheets required. Enter your active AI subscription plans to run deterministic optimization models checking for redundant systems, seat over-allocation, and contractual pricing cliffs. Get a personalized CFO summary in under 4 seconds.
              </p>
            </div>

            {/* Structured Value Proposition Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="flex gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                <TrendingDown size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-900">Consolidate Redundancies</h4>
                  <p className="text-xs text-slate-500 leading-normal">Flags multiple active prompt assistants (Claude vs ChatGPT Plus) or autoclodes (Cursor vs Copilot).</p>
                </div>
              </div>

              <div className="flex gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                <Building size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-900 font-display">Detect Orphan Seating</h4>
                  <p className="text-xs text-slate-500 leading-normal font-sans">Compare license allocations against active developer counts to instantly trim wasted overhead.</p>
                </div>
              </div>

              <div className="flex gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                <CheckCircle size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-900">Free & Private</h4>
                  <p className="text-xs text-slate-500 leading-normal">PII remains 100% excluded. Only input work criteria and emails after core savings value is proven.</p>
                </div>
              </div>
            </div>

            {/* SpendInputForm section */}
            <SpendInputForm onSubmit={handleRunAudit} isLoading={isLoading} />
          </div>
        )}
      </main>

      {/* Sticky Global Informational Footer */}
      <footer className="w-full bg-slate-100 border-t border-slate-200 px-8 py-6 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest mt-12 gap-2">
        <span>© 2026 SpendOptic. Powered by deterministic business logic frameworks.</span>
        <span>Pricing verified: May 2026</span>
        <span>System Status: Healthy</span>
      </footer>
    </div>
  );
}
