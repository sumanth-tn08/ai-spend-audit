import React, { useState } from "react";
import { AuditResult, ToolName } from "../types";
import { TrendingDown, Sparkles, CheckCircle, Share2, AlertTriangle, ArrowRight, RefreshCw, Copy, Check } from "lucide-react";
import LeadForm from "./LeadForm";

interface AuditResultsProps {
  audit: AuditResult;
  onReset: () => void;
  isPublicSharePage?: boolean;
}

export default function AuditResults({ audit, onReset, isPublicSharePage = false }: AuditResultsProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [capturedEmail, setCapturedEmail] = useState("");

  const handleCopyLink = () => {
    const url = `${window.location.origin}/share/${audit.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const hasSavings = audit.totalSavingsMonthly > 0;
  const isSpendingOptimal = audit.totalSavingsMonthly < 100;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Visual Report Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-55 text-indigo-600 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-indigo-100 bg-indigo-50">
              Audit Id: #{audit.id}
            </span>
            <span className="text-slate-400 text-xs font-mono">
              Generated: {new Date(audit.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-medium text-slate-900 tracking-tight" id="overall-report-title">
            Your Premium AI Tooling Audit Report
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyLink}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-sm text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer shadow-sm font-medium"
            title="Copy share link"
          >
            {copiedLink ? <Check size={16} className="text-indigo-600 font-bold" /> : <Share2 size={16} className="text-indigo-600" />}
            {copiedLink ? "Copied!" : "Share Audit URL"}
          </button>
          {!isPublicSharePage && (
            <button
              onClick={onReset}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-sm text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer shadow-sm font-medium"
            >
              <RefreshCw size={14} className="text-slate-500" /> New Audit
            </button>
          )}
        </div>
      </div>

      {/* Hero Statistics Counters Block */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Current Billed Monthly</span>
          <div className="mt-2 space-y-1">
            <span className="text-3xl font-mono font-bold text-slate-900">${audit.totalCurrentSpend.toLocaleString()}</span>
            <span className="text-xs text-slate-400 block">Across {audit.inputs.tools.length} active platforms</span>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="absolute right-4 top-4 text-emerald-600/10">
            <TrendingDown size={56} />
          </div>
          <span className="text-emerald-800 text-xs font-semibold uppercase tracking-wider">Potential Monthly Savings</span>
          <div className="mt-2 space-y-1 z-10">
            <span className="text-3xl font-mono font-bold text-emerald-600">-${audit.totalSavingsMonthly.toLocaleString()}</span>
            <span className="text-xs text-emerald-700 block text-semibold">
              {audit.totalCurrentSpend > 0 
                ? `${Math.round((audit.totalSavingsMonthly / audit.totalCurrentSpend) * 100)}% overall cost reduction` 
                : "0% reduction"
              }
            </span>
          </div>
        </div>

        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-sm">
          <span className="text-indigo-800 text-xs font-semibold uppercase tracking-wider">Estimated Annual Runway Captured</span>
          <div className="mt-2 space-y-1 z-10">
            <span className="text-3xl font-mono font-bold text-indigo-600">${audit.totalSavingsAnnual.toLocaleString()}</span>
            <span className="text-xs text-indigo-700 block text-semibold">Guaranteed baseline recurring clawback</span>
          </div>
        </div>
      </div>

      {/* Audit CFO advisory summary paragraph */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-4 text-indigo-600/5">
          <Sparkles size={48} />
        </div>
        <div className="flex items-center gap-2 text-indigo-600 font-display font-semibold text-sm uppercase tracking-wider">
          <Sparkles size={16} />
          <span>AI-Generated Personalized Audit Advisory Summary</span>
        </div>
        <p className="text-slate-700 text-sm md:text-base leading-relaxed font-sans font-normal border-l-2 border-indigo-500 pl-4 py-1">
          {audit.personalizedSummary}
        </p>
      </div>

      {/* Honest optimal spend banner for low metrics */}
      {isSpendingOptimal && (
        <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-emerald-800">You Are Spending Optimal Workloads!</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              We scanned each seat constraint against standard team profile boundaries. There are no major license runaways or redundant duplications in play. You are spending within excellent parameters. Consider signing up below to receive notifications only on relevant API tier modifications or newer competitive tool updates.
            </p>
          </div>
        </div>
      )}

      {/* Per-Tool Optimization Details Blocks */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
          Detailed Per-Tool Recommendations
        </h3>
        
        <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {audit.recommendations.map((rec) => {
            const hasRecSavings = rec.savings > 0;
            return (
              <div key={rec.toolName} className="p-5 md:p-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2.5 max-w-2xl">
                  {/* Tool Identifiers */}
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">{rec.toolName}</h4>
                    <span className="bg-slate-100 text-slate-600 text-[10px] uppercase font-mono px-2 py-0.5 rounded font-medium border border-slate-200/40">
                      Current: {rec.currentPlan}
                    </span>
                    {hasRecSavings && (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-200 uppercase font-bold">
                        Optimization Potential
                      </span>
                    )}
                  </div>
                  
                  {/* Action Roadmap */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider">Action Map:</span>
                    <span className="text-slate-600 font-mono font-semibold">{rec.currentPlan}</span>
                    <ArrowRight size={11} className="text-indigo-600" />
                    <span className="text-indigo-600 font-mono font-bold">{rec.recommendedPlan}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500">Seats: <strong className="text-slate-700 font-mono font-bold">{rec.seats}</strong></span>
                  </div>

                  {/* Optimization Reason */}
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    {rec.rationale}
                  </p>
                </div>

                {/* Financial Impact Stats Column */}
                <div className="flex md:flex-col items-center justify-between md:items-end gap-3 font-mono border-t border-slate-100 md:border-t-0 pt-3 md:pt-0 shrink-0">
                  <div className="md:text-right">
                    <span className="text-[10px] text-slate-450 uppercase tracking-wider block text-slate-400">Current Spend</span>
                    <span className="text-sm text-slate-700 font-bold">${rec.currentSpend}/mo</span>
                  </div>

                  {hasRecSavings ? (
                    <div className="md:text-right">
                      <span className="text-[10px] text-emerald-700 uppercase tracking-wider block font-bold">Est. Savings</span>
                      <span className="text-sm text-emerald-600 font-bold">-${rec.savings}/mo</span>
                    </div>
                  ) : (
                    <div className="md:text-right">
                      <span className="text-[10px] text-slate-405 uppercase tracking-wider block text-slate-400">Status</span>
                      <span className="text-xs text-slate-500 font-semibold">Spend Optimal</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lead capture module insertion */}
      {!isPublicSharePage && (
        <LeadForm
          auditId={audit.id}
          totalSavingsMonthly={audit.totalSavingsMonthly}
          onLeadSuccess={(email) => setCapturedEmail(email)}
        />
      )}
    </div>
  );
}
