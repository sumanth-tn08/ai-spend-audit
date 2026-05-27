# User Discovery Calls & Feedback Loops - SpendOptic

This log summarizes insights from three 10-15 minute discovery conversations focused on corporate AI licensing and procurement friction.

---

## Interview 1: J.H. - Engineering Team Lead (Series B Dev Squad, 45 Devs)

### Direct Quotes
1. *"Half our devs use Cursor, and the other half are still on GitHub Copilot within VS Code. I know for a fact we are paying twice for autocomplete, but syncing billing is a pain."*
2. *"We have like five different corporate credit cards paying for separate OpenAI API keys. Trying to cross-audit our total monthly usage is a black hole."*
3. *"If you show me how much we're on track to leak over the year, I can actually present that slide directly to our CFO during budgeting."*

### Most Surprising Thing
The team lead had no idea that Cursor Business includes enterprise-scoped security layers, meaning devs were paying for personal Pro accounts and getting reimbursed individually, completely dodging company data policies.

### How It Changed the Design
We built specific, prominent cross-tool duplication flags (e.g. explicitly checking if both Cursor and GitHub Copilot are utilized and recommending Copilot cancellation) so that users are shown immediate direct savings.

---

## Interview 2: M.C. - Operations Manager (Pre-revenue Web Agency, 12 Users)

### Direct Quotes
1. *"I want to save cash, but I don't want to log in, verify our domains, or hook up our bank statements to another SaaS tool just to see a single chart."*
2. *"We pay for Claude Max licenses for several copywriters, but they mostly copy-paste text blocks into it. I'm sure the API or Claude Pro is fine."*
3. *"Most AI audits look like complicated enterprise software pitches. Give me a clean layout and show me the simple math."*

### Most Surprising Thing
Even for tiny squads of 12 people, the operations manager regarded logging in as a major barrier to entry for procurement utilities. They simply wanted an answer instantly without gatekeeping.

### How It Changed the Design
We strictly configured SpendOptic as a **no-login web application** that does not require an account or credential connection. Email is collected strictly *after* the value (on-screen calculations, CFO summary) is shown, with simple local persistence.

---

## Interview 3: S.K. - Fractional CFO (Consultant for 8 Early-stage Startups)

### Direct Quotes
1. *"Finance people do not buy brand arguments. I don't care if 'Claude has a better writing tone.' Tell me how many dollars we save by downgrading tiers."*
2. *"For teams over 20, they buy tools in silos. The marketing lead buys ChatGPT Team, product buys Claude, and engineering buys Cursor. There is no central auditing."*
3. *"If an audit tells me we save over $500 a month, I would pay a procurement specialist $100 on the spot just to execute the contract negotiation."*

### Most Surprising Thing
The consultant was highly eager to offload the actual "execution" of the savings contract (e.g., getting in touch with vendors or migrating platforms) to a service if the savings exceeded $500/mo.

### How It Changed the Design
We implemented a conditional consultation CTA. If the deterministic calculations show monthly savings > $500, we prominently render the Credex direct consultation banner to prompt immediate advisory conversions.
