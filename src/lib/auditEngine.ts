import { ToolName, AuditInput, ToolInput, Recommendation, AuditResult, UseCase } from "../types";

export const PLAN_PRICES: Record<string, Record<string, number>> = {
  [ToolName.Cursor]: {
    "Hobby": 0,
    "Pro": 20,
    "Business": 40,
    "Enterprise": 100
  },
  [ToolName.GitHubCopilot]: {
    "Individual": 10,
    "Business": 19,
    "Enterprise": 39
  },
  [ToolName.Claude]: {
    "Free": 0,
    "Pro": 20,
    "Max": 40,
    "Team": 30,
    "Enterprise": 75,
    "API direct": 0
  },
  [ToolName.ChatGPT]: {
    "Plus": 20,
    "Team": 30,
    "Enterprise": 60,
    "API direct": 0
  },
  [ToolName.AnthropicAPIDirect]: {
    "API direct": 0
  },
  [ToolName.OpenAIAPIDirect]: {
    "API direct": 0
  },
  [ToolName.Gemini]: {
    "Pro": 20,
    "Ultra": 30,
    "API": 0
  },
  [ToolName.Windsurf]: {
    "Free": 0,
    "Pro": 15,
    "Team": 30,
    "Enterprise": 60
  }
};

/**
 * Deterministic audit engine implementing cost optimization rules.
 */
