# VenQore — Role & Permission Architecture
## The Complete, Industry-Grade Master Plan

**Author:** Architecture Session — April 2026  
**Status:** PLANNING ONLY — No code to be written until this document is signed off.  
**Purpose:** Define every user, every role, every dashboard, and every permission in the entire VenQore ecosystem — from the Platform Owner down to the most restricted store user.

> **SCOPE NOTICE — Three-Tier Architecture:**  
> This document fully specifies **Tier 1 (Platform HQ)** and **Tier 2 (Tenant/Store)**.  
> **Tier 3 — The B2B/B2C Network Ecosystem** (Wholesale Partners, Marketplace Consumers, Agency Partners, App Developers) is summarized at the bottom of this document and will be fully specified in a **Phase 3 / Year 3+ specification document**. The database schema *must* be designed to accommodate Tier 3 foreign keys from Day 1 — see the Tier 3 section for required schema stubs.

> **SECURITY NOTICE — URL Structure:**  
> All Tier 2 store routes use `{store_slug}` (a human-readable text identifier like `ali-electronics`), **never** the numeric database ID. Using `/app/15/dashboard` instead of `/app/ali-electronics/dashboard` allows attackers to enumerate IDs to probe other stores and reveal your total store count to competitors. While the `{store_slug}` prevents enumeration, **the true protection against IDOR is the mandatory middleware membership check**. Without verifying the user belongs to the requested store context, a slug is just as vulnerable as a numeric ID. **The combination of non-enumerable slugs and strict membership middleware is non-negotiable.**

---

## The Mental Model: Two Sealed Universes

Think of VenQore as a **shopping mall with a corporate head office above it**.

- **The Head Office (Tier 1 — Platform/HQ)** is where *you* run the business. You see every shop, every transaction summary, every complaint. You can walk into any shop. The Head Office staff (Support, Marketing, Finance) each have a key card that only opens the specific rooms they need.

- **The Shops (Tier 2 — Tenant/Store)** are where your *customers* run their businesses. Each shop is a completely sealed vault. A cashier in Shop A cannot see anything from Shop B. A store owner is the king of their own shop but they don't even know the Head Office exists.

**The Absolute Rules of This Architecture:**
1. Tier 1 users do NOT appear in store staff lists (they are invisible to tenants).
2. Tier 2 users CANNOT see any Tier 1 routes — even if they guess the URL.
3. A person can hold a Tier 1 role AND a Tier 2 role simultaneously (e.g., you created a store for yourself — you are both Platform Owner and Store Owner).
4. Permissions never "bleed" between tiers.
5. Every action is logged with `who`, `what`, `when`, and `which store`.

---

## TIER 1 — PLATFORM / HEAD OFFICE

> These roles live on `users.platform_role` (an enum column). No `tenant_users` record is needed for Tier 1 access.

---

### 1.1 — Platform Owner (`platform_role = 'platform_owner'`)

**That's you.** This is not a "Platform Owner" — it is the **Platform Owner**. There is exactly **one** Platform Owner per VenQore installation.

**Full Access To Everything, Everywhere, Always.**

#### Platform Owner Dashboard — Personal War Room

The Platform Owner dashboard is a real-time mission control. It has several "views" selectable from a top tab bar:

**Overview Tab** — The CEO View
| Metric | Description |
|--------|-------------|
| Total Registered Stores | Live count — trial + active + suspended |
| Monthly Recurring Revenue (MRR) | Live from Lemon Squeezy API |
| Annual Recurring Revenue (ARR) | MRR × 12, projected |
| New Stores This Month | Count + sparkline of last 6 months |
| Churned Stores This Month | Cancellations — most critical metric |
| Net Revenue Retention | (MRR end − MRR start + expansions − churn) ÷ MRR start |
| Trial Conversion Rate | % of trials that converted to paid plans (last 30 days) |
| Active Daily Users | Unique logins across ALL stores in last 24h |
| Open Support Tickets | With SLA breach indicator |
| Plans Breakdown | Pie chart: Starter / Growth / Business / LTD |
| AppSumo Codes Remaining | Codes in bank not yet redeemed |
| Top Grossing Stores | By subscription tier |
| Stores Expiring This Week | Needs action — trials + subscriptions |
| Server Health | CPU, memory, queue size, error rate |

**Stores Tab** — Every Tenant, Every Detail
- Full searchable, sortable table of all tenants
- Columns: Store ID, Name, Owner Email, Plan, Status, Trial Ends / Sub Ends, Users, Products, Sales (last 30 days), Country
- Single-click drill-down into any store's full data view
- Actions per store: Impersonate Owner, Suspend, Activate, Cancel, Extend Trial, Change Plan, Add Notes
- Export to CSV/Excel

**Users Tab** — Every Human in the System
- Every `users` table entry — platform AND tenant users
- Shows: Name, Email, Platform Role, Stores they belong to, Last Login, Account Status
- Actions: Reset Password, Force Logout, Suspend Account, Promote to Platform Role, View Full Activity Log

**Revenue Tab** — Financial Health
- MRR growth chart (last 12 months)
- Churn rate history
- Plan distribution over time
- LTD vs Subscription revenue split
- AppSumo redemption timeline
- Projected 12-month revenue
- Lemon Squeezy payout history

**Support Command Center Tab**
- All open tickets across ALL support agents
- SLA breach alerts (tickets older than X hours without response)
- Agent performance: tickets solved per agent, average response time, CSAT score
- Escalation queue — tickets flagged as requiring Platform Owner attention
- Can read any ticket thread, jump in, or reassign

**Feed Tab** — The Activity River
- Real-time feed of everything happening across the platform:
  - New store registrations
  - Plan upgrades / downgrades
  - Payment failures
  - Stores hitting plan limits
  - Critical errors from the queue
  - Support tickets opened
  - Staff terminations in stores (could indicate churn risk)

**Platform Users Tab**
- The only place where Tier 1 users are created
- Fields: Name, Email, Platform Role, Departments (for Support), Active/Suspended
- Platform Owner is the only one who can create other Tier 1 users
- Can set specific "access scopes" per platform user (e.g., Marketing can only see marketing-safe data)

**Settings Tab** — Platform Configuration
- Global plan limits (`config/plans.php` equivalent)
- AppSumo code import tool (bulk CSV import)
- Feature flag overrides per tenant (manually enable beta features for specific stores)
- Email template editor (platform emails: welcome, trial expiry, payment failed)
- Webhook log viewer (Lemon Squeezy webhook history)
- Audit log: every action any Tier 1 user has taken
- IP allowlist for Tier 1 access (optional security hardening)

---

### 1.2 — Platform Manager / Operations Manager (`platform_role = 'platform_manager'`)

The Platform Owner's right hand. Keeps the internal gears turning so you can focus on strategy. **From ROLES_ARC:** Oversees day-to-day platform health, reviews support manager metrics, and handles high-level vendor disputes (e.g., Cloudflare, Lemon Squeezy API outages).

**Cannot:**
- Create/delete other Tier 1 users
- Process refunds or initiate payouts (but CAN view MRR/ARR and platform metrics)
- Change the Platform Owner's account
- Access the IP allowlist or platform security settings

**Exclusive Ops Powers:**
- Issue platform-wide maintenance announcements (e.g., "Scheduled downtime at 2 AM")
- Monitor: Lemon Squeezy, Postmark, Cloudflare R2, and queue health in a single vendor dashboard
- Can manage all HQ staff except Platform Owners

**Dashboard:** Same as Platform Owner, minus Revenue Tab and Platform Settings. Adds a "Vendor API Status" panel.

---

### 1.3 — Support Director (`platform_role = 'support_director'`)

Manages the entire support organization. Has full visibility into all support operations.

#### Support Director Dashboard

