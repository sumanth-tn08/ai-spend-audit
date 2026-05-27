import React, { useState, useEffect } from "react";
import { ToolName, ToolInput, UseCase, AuditInput } from "../types";
import { CreditCard, Plus, Trash2, Users, Briefcase, ChevronRight, HelpCircle } from "lucide-react";

// Catalog options to suggest
const PLAN_OPTIONS: Record<ToolName, string[]> = {
  [ToolName.Cursor]: ["Hobby", "Pro", "Business", "Enterprise"],
  [ToolName.GitHubCopilot]: ["Individual", "Business", "Enterprise"],
  [ToolName.Claude]: ["Free", "Pro", "Max", "Team", "Enterprise", "API direct"],
  [ToolName.ChatGPT]: ["Plus", "Team", "Enterprise", "API direct"],
  [ToolName.AnthropicAPIDirect]: ["API direct"],
  [ToolName.OpenAIAPIDirect]: ["API direct"],
  [ToolName.Gemini]: ["Pro", "Ultra", "API"],
  [ToolName.Windsurf]: ["Free", "Pro", "Team", "Enterprise"]
};

// Help helper for pricing guidelines
const PLAN_HELP: Record<string, string> = {
  "Cursor Pro": "$20/mo",
  "Cursor Business": "$40/mo",
  "GitHub Copilot Individual": "$10/mo",
  "GitHub Copilot Business": "$19/mo",
  "Claude Pro": "$20/mo",
  "Claude Team": "$30/mo",
  "ChatGPT Plus": "$20/mo",
  "ChatGPT Team": "$30/mo",
  "Gemini Pro": "$20/mo",
  "Gemini Ultra": "$30/mo",
  "Windsurf Pro": "$15/mo",
  "Windsurf Team": "$30/mo"
};

interface SpendInputFormProps {
  onSubmit: (data: AuditInput) => void;
  isLoading: boolean;
}

