# FEATURES.md — Complete Feature Inventory & Prioritized Backlog

> Rankings: Impact / Difficulty / Revenue / Retention / Moat / Cost / Demand, each Low–Med–High–VHigh. Derived from code (routes, controllers, pages) — this is what actually exists, not marketing claims.

## A. EXISTING FEATURES (shipped in v5.0.6)

### POS & Selling
| Feature | Notes |
|---|---|
| Offline-first POS terminal | Dexie cache + sales queue + auto-resync; barcode; keyboard-first search; cart discounts; multi-tender |
| Parked/held sales | Park, recall, auto-cleanup hourly |
| Staff PINs + terminals | Per-membership PIN; terminal registration + activity + screenshots |
| Returns/refunds (POS + back office) | Batch-exact stock restore + reversal journals |
| Parked→credit sales, credit-limit enforcement | Live AR-balance check with row lock |
| Quotations, Sales Orders, Pre-Sales, Proposals | Full pre-sale pipeline |
| Recurring invoices + invoice reminders | Scheduled generation 00:01 daily |
| Gift cards, store credit, loyalty points | Models + balances (verify UI completeness before marketing) |
| Tiered pricing, promotional (Rs.0) items | S-040/S-042 in V3 SaleService |
| Receipts/invoices PDF + print + labels/barcodes | dompdf + barcode generator |

### Inventory & Manufacturing
FIFO batch engine (locked, deterministic) · negative stock policy · multi-warehouse + transfers · stock take/adjustments (V3) · batch tracking w/ expiry · serial tracking · product variants + attributes · multi-barcode · multi-UOM conversions · composite products/recipes (Make-Now Mode A / Ready-Made Mode B) · production runs + logs + ingredient costing · Cookbook (recipe pages) · purchase orders → GRN flow · purchase proposals · debit notes · stock movement audit trail · import/export via Excel (+ import mapping UI) · recycle bin restore.

### Accounting & Finance (the moat)
Double-entry ledger on every transaction · chart of accounts (auto-provisioned, tenant-scoped) · journal viewer + manual entries · payments + partial allocations · customer/supplier statements + aging · bank accounts + reconciliation · funds management · expenses + categories · fiscal years + opening balances · payroll, employee settlements, loans, advances (V3) · assets + depreciation runs · bad debt, bounced cheques, cash shortage, disaster claims, donations/charity (V3) · P&L, balance sheet, trial balance, cash flow + ~40 more reports (tiered) · daily snapshots · hourly automated financial integrity audit · Owner Daily Pulse digest.

### Multi-channel & Integrations
WooCommerce (webhook orders in, 15-min stock push out, SKU matching, handshake pairing) · VenSynQ marketplace sync: Amazon/eBay/TikTok OAuth clients, 15-min sync, FIFO+ledger posting, clearing-account accounting (Phase 0 done 2026-07-07; per-marketplace enablement pending) · Online Store pages (basic) · Google Drive per-tenant backups · FBR e-invoicing (Pakistan) + PK verification · e-commerce channel model layer.

### AI
SmartCapture: Gemini-powered receipt/doc → transaction extraction with fuzzy matching + entitlements/quotas · Vena assistant (in-app copilot endpoint) · storefront visitor chatbot with learning KB + canned responses + human takeover inbox · Growth Engine (daily analysis, AI recommendations) · AI add-on tiers incl. BYOK.

### SaaS Platform (the second product)
14-day trials + reminders + expiry processing · plans/limits/features in DB + SuperAdmin plan editor + per-tenant overrides · grace→view-only lifecycle · Lemon Squeezy billing (monthly/annual/LTD + add-on catalog) · geo pricing (PKR) · AppSumo code generation/import/redemption/stacking · coupons · multi-store Hub + store cloning (TenantCloner) · staff invitations + join codes · impersonation with guard · support tickets + inbox + canned responses · newsletter hub · public demo store w/ golden-master daily reset + demo session sandboxing · platform revenue dashboards (MRR w/ LTD amortization, billable scope) · error/audit/activity logs · health checks + smoke tests · updater (self-hosted) + installer + DRM licensing · marketing site (landing, pricing, features, blog, digital products) · onboarding wizard + tours + activation metrics.

