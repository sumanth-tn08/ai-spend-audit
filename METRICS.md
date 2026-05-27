# Core Metrics Framework - SpendOptic

## Single North Star Metric
- **The Metric**: **Total Annualized AI Savings Discovered and Shared (TASDS)**
- **Why**: TASDS is the ultimate proxy for user value. Running an audit is only the first step. If a user uncovers high savings and copies/shares the report, it proves that:
  1. The audit rules were highly defensible and shown real friction.
  2. The UI made sharing simple.
  3. The core viral loop has completed.
  TASDS maps value shown on-screen to actual growth potential.

---

## 3 Input Metrics that Drive It

### 1. Cumulative Monthly Tool Spend Inputted (CMTSI)
- **Why**: The absolute size of the spend bucket entered determines the headroom for savings. Users with >$2,000/mo spend have much larger optimization potential than small freelancers with 1 seat on ChatGPT Plus.

### 2. Form Audit Completion Rate (FACR)
- **Why**: The percentage of landings that complete the spend form. High friction in entering plan tiers or seat numbers directly dampens the top of our calculation pipeline.

### 3. Lead Report Share Rate (LRSR)
- **Why**: The share of completed audits where the user either submits their email or copies the unique shareable URL. This is our core capture rate, turning anonymous calculations into persistent leads.

---

## What to Instrument First
1. **Interactive Focus Captures**: Instrument custom click events on the "Add SubscriptionToForm" and "Analyze AI Spend" triggers to catch dropoffs midway through the form.
2. **Copy Link telemetry**: Track whenever the `Copy Link` or `Share Audit URL` button is pushed using client telemetry.
3. **Database Capture rates**: Instrument database logging on lead registrations, specifically looking at the proportion of high-value audits (Savings > $500) that convert to consultation clicks vs normal leads.

---

## The Number that Triggers a Pivot
- **The Number**: **Lead Capture Conversion < 3% for high-savings audits (Savings > $500/month)**.
- **The Action**: If organizations uncovering over $6,000/yr in wasteful AI tool leakage do not even capture their report or inquire for an enterprise procurement consultation at a rate of at least 3%, it indicates one of two fatal friction points:
  1. **Trust Deficit**: The deterministic justifications or professional layout didn't provide enough authority to trust our advice.
  2. **Persona Mismatch**: The person auditing is a low-level individual developer who doesn't have purchasing power or cares about corporate financial leakage.
  If this dips below 3%, we would pivot SpendOptic from a "no-login self-serve dashboard" to a **one-click browser extension** that auto-discovers duplicate tabs and subscriptions dynamically in-session.