| Panel | Content |
|-------|---------|
| **Team Overview** | All agents, their status (online/offline/in-ticket), ticket load |
| **SLA Tracker** | Real-time: which tickets are at risk of breaching SLA |
| **Category Breakdown** | Bug reports vs feature requests vs billing vs how-to questions |
| **Department Load** | Which department (Technical / Billing / Product) has highest volume |
| **Agent Leaderboard** | CSAT scores, tickets closed, avg resolution time — this week / month |
| **Escalation Queue** | Tickets escalated from agents that need director decision |
| **Satisfaction Trend** | CSAT score chart over time |
| **Conversation Volume** | Tickets opened per day, last 30 days |

**Powers:**
- Create / deactivate Support Department Managers and Support Agents
- Assign agents to departments
- Reassign any ticket to any agent or department
- Set SLA rules per department (e.g., billing = 2h, feature request = 48h)
- Override any CSAT dispute raised by an agent
- Run reports: team performance, department performance, satisfaction trends
- View any ticket thread anywhere in the support system
- Write internal notes on any ticket visible only to Tier 1 users

---

### 1.4 — Support Department Manager (`platform_role = 'support_dept_manager'`)

Manages a specific sub-team within support. There are **three departments** (configurable):

| Department | Focus |
|------------|-------|
| **Technical Support** | Bugs, errors, how-to questions, API integrations |
| **Billing & Subscriptions** | Payment failures, refunds, plan changes, AppSumo disputes |
| **Product & Feedback** | Feature requests, improvement suggestions, roadmap input |

Each Support Department Manager only sees tickets routed to their department.

#### Support Department Manager Dashboard

| Panel | Content |
|-------|---------|
| **Department Queue** | All open tickets in their department, sorted by SLA urgency |
| **My Agents** | Agents in their team, online status, current ticket load |
| **Ticket Volume** | Daily new tickets in this department, this week vs last week |
| **Agent Stats** | Each agent's closed count, response time, CSAT this week |
| **Unassigned Queue** | New tickets not yet assigned to an agent — needs assignment |
| **Escalated To Me** | Tickets an agent escalated up to department manager |
| **Knowledge Base** | Can view and edit knowledge base articles for their department |

**Powers:**
- View all tickets in their department only
- Assign/reassign tickets within their department
- Escalate tickets to Support Director
- Add internal notes to tickets
- Approve/draft knowledge base articles for their department
- View department-level reports
- Cannot see tickets from other departments
- Cannot see any store financial data, subscription data, or Platform Owner metrics

---

### 1.5 — Support Agent (`platform_role = 'support_agent'`)

The frontline. Handles customer tickets.

#### Support Agent — Personal Dashboard

| Panel | Content |
|-------|---------|
| **My Tickets** | All tickets currently assigned to me, sorted by SLA |
| **My Stats Today** | Tickets opened / closed today, avg response time |
| **My Stats This Week** | Weekly performance numbers |
| **My CSAT Score** | Satisfaction rating from resolved tickets |
| **Resolved by Me** | History of all tickets I've solved, with category and resolution |
| **Referred Tickets** | Tickets I escalated and which department/agent received them |
| **Knowledge Base** | Can search but not edit |

**Powers:**
- View only tickets assigned to them (or unassigned in their department)
- Reply to customers
- Add internal notes (not visible to customer)
- Change ticket status: Open → Pending → Solved
- Change ticket category
- Escalate to Department Manager (choose a reason)
- Transfer to another department (ticket leaves their queue)
- **Safe Read-Only View of Tenant Data:** When a customer reports a bug, the support agent can see:
  - The specific store's name, plan, and status
  - The customer's account email
  - The activity log for that action (what did they click, what error occurred)
  - **CANNOT see:** financial data, product prices, customer lists, sales records
- Cannot see metrics from other agents
- Cannot see any platform-level financial data

**Ticket Routing Rule (Critical):**
When a customer submits a support ticket, they choose a category. The system auto-routes:
- Bug / Error → Technical Support Department
- Billing / Payment / Plan → Billing & Subscriptions Department
- Feature Request / Feedback → Product & Feedback Department
- "Other" → Unassigned queue, Support Director assigns manually

---

### 1.6 — Support QA Analyst (`platform_role = 'support_qa'`)

A specialized agent role. Does NOT handle tickets directly. Instead:

**Purpose:** Quality assurance of the support team's replies. Randomly samples resolved tickets and scores them.

#### QA Analyst Dashboard

| Panel | Content |
|-------|---------|
| **Sampling Queue** | Randomly selected resolved tickets for review |
| **QA Scores Given This Week** | My own scoring history |
| **Team Quality Trend** | Average QA scores per agent over time |
| **Common Fail Reasons** | What agents most often get scored down for |
| **My QA Reports** | Exportable quality reports for Support Director |

**Powers:**
- Read resolved tickets from all departments
- Score tickets on a rubric (tone, accuracy, speed, completeness)
- Send private feedback to the agent and their department manager
- Cannot close/open/reply to tickets
- Cannot see financial platform data

---

### 1.7 — Technical Escalation Engineer / L2 Support (`platform_role = 'tech_escalation'`)

A developer (or senior technical person) who handles tickets that require actual code investigation. **From ROLES_ARC:** Can view database slow queries and Horizon queue failures for a specific store. Every action taken while impersonating is stamped with a bright `[Performed by VenQore Support]` tag in the audit logs.

**Receives escalations from:** Technical Support Department when an issue requires database queries, log file analysis, or a suspected bug in the application code.

#### Tech Escalation Dashboard

| Panel | Content |
|-------|---------|
| **Escalation Queue** | Tickets escalated to engineering |
| **Impersonation Log** | Every session ever opened, duration, store, and IP |
| **Bug Reports Filed** | GitHub issues / internal bug tracker entries I created |
| **Resolved Escalations** | My history of technical ticket resolutions |
| **System Health Quick View** | Error rate, queue depth, failing jobs, Horizon status |

**Powers:**
- Read any ticket in the system
- Access the application's internal error log (scoped to a specific tenant if needed)
- **Impersonate a store user — STRICTLY READ-ONLY** (see Impersonation Safety section below)
- File issues to the internal bug tracker
- Reply to the ticket with technical findings
- Cannot see platform financial data, MRR, or billing info

---

### 1.7b — ⚠️ Impersonation Safety Protocol (Critical Architecture Rule)

> **The Problem:** If a Tech Escalation Engineer impersonates "Ali Store" and accidentally clicks "Create Sale" while testing, Laravel will insert the engineer's `user_id` into Ali's `sales` table. This **corrupts Ali's financial records** with a fraudulent transaction they cannot explain to their accountant.

**The Solution — Three Layers of Protection:**

**Layer 1: Database — Immutable Session Flag**
```sql
-- New column on users table
ALTER TABLE users ADD COLUMN impersonation_session JSON NULL;
-- Stores: { "active": true, "target_tenant_id": 42, "target_user_id": 99, "hq_user_id": 5, "started_at": "..." }
-- Cleared on logout or session end
```

**Layer 2: Middleware — Hard Request Blocking**
```
ImpersonationGuardMiddleware (runs on ALL /app/* routes):
  IF session contains impersonation_session.active = true:
    IF request method is POST, PUT, PATCH, DELETE:
      → ABORT 403 with message: "This action is blocked during an impersonation session."
      → Log the ATTEMPT to platform_activity_log with action = 'blocked_write_during_impersonation'
    IF request method is GET:
      → Allow, but inject [VenQore Support Viewing] banner into the Inertia shared props
```

**Layer 3: UI — Persistent Warning Banner**  
When impersonation is active, a **red banner** is injected at the top of every page:
> 🔴 **VenQore Support Mode — Read-Only** | Viewing as: Ahmad Ali | Store: Ali Electronics | [End Session]

