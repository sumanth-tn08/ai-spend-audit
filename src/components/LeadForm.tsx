import React, { useState } from "react";
import { Mail, Shield, Sparkles, Building2, UserCircle, Calendar, CheckCircle2 } from "lucide-react";

interface LeadFormProps {
  auditId: string;
  totalSavingsMonthly: number;
  onLeadSuccess: (email: string) => void;
}

export default function LeadForm({ auditId, totalSavingsMonthly, onLeadSuccess }: LeadFormProps) {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [website, setWebsite] = useState(""); // Honeypot spam defense field
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const isHighSavings = totalSavingsMonthly >= 500;

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !auditId) {
      setError("Email address is required.");
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          companyName,
          role,
          teamSize: teamSize ? Number(teamSize) : undefined,
          auditId,
          website // Inject honeypot value to check validation
        })
      });
      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Failed to submit lead capture");
      }

      setSuccess(true);
      onLeadSuccess(email);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong. Please check your network and retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8 space-y-6">
      {/* High-Savings Call to Action Header */}
      {isHighSavings ? (
        <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-display font-semibold text-lg">
            <Sparkles size={20} className="text-emerald-700" />
            <h2>Unlock Enterprise Bulks with Credex Consultation</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your organization is on track to save a massive <strong className="text-emerald-700 font-mono">${totalSavingsMonthly.toFixed(2)}/mo</strong>. SpendOptic has discovered significant contract inefficiencies. Lock in direct committed-use volume discounts, centralize multiple platform credentials, and run seamless enterprise procurement audits.
          </p>
          <div className="pt-2">
            <a
              href="mailto:consulting@credex.ai?subject=AI Procurement Audit consultation Request"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-display font-medium px-5 py-2.5 rounded-lg text-sm transition-all shadow-sm"
            >
              <Calendar size={16} /> Book Consultation
            </a>
          </div>
        </div>
      ) : null}

      {/* Main Lead Form Body */}
      <div className="space-y-4">
        <h3 className="text-lg md:text-xl font-display font-semibold text-slate-900 flex items-center gap-2">
          <Mail size={18} className="text-indigo-600" />
          Email Me the Full Shareable Report
        </h3>
        <p className="text-xs text-slate-500">
          Enter your details below to lock in these recommendations, configure recurring notifications when new vendor optimizations apply, and receive your private shareable link.
        </p>

        {success ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-3">
            <div className="flex justify-center text-emerald-600">
              <CheckCircle2 size={36} />
            </div>
            <h4 className="text-base font-semibold text-slate-900">Full Audit Report Captured!</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              We have generated your private report and logged a transaction summary confirmation email (logged to the development terminal / console!). Use the unique URL at the top to share these insights with team members.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitLead} className="space-y-4">
            {/* Honeypot Field - Hidden both visually and structurally */}
            <div className="hidden absolute left-[-9999px]" aria-hidden="true">
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Leave this empty to proceed"
                tabIndex={-1}
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Direct Work Email *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@organization.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Company Name (Optional)</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Job Role / Job Title (Optional)</label>
                  <div className="relative">
                    <UserCircle size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Engineering Lead"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error ? (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-display font-semibold py-3 rounded-lg text-sm transition transition-all duration-150 cursor-pointer shadow-sm"
            >
              {isSubmitting ? "Locking In Report..." : "Save My Detailed Audit Report"}
            </button>

            <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
              <Shield size={11} className="text-indigo-600" />
              We enforce full email privacy: PII is always stripped on public shared URLs. No logins required to inspect core data.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