**Honest count: ~140 real, distinct features.** The "226+" marketing claim is defensible only if sub-features are counted; use 140+ externally to stay credible, or maintain the itemized `VENQORE_MASTER_PRODUCT_CATALOG.md` as proof.

---

## B. MISSING FEATURES (ranked backlog)

### Build FIRST (pre-launch or launch-quarter)
| # | Feature | Impact | Diff | Revenue | Retention | Moat | Demand | Why |
|---|---|---|---|---|---|---|---|---|
| 1 | POS → V3 engine cutover | VH | H | M | VH | VH | (internal) | Kills dual-engine risk; prerequisite for trust claims |
| 2 | Client idempotency for offline sales | VH | L | M | VH | H | H | Offline correctness = the promise |
| 3 | 2FA (owner/admin) | H | L | L | M | L | M | Table stakes for money software |
| 4 | Receipt printer/cash drawer support (ESC/POS via WebUSB/QZ-Tray or print server) | VH | M–H | H | VH | M | VH | #1 hard blocker for real shops; browser print is not enough |
| 5 | Empty states + activation checklist polish | H | L | M | H | L | H | Trial conversion lever (UIUX.md #1/#7) |
| 6 | Report drill-down to journal/source | H | M | M | H | VH | M | Makes "books always right" demonstrable |
| 7 | Data import concierge (Vyapar/Excel/Square CSV templates) | VH | M | H | VH | M | VH | Switching cost is the #1 objection; templates exist — productize |
| 8 | In-app announcements/changelog + NPS prompt | M | L | L | M | L | M | Launch feedback loop |

### Build NEXT (quarter 2)
| # | Feature | Impact | Diff | Revenue | Retention | Moat | Demand |
|---|---|---|---|---|---|---|---|
| 9 | Mobile companion app (Flutter plan exists) — owner dashboard + stock lookup first, not full POS | H | H | M | H | M | VH |
| 10 | Urdu (RTL) + localization framework | H | H | H (PK) | H | H (local moat) | H (PK) |
| 11 | Kitchen display / restaurant mode (tables, KOT) | H | H | H | H | M | H (food niche) |
| 12 | Purchase planning / reorder suggestions (Growth Engine extension) | M | M | M | H | M | M |
| 13 | Customer-facing invoice portal + payment links (local rails: JazzCash/Easypaisa; Stripe/PayPal global) | H | M–H | H | H | M | H |
| 14 | WhatsApp receipts + reminders (WA Business API) | H | M | H | H | M | VH (PK/IN) |
| 15 | Public REST API + API keys (plan-gated; `api_access` flag already exists) | M | M | M | M | M | M |
| 16 | Shopify channel for VenSynQ | M | M | H | M | M | H (global) |

### Later / opportunistic
Accountant multi-client workspace (CA channel play) · franchise/HQ consolidation reports · e-commerce storefront builder (resist: partner instead) · payroll tax localization beyond PK · hardware bundle program · marketplace of report templates · white-label/reseller edition (DRM system already 80% of it) · Tally/QuickBooks export bridge (accountant acceptance) · audit-mode read-only accountant login.

### Deliberately DO NOT build (complexity without matching value)
- Full e-commerce website builder (OnlineStore beyond basics) — WooCommerce/Shopify integration is the right boundary.
- Generic CRM pipelines — Parties + marketing campaigns suffice for SMB retail.
- Custom report builder UI — ship 44 curated reports + CSV export; builders are a maintenance tarpit.
- More marketplaces before Amazon/eBay/TikTok are *actually enabled end-to-end* (audit doc says enablement gaps remain).
- Native desktop rewrite — the PWA/Updater path is working; don't fork platforms pre-revenue.

---

## C. Sequencing recommendation (one line)
Correctness (1,2) → trust (3,6) → sellability (4,5,7) → market expansion (9–14). Everything else waits for revenue signal.