Every button that would trigger a write (New Sale, Delete Product, etc.) is **visually greyed out** and shows a tooltip: "Disabled during support session."

**Audit Trail (non-negotiable):**
Every single impersonation session must log:
- `hq_user_id` (who impersonated)
- `target_user_id` (who they impersonated)
- `target_tenant_id` (which store)
- `started_at` and `ended_at`
- `ip_address`
- Any **attempted writes** (even the blocked ones)

**Who can Impersonate?**
| Role | Can Impersonate? | Mode |
|------|-----------------|------|
| Platform Owner | ✅ Yes | Read-Only |
| Platform Manager | ✅ Yes | Read-Only |
| Tech Escalation Engineer | ✅ Yes | Read-Only |
| All other Tier 1 roles | ❌ No | — |

---

### 1.8 — Marketing Manager (`platform_role = 'marketing_manager'`)

Runs the public-facing content and growth strategy.

#### Marketing Manager Dashboard

| Panel | Content |
|-------|---------|
| **Blog Posts** | All published and draft blog posts, create/edit/delete |
| **Landing Pages** | Static marketing pages manager |
| **Email Campaigns** | Drip sequences, newsletters, trial nurture emails |
| **Signup Metrics** | New signups per day, week, month — by source (organic, AppSumo, direct) |
| **Trial Conversion** | How many trials converted — segmented by acquisition channel |
| **Feature Announcements** | Drafting in-app notifications (requires Platform Owner approval to publish) |
| **SEO Dashboard** | Page metadata, sitemap status |
| **Integrations** | Google Analytics, Hotjar, Mailchimp API keys |

**Powers:**
- Full control over the marketing CMS (blog, pages)
- Manage email campaigns and sequences
- View anonymized signup and conversion metrics (NO access to individual user data)
- Schedule in-app announcements for approval
- Cannot see any tenant's business data
- Cannot see MRR or platform financial metrics
- Cannot manage any Tier 1 users

---

### 1.9 — Content Writer (`platform_role = 'content_writer'`)

An assistant to the Marketing Manager.

**Dashboard:** Simplified — just blog posts assigned to them (drafts), scheduled posts, and published posts they authored.

**Powers:**
- Create and edit blog posts (in draft state)
- Cannot publish directly — requires Marketing Manager approval
- Cannot see any metrics, user data, or platform financials

---

### 1.10 — Billing Operations (`platform_role = 'billing_operations'`)

> **From ROLES_ARC — This was a distinct role, not merged into Finance.** The Billing Ops person handles financial friction that L1 Support cannot. Think of them as payment specialists, not accountants.

#### Billing Operations Dashboard

| Panel | Content |
|-------|---------|
| **Failed Payments** | Dunning list — stores with failed billing, retry history |
| **Refund Queue** | Refund requests awaiting processing |
| **Chargeback Disputes** | Active bank chargeback cases |
| **AppSumo Redemption Log** | Recent redemptions, stacking history, failed webhooks |
| **Upcoming Renewals** | Stores renewing in next 7 days |
| **Manual Credits** | History of manual license grants (AppSumo webhook failures, etc.) |

