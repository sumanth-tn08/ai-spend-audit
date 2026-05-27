import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { auditAI_Spend } from "./src/lib/auditEngine.js";
import { AuditInput, LeadInput } from "./src/types.js";

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;

// Vite instance holder for HTML transformation in development
let viteInstance: any = null;

// Dual-Mode Database Engine (Firestore with Local JSON fallback)
let firebaseApp: any = null;
let firestoreDb: any = null;

const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
const localDbPath = path.join(process.cwd(), "app_data.json");

// Helper to manage local database file
function initLocalDb() {
  if (!fs.existsSync(localDbPath)) {
    fs.writeFileSync(localDbPath, JSON.stringify({ audits: {}, leads: [] }, null, 2));
  }
}

function readLocalDb() {
  try {
    initLocalDb();
    const data = fs.readFileSync(localDbPath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return { audits: {}, leads: [] };
  }
}

function writeLocalDb(data: any) {
  try {
    fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed to write to local DB:", e);
  }
}

// ----------------- FIRESTORE CONNECTION SETUP -----------------
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, pathParam: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null
    },
    operationType,
    path: pathParam
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    firebaseApp = initializeApp(firebaseConfig);
    firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase initialized successfully, using Firestore as primary database!");
  } catch (err) {
    console.error("Failed to initialize Firebase:", err);
  }
} else {
  console.log("No config file detected. Running in local JSON database fallback mode.");
}

async function persistAudit(auditResult: any) {
  // Always save to local fallback JSON
  try {
    const localDb = readLocalDb();
    localDb.audits[auditResult.id] = auditResult;
    writeLocalDb(localDb);
  } catch (err) {
    console.error("Local DB write error:", err);
  }

  // Save to Firestore if connected
  if (firestoreDb) {
    const docPath = `audits/${auditResult.id}`;
    try {
      await setDoc(doc(firestoreDb, "audits", auditResult.id), auditResult);
      console.log(`Successfully saved audit #${auditResult.id} to Firestore!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }
}

async function findAudit(auditId: string) {
  // First attempt from Firestore if connected
  if (firestoreDb) {
    const docPath = `audits/${auditId}`;
    try {
      const snap = await getDoc(doc(firestoreDb, "audits", auditId));
      if (snap.exists()) {
        return snap.data();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, docPath);
    }
  }

  // Fallback to local DB
  const localDb = readLocalDb();
  return localDb.audits[auditId] || null;
}

async function persistLead(leadRecord: any) {
  // Always save to local fallback JSON
  try {
    const localDb = readLocalDb();
    localDb.leads.push(leadRecord);
    writeLocalDb(localDb);
  } catch (err) {
    console.error("Local DB write error:", err);
  }

  // Save to Firestore if connected
  if (firestoreDb) {
    const docPath = `leads/${leadRecord.id}`;
    try {
      await setDoc(doc(firestoreDb, "leads", leadRecord.id), {
        id: leadRecord.id,
        email: leadRecord.email,
        companyName: leadRecord.companyName || "",
        role: leadRecord.role || "",
        teamSize: leadRecord.teamSize || null,
        auditId: leadRecord.auditId,
        createdAt: leadRecord.createdAt
      });
      console.log(`Successfully saved lead #${leadRecord.id} to Firestore!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }
}

// Lazy init Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } else {
      console.warn("GEMINI_API_KEY environment variable is not defined or is placeholder. Falling back to local template summaries.");
    }
  }
  return aiClient;
}

// ---------------- BACKGROUND SERVICES ----------------

