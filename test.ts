import { auditAI_Spend } from "./src/lib/auditEngine";
import { ToolName, AuditInput, ToolInput } from "./src/types";

// Simple custom assertion helper
function assertEqual(actual: any, expected: any, testName: string) {
  if (actual === expected) {
    console.log(`✅ Passed: ${testName}`);
  } else {
    console.error(`❌ Failed: ${testName}`);
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual:   ${actual}`);
    process.exit(1);
  }
}

console.log("Starting SpendOptic AI Spend Auditor Unit Tests...");

// TEST 1: GitHub Copilot Redundancy with Active Cursor Pro
try {
  const input: AuditInput = {
    teamSize: 5,
    primaryUseCase: "coding",
    tools: [
      { name: ToolName.Cursor, plan: "Pro", monthlySpend: 100, seats: 5 },
      { name: ToolName.GitHubCopilot, plan: "Business", monthlySpend: 95, seats: 5 }
    ]
  };

  const result = auditAI_Spend(input);
  const copilotRec = result.recommendations.find(r => r.toolName === ToolName.GitHubCopilot);
  
  assertEqual(copilotRec?.recommendedSpend, 0, "TEST 1 - Redundant Copilot cancelled");
  assertEqual(copilotRec?.recommendedPlan, "Individual", "TEST 1 - Recommendation defaults out");
  assertEqual(result.totalSavingsMonthly, 95, "TEST 1 - Total monthly savings reflects redundant Copilot spend");
} catch (e: any) {
  console.error("TEST 1 error:", e);
  process.exit(1);
}

// TEST 2: Claude Max Downgrading to Claude Team for Larger Squads
try {
  const input: AuditInput = {
    teamSize: 6,
    primaryUseCase: "research",
    tools: [
      { name: ToolName.Claude, plan: "Max", monthlySpend: 240, seats: 6 } // $40/seat
    ]
  };

  const result = auditAI_Spend(input);
  const claudeRec = result.recommendations.find(r => r.toolName === ToolName.Claude);

  assertEqual(claudeRec?.recommendedPlan, "Team", "TEST 2 - Recommends Claude Team plan");
  assertEqual(claudeRec?.recommendedSpend, 180, "TEST 2 - New bill calculated as $30 * 6 = $180");
  assertEqual(result.totalSavingsMonthly, 60, "TEST 2 - Savings is $60 ($240 - $180)");
} catch (e: any) {
  console.error("TEST 2 error:", e);
  process.exit(1);
}

// TEST 3: De-provisioning Excess Tool Seats above Active Team Size
try {
  const input: AuditInput = {
    teamSize: 3,
    primaryUseCase: "mixed",
    tools: [
      { name: ToolName.ChatGPT, plan: "Plus", monthlySpend: 120, seats: 6 } // 6 seats for team of 3
    ]
  };

  const result = auditAI_Spend(input);
  const chatGptRec = result.recommendations.find(r => r.toolName === ToolName.ChatGPT);

  assertEqual(chatGptRec?.recommendedSpend, 60, "TEST 3 - Reduced spend to match 3 seats of Plus ($60)");
  assertEqual(result.totalSavingsMonthly, 60, "TEST 3 - Monthly savings of $60 calculated");
} catch (e: any) {
  console.error("TEST 3 error:", e);
  process.exit(1);
}

// TEST 4: Catalog Overpayment Realignment
try {
  const input: AuditInput = {
    teamSize: 2,
    primaryUseCase: "coding",
    tools: [
      { name: ToolName.Cursor, plan: "Business", monthlySpend: 150, seats: 2 } // expected rate $40/mo per user. They overpay by $70
    ]
  };

  const result = auditAI_Spend(input);
  const cursorRec = result.recommendations.find(r => r.toolName === ToolName.Cursor);

  assertEqual(cursorRec?.recommendedSpend, 80, "TEST 4 - Aligns Cursor Business to catalog standard ($80)");
  assertEqual(result.totalSavingsMonthly, 70, "TEST 4 - Savings matches excess billing differential");
} catch (e: any) {
  console.error("TEST 4 error:", e);
  process.exit(1);
}

// TEST 5: Brand Overlap Consolidation (Claude and ChatGPT Plus redundant usage)
try {
  const input: AuditInput = {
    teamSize: 4,
    primaryUseCase: "writing",
    tools: [
      { name: ToolName.Claude, plan: "Pro", monthlySpend: 80, seats: 4 },
      { name: ToolName.ChatGPT, plan: "Plus", monthlySpend: 80, seats: 4 }
    ]
  };

  const result = auditAI_Spend(input);
  const chatGptRec = result.recommendations.find(r => r.toolName === ToolName.ChatGPT);

  assertEqual(chatGptRec?.recommendedSpend, 0, "TEST 5 - Recommends fully consolidating out redundant ChatGPT licenses");
  assertEqual(result.totalSavingsMonthly, 80, "TEST 5 - Correctly nets savings of $80/mo");
} catch (e: any) {
  console.error("TEST 5 error:", e);
  process.exit(1);
}

// TEST 6: Non-developer team using Cursor (IDE)
try {
  const input: AuditInput = {
    teamSize: 5,
    primaryUseCase: "writing", // non-developer
    tools: [
      { name: ToolName.Cursor, plan: "Pro", monthlySpend: 100, seats: 5 }
    ]
  };

  const result = auditAI_Spend(input);
  const cursorRec = result.recommendations.find(r => r.toolName === ToolName.Cursor);

  assertEqual(cursorRec?.recommendedPlan, "Hobby", "TEST 6 - Downgrades developer IDE to Hobby");
  assertEqual(cursorRec?.recommendedSpend, 0, "TEST 6 - Expected spend is 0");
  assertEqual(result.totalSavingsMonthly, 100, "TEST 6 - Full savings of $100 realized");
} catch (e: any) {
  console.error("TEST 6 error:", e);
  process.exit(1);
}

console.log("All custom unit tests verified successfully! Math is 100% deterministic.");
process.exit(0);
