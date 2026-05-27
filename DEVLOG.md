# Engineering Devlog - SpendOptic

## Day 1 — 2026-05-19
**Hours worked:** 4  
**What I did:** Drafted the initial functional specs for SpendOptic. Outlined the enums and plans needed for Cursor, Copilot, ChatGPT, Claude, OpenAI/Anthropic APIs, Gemini, and Windsurf. Created the basic project structure.  
**What I learned:** Discovered that standard enterprise LLM plan names vary heavily by vendor (e.g. ChatGPT Plus vs Claude Pro, and ChatGPT Team vs Claude Team). Standardizing enums is critical.  
**Blockers / what I'm stuck on:** Deciding whether to require DB logins. Concluded that a pure no-login flow with localStorage draft preservation is ideal for viral user acquisition.  
**Plan for tomorrow:** Build the core pricing math and rule catalog in code.

---

## Day 2 — 2026-05-20
**Hours worked:** 5  
**What I did:** Formulated the primary deterministic audit rules in a standalone library. Sourced pricing from each vendor's site to write `PRICING_DATA.md` and ensured all calculations are traceable.  
**What I learned:** AI IDEs (Cursor and Windsurf) and autocomplete engines (Copilot) represent highly duplicated structures since modern editors provide overlapping feature scopes.  
**Blockers / what I'm stuck on:** Handling user-entered monthlySpend when it exceeds official catalog rates. Added logic to flag overpayment.  
**Plan for tomorrow:** Lay out the server-side API endpoints using Express and Vite.

---

## Day 3 — 2026-05-21
**Hours worked:** 0  
**What I did:** Took a scheduled rest day to clear backlog.  
**What I learned:** Standard development cycles require rest boundaries to maintain peak focus on code robustness.  
**Blockers / what I'm stuck on:** None.  
**Plan for tomorrow:** Build and test the full-stack server integration.

---

## Day 4 — 2026-05-22
**Hours worked:** 6  
**What I did:** Implemented the Express entry points in `server.ts`. Bound server to host 0.0.0.0 on port 3000. Configured dual DB persistence: reading from/writing to local JSON file structures with active provisions for Firestore configurations.  
**What I learned:** Bundling full-stack Node.js script assets utilizing esbuild simplifies relative importing structures inside containerized runtimes compared to raw module resolutions.  
**Blockers / what I'm stuck on:** Vite HMR causes rendering conflicts in agent editing. Setting `watch: null` when `DISABLE_HMR` is true resolves CPU overhead.  
**Plan for tomorrow:** Integrate the server-side Gemini text summarizer.

---

## Day 5 — 2026-05-23
**Hours worked:** 5  
**What I did:** Set up the `@google/genai` server-side SDK. Crafted the structured prompt template in `PROMPTS.md` and initialized `gemini-3.5-flash` model generation with secure fallback handlers.  
**What I learned:** If we let the LLM calculate mathematical totals itself, it hallucinates calculations. Feeding the code's calculated integers as constants inside the prompt resolves this entirely.  
**Blockers / what I'm stuck on:** Gemini SDK requires named params: `const ai = new GoogleGenAI({ apiKey: ... })`. Avoid using legacy deprecated initialization wrappers.  
**Plan for tomorrow:** Build the responsive Tailwind user interfaces.

---

## Day 6 — 2026-05-24
**Hours worked:** 6  
**What I did:** Created `SpendInputForm`, `AuditResults`, and `LeadForm` components. Styled layouts using clear Space Grotesk fonts inside `index.css` and added Lucide icons for responsive mobile-first views.  
**What I learned:** Adding micro-transition animations on input lists makes adding new tool rows highly responsive and intuitive.  
**Blockers / what I'm stuck on:** Designing a seamless way to share unique URL cards without forcing logins. Constructed dynamic Meta tag parsing inside `server.ts` for `/share/:id`.  
**Plan for tomorrow:** Write robust unit tests, verify CI triggers, and finalize shipping parameters.

---

## Day 7 — 2026-05-25
**Hours worked:** 5  
**What I did:** Wrote custom unit testing coverage checking all 6 core mathematical edge cases in `test.ts` and set up the GitHub Actions CI build check in `.github/workflows/ci.yml`. Conducted dry compile builds.  
**What I learned:** Integrating lightweight assert helpers for local code verification prevents unnecessary module load lags during automated CI triggers compared to heavy frameworks.  
**Blockers / what I'm stuck on:** Fixing subtle index.html title and meta overlapping tags during public renders. Completed injection replacements in the server.  
**Plan for tomorrow:** Product launch on product communities!
