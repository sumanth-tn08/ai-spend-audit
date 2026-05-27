# System Architecture & Flow Design - SpendOptic

---

## 1. System Topology Diagram

Our production application uses a full-stack Node.js (Express + Vite + React) engine that runs server-side on container platforms like Cloud Run.

```text
  +-------------------------------------------------------+
  |                   CLIENT (BROWSER)                    |
  |                                                       |
  |   React SPA Form  <-- Local Draft Persistence         |
  |         |             (via Client-Side localStorage)  |
  |         |                                             |
  |         +--- POST /api/audit --------------------+    |
  |         +--- POST /api/leads -----------------+  |    |
  |         +--- GET  /share/:id ---------------+ |  |    |
  +---------|-----------------------------------|--|--|---+
            |                                   |  |  |
            v                                   v  v  v
  +---------|-----------------------------------|--|--|---+
  |         |         BACKEND (EXPRESS)         |  |  |   |
  |         |                                   |  |  |   |
  |         |   +--> Route: /api/audit <--------+  |  |   |
  |         |   |    Calls auditAI_Spend()         |  |   |
  |         |   |    Queries Gemini API / Fallback |  |   |
  |         |   |    Writes Audit to DB            |  |   |
  |         |   |                                  |  |   |
  |         |   +--> Route: /api/leads <-----------+  |   |
  |         |   |    Checks Honeypot Fields           |   |
  |         |   |    Writes Lead & Triggers Email     |   |
  |         |   |                                     |   |
  |         |   +--> Route: /share/:id <--------------+   |
  |         |        Injects Open Graph Meta Tags         |
  |         |        Outputs Visually Rich Cards          |
  |         |                                             |
  |         v                                             |
  |   Vite Asset Server / Production Static Fallback      |
  +---------|---------------------------------------------+
            |
            v
  +-------------------------------------------------------+
  |                 PERSISTENCE ADAPTER                   |
  |                                                       |
  |   if configured: Firebase Firestore                   |
  |   else (resilience mode): app_data.json (local disk)  |
  +-------------------------------------------------------+
```

---

## 2. Dynamic Data Flow (Input to Result)

1. **User Input Form**: The visitor enters team metrics and current AI licenses into the React frontend. State is continuously saved (on keystroke/change) to `localStorage` enabling persistence on page reloads.
2. **Analysis Trigger**: The user clicks "Analyze AI Spend". The payload is securely POST'ed to `/api/audit`.
3. **Core Calculations**: The backend evaluates the tools against pure deterministic catalog rates (`PLAN_PRICES` constant map) to find duplications, plan mismatches, and seat runaways.
4. **Advisory Summarization**: The server calls the modern `@google/genai` Node.js SDK (routing past any browser exposure) using `gemini-3.5-flash` to write a professional ~100-word CFO advisory. If the key is missing or the request fails, it gracefully triggers a pre-designed math-bound fallback summary.
5. **Caching**: The finalized `AuditResult` is written to our database.
6. **Delivery**: The completed data is returned to the React frontend, rendering hero statistics counts and a toggle to launch our optional, spam-shielded Lead capture (`LeadForm`).
7. **Social Loop**: If the user clicks `Share Audit URL`, they get a unique path `/share/:id`. When loaded, the server dynamically catches this request, parses the cached database audit, and injects customized Open Graph Meta headers directly into the `<head>` of `index.html` before outputting, generating high-contrast preview cards on Twitter and LinkedIn.

---

## 3. Technology Stack Selection Justifications

- **React with Vite**: Gives us a hyper-dense, lightweight SPA container that boots instantly with zero runtime overhead, satisfying our Lighthouse target expectations (Accessibility >= 90).
- **TypeScript**: Establishes strict contract safety between our frontend input models and backend calculation tools, making our unit test assertions (`test.ts`) bulletproof.
- **Tailwind CSS**: Eliminates visual bloat from heavy precompiled UI components, enabling highly premium, eye-safe dark layouts using native class structures.
- **Express**: Provides robust, flexible RESTful routing and enables us to mount Vite directly as a middleware in development, while serving compiled single-bundled scripts in production easily.
- **Dual-Adapter Persistence**: Using Firestore first while supporting a local JSON file database (`app_data.json`) ensures 100% cloud platform durability under sandboxed, zero-credential test runtimes.

---

## 4. Scalability Roadmap for 10,000 Audits / Day

If SpendOptic scales to **10,000 concurrent audits per day** (~7 audits per minute with peak bursts of 100 audits/minute), the current local file-based database can lead to filesystem write locks and disk issues. I would implement the following horizontal scale upgrades:

1. **Fully Migrate to Firestore / Redis Caching**: Shift from our local JSON file state to actual Firebase Firestore. Firestore easily handles tens of thousands of writes per second. We would front common reads (such as popular shared `/share/:auditId` pages) with a Redis cache layer (e.g. Upstash) to minimize redundant database reads.
2. **Asynchronous Summary Generation**: To avoid keeping HTTP requests open during peak traffic, instead of calling the Gemini API synchronously inside the `/api/audit` response, we would return the deterministic audit results *instantly* and stream the AI summary text to the client using Server-Sent Events (SSE) or WebSockets.
3. **Dedicated Transactional Email Queue**: Leads submissions should be decoupled from the synchronous HTTP request cycle. We would push captured lead events to a lightweight queue broker (e.g. BullMQ on Redis) to be processed asynchronously by worker threads using the Resend API, insulating our server from transactional email API latency.
