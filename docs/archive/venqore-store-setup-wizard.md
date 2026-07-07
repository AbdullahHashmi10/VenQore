# VenQore — Store Setup Wizard
### Complete Onboarding System Design Document
> Version 1.0 | Product & UX Architecture

---

## TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [User Flow Architecture](#2-user-flow-architecture)
3. [Step-by-Step Breakdown](#3-step-by-step-breakdown)
4. [Detailed Flow Design](#4-detailed-flow-design)
5. [Guided Walkthrough System](#5-guided-walkthrough-system)
6. [Progression & State Management](#6-progression--state-management)
7. [UX & Psychology Layer](#7-ux--psychology-layer)
8. [Edge Cases](#8-edge-cases)
9. [Transition to Main System](#9-transition-to-main-system)
10. [Implementation Strategy](#10-implementation-strategy)

---

## 1. SYSTEM OVERVIEW

### What This Is

The **Store Setup Wizard** is a one-time, guided onboarding experience that intercepts new store owners immediately after store creation — before they ever see the full dashboard. It acts as a structured bridge between "blank store" and "confident first action."

It is **not** a stripped-down version of the product. It is the full product, presented in a reduced-complexity shell, one focus area at a time.

### Why It Exists

VenQore is a feature-rich ERP + POS system. That richness is its greatest strength — and the exact reason first-time users drop off. When a new user lands on the dashboard and sees transaction cards, report widgets, tab bars, and navigation menus all at once, their brain answers one question:

> "I don't know where to start."

And then they leave.

The Setup Wizard solves this by answering that question *for* them — in the right order, with the right pace, with the right encouragement — so that by the time they reach the real dashboard, they already feel like they know the system.

### Key UX Principles

| Principle | Application |
|---|---|
| **Progressive Disclosure** | Show one concern at a time. Never reveal the next step until the current one is addressed. |
| **Perceived Control** | User can skip, pause, or return at any time. Nothing is forced. |
| **Time-to-Value is Sacred** | The first real action (a sale, an invoice) must happen within the first session. |
| **Confidence Before Complexity** | User must feel capable before they see the full system. |
| **No Dead Ends** | Every skip, every exit, every "I'll do this later" must lead somewhere safe. |
| **Reuse Existing UI** | The wizard uses real pages — same forms, same components — wrapped in a guided shell. No parallel UI systems to maintain. |

---

## 2. USER FLOW ARCHITECTURE

### Entry Point

```
User creates a new store
        │
        ▼
System checks: onboarding_complete = false?
        │
       YES
        │
        ▼
Redirect to /setup-wizard (NOT /dashboard)
```

The flag `onboarding_complete` lives on the **store** record, not the user record. It is set to `false` at store creation and `true` only when the user explicitly completes or dismisses the wizard for the final time.

### High-Level Journey

```
PHASE 0: Welcome
   └─ Guided Setup  ──────────────────────────────┐
   └─ Skip to Dashboard  ──────► [flag marked, go to dashboard]

PHASE 1: Store Setup (Data Entry)
   ├─ Step 1: Products & Inventory
   ├─ Step 2: Financial Accounts (Bank / Cash / Capital)
   ├─ Step 3: Expense Categories
   └─ Step 4: Parties (Customers & Suppliers)
              │
              ▼
        [Setup Complete Banner]
              │
              ▼
PHASE 2: System Walkthrough (Optional Tutorial)
   ├─ Option A: Take the guided tour
   └─ Option B: Jump into the real system now
              │
           [Tour]
              ├─ Demo: POS Sale (NOT saved)
              ├─ Demo: Create Invoice (NOT saved)
              ├─ Demo: Create Purchase (NOT saved)
              └─ Demo: Log Expense (NOT saved)
              │
              ▼
PHASE 3: Completion
   └─ Celebration screen → Real Dashboard
```

### Decision Points

| Decision | Option A | Option B |
|---|---|---|
| Welcome screen | Start Guided Setup | Skip to Dashboard |
| Any setup step | Continue | Skip this step |
| After setup complete | Take Guided Tour | Go to Dashboard |
| Mid-tour | Continue demo | Exit to real system |
| Tour complete | Go to Dashboard | — |

### Exit Conditions

- **Hard Exit**: User clicks "Skip to Dashboard" on welcome → taken to dashboard, wizard never shown again automatically (but accessible from settings/help).
- **Soft Exit**: User skips a setup step → wizard continues to next step. Progress is saved.
- **Session Exit**: User closes browser mid-flow → wizard resumes from last completed step on next login.
- **Completion Exit**: User completes all phases → `onboarding_complete = true`, redirected to dashboard.

---

## 3. STEP-BY-STEP BREAKDOWN

### PHASE 0 — Welcome

| Attribute | Detail |
|---|---|
| **Step Name** | Welcome & Intent Capture |
| **Purpose** | Set the tone. Reduce anxiety. Establish trust. Give the user a clear choice between guided and independent. |
| **UI Approach** | Full-screen modal/overlay on a blurred, dimmed dashboard background. User can see the dashboard exists but can't interact with it yet. This creates curiosity, not fear. |
| **User Actions** | Click "Set Up My Store" or "Skip, I'll explore myself" |
| **System Behavior** | "Set Up My Store" → Wizard starts. "Skip" → `onboarding_skipped = true`, redirect to dashboard. |
| **Skip Logic** | Skipping here is a permanent first-session skip. The wizard can still be re-entered from Help > Setup Wizard. |
| **Completion Criteria** | User clicks either button. |

---

### PHASE 1 — Store Setup

#### Step 1: Products & Inventory

| Attribute | Detail |
|---|---|
| **Step Name** | Add Your Products |
| **Purpose** | The product catalog is the heart of any retail/trade operation. Without products, nothing else works. This step establishes the store's core inventory. |
| **UI Approach** | Full existing **Products page**, embedded inside a wizard shell (top progress bar, step label, "Next Step" button, "Skip for Now" link). No new page built. Just a new layout wrapper around the existing product creation UI. |
| **User Actions** | Add products one by one, OR use the import-from-file option. Set names, prices, SKUs, units, category, and initial stock. |
| **System Behavior** | Every product saved is real and persisted. Auto-saves. No time pressure. The "Next Step" button activates as soon as 1 product is added (but user is encouraged to add all). |
| **Skip Logic** | "Skip for Now" available at all times. A soft warning: "You can still use the system, but you'll need products before making a sale." User proceeds. |
| **Completion Criteria** | At least 1 product created, OR user explicitly skips. |

---

#### Step 2: Financial Setup

| Attribute | Detail |
|---|---|
| **Step Name** | Set Up Your Accounts |
| **Purpose** | Before any transaction is recorded, the system needs to know where money lives. This step creates the financial skeleton of the store. |
| **UI Approach** | Existing **Chart of Accounts / Bank Accounts page**, wrapped in wizard shell. Presented in three mini-sub-steps within this one step (Bank → Cash → Capital). Sub-steps do NOT require separate navigation — they appear as collapsible sections on one screen. |
| **User Actions** | Add bank account(s) with name and opening balance. Add cash-in-hand amount. Optionally add owner's capital contribution. |
| **System Behavior** | Each entry creates real ledger entries. Capital entry creates an equity transaction. All optional — the system works without these, just with reduced reporting accuracy. |
| **Skip Logic** | Entire step skippable. Each sub-section skippable independently. Tooltip on skip: "You can add accounts later from Accounts > Bank & Cash." |
| **Completion Criteria** | At least 1 account created (bank OR cash), OR user skips. |

---

#### Step 3: Expense Categories

| Attribute | Detail |
|---|---|
| **Step Name** | Set Up Expense Categories |
| **Purpose** | Expense tracking requires categories. This step pre-populates the most common ones and lets the user customize — making expense logging effortless from day one. |
| **UI Approach** | Custom screen within wizard shell. Shows a **grid of pre-built category cards** (Rent, Utilities, Salaries, Transport, Marketing, Maintenance, Miscellaneous, etc.). User taps/checks the ones they want. Below: a "+ Add Custom Category" button. This is fast, visual, and feels like configuration, not a form. |
| **User Actions** | Select predefined categories. Add custom ones. Remove unwanted ones. |
| **System Behavior** | Selected categories are created in the Expense Categories table. Custom entries are created immediately. Nothing is destructive — categories can be renamed or deleted later. |
| **Skip Logic** | Fully skippable. Default categories (Rent, Utilities, Miscellaneous) are auto-created silently as a safety net if skipped. |
| **Completion Criteria** | At least 1 category selected/created, OR user skips. |

---

#### Step 4: Parties (Customers & Suppliers)

| Attribute | Detail |
|---|---|
| **Step Name** | Add Your Customers & Suppliers |
| **Purpose** | Parties are required for invoicing and purchasing. This step lets the user seed their contact list before any transactions begin, which makes the first real sale or purchase far smoother. |
| **UI Approach** | Existing **Parties page**, wrapped in wizard shell. Two tabs within the step: "Customers" and "Suppliers." Import-from-file button prominently placed. |
| **User Actions** | Add parties manually (name, phone, type, opening balance if any). OR import via CSV/Excel. Optionally add opening receivables/payables per party. |
| **System Behavior** | All parties saved are real records. Opening balances create journal entries. Import validates and shows a preview before committing. |
| **Skip Logic** | Fully skippable. Walk-in customer / general supplier defaults exist for cash transactions. |
| **Completion Criteria** | At least 1 party added, OR user skips. |

---

### PHASE 1 → PHASE 2 TRANSITION

After Step 4 completes (or is skipped), a **Setup Complete banner** appears:

> ✅ **Your store is set up!**
> You've added your products, accounts, expense categories, and contacts.
> Now let's see how the system actually works — with a quick guided walkthrough.

Two buttons:
- **"Show Me How It Works"** → Enters Phase 2 (guided tour)
- **"I'm Ready — Take Me to My Dashboard"** → Marks `setup_steps_complete = true`, redirects to dashboard.

---

### PHASE 2 — Guided Walkthrough

#### Tour Step 1: POS Sale Demo

| Attribute | Detail |
|---|---|
| **Step Name** | Make Your First Sale (Demo) |
| **Purpose** | POS is often the most-used feature. Let the user experience a real sale flow without the fear of creating a wrong record. |
| **UI Approach** | Full POS page — real UI — but with a **yellow "DEMO MODE" banner** at the top and all action buttons relabeled. "Checkout" becomes "Complete Demo Sale." A guided tooltip sequence walks the user through each action. |
| **User Actions** | Select a product, set quantity, select/type customer (or use walk-in), choose payment method, click "Complete Demo Sale." |
| **System Behavior** | Everything *looks* real and responds like the real system — but the final transaction is **NOT committed to the database**. The system uses a temporary in-memory/session state. On completion, a success modal says: "That's how a sale works! This wasn't saved. Ready to make a real one?" |
| **Skip Logic** | "Skip Demo" link always visible. |
| **Completion Criteria** | User clicks "Complete Demo Sale," OR skips. |

---

#### Tour Step 2: Create Invoice Demo

| Attribute | Detail |
|---|---|
| **Step Name** | Create an Invoice (Demo) |
| **Purpose** | Invoicing is the backbone of B2B revenue. This shows the user how to create a credit sale. |
| **UI Approach** | Full Invoice creation page with DEMO MODE banner and guided tooltips. |
| **User Actions** | Select customer, add products, set due date, review totals, click "Save Demo Invoice." |
| **System Behavior** | Same as POS — session-only, not persisted. Completion modal: "That's how invoicing works. This wasn't saved." |
| **Skip Logic** | "Skip Demo" always available. |
| **Completion Criteria** | Demo invoice "saved," OR skipped. |

---

#### Tour Step 3: Create Purchase Demo

| Attribute | Detail |
|---|---|
| **Step Name** | Record a Purchase (Demo) |
| **Purpose** | Show how inventory replenishment and supplier bills are recorded. |
| **UI Approach** | Full Purchase/Bill creation page with DEMO MODE banner. |
| **User Actions** | Select supplier, add items with quantities and costs, set payment terms, click "Save Demo Purchase." |
| **System Behavior** | Not persisted. Completion modal: "That's how purchases work. Inventory, costs, and payables — all handled automatically." |
| **Skip Logic** | Skippable. |
| **Completion Criteria** | Demo completed or skipped. |

---

#### Tour Step 4: Log an Expense Demo

| Attribute | Detail |
|---|---|
| **Step Name** | Log an Expense (Demo) |
| **Purpose** | Show the simplest transaction type to build closing confidence. |
| **UI Approach** | Expense entry form with DEMO MODE banner. |
| **User Actions** | Select category, enter amount, select payment method, add a note, click "Save Demo Expense." |
| **System Behavior** | Not persisted. Completion modal: "That's it! Expenses tracked in seconds." |
| **Skip Logic** | Skippable. |
| **Completion Criteria** | Demo completed or skipped. |

---

### PHASE 3 — Completion

| Attribute | Detail |
|---|---|
| **Step Name** | You're All Set |
| **Purpose** | Celebrate the user's progress. Create a confident emotional close before they enter the real system. |
| **UI Approach** | Full-screen completion screen. VenQore branding, animated checkmark or subtle confetti. Summary of what was set up. Two CTAs. |
| **User Actions** | Click "Go to My Dashboard" |
| **System Behavior** | `onboarding_complete = true` written to DB. User redirected to real dashboard. Subtle "guided hints" system activated (see Section 9). |
| **Skip Logic** | N/A — this is the final screen. |
| **Completion Criteria** | User clicks "Go to My Dashboard." |

---

## 4. DETAILED FLOW DESIGN

### A. Welcome Step

**Screen Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│   [Blurred dashboard in background]                          │
│                                                              │
│   ┌──────────────────────────────────────┐                  │
│   │  👋  Welcome to VenQore              │                  │
│   │                                      │                  │
│   │  You've just created your store.     │                  │
│   │  Let's set it up together — it       │                  │
│   │  takes about 10 minutes.             │                  │
│   │                                      │                  │
│   │  We'll walk you through:             │                  │
│   │  ✓ Adding your products              │                  │
│   │  ✓ Setting up your accounts          │                  │
│   │  ✓ Adding customers & suppliers      │                  │
│   │  ✓ Making your first sale            │                  │
│   │                                      │                  │
│   │  [Set Up My Store]                   │                  │
│   │                                      │                  │
│   │  Skip — I'll explore on my own →     │                  │
│   └──────────────────────────────────────┘                  │
└──────────────────────────────────────────────────────────────┘
```

**Copy Principles:**
- No jargon. No pressure. "Together" signals collaboration.
- Time estimate ("~10 minutes") removes the fear of a long commitment.
- The checklist previews the journey, reducing surprise.
- "Skip" is a plain text link — visible but not equal to the primary CTA.

---

### B. Product Setup

**UX Details:**

The existing products page is wrapped in a wizard shell:

```
┌────────────────── WIZARD SHELL ──────────────────────────────┐
│  ● ○ ○ ○   Step 1 of 4 — Add Your Products                  │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  [EXISTING PRODUCT PAGE RENDERS HERE — full functionality]   │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│  [← Back]          [Skip for Now]     [Next: Accounts →]    │
└──────────────────────────────────────────────────────────────┘
```

**Import UX:**
- Import button is surfaced prominently — "Have a product list? Import from Excel/CSV"
- Import opens a drawer (not a new page). Preview table shows first 10 rows. Validation errors shown inline per row. User can fix or ignore errors.
- On success: "X products imported successfully" — Next button activates.

**Pace Messaging:**
- Subtitle under the step title: "Add as many or as few as you want. You can always add more later."
- No auto-advance. User controls when they move on.

---

### C. Financial Setup

**Sub-step layout within Step 2:**

```
Step 2 of 4 — Set Up Your Accounts

  [Bank Accounts]  [Cash in Hand]  [Owner's Capital]
  ─────────────────────────────────────────────────
  
  BANK ACCOUNTS
  ┌────────────────────────────┐
  │ Account Name: [          ] │  + Add Another Bank Account
  │ Opening Balance: [       ] │
  └────────────────────────────┘

  CASH IN HAND
  ┌────────────────────────────┐
  │ Opening Cash Balance: [  ] │
  └────────────────────────────┘

  OWNER'S CAPITAL (optional)
  ┌────────────────────────────────────────────────────┐
  │ How much capital did you invest in this store?     │
  │ Amount: [          ]    (optional — skip if unsure)│
  └────────────────────────────────────────────────────┘
```

**Why all three on one screen:**
- Spreading these across 3 wizard steps would feel tedious.
- They're conceptually linked: "where is your money?"
- Each sub-section is collapsible/expandable.

---

### D. Expense Categories

**Visual grid UX:**

```
Step 3 of 4 — Expense Categories

  Pick the categories that apply to your business.
  You can add custom ones below.

  ┌────────┐ ┌────────┐ ┌─────────┐ ┌──────────┐
  │  Rent  │ │ Salary │ │ Utility │ │Transport │ ← tap to select
  │  [✓]   │ │  [ ]   │ │   [✓]   │ │   [ ]    │
  └────────┘ └────────┘ └─────────┘ └──────────┘
  ┌──────────┐ ┌───────────┐ ┌──────────────────┐
  │Marketing │ │Maintenance│ │  Miscellaneous   │
  │   [ ]    │ │    [✓]    │ │       [✓]        │
  └──────────┘ └───────────┘ └──────────────────┘

  + Add a custom category:  [________________] [Add]

  Already added: Repairs ✕   Packaging ✕
```

**Behaviour:**
- Cards toggle on click with a checkmark + colour fill.
- Custom entry appends a tag below instantly.
- Minimum 2 categories auto-selected by default to avoid empty states.

---

### E. Parties Setup

**Tab structure:**

```
Step 4 of 4 — Your Customers & Suppliers

  [Customers]  [Suppliers]

  ┌─────────────────────────────────────────────────┐
  │ Name: [           ]  Phone: [           ]       │
  │ Opening Receivable (if any): [         ]        │
  │ [Add Customer]                                  │
  └─────────────────────────────────────────────────┘

  ─── Or import from a file ───
  [ Import from Excel / CSV ]

  Added so far:
  ┌────────────────────────────────────────┐
  │ Ahmed Ali      +92 300 0000000    ✏️ 🗑️ │
  │ Shopkeeper Co. (no phone)         ✏️ 🗑️ │
  └────────────────────────────────────────┘
```

**Import flow (same as products):**
- Drawer-based preview. Error rows highlighted. Confirm → bulk create.

---

## 5. GUIDED WALKTHROUGH SYSTEM

### Architecture: Demo Mode

Demo Mode is a **session-scoped transactional sandbox**. It works as follows:

1. When demo mode is entered, a flag `wizard_demo_mode = true` is set in the frontend app state.
2. All API calls for write operations (create sale, create invoice, etc.) are intercepted.
3. Instead of hitting the real `/api/sales/create` endpoint, they hit `/api/demo/preview` — a lightweight endpoint that validates the data and returns a realistic success response but performs no database writes.
4. The UI responds exactly as it would for a real transaction.
5. When the user exits demo mode, all session state is cleared.

**Why this approach instead of a "test store":**
- No cleanup required.
- No risk of test data in production.
- Works with the user's real products and parties (read operations are real).
- No parallel database/schema needed.

### Guided Tooltip System

Each demo step uses a sequential tooltip overlay:

```
Step → Highlighted element → Tooltip → User action → Next tooltip
```

Example (POS demo):
```
1. [Products panel highlighted]
   💬 "Start by searching for a product or tapping it here."
   
2. [Cart highlighted after product added]
   💬 "Your cart updates automatically. You can change quantity here."
   
3. [Payment panel highlighted]
   💬 "Choose how the customer is paying."
   
4. [Checkout button highlighted]
   💬 "When you're ready, complete the sale here."
   ⚠️ "This demo sale will NOT be saved."
```

### Demo Mode UI Indicators

Every demo screen must clearly communicate its non-destructive nature:

- **Top banner** (yellow/amber): `🧪 DEMO MODE — Nothing here will be saved`
- **Primary action button** label changes: "Checkout" → "Complete Demo Sale"
- **Success modal** after demo action always includes:
  > "Great work! This was just a demo — nothing was recorded. When you're ready to make a real sale, come back to this page anytime."
  > [Continue Tour] [Go to Dashboard]

### What Is Interactive vs Simulated

| Element | Interactive? | Notes |
|---|---|---|
| Product search | ✅ Real | Uses actual product catalog |
| Add to cart | ✅ Real | Client-side state |
| Quantity edit | ✅ Real | Client-side state |
| Customer select | ✅ Real | Uses actual party list |
| Payment method | ✅ Real | UI only |
| Discount/tax input | ✅ Real | Calculated client-side |
| Final submission | 🔶 Simulated | Hits `/demo/preview`, not real endpoint |
| Receipt generation | 🔶 Simulated | Shown but not stored |
| Inventory deduction | ❌ Not applied | No DB write occurs |
| Ledger entries | ❌ Not applied | No DB write occurs |

---

## 6. PROGRESSION & STATE MANAGEMENT

### Database Schema (Additions)

```sql
-- On the stores table (or a dedicated wizard_state table):

onboarding_complete        BOOLEAN DEFAULT false
onboarding_skipped         BOOLEAN DEFAULT false
wizard_current_step        VARCHAR(50) DEFAULT 'welcome'
wizard_setup_complete      BOOLEAN DEFAULT false
wizard_tour_complete       BOOLEAN DEFAULT false
wizard_steps_completed     JSONB DEFAULT '[]'
  -- e.g. ["products", "accounts", "expenses", "parties"]
wizard_steps_skipped       JSONB DEFAULT '[]'
  -- e.g. ["parties"]
wizard_started_at          TIMESTAMP
wizard_completed_at        TIMESTAMP
```

### Progress Tracking

- **After each step is completed or skipped**: update `wizard_current_step` and append to `wizard_steps_completed` or `wizard_steps_skipped`.
- **On next login** (if `onboarding_complete = false`): redirect to `/setup-wizard?resume=true`. The wizard reads `wizard_current_step` and jumps directly to that step.
- **Progress bar**: always reflects real step count, not just completed steps. "Step 2 of 4" is shown even if Step 1 was skipped.

### Skip Logic Rules

| Situation | Behavior |
|---|---|
| Skip a setup step | Step marked as skipped. Move to next step. |
| Skip the entire setup at welcome | `onboarding_skipped = true`. Go to dashboard. Wizard accessible from Help menu. |
| Skip the tour entirely | `wizard_tour_skipped = true`. Mark `onboarding_complete = true`. Go to dashboard. |
| Skip an individual demo | Mark that demo as skipped. Move to next demo. |

### Resume Logic

On login, system checks:
```
onboarding_complete = false?
  └─ YES → Is user the store's super admin?
              └─ YES → Redirect to /setup-wizard?step={wizard_current_step}
              └─ NO → Normal dashboard
  └─ NO → Normal dashboard
```

### Re-entry After Completion

Once `onboarding_complete = true`, the wizard is no longer auto-triggered. However:
- A "Setup Wizard" link appears in **Help > Getting Started** menu.
- Clicking it re-opens the wizard in a **review mode** (read-only summary of what was set up, with links to each area).
- The tour can be re-taken at any time from this menu.

---

## 7. UX & PSYCHOLOGY LAYER

### Reducing Overwhelm

| Technique | How Applied |
|---|---|
| **One job per screen** | Each wizard step has exactly one topic. No sidebars. No navigation menus visible. The rest of the product does not exist yet, visually. |
| **Visible progress** | Step indicator (● ● ○ ○) shows exactly where they are. The end is always visible. |
| **Soft language** | "Take your time." "Skip if you want." "You can always add more later." No urgency. |
| **Collapsible complexity** | Financial sub-steps (bank/cash/capital) are collapsible. User can ignore what doesn't apply. |

### Building Confidence

| Technique | How Applied |
|---|---|
| **Real feedback** | When a product is saved, it appears in a list below the form instantly. The user can see their work accumulate. |
| **Small wins** | Each step ends with a green success state ("✅ 5 products added"). |
| **Demo before real** | The demo walkthrough lets users "practice" in a zero-risk environment before committing real transactions. |
| **Summary at the end** | The completion screen shows everything they set up: "5 products, 2 accounts, 3 expense categories, 8 parties." Proof of progress. |

### Maintaining Motivation

| Technique | How Applied |
|---|---|
| **Time framing** | "~10 minutes" upfront. Each step has a subtle estimated time: "(~2 min)" |
| **Encouraging copy** | "Great! You're ready to start selling." after each step. Not patronizing — brief and energetic. |
| **Visible endpoint** | The final step always visible in the progress bar. The finish line is always in sight. |
| **Optional depth** | Users who want to add 50 products can. Users who want to add 2 and move on can. Both paths are valid and respected. |

### Minimising Friction

| Technique | How Applied |
|---|---|
| **Defaults everywhere** | Expense categories pre-selected. Walk-in customer pre-exists. Default cash account auto-created. |
| **No required fields in wizard context** | In the real system, some fields are required. In the wizard, warnings are shown but submissions are not blocked (except for logically essential fields like product name). |
| **Import as a first-class option** | Every data-entry step offers import. Users with existing data can be done in minutes. |
| **Back navigation always available** | No trap doors. User can always go back to a previous step without losing their work. |

---

## 8. EDGE CASES

### Case 1: User Skips Everything

**Scenario:** User hits "Skip" on welcome. Never returns to wizard.

**Handling:**
- `onboarding_skipped = true` recorded.
- Dashboard loads normally.
- A subtle, dismissible **tip card** on the dashboard: "👋 Haven't set up your store yet? [Open Setup Wizard]"
- Card disappears after 7 days or when dismissed — never intrusive.

---

### Case 2: User Partially Completes Setup

**Scenario:** User completes products and accounts, then closes the browser before doing expenses or parties.

**Handling:**
- `wizard_current_step = 'expenses'` saved after account step completes.
- On next login: auto-redirect to `/setup-wizard?step=expenses`.
- Progress bar shows steps 1 and 2 already filled.
- Brief message: "Welcome back! You left off at Expense Categories. Pick up where you left."

---

### Case 3: User Exits Mid-Demo

**Scenario:** User starts the POS demo, then navigates away (closes tab, browser back button, etc.).

**Handling:**
- Demo state is session-scoped. Nothing is saved. No cleanup needed.
- On next login: wizard resumes at Phase 2 (tour), first demo step.
- `wizard_tour_complete = false` means user is offered the tour again.

---

### Case 4: User Returns After Days

**Scenario:** User set up products and accounts 3 days ago and hasn't logged in since.

**Handling:**
- System checks `onboarding_complete = false`.
- Redirects to wizard at `wizard_current_step` (e.g., 'expenses').
- No context is lost. Their previously added data (products, accounts) is intact and shown.

---

### Case 5: User Imports Large Data

**Scenario:** User imports 500 products from a CSV file.

**Handling:**
- Import is processed asynchronously (background job if > 100 rows).
- UI shows a progress bar: "Importing 500 products… 42% complete"
- On completion: "✅ 498 products imported. 2 rows had errors — [View Errors]"
- User can proceed to the next step while review of errors is optional.
- Error file downloadable as CSV with error annotations.

---

### Case 6: User Adds Opening Balances for Parties

**Scenario:** User imports 50 customers with receivable balances.

**Handling:**
- Import template includes an optional "Opening Balance" column.
- Imported balances create journal entries dated the store's creation date (or a configurable "go-live date").
- Summary shown: "Opening balances set for 23 customers (total receivable: PKR 1,240,000)."

---

### Case 7: Non-Admin User Logs In First

**Scenario:** The store owner creates the store, then an employee (non-super-admin) is the first to log in on a device.

**Handling:**
- Wizard checks: `is_super_admin = true?`
- Non-admin users are **never shown the wizard**. They go directly to the dashboard with role-appropriate access.
- The wizard is exclusively for the store's original super admin.

---

## 9. TRANSITION TO MAIN SYSTEM

### The Completion Screen

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   🎉  Your Store Is Ready                            │
│                                                      │
│   Here's what you've set up:                         │
│   ✅ 12 products added                               │
│   ✅ 2 bank accounts + cash registered               │
│   ✅ 5 expense categories created                    │
│   ✅ 8 customers and 4 suppliers added               │
│   ✅ Guided tour completed                           │
│                                                      │
│   VenQore is ready to run your business.             │
│                                                      │
│          [Go to My Dashboard →]                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### First Dashboard Experience

The dashboard they arrive at is the same, full dashboard — but with two UX enhancements activated:

**1. Contextual Empty States**

Instead of widgets showing zeros with no context, empty-state widgets show actionable prompts:

```
┌─────────────────────────────┐
│  Sales Today                │
│  No sales yet               │
│  [Make Your First Sale →]   │
└─────────────────────────────┘
```

**2. Guided Hints (Passive, Non-Intrusive)**

A small "?" beacon appears on key interactive elements for the first 7 days:

- POS button: "Make a sale"
- Invoices tab: "Send an invoice to a customer"
- Purchase button: "Record a supplier purchase"

Clicking the beacon shows a 1-sentence tooltip. No popups. No interruptions.

These hints are:
- Stored per-user in `ui_hints_dismissed` (JSONB)
- Dismissible one by one
- Automatically hidden after 14 days regardless of dismissal

**3. Setup Checklist Widget (Optional)**

A collapsible sidebar widget shows the setup checklist post-onboarding:

```
Getting Started  ▼
────────────────
✅ Products added
✅ Accounts set up
⬜ First sale made       [Go]
⬜ First invoice created [Go]
⬜ First purchase made   [Go]
```

This widget auto-hides when all 5 items are checked. It can be dismissed at any time.

---

## 10. IMPLEMENTATION STRATEGY

### Architecture Decision: Wizard Shell, Not New Pages

The core implementation uses a **layout wrapper pattern**:

```
<WizardShell currentStep={step} totalSteps={4} onSkip={...} onNext={...}>
  {renderStepContent(step)}
</WizardShell>
```

`renderStepContent()` renders the **existing page component** for each step. The shell provides the progress bar, step label, navigation buttons (Back / Skip / Next), and the wizard background. The page component inside is unchanged — it just loses its normal nav/sidebar and gains the wizard shell around it.

**Benefits:**
- Existing pages are not duplicated or modified.
- Any future improvements to those pages automatically apply to the wizard.
- No "two UIs" maintenance problem.

### Routing

```
/setup-wizard              → Welcome step
/setup-wizard/products     → Step 1
/setup-wizard/accounts     → Step 2
/setup-wizard/expenses     → Step 3
/setup-wizard/parties      → Step 4
/setup-wizard/tour/pos     → Tour: POS
/setup-wizard/tour/invoice → Tour: Invoice
/setup-wizard/tour/purchase → Tour: Purchase
/setup-wizard/tour/expense → Tour: Expense log
/setup-wizard/complete     → Completion screen
```

On direct access to `/dashboard` by a user with `onboarding_complete = false`:
```
Middleware → check flag → redirect to /setup-wizard?step={current}
```

### State Handling

- **Server-side state**: Wizard progress stored in DB (fields described in Section 6). Source of truth.
- **Client-side state**: Wizard context (React Context or Zustand store) holds in-session state: current step, demo mode flag, unsaved form data.
- **Demo mode**: Client-only flag. Never sent to server except as part of `/api/demo/preview` calls.

### Feature Flags

| Flag | Scope | Purpose |
|---|---|---|
| `onboarding_complete` | Store record | Primary gate. Is wizard done? |
| `onboarding_skipped` | Store record | Did user skip at welcome? |
| `wizard_current_step` | Store record | Resume point |
| `wizard_tour_complete` | Store record | Was the tour completed? |
| `wizard_demo_mode` | Client session | Is a demo active? |
| `ui_hints_active` | User record | Show guided hints on dashboard? |
| `ui_hints_dismissed` | User record (JSONB) | Which hints have been closed? |

### Demo API Endpoint

```
POST /api/demo/preview

Body: { type: "sale" | "invoice" | "purchase" | "expense", payload: {...} }

Behavior:
  1. Validate payload exactly as the real endpoint would
  2. Return a realistic success response with mock IDs and timestamps
  3. Perform ZERO database writes
  4. Log to analytics: { event: "demo_completed", type, store_id, user_id }

Response: { success: true, demo: true, mockId: "DEMO-0001", ... }
```

### Analytics Events to Track

| Event | When Fired |
|---|---|
| `wizard_started` | Welcome → "Set Up My Store" |
| `wizard_skipped` | Welcome → "Skip" |
| `wizard_step_completed` | Any step completed |
| `wizard_step_skipped` | Any step skipped |
| `wizard_tour_started` | Tour begins |
| `wizard_tour_demo_completed` | Each demo step done |
| `wizard_tour_skipped` | Tour skipped |
| `wizard_completed` | Completion screen shown |
| `hint_dismissed` | Guided hint closed |
| `checklist_item_completed` | First real action done |

These events enable measurement of:
- Step-by-step drop-off rates
- Which steps get skipped most
- Whether the tour increases first-transaction rate
- Time-to-first-real-action

---

## APPENDIX: COPY GUIDELINES

All wizard copy should follow these rules:

- **Speak to the owner, not a user**: "your store", "your products", "your customers"
- **No ERP jargon**: not "ledger entries", "journal vouchers", "chart of accounts" in primary copy. Use "accounts", "records", "your books."
- **Active voice**: "Add your products" not "Products can be added."
- **Short sentences**: Max 15 words per instructional sentence.
- **Time honesty**: State realistic time estimates. Don't say "takes 2 minutes" if it takes 10.
- **Empowering, not patronizing**: "Great work!" is fine once. Don't celebrate every single click.

---

*End of Document*
*VenQore Store Setup Wizard — System Design v1.0*