export function auditAI_Spend(input: AuditInput): AuditResult {
  const recommendations: Recommendation[] = [];
  let totalCurrentSpend = 0;
  let totalSavingsMonthly = 0;

  // Track tools for redundancy cross-auditing
  const toolMap = new Map<ToolName, ToolInput>();
  for (const t of input.tools) {
    toolMap.set(t.name, t);
    totalCurrentSpend += t.monthlySpend;
  }

  const { teamSize, primaryUseCase } = input;

  for (const t of input.tools) {
    const prices = PLAN_PRICES[t.name] || {};
    const basePrice = prices[t.plan] !== undefined ? prices[t.plan] : 0;
    const computedExpectedBaseSpend = basePrice * t.seats;

    // Calculate active target seat limitation based on corporate team size
    const targetSeats = (t.seats > teamSize && teamSize > 0) ? teamSize : t.seats;

    let recPlan = t.plan;
    let recSpend = t.monthlySpend;
    let savings = 0;
    let rationale = `Spend is currently optimal. You are paying accurate market rates for ${t.seats} seat(s) on the ${t.plan} plan.`;

    // 1. Check for excess spend above standard catalog rates
    if (t.monthlySpend > computedExpectedBaseSpend && basePrice > 0) {
      const overpayment = t.monthlySpend - computedExpectedBaseSpend;
      if (overpayment > 5) {
        recSpend = computedExpectedBaseSpend;
        savings = overpayment;
        rationale = `Catalog audit shows overpayment of $${overpayment.toFixed(2)}/mo for ${t.seats} seats of ${t.name} on the ${t.plan} plan (expected $${computedExpectedBaseSpend}/mo based on official rates of $${basePrice}/user/month). Realign billing to actual seat limits.`;
      }
    }

    // 2. Reduce seats to teamSize if allocated seats exceed team size
    if (t.seats > teamSize && teamSize > 0) {
      const excessSeats = t.seats - teamSize;
      const rate = basePrice || (t.monthlySpend / t.seats);
      const potentialReductionVal = excessSeats * rate;
      if (potentialReductionVal > savings) {
        recPlan = t.plan;
        recSpend = targetSeats * rate;
        savings = t.monthlySpend - recSpend;
        rationale = `Your allocated seat count (${t.seats}) for ${t.name} exceeds your active team size (${teamSize}). Deprovisioning ${excessSeats} unused seat(s) saves $${savings.toFixed(2)}/mo ($${rate}/user/month).`;
      }
    }

    // 3. Tool-specific logical optimizations
    
    // -- CURSOR OPTIMIZATIONS --
    if (t.name === ToolName.Cursor) {
      if (primaryUseCase !== "coding" && primaryUseCase !== "mixed") {
        // Paying for IDE on research/writing is mostly redundant
        recPlan = "Hobby";
        recSpend = 0;
        savings = t.monthlySpend;
        rationale = `Cursor is a developer-centric IDE. Since your primary use case is ${primaryUseCase}, paying for developer environments is highly redundant. Downgrade to Hobby ($0) and use web-based LLMs instead, saving $${savings.toFixed(2)}/mo.`;
      } else if (t.plan === "Hobby" && (targetSeats > 1 || primaryUseCase === "coding")) {
        recPlan = "Pro";
        recSpend = 20 * targetSeats;
        // This is an UPGRADE, savings could technically be negative or 0; we show savings of 0 but justify the logical correction.
        savings = 0;
        rationale = `Hobby tier does not provide enough business context or speed for ${primaryUseCase}. We recommend upgrading to the 'Pro' tier ($20/mo) for optimized context windows.`;
      } else if (t.plan === "Pro" && targetSeats >= 5) {
        recPlan = "Business";
        recSpend = 40 * targetSeats;
        savings = 0; // Upgrade for tier/productivity, no financial saving, but high enterprise value.
        rationale = `With ${targetSeats} seats on Cursor Pro, we recommend consolidating to 'Business' ($40/mo/user) to secure team-level usage controls, centralized billing, and strict SOC 2 compliance.`;
      }
    }

    // -- GITHUB COPILOT OPTIMIZATIONS --
    if (t.name === ToolName.GitHubCopilot) {
      // Check Redundancy: If both Cursor and Copilot are utilized
      if (toolMap.has(ToolName.Cursor)) {
        const cursorInput = toolMap.get(ToolName.Cursor)!;
        if (cursorInput.plan !== "Hobby") {
          recPlan = "Individual"; // Treat as cancelled or fully optimize out
          recSpend = 0;
          savings = t.monthlySpend;
          rationale = `Major redundancy detected: Cursor Pro/Business includes built-in state-of-the-art autocomplete and Composer engine. Paying for GitHub Copilot ($${basePrice}/mo) on top of Cursor is fully redundant. Canceling Copilot saves $${savings.toFixed(2)}/mo.`;
        }
      }
    }

    // -- CLAUDE OPTIMIZATIONS --
    if (t.name === ToolName.Claude) {
      // If paying for Claude Max ($40) but team size is >= 5, downgrade to Claude Team ($30) for collective pool benefits and lower rates.
      if (t.plan === "Max" && targetSeats >= 5) {
        recPlan = "Team";
        recSpend = 30 * targetSeats;
        savings = t.monthlySpend - recSpend;
        rationale = `Downgrading from Max ($40/mo) to Claude Team ($30/mo) for your ${targetSeats} seats delivers high savings of $${savings.toFixed(2)}/mo while keeping team-wide sharing features active.`;
      }
      // Overlap optimization: Claude Pro/Team + ChatGPT Plus/Team
      else if ((t.plan === "Pro" || t.plan === "Team") && toolMap.has(ToolName.ChatGPT)) {
        const chatGpt = toolMap.get(ToolName.ChatGPT)!;
        if (chatGpt.plan === "Plus" || chatGpt.plan === "Team") {
          // Keep Claude, deprecate ChatGPT (or keep ChatGPT, but recommendation is to consolidate)
          recPlan = t.plan;
          
          // Preserve any seat downscaling savings already computed
          const seatDowngraderSavings = (t.seats > teamSize && teamSize > 0) ? (t.monthlySpend - targetSeats * (prices[t.plan] || 20)) : 0;
          if (seatDowngraderSavings > 0) {
            recSpend = targetSeats * (prices[t.plan] || 20);
            savings = seatDowngraderSavings;
          } else {
            recSpend = t.monthlySpend;
            savings = 0;
          }
          rationale = `Potential tools overlap: Your team has active subscriptions for both Claude and ChatGPT. Unless multi-model comparison is critical, deprecating ChatGPT subscriptions in favor of Claude saves up to $${chatGpt.monthlySpend.toFixed(2)}/mo.`;
        }
      }
      // High Enterprise price check
      if (t.plan === "Enterprise" && targetSeats < 15) {
        recPlan = "Team";
        recSpend = 30 * targetSeats;
        savings = t.monthlySpend - recSpend;
        rationale = `Claude Enterprise plans typically charge a massive premium (~$75/mo estimated). With only ${targetSeats} seat(s), downgrade to Claude Team ($30/mo) to secure advanced context for $${savings.toFixed(2)}/mo in raw cash savings.`;
      }
    }

    // -- CHATGPT OPTIMIZATIONS --
    if (t.name === ToolName.ChatGPT) {
      // Consolidate duplicated Plus accounts - ONLY when they have no excess seats
      if (t.plan === "Plus" && t.seats >= 3 && t.seats <= teamSize) {
        recPlan = "Team";
        recSpend = 30 * targetSeats;
        // It's technically $30 / user instead of $20, but it merges scattered personal accounts into central administration.
        // Or if they have redundant Plus subscriptions, recommend cutting excess.
        savings = 0;
        rationale = `Migrate scattered Plus accounts to ChatGPT Team ($30/mo) to unlock workspace-scoped variables, shared links, administrative panels, and double rate limits.`;
      }
      else if (t.plan === "Enterprise" && targetSeats < 15) {
        recPlan = "Team";
        recSpend = 30 * targetSeats;
        savings = t.monthlySpend - recSpend;
        rationale = `You are paying enterprise premiums ($60+/seat/mo) for a small squad of ${targetSeats} users. Downgrading to ChatGPT Team ($30/mo) keeps the workspaces and admin features while saving $${savings.toFixed(2)}/mo.`;
      }
      // Consolidation recommendation if Claude is already on Plan Pro
      if (toolMap.has(ToolName.Claude)) {
        const claudeVal = toolMap.get(ToolName.Claude)!;
        if (claudeVal.plan === "Pro" || claudeVal.plan === "Team" || claudeVal.plan === "Max") {
          recPlan = "Plus"; // Recommendation: consolidate to 0
          recSpend = 0;
          savings = t.monthlySpend;
          rationale = `Redundancy: Consolidating and canceling ChatGPT Plus/Team licenses in favor of active Claude Pro/Team accounts eliminates brand duplication, saving $${savings.toFixed(2)}/mo.`;
        }
      }
    }

    // -- API COST OPTIMIZATIONS (OpenAI & Anthropic) --
    if (t.name === ToolName.AnthropicAPIDirect || t.name === ToolName.OpenAIAPIDirect) {
      if (t.monthlySpend > 50) {
        const potentialCachingSavings = t.monthlySpend * 0.40; // 40% savings with Caching and mini-models
        recPlan = "API direct";
        recSpend = t.monthlySpend - potentialCachingSavings;
        savings = potentialCachingSavings;
        rationale = `Your direct API usage ($${t.monthlySpend.toFixed(2)}/mo) has high optimization potential. Enforcing Prompt Caching and shifting heavy routine summarization pipelines to Claude Haiku/GPT-4o-mini reduces spend by 40%, saving $${savings.toFixed(2)}/mo.`;
      }
    }

    // -- GEMINI OPTIMIZATIONS --
    if (t.name === ToolName.Gemini) {
      if ((t.plan === "Pro" || t.plan === "Ultra") && (toolMap.has(ToolName.ChatGPT) || toolMap.has(ToolName.Claude))) {
        recPlan = "Pro";
        recSpend = 0; // We propose fully canceling this since Google Workspace basic tier or competing tools handle it
        savings = t.monthlySpend;
        rationale = `Overlap: Since ChatGPT or Claude subscriptions are already active, Gemini subscriptions ($${t.monthlySpend}/mo) are highly redundant. Decommissioning Gemini saves $${savings.toFixed(2)}/mo.`;
      }
    }

    // -- WINDSURF OPTIMIZATIONS --
    if (t.name === ToolName.Windsurf) {
      if (toolMap.has(ToolName.Cursor)) {
        recPlan = "Free";
        recSpend = 0;
        savings = t.monthlySpend;
        rationale = `Major tooling clash: Paying for both Windsurf and Cursor simultaneously is fully redundant. Consolidate to a single developer environment to save $${savings.toFixed(2)}/mo.`;
      }
    }

    // Track computed savings from this tool
    if (savings > 0) {
      totalSavingsMonthly += savings;
    }

    recommendations.push({
      toolName: t.name,
      currentPlan: t.plan,
      currentSpend: t.monthlySpend,
      seats: t.seats,
      recommendedPlan: recPlan,
      recommendedSpend: recSpend,
      savings: savings > 0 ? savings : 0,
      rationale
    });
  }

  // Deduplication / post-processing for overlaps that were not naturally netted:
  // Let's make sure totalSavingsMonthly is bounded by totalCurrentSpend and correct rounding
  totalSavingsMonthly = Math.round(totalSavingsMonthly * 100) / 100;
  if (totalSavingsMonthly > totalCurrentSpend) {
    totalSavingsMonthly = totalCurrentSpend;
  }
  const totalSavingsAnnual = Math.round(totalSavingsMonthly * 12 * 100) / 100;

  return {
    id: Math.random().toString(36).substring(2, 11),
    inputs: input,
    recommendations,
    totalCurrentSpend,
    totalSavingsMonthly,
    totalSavingsAnnual,
    personalizedSummary: "", // Filled by Gemini server-side or fallback
    createdAt: new Date().toISOString()
  };
}
