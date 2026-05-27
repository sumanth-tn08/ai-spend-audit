# Automated Testing Framework Documentation - SpendOptic

This document outlines our automated testing suite verifying the SpendOptic deterministic AI cost optimization calculations.

## Test Suite Location
- **Filename**: `/test.ts`
- **Language**: TypeScript (using raw assertions to avoid bulky external dependencies that could introduce library compile lag in container workflows).

---

## 5+ Required Test Cases Covered (6 Total)

### 1. GitHub Copilot Redundancy with Cursor Pro
- **Description**: Verifies that when both Cursor (Pro or Business) and GitHub Copilot are utilized simultaneously, the engine flags Copilot as redundant and cancels its recommended spend fully to $0.
- **Assertion**: `copilotRec.recommendedSpend === 0 && result.totalSavingsMonthly === 95`

### 2. Claude Max Seating Plan Alignment
- **Description**: Verifies that teams of 5 or more on the Claude Max premium ($40/mo) are automatically downgraded to the Claude Team plan ($30/mo) for optimized centralized pool rates.
- **Assertion**: `claudeRec.recommendedPlan === "Team" && claudeRec.recommendedSpend === 180`

### 3. Seat Allocation Downscaling
- **Description**: Checks if individual subscription seat quotas exceed total active human team size, pruning idle seats of ChatGPT Plus automatically to fit.
- **Assertion**: `chatGptRec.recommendedSpend === 60 && result.totalSavingsMonthly === 60`

### 4. Overpayment vs. Official Catalog Slashes
- **Description**: Identifies cases where the user's manual inputted monthlySpend exceeds the expected price ceiling (seats multiplied by list catalog rates, e.g. Cursor Pro is $20). Corrects the billing line accordingly.
- **Assertion**: `cursorRec.recommendedSpend === 80 && result.totalSavingsMonthly === 70`

### 5. Multi-brand Conversational Overlaps
- **Description**: Scans for redundant double-subscriptions of Claude Pro and ChatGPT Plus for the same team size, recommending the cancellation of ChatGPT Plus in favor of the active Claude Pro plan.
- **Assertion**: `chatGptRec.recommendedSpend === 0 && result.totalSavingsMonthly === 80`

### 6. Non-Developer IDE Usage
- **Description**: Guards against teams utilizing the developer-centric Cursor IDE when their primary use case is non-technical content creation (writing/data), automatically downgrading them and pointing them to web AI tools.
- **Assertion**: `cursorRec.recommendedPlan === "Hobby" && result.totalSavingsMonthly === 100`

---

## How to Run the Tests Locally

Ensure you have your dependencies installed beforehand:

```bash
# Clean install
npm install

# Execute the test cases in the local node runtime
npx tsx test.ts
```

The terminal will print success summaries:
```text
Starting SpendOptic AI Spend Auditor Unit Tests...
✅ Passed: TEST 1 - Redundant Copilot cancelled
✅ Passed: TEST 1 - Recommendation defaults out
✅ Passed: TEST 1 - Total monthly savings reflects redundant Copilot spend
✅ Passed: TEST 2 - Recommends Claude Team plan
✅ Passed: TEST 2 - New bill calculated as $30 * 6 = $180
✅ Passed: TEST 2 - Savings is $60 ($240 - $180)
✅ Passed: TEST 3 - Reduced spend to match 3 seats of Plus ($60)
...
All custom unit tests verified successfully! Math is 100% deterministic.
```