**Powers:**
- Manually process partial or full refunds
- Dispute bank chargebacks
- Manually credit an account with a Lifetime License if an AppSumo webhook fails
- View the complete Lemon Squeezy payment history per store
- Cannot see the full MRR/ARR charts (that's Finance Officer territory)
- Cannot manage platform users or suspend stores

---

### 1.11 — Platform Finance Officer (`platform_role = 'platform_finance'`)

The bookkeeper for VenQore the business itself. Sees the macro financial picture but does not handle individual customer billing disputes (that's Billing Operations).

#### Platform Finance Dashboard

| Panel | Content |
|-------|---------|
| **MRR / ARR** | Revenue metrics with trend chart |
| **Subscription Payments** | All successful payments from Lemon Squeezy |
| **Revenue by Plan** | Distribution across Starter / Growth / Business / LTD |
| **Net Revenue Retention** | Expansion vs. churn |
| **Payout History** | Lemon Squeezy payouts to your bank account |
| **Tax Report** | Revenue by country (for VAT/tax compliance) |
| **Projected Revenue** | 3/6/12 month projections |

**Powers:**
- View all macro revenue data and charts
- Initiate large refunds (requires Platform Owner dual-approval above threshold)
- Export revenue data for external accounting
- Cannot see support tickets or store operational data
- Cannot process individual refunds (that's Billing Operations)

---

### 1.12 — Customer Success Manager (`platform_role = 'customer_success'`)

> **From ROLES_ARC — Missing from original plan.** Proactive relationship builders for VIP or Business-tier customers. They don't wait for complaints — they find customers who aren't using the software properly and help them before they churn.

#### Customer Success Manager Dashboard

| Panel | Content |
|-------|---------|
| **Adoption Tracker** | High-paying accounts with low activity (e.g., "Paying $79/mo but 0 products in 10 days") |
| **At-Risk Accounts** | Stores showing churn signals (no logins, payment failures, usage drop) |
| **My Portfolio** | Assigned Business-tier stores I actively manage |
| **Onboarding Progress** | Setup wizard completion % per store |
| **Scheduled Calls** | 1-on-1 Zoom sessions booked through the dashboard |
| **Interventions Log** | Emails sent, trial extensions granted, calls completed |

**Powers:**
- Trigger manual onboarding email sequences for specific stores
- Offer trial extensions to at-risk accounts (with Platform Owner approval)
- View store usage metrics: login frequency, modules used, transactions created
- Cannot see store financial data (sales figures, product costs)
- Cannot impersonate users or access support tickets

---

### 1.13 — Product Manager (`platform_role = 'product_manager'`)

> **From ROLES_ARC — Missing from original plan.** The bridge between customer complaints and the development roadmap.

**Dashboard:** "Feature Roadmap." Aggregates tagged feature requests from L1 Support (e.g., "47 users requested Dark Mode this month"). Shows which features are used most and least to drive prioritization.

**Powers:**
- View anonymized, aggregated usage data across all stores
- Tag and categorize support tickets as feature requests on the roadmap board
- Write product update announcements (requires Marketing Manager to publish)
- Cannot see individual store data, financial data, or manage platform users

---

### 1.14 — Security & Compliance Auditor (`platform_role = 'security_auditor'`)

> **From ROLES_ARC — Critical missing role.** Strictly view-only. The Watchman. Essential for enterprise credibility — ensures no HQ staff are abusing their access.

#### Security Auditor Dashboard — The Audit Matrix

| Panel | Content |
|-------|---------|
| **HQ Action Feed** | Every sensitive action taken by any Tier 1 user |
| **Impersonation Log** | Who impersonated which store, when, from what IP |
| **Failed HQ Logins** | Catch internal credential leak attempts |
| **Suspicious Patterns** | Agents viewing too many stores, off-hours access |
| **Data Export Log** | Every CSV/Excel download by any HQ user |
| **Policy Violations** | Write attempts blocked during impersonation sessions |

**Powers (STRICTLY VIEW-ONLY — absolutely zero writes):**
- View the complete `platform_activity_log` with full filter controls
- Track every impersonation session with IP, duration, and page views
- Export audit reports for compliance review
- Cannot create, edit, or delete any record anywhere in the system
- Cannot see platform financial data or support tickets

---

### 1.15 — Platform Sales / Account Executive (`platform_role = 'platform_sales'`)

Closes the big fish. If a 50-location pharmacy chain wants to migrate, this role handles the negotiation. **From ROLES_ARC:** Can generate secure, custom discount codes or bypass normal pricing to create bespoke "Enterprise" subscription tiers.

**Dashboard:** Sales pipeline, prospect list, booked demos, contract statuses.

**Powers:**
- View limited store overview (count, plan tier) — no operational data
- Generate custom discount codes or enterprise pricing tiers (requires Platform Owner approval)
- Cannot see individual store business data or MRR details of other accounts

---

## TIER 2 — TENANT / STORE LEVEL

> These roles live in `tenant_users.role`. They are completely isolated per store. A cashier in Store A has **zero** knowledge that Store B exists.

---

### 2.1 — Owner (`role = 'owner'`)

The person who creates the store and pays for it. **There is exactly one Owner per store.** The Owner cannot be removed — they can only transfer ownership.

**Full access to the entire store. No restrictions.**

#### Owner Dashboard — The Command Center

| Section | Widgets |
|---------|---------|
| **Revenue Health** | Today's sales, this week, this month, vs. last period |
| **Profit Margin** | Gross margin %, net margin %, trend |
| **Cash Position** | Cash in hand, bank balances, receivables, payables — net position |
| **Top Products** | By revenue and by units sold |
| **Staff Activity** | Who is clocked in right now, who's idle, POS sessions open |
| **Inventory Alerts** | Low stock items, expired items, negative stock |
| **Expense Burn** | This month's expenses vs. last month |
| **Customer Health** | New customers, returning %, top customers by spend |
| **Trial/Subscription Status** | Days remaining, upgrade CTA if on trial |
| **Quick Actions** | New Sale, New Purchase, New Expense, Add Staff |

**Exclusive Owner Powers (others cannot do this):**
- Transfer ownership to another staff member
- Delete the store (and all its data — irreversible)
- Manage subscription/billing for the store
- Set and reset all staff POS PINs
- Access all financial reports without restriction
- Unlock and re-lock any accounting period

---

### 2.2 — Franchise / Multi-Location Admin (`role = 'franchise_admin'`)

> **This is an industry role you might be missing.** Used when a store owner has multiple locations within the same VenQore store (not separate tenants, but separate "branches" within one tenant). The Franchise Admin oversees multiple branches within a tenant.

**Example use case:** A restaurant chain "Burger Palace" has 5 locations all on one VenQore subscription. The Franchise Admin sees all 5 locations' data but manages staff at each branch through Branch Managers.

#### Franchise Admin Dashboard

| Section | Widgets |
|---------|---------|
| **Multi-Location Overview** | Revenue heatmap by branch |
| **Branch Comparison** | Side-by-side: sales, staff, avg transaction value |
| **Inventory Across Locations** | Which branch has overstock, which is running low |
| **Staff Head Count** | Per branch |
| **Combined P&L** | Rolled-up across all locations |
| **Inter-Branch Transfers** | Pending and recent |

---

### 2.3 — Store Admin (`role = 'admin'`)

The Owner's most trusted employee. Has all operational access. **Cannot touch billing or delete the store.**

#### Admin Dashboard

| Section | Widgets |
|---------|---------|
| **Today at a Glance** | Sales today, transactions, top product |
| **Staff on Duty** | Who is logged in, active POS sessions |
| **Pending Tasks** | Purchase orders awaiting receipt, quotes to approve |
| **Payment Outstanding** | Receivables and payables due this week |
| **Recent Activity Log** | Last 20 actions taken in the store |
| **Low Stock Alerts** | Products below reorder point |

**Powers:** Everything the Owner can do, except:
- Billing management
- Store deletion
- Ownership transfer
- Audit log delete (can view only)

---

### 2.4 — Store Manager (`role = 'manager'`)

Day-to-day operations manager. Has full operational visibility but cannot manage staff beyond what the owner explicitly grants.

#### Manager Dashboard

| Section | Widgets |
|---------|---------|
| **Sales This Shift** | Revenue, transaction count, avg ticket size |
| **Staff on Duty** | Clock-in status, attendance today |
| **Inventory Flags** | Low stock, pending deliveries |
| **Today's Expenses** | What was spent today |
| **Cash Drawer Status** | Opening vs. current cash |
| **Pending Purchase Orders** | Orders placed, not yet received |

**Powers:**
- View all reports (all 38)
- Create/edit/delete: sales, purchases, expenses, products, categories
- Open/close POS sessions
- Do stock adjustments and transfers (with reason logged)
- Approve discounts above staff threshold
- View staff attendance and basic staff info
- **Cannot:** Manage staff roles, invite staff, delete staff, access billing

---

### 2.5 — Shift Supervisor (`role = 'shift_supervisor'`)

> **Industry role you're missing.** Between Cashier and Manager. Used in restaurants, cafes, retail. The senior person on the floor who handles the register, approves voids, and keeps the shift running — but doesn't have full management access.

#### Shift Supervisor Dashboard

| Section | Widgets |
|---------|---------|
| **My Shift Summary** | Sales during my shift, items sold, voids |
| **POS Sessions** | All open sessions right now |
| **Void & Discount Queue** | Items waiting for my approval |
| **Cash Drawer Totals** | Opening balance, current cash, expected |
| **Attendance** | Who is clocked in for this shift |

**Powers:**
- Open/close their own POS session
- Approve discounts and voids for cashiers under them (if Owner enables this)
- View today's sales summary
- View stock levels (read-only)
- Clock in/out staff for the current shift
- Cannot access reports beyond current shift, cannot change prices, cannot access finances

---

### 2.6 — Purchasing Officer (`role = 'purchasing_officer'`)

> **Industry role.** Dedicated to procurement. Common in mid-to-large retail, wholesale, manufacturing, and restaurants.

#### Purchasing Officer Dashboard

| Section | Widgets |
|---------|---------|
| **Open Purchase Orders** | Status: Ordered / Partially Received / Received |
| **Pending Deliveries** | Expected arrivals this week |
| **Supplier List** | With outstanding payables per supplier |
| **Reorder Alerts** | Products at or below reorder point |
| **Budget Used** | Purchases this month vs. allocated budget |
| **Price Comparison** | For products purchased from multiple suppliers |

**Powers:**
- Create and manage purchase orders
- Receive stock and mark deliveries
- Manage supplier records
- View product costs and reorder levels
- Cannot access sales data or customer records
- Cannot approve their own purchases above set limit (needs Manager sign-off)
- Cannot touch accounting

---

### 2.7 — Accountant (`role = 'accountant'`)

Full access to all financial data. Zero access to operational POS.

#### Accountant Dashboard

| Section | Widgets |
|---------|---------|
| **Cash Position** | Bank balances, cash on hand, net cash |
| **Receivables** | Who owes money, aged (0-30, 30-60, 60-90, 90+ days) |
| **Payables** | What the store owes, aged |
| **P&L This Month** | Gross revenue, COGS, gross profit, expenses, net profit |
| **Bank Reconciliation Status** | Last reconciliation date, unmatched items |
| **Tax Liability** | Input VAT, output VAT, net tax due |
| **Journal Entry Queue** | Pending journal entries awaiting review |
| **Upcoming Payments** | Bills due this week |

**Powers:**
- View all 38 financial reports
- Create/edit journal entries
- Reconcile bank accounts
- Manage chart of accounts
- View all sales and purchase transactions (read-only)
- Cannot create sales or modify products
- Cannot manage staff
- Cannot access POS

---

### 2.8 — Inventory Controller (`role = 'inventory_controller'`)

> **Industry role.** Dedicated stock management. Common in warehouses, manufacturing, pharmacy, electronics.

#### Inventory Controller Dashboard

| Section | Widgets |
|---------|---------|
| **Stock Levels** | Total SKUs, in-stock, out-of-stock, low stock |
| **Warehouse Map** | Which warehouse has what (if multi-warehouse) |
| **Recent Movements** | All stock-ins, stock-outs, transfers, adjustments (last 48h) |
| **Expiry Calendar** | Products expiring this week / this month |
| **Valuation** | Total inventory value (FIFO) |
| **Dead Stock** | Items with no movement in 60/90/180 days |
| **Pending Transfers** | Inter-warehouse transfers awaiting confirmation |
| **Batch/Serial Tracker** | If feature enabled |

**Powers:**
- Full inventory management: products, categories, variants, attributes
- Stock adjustments, transfers, audits
- Batch and serial tracking
- View purchase orders (to coordinate receiving)
- Cannot access sales, finances, or customer data

---

### 2.9 — Sales Executive (`role = 'sales_executive'`)

> **Industry role.** For B2B-oriented stores, wholesale businesses, or any store with a dedicated sales team who do not sit behind a register but create invoices and manage customer relationships.

#### Sales Executive Dashboard

| Section | Widgets |
|---------|---------|
| **My Sales This Month** | Total I personally created |
| **My Pipeline** | Quotations/proposals I sent, awaiting response |
| **My Top Customers** | By revenue from my sales |
| **Outstanding Invoices** | My invoices not yet paid |
| **Commission Tracker** | If commission is configured |
| **Today's Schedule** | Deliveries, follow-ups (future feature) |

**Powers:**
- Create sales, quotations, proposals
- View and manage customers assigned to them
- View stock availability (read-only)
- Cannot access store finances beyond their own sales
- Cannot manage other staff or products

---

### 2.10 — Cashier (`role = 'cashier'`)

The most common role. Operates the POS terminal.

#### Cashier Dashboard (Extremely Minimal)

| Section | Widgets |
|---------|---------|
| **My Session** | Sales I've done this session, transaction count |
| **Open POS** | One-click button |
| **My Attendance** | Clock-in time today |

**Powers:**
- Operate POS (process sales, apply pre-approved discounts, accept payments)
- Search products (for customer queries)
- View stock availability of specific items (not full inventory)
- Manage their own cash drawer
- Process returns (if Owner enables this permission)
- Sign in with POS PIN (optional, on shared tablet)
- **Cannot access:** Any financial report, customer list, product pricing management, staff info, purchases, settings

---

### 2.11 — HR Officer (`role = 'hr_officer'`)

> **Industry role.** As businesses grow, they need dedicated HR. Manages staff records, attendance, payroll data.

#### HR Officer Dashboard

| Section | Widgets |
|---------|---------|
| **Headcount** | Total active staff, by role, by shift |
| **Attendance Today** | Who is in, who is absent, who is late |
| **Attendance Report** | Monthly attendance calendar per employee |
| **Leave Requests** | Pending leave approvals |
| **Payroll Summary** | Hours worked this pay period (if payroll enabled) |
| **Staff Documents** | Employee contracts, ID uploads |

**Powers:**
- View and manage staff records (personal info, role, display name)
- Manage attendance (approve/reject clock-ins, manual entries)
- View staff performance metrics (attendance %, punctuality)
- Cannot invite new staff or change roles (Owner/Admin handles that)
- Cannot access sales, inventory, or financial data

---

### 2.12 — Industry-Specific Roles

These roles are only visible to stores that have the relevant industry feature enabled.

#### 2.12.1 — Kitchen Manager (`role = 'kitchen_manager'`) — F&B Industry

> For restaurants, cafes, cloud kitchens.

**Dashboard:** Real-time KOT (Kitchen Order Tickets) queue, preparation status, average prep time, waste log, recipe cost vs actual usage.

**Powers:**
- View incoming orders from POS
- Manage kitchen display (KOT management)
- Log ingredient consumption and waste
- View recipe/cookbook (BOM for food)
- Cannot access finances, customer records, or staff management

#### 2.12.2 — Pharmacy Dispenser (`role = 'dispenser'`) — Pharmacy Industry

> For pharmacies and medical stores.

**Dashboard:** Prescription queue, expiry alerts (critical — legal requirement), controlled substances log, batch tracking.

**Powers:**
- POS access for prescription-linked sales
- View batch numbers and expiry dates (full visibility — required by law)
- Cannot modify product prices
- Cannot access customer financial data

#### 2.12.3 — Production Supervisor (`role = 'production_supervisor'`) — Manufacturing

> For bakeries, textile, small manufacturers.

**Dashboard:** Active production runs, BOM consumption, finished goods produced, quality checks pending, raw material availability.

**Powers:**
- Create and manage production runs
- Consume raw materials (stock out) and receive finished goods (stock in)
- View production reports
- Cannot access sales or customer data

#### 2.12.4 — Dispatch / Fulfillment Lead (`role = 'fulfillment_lead'`)

> **From ROLES_ARC — Distinct from Delivery Driver.** For businesses with an e-commerce/omnichannel bridge (WooCommerce, Shopify, Amazon FBM orders). The Fulfillment Lead packs the boxes and generates shipping labels. The Delivery Driver physically delivers them.

**Dashboard:** "Fulfillment Queue." A live feed of incoming online orders. Status per order: Received → Packed → Dispatched → Delivered.

**Powers:**
- Accept online orders and print packing slips / shipping labels
- Mark packages as "Packed" or "Dispatched" (automatically deducts from inventory)
- Assign orders to Delivery Drivers
- Blocked from: physical store POS, financial reports, pricing, accounting

#### 2.12.5 — Delivery Driver (`role = 'delivery_driver'`)

> For any business that does last-mile home delivery. From ROLES_ARC: "They only see the order ID and the customer address. They cannot see the store's total revenue or the customer's payment details."

**Dashboard:** Driver App — optimized route map, delivery queue, order status.

**Powers:**
- View assigned deliveries only (pickup instructions, drop-off address)
- Update delivery status (Picked Up → On The Way → Delivered / Failed)
- No access to anything else in the system — not even the customer's payment amount

---

### 2.13 — Viewer / Auditor (`role = 'viewer'`)

The most restricted Tier 2 role. Read-only access to reports. Often used for:
- External accountants / auditors
- Business partners who want visibility
- Bank representatives during loan applications

#### Viewer Dashboard

| Section | Widgets |
|---------|---------|
| **Financial Summary** | P&L, Balance Sheet, Cash Flow — read-only |
| **Sales Summary** | Aggregated sales data |
| **Inventory Value** | Total valuation report |

**Powers (read-only everything, write nothing):**
- **Report Restrictions:** 
  - (A) Fully Visible: P&L, Balance Sheet, Trial Balance, Inventory Valuation.
  - (B) Aggregated Only: Sales by Customer, Receivables Aging (Names hidden/hashed, e.g., "Customer A").
  - (C) Blocked Entirely: Individual Staff Performance, detailed POS shift logs.
- Cannot create any transaction
- Cannot view staff information or system settings
- Cannot access POS

---

## The Permission Matrix

### Tier 1 Permissions (Platform Level)

| Permission | Platform Owner | Platform Manager | Support Director | Support Dept. Mgr | Support Agent | QA Analyst | Tech Engineer | Marketing Mgr | Content Writer | Finance Officer | Sales AE |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| View Platform Metrics (MRR, ARR) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Manage Tier 1 Users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Impersonate Store Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ (read-only) | ❌ | ❌ | ❌ | ❌ |
| View ALL Support Tickets | ✅ | ✅ | ✅ | Dept. Only | Own Only | Resolved Only | ✅ | ❌ | ❌ | ❌ | ❌ |
| Assign / Escalate Tickets | ✅ | ✅ | ✅ | Dept. Only | ✅ | ❌ | File Only | ❌ | ❌ | ❌ | ❌ |
| Reply to Tickets | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Suspend / Activate Stores | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Change Store Plans | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Write Blog Posts | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | Draft Only | ❌ | ❌ |
| Publish Blog Posts | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| View Revenue & Billing | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | View Only | ❌ | ✅ | ❌ |
| Process Refunds | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Import AppSumo Codes | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Error Logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Marketing Content | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| QA Score Tickets | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### Tier 2 Permissions (Store Level)

| Permission | Owner | Franchise Admin | Admin | Manager | Shift Supervisor | Cashier | Accountant | Purchasing Officer | Inventory Controller | Sales Executive | HR Officer | Kitchen Mgr | Dispenser | Production Sup | Fulfillment Lead | Delivery Driver | Viewer |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **POS — Operate** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | View Only | ✅ | ❌ | ❌ | ❌ | ❌ |
| **POS — Open/Close** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **POS — Void/Discount** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Sales — Create** | ✅ | ✅ | ✅ | ✅ | ❌ | Via POS | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | Via POS | ❌ | ❌ | ❌ | ❌ |
| **Sales — View All** | ✅ | ✅ | ✅ | ✅ | Today | Own | ✅ | ❌ | ❌ | Own | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Purchase Orders** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Inventory — Full CRUD** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Inventory — View Levels** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Stock Adjustment** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | Waste Only | ❌ | Raw Mats | ❌ | ❌ | ❌ |
| **Customers — Full CRUD** | ✅ | ✅ | ✅ | ✅ | ❌ | Add Only | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Finance — Full View** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Report only |
| **Reports — All 38** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | Purchase Only | Inventory Only | Sales Only | HR Only | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Staff — Invite/Remove** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Billing — Manage** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Attendance — Clock Own** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Attendance — Manage** | ✅ | ✅ | ✅ | ✅ | Today | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Database Schema: What Must Change

> From the architectural diagnostic, the current schema has `is_platform_admin` (boolean) and `tenant_users.role` (limited enum). Here is the expansion required:

### Change 1: Expand `users.platform_role`

```sql
-- REPLACE  is_platform_admin BOOLEAN
-- WITH     platform_role ENUM

ALTER TABLE users
  DROP COLUMN is_platform_admin,
  ADD COLUMN platform_role ENUM(
    'none',
    'platform_owner',
    'platform_manager',
    'support_director',
    'support_dept_manager',
    'support_agent',
    'support_qa',
    'tech_escalation',
    'marketing_manager',
    'content_writer',
    'platform_finance',
    'platform_sales'
  ) DEFAULT 'none' AFTER email_verified_at;
```

### Change 2: Add `support_department` to `users`

```sql
ALTER TABLE users
  ADD COLUMN support_department ENUM('technical', 'billing', 'product') DEFAULT NULL;
  -- Only populated for support_dept_manager and support_agent roles
```

### Change 3: Expand `tenant_users.role`

```sql
ALTER TABLE tenant_users
  MODIFY COLUMN role ENUM(
    'owner',
    'franchise_admin',
    'admin',
    'manager',
    'shift_supervisor',
    'purchasing_officer',
    'accountant',
    'inventory_controller',
    'sales_executive',
    'hr_officer',
    'cashier',
    'kitchen_manager',
    'dispenser',
    'production_supervisor',
    'fulfillment_lead',
    'delivery_driver',
    'viewer'
  );
```

### Change 4: New `support_tickets` table

```sql
CREATE TABLE support_tickets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    tenant_id BIGINT UNSIGNED NULL, -- NULLABLE: So pre-store or post-deletion tickets work
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('bug', 'billing', 'feature_request', 'how_to', 'other'),
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('open', 'pending', 'resolved', 'closed') DEFAULT 'open',
    department ENUM('technical', 'billing', 'product') NOT NULL,
    assigned_to BIGINT UNSIGNED NULL,
    sla_deadline_at TIMESTAMP NULL,
    first_response_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    qa_score TINYINT UNSIGNED NULL,
    csat_score TINYINT UNSIGNED NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    INDEX idx_status_department (status, department),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_sla (sla_deadline_at, status),
    timestamps
);
```

### Change 5: New `ticket_messages` table

```sql
CREATE TABLE ticket_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT UNSIGNED NOT NULL,
    sender_user_id BIGINT UNSIGNED NOT NULL,
    body TEXT NOT NULL,
    is_internal_note BOOLEAN DEFAULT FALSE,
    attachments JSON NULL,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_user_id) REFERENCES users(id),
    timestamps
);
```

### Change 6: New `platform_activity_log` table

```sql
CREATE TABLE platform_activity_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    actor_user_id BIGINT UNSIGNED NOT NULL,
    tenant_id BIGINT UNSIGNED NULL, -- Added to easily filter "all HQ actions on Store X"
    action VARCHAR(100) NOT NULL,
    subject_type VARCHAR(100) NULL,
    subject_id BIGINT UNSIGNED NULL,
    payload JSON NULL,
    ip_address VARCHAR(45) NULL,
    FOREIGN KEY (actor_user_id) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    INDEX idx_actor (actor_user_id),
    INDEX idx_action (action),
    INDEX idx_tenant (tenant_id),
    timestamps
);
```

### Change 7: New `staff_invitations` table (V1 Core)

```sql
CREATE TABLE staff_invitations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    invited_by BIGINT UNSIGNED NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE, -- Store hashed, send plain in email
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP NULL,
    revoked_at TIMESTAMP NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (invited_by) REFERENCES users(id),
    timestamps
);
```

### Change 8: New `tenant_permission_overrides` table (V1 Stub for V2 UI)

```sql
CREATE TABLE tenant_permission_overrides (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    permission VARCHAR(100) NOT NULL, -- e.g. 'staff.invite'
    granted BOOLEAN NOT NULL, -- TRUE = grant, FALSE = revoke
    granted_by BIGINT UNSIGNED NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (granted_by) REFERENCES users(id),
    UNIQUE KEY (tenant_id, user_id, permission)
);
```

### Change 9: New `store_activity_log` table (V1 Core)

```sql
CREATE TABLE store_activity_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    actor_user_id BIGINT UNSIGNED NOT NULL,
    action VARCHAR(100) NOT NULL, -- e.g. 'sale.created'
    subject_type VARCHAR(100) NULL,
    subject_id BIGINT UNSIGNED NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    is_impersonation BOOLEAN DEFAULT FALSE,
    impersonated_by BIGINT UNSIGNED NULL, -- HQ user ID
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (actor_user_id) REFERENCES users(id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_action (action),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Architecture Policies & Flows (V1 Implementation Rules)

**1. Soft Delete Strategy:**
All financially-referenced records must use soft deletes (`deleted_at`). This includes: products, customers, suppliers, staff members (`tenant_users` deactivation via `is_active = false`), and purchase orders. Only standalone config records (categories, tax rates) may be hard-deleted.

**2. Plan Limit Enforcement Architecture:**
Store usage counts (`staff_count`, `product_count`, `branch_count`) are securely cached on the `tenants` table. On insertion, limits are checked via `tenant.staff_count < plan.max_staff` within a DB transaction. Counters are atomically incremented. Full recalculations run asynchronously via jobs on upgrade/downgrade.

**3. Custom Permission Overrides (Tenant-Level):**
While V1 uses fixed ENUM roles, the check must be: `check role → check overrides → resolve`. V1 ignores overrides (no rows). V2 opens the UI to add rows manually allowing Owners to tweak permissions.

**4. Invitation Token System:**
Tokens must never be reused and must be stored securely (store HASH in DB, transmit plain token in email). Constant-time comparison is mandated to eliminate timing attacks.

**5. Shared Device POS Sessions & PIN Security:**
Shared tablets register with a long-lived `device_token`. Staff login with a 4-digit hashed PIN (bcrypt) producing a short-lived user session (e.g. 8 hours). Failed attempts are rate-limited per device (e.g., 5 attempts → 30s lockout and manager alert).

**6. Ownership Transfer Flow:**
1. Owner initiates transfer to existing staff email. 2. Staff receives secure link. 3. Staff accepts. 4. DB transaction demotes old Owner to Admin/Manager and promotes new user to Owner. 5. **Billing Update (CRITICAL):** Lemon Squeezy subscriptions are tied to a customer email. Transferring ownership means the new owner needs to be the billing contact, requiring an automatic API call to Lemon Squeezy to update the customer record so the new owner can manage the billing portal.

**7. "One Person, Two Roles" Rule:**
Tier 1 role ALWAYS wins global precedence. A Platform Owner visiting `/app/my-store` gets Tier 1 read access regardless of their `tenant_users` row. A UI toggle explicitly labelled `[Switch to Store User Mode]` temporarily drops Tier 1 context allowing them to act strictly as their store role (e.g., Cashier).

---

## 🚀 The Phased Build Plan

This roadmap dictates precisely what is built and when. Every schema is prepared in V1, but the UI is staggered to prevent feature bloat.

### Version 1 — The Revenue-Generating MVP (Months 0–6)
*Goal: First 50 paying stores, prove product-market fit.*

**V1 Tier 1 Philosophy:** You are the team. No dashboards for non-existent staff.
- **Roles Shipped:** Platform Owner. (Support Agent logic is handled manually by Platform Owner).
- **Features Shipped:** Tenant management (list/suspend), Impersonation (read-only), Basic ticket inbox (list + reply only), MRR overview (Lemon Squeezy numbers), Plan limit enforcement, Feature flags, Webhook logs.
- **Skipped for V1:** Revenue charts, SLA routing tracking, QA scoreboards, Platform settings UI for multi-users. IP allowlisting.

**V1 Tier 2 Philosophy:** Ship the Core 7 roles that 95% of businesses need today.
- **Roles Shipped:** Owner, Admin, Manager, Cashier, Accountant, Purchasing Officer, Viewer/Auditor.
- **Features Shipped:** All fundamental POS, Sales, CRM, Inventory, Financials, and core Reports.
- **Database Rule:** *ALL* 17 ENUM values for roles are defined via migrations today, even though only 7 show in the UI drop-down. 
- **Release Gate:** V1 is ONLY considered complete and ready for production when every test in the `VenQore_V1_Testing_Checklist.md` passes successfully. No exceptions.

### Version 2 — The Scaling Platform (Months 6–18)
*Goal: 50–500 stores, hiring first staff, churn prevention logic in place.*

**V2 Activations:**
- **Tier 1:** Platform Manager, Support Director, Department Managers, Tech Escalation Engineer, Marketing Manager, QA Analyst, Finance Officer, Billing Operations, Customer Success Manager.
- **Tier 2:** Franchise Admin, Shift Supervisor, Sales Executive, Inventory Controller, HR Officer.
- **Features added:** Full Support SLA/Routing logic, Custom Permission Overrides UI, Marketing CMS, Dashboard for CSM tracking "At Risk" accounts, Custom email senders.

### Version 3 — The Ecosystem Play (Months 18+)
*Goal: 500+ stores, creating defensible moats via B2B/B2C interlinks.*

**V3 Activations:**
- **Tier 1:** Platform Sales AE (Enterprise deals), Content Writer (Marketing team sizes up). Product Manager.
- **Tier 2:** Kitchen Manager, Pharmacy Dispenser, Production Supervisor, Delivery Driver, Fulfillment Lead.
- **Tier 3 Roles Deployed:** Wholesale Partner, Marketplace Consumer, Delivery Courier, Certified Agency Partner, External App Developer (OAuth portal).
- **Features added:** Deep industry specializations, Omnichannel B2C bridge (Shopify / App), Direct Supplier integration.

---

## Routing Architecture

### ⚠️ URL Security Decision: `{store_slug}` NOT `{store_id}`

**Using numeric IDs in URLs (`/app/15/dashboard`) enables enumeration attacks:**
- Competitors know exactly how many stores you have (count up from 1)
- Hackers write scripts that iterate `/app/1/` through `/app/9999/` probing for data
- Enumeration attacks become trivially easy

**Using slugs (`/app/ali-electronics/dashboard`) paired with Middleware is correct:**
- Unique via DB constraint and prevents enumeration (reveals nothing about store counts).
- **CRITICAL NOTE:** A slug is NOT collision-proof against IDOR by itself. It merely stops enumeration. The **real IDOR protection** is the membership check in the route middleware ensuring the logged-in user belongs to that slug.
- Store renames update only `tenants.slug` — but renames should either be forbidden or implemented with a permanent 301 redirect to avoid breaking bookmarks and Google-indexed pages.
- Middleware resolves slug → tenant_id internally; the numeric ID never leaves the server

### Tier 1 Routes (HQ)

```
/hq/                          → Platform Owner war room
/hq/stores                    → All tenants (searchable, sortable)
/hq/users                     → All platform + store users
/hq/revenue                   → Revenue metrics (Finance Officer + Platform Owner)
/hq/support                   → Support Director view
/hq/support/tickets           → All tickets
/hq/support/agents            → Agent management + performance
/hq/support/departments       → Department config and SLA rules
/hq/marketing                 → Marketing Manager workspace
/hq/marketing/blog            → Blog CMS
/hq/customer-success          → CSM adoption tracker
/hq/product                   → Product Manager roadmap
/hq/audit                     → Security Auditor — full audit matrix
/hq/settings                  → Platform settings (Platform Owner only)
```

**Middleware Stack for all `/hq/*` routes:**
```
auth → verified → platform_access → platform_permission:{specific_role}
```

> `platform_access` middleware: checks `users.platform_role != 'none'`. Any user with `platform_role = 'none'` (i.e., a regular store user) who guesses a `/hq/*` URL gets a hard 403 — not a redirect to login, which would confirm the route exists.

### Tier 2 Routes (Store)

> **`{store_slug}` is a unique text string (e.g., `ali-electronics`), never the numeric database ID.**

```
/app/{store_slug}/dashboard    → Role-appropriate dashboard
/app/{store_slug}/pos          → Cashier, Shift Supervisor, Manager, Admin, Owner
/app/{store_slug}/sales        → Manager, Admin, Owner, Sales Executive
/app/{store_slug}/purchases    → Manager, Admin, Owner, Purchasing Officer
/app/{store_slug}/inventory    → Manager, Admin, Owner, Inventory Controller
/app/{store_slug}/reports      → Manager, Admin, Owner, Accountant, Viewer
/app/{store_slug}/finance      → Accountant, Admin, Owner
/app/{store_slug}/staff        → Admin, Owner
/app/{store_slug}/settings     → Admin, Owner
/app/{store_slug}/billing      → Owner only
/app/{store_slug}/hr           → HR Officer, Admin, Owner
/app/{store_slug}/fulfillment  → Fulfillment Lead, Admin, Owner
```

**Middleware Stack for all `/app/{store_slug}/*` routes:**
```
auth → verified → tenant (resolves slug → tenant) → impersonation_guard → store_permission:{required_role}
```

> `tenant` middleware: queries `tenants WHERE slug = {store_slug}`, binds tenant to DI container. The numeric ID is **never exposed** in the URL at any point.

---

## The Support Ticket Lifecycle

```
1. Customer opens ticket at support portal
   └── Fills: subject, description, category

2. System auto-assigns department based on category
   └── Bug/Error → Technical
   └── Billing/Payment → Billing & Subscriptions
   └── Feature/Improvement → Product & Feedback
   └── Other → Unassigned (Director assigns)

3. SLA clock starts immediately
   └── Urgent: 1h | High: 4h | Medium: 8h | Low: 48h

4. Department Manager assigns ticket to available agent

5. Agent responds → status = "Pending" (waiting for customer)
   Customer responds → status = "Open" (waiting for agent)

6. Escalation paths:
   Agent → Department Manager → Support Director → Platform Owner
   Agent → Tech Escalation Engineer (for bugs)

7. Agent marks Resolved → Customer gets email → Can rate: 1-5 CSAT

8. QA Analyst randomly samples resolved tickets and scores

9. If unsatisfied: customer can reopen → escalation flag added

10. Auto-closes after 7 days of resolved with no reply
```

---

## The "Who Sees What" Dashboard Summary

| Role | Dashboard Character |
|------|---------------------|
| **Platform Owner** | The Satellite View — sees the entire planet from space. Every metric, every user, every rupee. |
| **Platform Manager** | Co-pilot — same view, no financial controls, no user creation. |
| **Support Director** | Air Traffic Controller — all tickets, all agents, real-time SLA heat map. |
| **Support Dept. Manager** | Department Head — their queue, their team, their backlog. Clear boundaries. |
| **Support Agent** | Personal Inbox — my tickets, my CSAT, my performance. Nothing else. |
| **QA Analyst** | Quality Inspector — resolved tickets only, scoring rubric, trend reports. |
| **Tech Engineer** | Bug Hunter — escalation queue, error logs, system health. No financial data. |
| **Marketing Manager** | Brand Command — content CMS, campaigns, anonymized growth metrics. |
| **Content Writer** | Draft Mode — only their own drafts and published content they authored. |
| **Finance Officer** | Ledger View — all revenue, billing, payouts. No operational store data. |
| **Store Owner** | Kingdom View — everything in their store, subscription status, staff overview. |
| **Franchise Admin** | Empire View — all branches side-by-side, consolidated metrics. |
| **Store Admin** | Operations Hub — same as owner minus billing. |
| **Manager** | Floor Manager — today's performance, staff on duty, pending items. |
| **Shift Supervisor** | This Shift Only — live POS, void approvals, cash status. |
| **Accountant** | Money Room — all financial reports, receivables/payables, bank reconciliation. |
| **Purchasing Officer** | Supply Desk — POs, deliveries, supplier balances, reorder alerts. |
| **Inventory Controller** | Warehouse View — stock levels, movements, valuation, dead stock, expiry. |
| **Sales Executive** | My Pipeline — my sales, my customers, my quotations. |
| **HR Officer** | People Desk — headcount, attendance, leave, payroll hours. |
| **Cashier** | POS Terminal — minimal. My session, my sales, clock-in time. |
| **Viewer / Auditor** | Read-Only Reports — all 38 reports, zero ability to write anything. |

---

## Industry Roles You Were Missing (Summary)

| Role | Industry | Why It Matters |
|------|----------|----------------|
| Shift Supervisor | Retail, F&B, Pharmacy | Handles voids/approvals without full manager access |
| Purchasing Officer | Wholesale, Manufacturing, Retail | Dedicated procurement without finance access |
| Inventory Controller | Warehouse, Pharmacy, Electronics | Dedicated stock management role |
| Sales Executive | B2B, Wholesale | Creates invoices, not POS operator |
| HR Officer | Medium-Large Business | Manages attendance, payroll prep, contracts |
| Franchise Admin | Chain Stores | Multi-branch oversight in one subscription |
| Kitchen Manager | Restaurant, Cafe | KOT management, ingredient tracking |
| Pharmacy Dispenser | Pharmacy | Batch/expiry legally required |
| Production Supervisor | Bakery, Textile, Factory | BOM consumption, production tracking |
| Delivery Driver | Any delivery business | Their queue only, update delivery status |
| Support Director | Platform Level | Manages entire support organization |
| Support Dept. Manager | Platform Level | Per-department management |
| Support QA Analyst | Platform Level | Quality control for support team |
| Tech Escalation Engineer | Platform Level | Developer-level ticket resolution |
| Platform Finance Officer | Platform Level | VenQore's own bookkeeper |
| Content Writer | Platform Level | Blog writer under marketing supervision |

---

## TIER 3 — The B2B/B2C Network Ecosystem

> **STATUS: Phase 3 / Year 3–5 Specification (Placeholder)**  
> These roles do **not** work for VenQore HQ, and they do **not** work for individual retail stores.  They are **external actors** — suppliers, consumers, agencies, and developers — who connect the isolated Tier 2 stores into a global networked economy.  
> Full specification lives in: `VenQore_Phase3_NetworkEcosystem_Spec.md` (to be written).

> ⚠️ **Database Preparation Requirement (Do This Now in Phase 1):**  
> Even though we are not building Tier 3 yet, the database must be designed with future-proofing stubs. Specifically: `tenants.public_vendor_id` (for the B2B catalog), `users.tier3_role` (nullable enum for future network roles), and the `wholesale_partners` table with soft-foreign-keys to `tenants`. Failure to add these stubs now means a disruptive migration later.

---

### Tier 3 Roles — Summary (Full detail in Phase 3 spec)

#### 3.1 — The B2B Syndicate (Wholesale Network)

| Role | Description |
|------|-------------|
| **Wholesale Partner (Supplier)** | A bulk distributor (e.g., flour mill) that sells to VenQore retail stores. Has a "Vendor Portal" to manage incoming POs, tiered pricing catalogs, and wholesale invoices. Zero visibility into retailer markup or customer data. |
| **B2B Account Representative** | The Wholesale Partner's salesperson. Manages VIP retail clients, approves line-item discounts. Has a "B2B CRM" showing which VenQore stores buy their products and who has stopped ordering. |

#### 3.2 — The B2C Marketplace (Consumer Empire)

| Role | Description |
|------|-------------|
| **Marketplace Consumer** | An everyday shopper using the VenQore Consumer App. When they click "Buy," the order drops directly into the merchant's Tier 2 POS — bypassing Foodpanda/Amazon. Dashboard: "My Orders" with unified cart across all VenQore-powered merchants. |
| **Delivery Courier (Fleet)** | The driver. Sees only: order ID, pickup instructions, drop-off address. Cannot see the store's revenue or customer payment details. A dedicated "Driver App" with optimized route map. |

#### 3.3 — The API & Partner Ecosystem

| Role | Description |
|------|-------------|
| **Certified Agency Partner** | An IT agency hired by a 50-location retail chain to set up VenQore. Gets "Delegate Access" (temporary Admin rights, no paid staff seat) once the Store Owner approves. Owner can revoke with one click. Has an "Agency Hub" listing all client stores they manage — similar to Shopify Partner Dashboard. |
| **External App Developer** | Builds third-party integrations (loyalty points, custom tax calculators) for the VenQore Marketplace. Uses OAuth + Webhook endpoints. Can only access specific data scopes explicitly approved by the Store Owner (e.g., "This app requests Read-Only Inventory access"). |

---

## Changelog

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-10 | Initial document created | Architecture session |
| 2026-04-10 | v1.1 — Fixed IDOR trap: `{store_id}` → `{store_slug}` in all routes | Security fix — IDOR vulnerability |
| 2026-04-10 | v1.1 — Added Impersonation Safety Protocol (3-layer enforcement) | Data integrity — prevent financial corruption during support sessions |
| 2026-04-10 | v1.1 — Added Tier 3 placeholder and schema stubs | Forward-compatibility — B2B/B2C network ecosystem |
| 2026-04-10 | v1.1 — Added 5 missing Tier 1 roles from ROLES_ARC: Customer Success Manager, Product Manager, Security Auditor, Billing Operations, Operations Manager detail | Completeness — industry-standard platform org chart |
| 2026-04-10 | v1.1 — Added Dispatch/Fulfillment Lead to Tier 2 | Completeness — e-commerce omnichannel operations role |
| 2026-04-10 | v1.1 — Added Tier 3 scope notice and URL security notice at document header | Clarity — prevent future architecture mistakes |

---

*This document is the specification. No single line of code should be written for any of these features without this document having been reviewed and confirmed as correct.*