export default function SpendInputForm({ onSubmit, isLoading }: SpendInputFormProps) {
  const [teamSize, setTeamSize] = useState<number>(5);
  const [isTeamSizeManuallyEdited, setIsTeamSizeManuallyEdited] = useState<boolean>(false);
  const [primaryUseCase, setPrimaryUseCase] = useState<UseCase>("coding");
  const [inputTools, setInputTools] = useState<ToolInput[]>([]);

  // Selected tool to add
  const [selectedToolToAdd, setSelectedToolToAdd] = useState<ToolName>(ToolName.Cursor);
  const [selectedPlanToAdd, setSelectedPlanToAdd] = useState<string>("Pro");
  const [seatsToAdd, setSeatsToAdd] = useState<number>(5);
  const [spendToAdd, setSpendToAdd] = useState<number>(100);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("spendsight_audit_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.teamSize) {
          setTeamSize(parsed.teamSize);
          setIsTeamSizeManuallyEdited(true);
        }
        if (parsed.primaryUseCase) setPrimaryUseCase(parsed.primaryUseCase);
        if (Array.isArray(parsed.tools)) setInputTools(parsed.tools);
      } catch (e) {
        console.warn("Could not load form state:", e);
      }
    } else {
      // Default placeholder tools to help onboarding
      setInputTools([
        { name: ToolName.Cursor, plan: "Pro", monthlySpend: 100, seats: 5 },
        { name: ToolName.Claude, plan: "Pro", monthlySpend: 60, seats: 3 },
      ]);
    }
  }, []);

  // Sync team size with max tool seats if not manually touched
  useEffect(() => {
    if (!isTeamSizeManuallyEdited && inputTools.length > 0) {
      const maxSeats = Math.max(...inputTools.map(t => t.seats));
      if (maxSeats > 0 && maxSeats !== teamSize) {
        setTeamSize(maxSeats);
      }
    }
  }, [inputTools, isTeamSizeManuallyEdited, teamSize]);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(
      "spendsight_audit_draft",
      JSON.stringify({ teamSize, primaryUseCase, tools: inputTools })
    );
  }, [teamSize, primaryUseCase, inputTools]);

  // Handle plan auto-update based on tool changing
  const handleToolToAddChange = (tool: ToolName) => {
    setSelectedToolToAdd(tool);
    const plans = PLAN_OPTIONS[tool];
    const defaultPlan = plans[0] === "Free" || plans[0] === "Hobby" ? plans[1] || plans[0] : plans[0];
    setSelectedPlanToAdd(defaultPlan);
    updateEstimatedSpend(tool, defaultPlan, seatsToAdd);
  };

  const handlePlanToAddChange = (plan: string) => {
    setSelectedPlanToAdd(plan);
    updateEstimatedSpend(selectedToolToAdd, plan, seatsToAdd);
  };

  const handleSeatsToAddChange = (s: number) => {
    setSeatsToAdd(s);
    updateEstimatedSpend(selectedToolToAdd, selectedPlanToAdd, s);
  };

  const updateEstimatedSpend = (tool: ToolName, plan: string, seats: number) => {
    // Standard multipliers matching pricing data
    const rateBook: Record<string, number> = {
      "Cursor-Hobby": 0, "Cursor-Pro": 20, "Cursor-Business": 40, "Cursor-Enterprise": 100,
      "GitHub Copilot-Individual": 10, "GitHub Copilot-Business": 19, "GitHub Copilot-Enterprise": 39,
      "Claude-Free": 0, "Claude-Pro": 20, "Claude-Max": 40, "Claude-Team": 30, "Claude-Enterprise": 75, "Claude-API direct": 15,
      "ChatGPT-Plus": 20, "ChatGPT-Team": 30, "ChatGPT-Enterprise": 60, "ChatGPT-API direct": 15,
      "Anthropic API direct-API direct": 25,
      "OpenAI API direct-API direct": 25,
      "Gemini-Pro": 20, "Gemini-Ultra": 30, "Gemini-API": 15,
      "Windsurf-Free": 0, "Windsurf-Pro": 15, "Windsurf-Team": 30, "Windsurf-Enterprise": 60
    };
    const key = `${tool}-${plan}`;
    const rate = rateBook[key] !== undefined ? rateBook[key] : 15;
    setSpendToAdd(rate * seats);
  };

  // Add tool to audit list
  const handleAddTool = (e: React.FormEvent) => {
    e.preventDefault();
    // Exclude duplicates
    if (inputTools.some(t => t.name === selectedToolToAdd && t.plan === selectedPlanToAdd)) {
      alert(`Already added ${selectedToolToAdd} on the ${selectedPlanToAdd} plan.`);
      return;
    }

    const newTool: ToolInput = {
      name: selectedToolToAdd,
      plan: selectedPlanToAdd,
      seats: seatsToAdd,
      monthlySpend: spendToAdd
    };

    setInputTools([...inputTools, newTool]);
  };

  const handleRemoveTool = (index: number) => {
    setInputTools(inputTools.filter((_, i) => i !== index));
  };

  const handleGenerateAudit = () => {
    if (inputTools.length === 0) {
      alert("Please add at least one AI tool and subscription to calculate optimization results.");
      return;
    }
    onSubmit({
      tools: inputTools,
      teamSize,
      primaryUseCase
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
      {/* Upper Context Settings Section */}
      <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 mb-4 h-auto" id="firm-profile-title">
        1. Your Profile & Team Size
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <Users size={16} className="text-indigo-600" />
            Total Team Size
          </label>
          <input
            type="number"
            min={1}
            max={5000}
            value={teamSize}
            onChange={(e) => {
              setTeamSize(Math.max(1, Number(e.target.value)));
              setIsTeamSizeManuallyEdited(true);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
            placeholder="e.g. 5"
          />
          <p className="text-xs text-slate-500 mt-1">Used to identify idle licenses and over-allocated seats.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <Briefcase size={16} className="text-indigo-600" />
            Primary AI Workload Use Case
          </label>
          <select
            value={primaryUseCase}
            onChange={(e) => setPrimaryUseCase(e.target.value as UseCase)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
          >
            <option value="coding">Software Engineering (Coding, Debugging, API design)</option>
            <option value="writing">Content Production (Copywriting, Blogging, Sales emails)</option>
            <option value="data">Data Analysis & Modeling (Finance, SQL, Charts)</option>
            <option value="research">R&D and Document Synthesis (Knowledge extraction, Summarization)</option>
            <option value="mixed">Mixed/All-rounder Workplace Assistants</option>
          </select>
          <p className="text-xs text-slate-500 mt-1">Used to evaluate tool placement efficiency and functional redundancies.</p>
        </div>
      </div>

      {/* Tool Adder Form Section */}
      <div className="border-t border-slate-100 pt-6">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 mb-6" id="add-subscriptions-title">
          2. Add Current AI Subscriptions
        </h2>
        <form onSubmit={handleAddTool} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end bg-slate-50/50 p-4 rounded-xl border border-slate-200 mb-6">
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Select Tool</label>
            <select
              value={selectedToolToAdd}
              onChange={(e) => handleToolToAddChange(e.target.value as ToolName)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {Object.values(ToolName).map(tool => (
                <option key={tool} value={tool}>{tool}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Plan / Tier</label>
            <select
              value={selectedPlanToAdd}
              onChange={(e) => handlePlanToAddChange(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {PLAN_OPTIONS[selectedToolToAdd].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Seat Count</label>
            <input
              type="number"
              min={1}
              value={seatsToAdd}
              onChange={(e) => handleSeatsToAddChange(Math.max(1, Number(e.target.value)))}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
              Spend (USD/mo)
              <span className="text-[10px] text-indigo-600 font-mono font-bold">Catalog: {PLAN_HELP[`${selectedToolToAdd} ${selectedPlanToAdd}`] || "Dynamic"}</span>
            </label>
            <input
              type="number"
              min={0}
              value={spendToAdd}
              onChange={(e) => setSpendToAdd(Math.max(0, Number(e.target.value)))}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-slate-900 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer border border-transparent shadow-sm"
            >
              <Plus size={16} /> Add Subscription
            </button>
          </div>
        </form>

        {/* List of Added Tools */}
        <div className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Added to Audit List ({inputTools.length})</label>
          {inputTools.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
              Your audit list is currently empty. Add your AI tooling subscriptions to begin optimization analysis.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inputTools.map((tool, idx) => (
                <div key={`${tool.name}-${tool.plan}-${idx}`} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition duration-150 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{tool.name}</span>
                      <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded uppercase font-mono font-medium">{tool.plan}</span>
                    </div>
                    <div className="text-xs text-slate-500 space-x-3">
                      <span>Seats: <strong className="text-slate-800 font-mono">{tool.seats}</strong></span>
                      <span className="text-slate-300">|</span>
                      <span>Billed: <strong className="text-indigo-600 font-mono font-bold">${tool.monthlySpend}/mo</strong></span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveTool(idx)}
                    className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-slate-50 transition flex items-center"
                    title="Remove from sheet"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Primary Call to Action */}
      <div className="border-t border-slate-100 pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5 max-w-xl text-xs text-slate-500 leading-snug">
          <HelpCircle size={16} className="text-indigo-600 shrink-0 mt-0.5" />
          <span>Our Audit Engine uses 100% deterministic rules powered by raw catalog pricing verified in PRICING_DATA.md. We analyze for orphan seats, tier alignments, API integrations, and brand-level redundancies.</span>
        </div>
        <button
          onClick={handleGenerateAudit}
          disabled={isLoading || inputTools.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl flex items-center justify-center gap-2 font-display font-semibold text-base transition-all duration-200 cursor-pointer shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 w-full md:w-auto"
        >
          {isLoading ? "Running Mathematical Audit..." : "Analyze AI Spend & Optimize"}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
