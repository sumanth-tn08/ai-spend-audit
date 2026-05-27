export enum ToolName {
  Cursor = "Cursor",
  GitHubCopilot = "GitHub Copilot",
  Claude = "Claude",
  ChatGPT = "ChatGPT",
  AnthropicAPIDirect = "Anthropic API direct",
  OpenAIAPIDirect = "OpenAI API direct",
  Gemini = "Gemini",
  Windsurf = "Windsurf"
}

export type CursorPlan = "Hobby" | "Pro" | "Business" | "Enterprise";
export type CopilotPlan = "Individual" | "Business" | "Enterprise";
export type ClaudePlan = "Free" | "Pro" | "Max" | "Team" | "Enterprise" | "API direct";
export type ChatGPTPlan = "Plus" | "Team" | "Enterprise" | "API direct";
export type AnthropicAPIPlan = "API direct";
export type OpenAIAPIPlan = "API direct";
export type GeminiPlan = "Pro" | "Ultra" | "API";
export type WindsurfPlan = "Free" | "Pro" | "Team" | "Enterprise";

export interface ToolInput {
  name: ToolName;
  plan: string;
  monthlySpend: number;
  seats: number;
}

export type UseCase = "coding" | "writing" | "data" | "research" | "mixed";

export interface AuditInput {
  tools: ToolInput[];
  teamSize: number;
  primaryUseCase: UseCase;
}

export interface Recommendation {
  toolName: ToolName;
  currentPlan: string;
  currentSpend: number;
  seats: number;
  recommendedPlan: string;
  recommendedSpend: number;
  savings: number;
  rationale: string;
}

export interface AuditResult {
  id: string;
  inputs: AuditInput;
  recommendations: Recommendation[];
  totalCurrentSpend: number;
  totalSavingsMonthly: number;
  totalSavingsAnnual: number;
  personalizedSummary: string;
  createdAt: string;
}

export interface LeadInput {
  email: string;
  companyName?: string;
  role?: string;
  teamSize?: number;
  auditId: string;
}