// 1. Audit Endpoint
app.post("/api/audit", async (req, res) => {
  try {
    const input: AuditInput = req.body;
    if (!input || !Array.isArray(input.tools)) {
      res.status(400).json({ error: "Invalid audit input" });
      return;
    }

    // Determine savings deterministically
    const auditResult = auditAI_Spend(input);

    // Call Gemini to generate personalized summary text
    let summaryParagraph = "";
    const ai = getGeminiClient();

    if (ai) {
      try {
        const recListText = auditResult.recommendations
          .map(r => `- ${r.toolName} (${r.currentPlan} with ${r.seats} seats): recommends ${r.recommendedPlan}; potential savings: $${r.savings.toFixed(2)}/mo. Rationale: ${r.rationale}`)
          .join("\n");

        const userPrompt = `Here is the audit context for an organization:
- Team size: ${auditResult.inputs.teamSize}
- Primary use case: ${auditResult.inputs.primaryUseCase}
- Total Current Monthly Spend: $${auditResult.totalCurrentSpend}
- Calculated Potential Monthly Savings: $${auditResult.totalSavingsMonthly}
- Calculated Potential Annual Savings: $${auditResult.totalSavingsAnnual}

Per-Tool Breakdown and Recommendations:
${recListText}

Generate an audit summary advisory paragraph (~100 words). Highlighting whether they are within an optimal spending bracket or if they have major cost optimization vectors (such as moving from individual seats to team licenses, consolidating redundant ChatGPT/Claude seats into API tokens or single-provider seats, or correcting over-allocated licenses). Keep it direct and business-focused.`;

        const systemInstruction = "You are an expert enterprise software auditor and procurement CFO specializing in AI tooling and engineering productivity spend. Create a highly professional, direct, and concise ~100-word personalized advisory summary of their current AI spend. Focus exclusively on concrete math, tool redundancies, and specific structural savings. Maintain an objective, analytical tone without flowery marketing adjectives. Do not mention system-internal files or technical labels. All math MUST be coherent and align with the provided inputs.";

        const attemptGenerate = async (modelName: string) => {
          try {
            console.log(`Attempting personalized summary generation with model: ${modelName}`);
            const response = await ai.models.generateContent({
              model: modelName,
              contents: userPrompt,
              config: { systemInstruction },
            });
            return response.text || "";
          } catch (err: any) {
            console.warn(`Error generating summary with ${modelName}:`, err.message || err);
            return "";
          }
        };

        // Try 'gemini-3.5-flash' first
        summaryParagraph = await attemptGenerate("gemini-3.5-flash");

        // If 'gemini-3.5-flash' fails, fall back to 'gemini-flash-latest'
        if (!summaryParagraph || summaryParagraph.trim() === "") {
          console.warn("Primary model gemini-3.5-flash UNAVAILABLE or failed. Falling back to gemini-flash-latest...");
          summaryParagraph = await attemptGenerate("gemini-flash-latest");
        }

        // If 'gemini-flash-latest' fails, fall back to 'gemini-3.1-flash-lite'
        if (!summaryParagraph || summaryParagraph.trim() === "") {
          console.warn("Fallback model gemini-flash-latest failed. Falling back to gemini-3.1-flash-lite...");
          summaryParagraph = await attemptGenerate("gemini-3.1-flash-lite");
        }
      } catch (rootErr: any) {
        console.error("Gemini root summary generator exception:", rootErr);
      }
    }

    // Fall back to template summary if AI was offline or errored
    if (!summaryParagraph || summaryParagraph.trim() === "") {
      const { totalSavingsMonthly, totalCurrentSpend } = auditResult;
      const { teamSize, primaryUseCase } = auditResult.inputs;
      if (totalSavingsMonthly > 0) {
        summaryParagraph = `Your team of ${teamSize} is currently spending $${totalCurrentSpend}/mo on AI tools. By optimizing allocations, consolidating redundant plans for ${primaryUseCase}, and migrating to team/volume tiers where appropriate, you can securely reduce leakage. We recommend executing the listed actions immediately to capture up to $${totalSavingsMonthly}/mo in baseline recurring overhead reduction.`;
      } else {
        summaryParagraph = `Your team of ${teamSize} has optimized their AI spend. Your tooling matches workload demands for ${primaryUseCase} with zero redundant seats or plan tiers discovered. We recommend maintaining this configuration and scheduling a quarterly re-audit to capture pricing/tier adjustments as the market matures.`;
      }
    }

    auditResult.personalizedSummary = summaryParagraph;

    // Save on database
    await persistAudit(auditResult);

    res.json({ success: true, data: auditResult });
  } catch (error: any) {
    console.error("Audit endpoint error:", error);
    res.status(500).json({ error: error.message || "Failed to generate report" });
  }
});

// 2. Fetch specific public audit (PII is fully stripped since inputs do not store user email/company)
app.get("/api/audit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const audit = await findAudit(id);

    if (!audit) {
      res.status(404).json({ error: "Audit report not found" });
      return;
    }

    res.json({ success: true, data: audit });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to retrieve audit report" });
  }
});

