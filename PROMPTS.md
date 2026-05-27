# Prompts Engine - SpendOptic AI Spend Auditor

This file references and catalogs the prompts used to generate the personalized summary paragraph of the audit results.

## Model Choice
We use **gemini-3.5-flash** as specified in the `@google/genai` guidelines for **Basic Text Tasks** (e.g., summarization and advice text). Our API calls are routed entirely on the server-side to hide all secret keys from browsers.

## 1. Personalized Summary Generation Prompt

```
[SYSTEM INSTRUCTION]
You are an expert enterprise software auditor and procurement CFO specializing in AI tooling and engineering productivity spend.
Analyze the user's AI spend inputs and recommendations.
Create a highly professional, direct, and concise ~100-word personalized advisory summary of their current AI spend.
Focus exclusively on concrete math, tool overlap/redundancies, and specific structural savings.
Maintain an objective, analytical tone without flowery marketing adjectives. Do not mention system-internal files or technical labels.
All math MUST be coherent and align with the provided inputs.

[USER PROMPT]
Here is the audit context for an organization:
- Team size: {{teamSize}}
- Primary use case: {{primaryUseCase}}
- Total Current Monthly Spend: ${{totalCurrentSpend}}
- Calculated Potential Monthly Savings: ${{totalSavingsMonthly}}
- Calculated Potential Annual Savings: ${{totalSavingsAnnual}}

Per-Tool Breakdown and Recommendations:
{{recommendationsText}}

Generate an audit summary advisory paragraph (~100 words). Highlighting whether they are within an optimal spending bracket or if they have major cost optimization vectors (such as moving from individual seats to team licenses, consolidating redundant ChatGPT/Claude seats into API tokens or single-provider seats, or correcting over-allocated licenses). Keep it direct and business-focused.
```

## Why We Wrote the Prompt This Way
- **Mathematical Boundness**: By feeding the exact calculated deterministic values (`totalSavingsMonthly`, `totalSavingsAnnual`, and `totalCurrentSpend`), we eliminate the risk of Gemini fabricating different numbers (hallucinations).
- **Conciseness and Actionability**: Specifying a strict length limit (~100 words), asking for a professional financial/CFO perspective, and directing the focus to specific optimization strategies (e.g., consolidation, team seating) ensures high-impact advice that sounds human-crafted rather than "AI Slop".
- **No System Noise**: Restricting access to internal code descriptions avoids leaky abstractions.

## What Failed During Iterations
- **Prompt Failure (Unbounded Math)**: Initially, when we let the model calculate the savings mathematically by itself, it made rounding errors or used incorrect pricing tables, resulting in discrepancies between the UI's table and the summary text.
  - *Fix*: We made the audit logic in the code 100% deterministic (the core audit engine computes the exact figures) and inject the finalized calculations as read-only constants directly to the prompt.
- **Tone Failures**: When given generic instructions, the model would output conversational padding like "Congratulations on auditing your spend!..." which wastes valuable real estate and sounds unprofessional for a procurement audit report.
  - *Fix*: Added a strict system instruction establishing the persona as a "procurement CFO and expert enterprise software auditor".

## Hallucination and API Failure Fallback
We handle API connection failures, quota limits, model errors, or missing keys gracefully. If there's an error calling the API (or missing `GEMINI_API_KEY`), the server catches the exception and falls back to a deterministic, high-quality, templated text structure:

```ts
function getFallbackSummary(data) {
  const { teamSize, primaryUseCase, totalSavingsMonthly, totalCurrentSpend } = data;
  if (totalSavingsMonthly > 0) {
    return `Your team of ${teamSize} is currently spending $${totalCurrentSpend}/mo on AI tools. By optimizing allocations, consolidating redundant plans for ${primaryUseCase}, and migrating to team/volume tiers where appropriate, you can securely reduce leakage. We recommend executing the listed actions immediately to capture up to $${totalSavingsMonthly}/mo in baseline recurring overhead reduction.`;
  }
  return `Your team of ${teamSize} has optimized their AI spend. Your tooling matches workload demands for ${primaryUseCase} with zero redundant seats or plan tiers discovered. We recommend maintaining this configuration and scheduling a quarterly re-audit to capture pricing/tier adjustments as the market matures.`;
}
```
