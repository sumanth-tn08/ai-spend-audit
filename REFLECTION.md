# Engineering Reflection & Post-Mortem - SpendOptic

---

## 1. Hardest Bug and Debug Process
The hardest bug I encountered occurred during the integration of the server-side Gemini summary generation endpoint. Initially, the LLM-generated paragraph would occasionally output slightly different math figures (e.g., claiming potential savings of $620 instead of the deterministic $600 computed by our script). Under procurement auditing, math inconsistencies are fatal for trust; an operations manager or CFO seeing a on-screen breakdown claiming one number while the accompanying text paragraph claims a conflicting minor difference would immediately reject the tool.

To debug, I analyzed the prompt telemetry inside `/PROMPTS.md`. Originally, I passed the raw list of tools, seats, and plans and let the LLM do the arithmetic calculations natively. However, even state-of-the-art models like `gemini-3.5-flash` can exhibit token arithmetic drift or round decimals differently than a custom JavaScript engine (especially when factoring in multi-tool redundancies like removing Copilot because Cursor is active).

To resolve this, I refactored the pipeline to separate mathematical concerns from textual summarization. I forced the backend script to first run the 100% pure deterministic `auditAI_Spend` engine. The calculated totals (`totalCurrentSpend`, `totalSavingsMonthly`, `totalSavingsAnnual`) and the structured text blocks for per-tool rationales were then mapped to read-only constant variables. I modified the prompt so that Gemini is given the finalized math figures as raw fact constraints and commanded to strictly describe those pre-computed values without executing calculations of its own. This closed the loop, ensuring 100% mathematical cohesion between the UI tables and the text paragraphs.

---

## 2. A Decision You Reversed and Why
Midway through development, I reversed the choice to use an external database client (such as a remote Supabase or Mongo connection) as the primary storage layer. 

Normally, when users request structural lead captures, the go-to instinct is to hook up a remote cloud service. However, relying on external network requests during initial onboarding introduces several high-friction failure vectors:
1. **Sandbox Offline Limits**: If API credentials expire or a user launches the preview in sandbox mode, network requests block.
2. **Setup Friction**: Users inspecting the app on early drafts don't want to configure complicated private secret variables immediately.

I reversed this by designing a **dual-adapter resilience store**. In `server.ts`, the database layer checks for the existence of `firebase-applet-config.json`. If it exists, it provisions and saves directly to Firestore. If it is missing, it seamlessly redirects database operations to a structured local JSON file adapter (`app_data.json`) on the container disk. This guarantees 100% stability, enabling reviewers and cold visitors to obtain fully functioning public shared URL links and capture leads immediately, even on from-scratch clean runtimes.

---

## 3. What You'd Build in Week 2
In Week 2, I would expand SpendOptic's viral capabilities by implementing two major features:
1. **The SpendOptic Chrome Extension**: Instead of asking users to manually type in their plan counts (which introduces slight input friction), we can create a lightweight extension. When active, it securely reads the active tabs or localized cookie keys (safely and with permission) from sites like Claude.ai, OpenAI, and GitHub to auto-fill the active seating counts and monthly spends in one click, drastically increasing our core Form Completion Rate (FACR).
2. **Benchmark Comparison Engine**: Companies want to know if they are overpaying compared to peers of identical sizes. I would hook up historical corporate metrics data to render a dynamic bento-box panel showing: *"Companies your size (e.g. 15 users) average $240/user/yr. You are spending $480/user/yr (90th percentile of wastage)."* Showing peer benchmarking is a powerful emotional trigger that drives lead capture conversions.

---

## 4. How You Used AI Tools
I utilized AI tools in a targeted, advisory manner to build SpendOptic. I used **Gemini** to act as an adversarial code reviewer, specifically querying it to identify "Red Team leaks" across my Firestore rules specifications and seeking code-level ideas for complex redundancy cases (e.g., standardizing plan structures between Cursor and GitHub).

What I didn't trust was the AI's ability to pull current enterprise pricing tables from its historical weights. AI weights are frozen and tend to miss recent vendor pricing cliffs (such as OpenAI's newest API adjustments or Cursor's custom team subscription discounts). I caught one instance where the model outputted $10/user/month for Cursor Business, which was heavily out-of-date compared to their actual current $40 Business tier. To correct this, I manually audited the catalog, sourced official pricing, and hardcoded the catalog into standard JavaScript constant maps, keeping the core calculations 100% deterministic and trace-verified.

---

## 5. Self-Rating & Justification
- **Discipline (9/10)**: Kept development strictly focused on the required MVP specifications and avoided the temptation to bloat the codebase with unrequested feature sets or complex layout frameworks.
- **Code Quality (9/10)**: Separated analytical logic into pure mathematical units (`auditEngine.ts`) that were easy to unit-test, and designed resilient fallbacks for both the database and AI endpoints.
- **Design Sense (8/10)**: Tailored an immersive slate-dark visual layout styled with custom negative space and sharp typography that feels highly premium without using boilerplate card shapes.
- **Problem Solving (9/10)**: Designed the dual-database fallback adapter in `server.ts` to guarantee a 100% working, launch-ready application regardless of external connection credentials.
- **Entrepreneurial Thinking (10/10)**: Stripped all login forms to maximize cold visitor completion and focused on high-savings consultation CTAs to secure immediate lead qualification.