// 3. Lead Capture with basic abuse check & transactional email notification
app.post("/api/leads", async (req, res) => {
  try {
    const { email, companyName, role, teamSize, auditId, website } = req.body;

    // Honeypot Protection: 'website' field must be empty
    if (website && website.trim() !== "") {
      console.warn("Honeypot protection triggered. Rejected lead capture.");
      res.status(400).json({ error: "Suspicious submission rejected" });
      return;
    }

    if (!email || !auditId) {
      res.status(400).json({ error: "Email and Audit ID are required" });
      return;
    }

    const lead: LeadInput & { createdAt: string; id: string } = {
      id: Math.random().toString(36).substring(2, 11),
      email,
      companyName: companyName || "",
      role: role || "",
      teamSize: teamSize ? Number(teamSize) : undefined,
      auditId,
      createdAt: new Date().toISOString()
    };

    // Save lead
    await persistLead(lead);

    // Retrieve corresponding audit to customize email template and flag high savings high-value leads (> $500 savings/mo)
    const audit = await findAudit(auditId);
    const savingsAmount = audit ? audit.totalSavingsMonthly : 0;
    const isHighSavings = savingsAmount >= 500;

    // Simulate sending email via a verified platform
    // In production we import a custom client (`import { Resend } from 'resend'`) if Resend API key is available
    console.log("====================================================");
    console.log(`TRANSACTIONAL EMAIL DISPATCHER [SIMULATED PLATFORM]`);
    console.log(`To: ${email}`);
    console.log(`Subject: Your SpendOptic AI Spend Audit Report Summary`);
    console.log(`------------------------------`);
    console.log(`Hello${companyName ? " from " + companyName : ""},`);
    console.log(`Thank you for auditing your AI tools spend with SpendOptic.`);
    console.log(`Here is a quick summary of the potential optimization we found:`);
    console.log(`- Current Monthly Spend: $${audit ? audit.totalCurrentSpend : 0}`);
    console.log(`- Potential Monthly Savings: $${savingsAmount}/mo`);
    console.log(`- Potential Annual Savings: $${audit ? audit.totalSavingsAnnual : 0}/yr`);
    if (isHighSavings) {
      console.log(`\n*** CRITICAL ADVISORY ***`);
      console.log(`Your calculated savings exceed $500/month. A Credex AI Procurement specialist will be reaching out shortly to guide your team through direct bulk licensing contracts and committed-use discounts.`);
    } else {
      console.log(`\nWe have set up an automated notification for your account to alert you when new provider tiers or optimization frameworks apply.`);
    }
    console.log(`------------------------------`);
    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol;
    const computedShareUrl = `${protocol}://${host}/share/${auditId}`;

    console.log(`Access your unique shareable report here: ${computedShareUrl}`);
    console.log("====================================================");

    res.json({
      success: true,
      data: {
        leadId: lead.id,
        isHighSavings,
        message: "Lead captured successfully. Audit confirmation email logged to terminal."
      }
    });
  } catch (error: any) {
    console.error("Lead capture error:", error);
    res.status(500).json({ error: "Failed to process lead capture" });
  }
});

// Serve Open Graph / Twitter Cards in HTML precisely for shared report urls
app.get("/share/:auditId", async (req, res, next) => {
  const { auditId } = req.params;
  const audit = await findAudit(auditId);

  if (!audit) {
    next(); // Fall through to standard layout
    return;
  }

  // Generate HTML with injected Meta Headers
  let htmlContent = "";
  const isProd = process.env.NODE_ENV === "production";
  const indexHtmlPath = isProd
    ? path.join(process.cwd(), "dist", "index.html")
    : path.join(process.cwd(), "index.html");

  if (fs.existsSync(indexHtmlPath)) {
    htmlContent = fs.readFileSync(indexHtmlPath, "utf-8");
  } else if (!isProd) {
    // Fallback
    const fallbackPath = path.join(process.cwd(), "dist", "index.html");
    if (fs.existsSync(fallbackPath)) {
      htmlContent = fs.readFileSync(fallbackPath, "utf-8");
    }
  }

  if (htmlContent) {
    const title = `AI Tool Spend Audit: $${audit.totalSavingsMonthly}/mo Saved - SpendOptic`;
    const description = `My organization has unlocked $${audit.totalSavingsAnnual}/yr in redundant licenses and optimized seats. Check out my full SpendOptic report.`;
    
    // Dynamically retrieve protocol and host to build compliant social-preview/share URLs
    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol;
    const shareUrl = `${protocol}://${host}/share/${auditId}`;

    // Inject tags in head
    const tags = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${shareUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    `;

    // Replace <title> tag if any, or append in head
    let modifiedHtml = htmlContent
      .replace(/<title>.*<\/title>/, "")
      .replace("<head>", `<head>${tags}`);

    // Cleanly process HTML template via Vite compilation parser in dev environment
    if (process.env.NODE_ENV !== "production" && viteInstance) {
      try {
        modifiedHtml = await viteInstance.transformIndexHtml(req.originalUrl, modifiedHtml);
      } catch (transformErr) {
        console.error("Vite index HTML transform error:", transformErr);
      }
    }

    res.send(modifiedHtml);
    return;
  }

  next();
});

// ---------------- VITE OR STATIC FILE DISTRIBUTION ----------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    viteInstance = vite;
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SpendOptic Server booted and listening on port ${PORT}`);
  });
}

startServer();
