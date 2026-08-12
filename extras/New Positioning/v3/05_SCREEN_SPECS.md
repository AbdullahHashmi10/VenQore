# 05 — Screen Specifications

Every screen follows the two-step shape from `04_UI_PROGRAM.md` §02.3: **extract to `Domain/` (ships to production, invisible), then build in `Next/` (hidden until the flip).**

Each spec below states: the domain hook to extract, what the new screen must do differently, which capabilities change it, which terminology keys it uses, and what "done" means.

---

## 01 — Build order and why

Ordered by *(frequency of use) × (how badly the current one under-serves a non-retail business)*.

| # | Screen | Why here | Extract | Build |
|---|---|---|---|---|
| 1 | **Shell + Nav** | Everything renders inside it; landing it early makes the whole experience demonstrable | — | wk 2–4 |
| 2 | **Dashboard** | First thing seen daily; most retail-shaped thing in the product | wk 3 | wk 4–6 |
| 3 | **Invoice / Sale form** | Highest-frequency write path; must carry services + parts | wk 4 | wk 5–7 |
| 4 | **POS** | Highest-frequency screen overall; offline; hardest | wk 5 | wk 6–9 |
| 5 | **Product / Service form** | Where the service type appears | wk 6 | wk 7–8 |
| 6 | **Party (customer/supplier)** | Most-renamed object in the product | wk 7 | wk 8–9 |
| 7 | **Expense** | Simple, high frequency, sets the form pattern | wk 7 | wk 8–9 |
| 8 | **List views (generic)** | One spec covers ~40 screens | wk 8 | wk 9–11 |
| 9 | **Job / Work order** | New screen, no old equivalent | — | wk 9–11 |
| 10 | **Quotation → Order** | Feeds jobs | wk 9 | wk 10–12 |
| 11 | **Reports** | Many screens, one frame | wk 10 | wk 11–13 |
| 12 | **Settings + Studio** | Onboarding, MyErp, Terminology, Appearance | wk 10 | wk 11–14 |

---

## 02 — Shell + Navigation

**Extract:** nothing (new construction).
**Build:** `Next/Shell/AppShell.jsx`, `Nav.jsx`, `CommandBar.jsx`.

### Navigation

Today: a hard-coded JSX array, ten top-level items, five of which cannot be turned off, with unavailable items rendered **locked**.

New: **nine slots maximum**, computed from `capabilities.provides_nav`.

```
Home · Sell · Buy · Stock · Work · Money · People · Insights · Studio
```

- `Work` appears only when `work_orders` is on. A retail tenant has eight.
- `Stock` disappears entirely for a pure-services tenant. A consultant has seven.
- Each label passes through `t()` — "Stock" becomes "Van stock" for an electrician, "Inventory" for a pharmacy.

**Hide vs lock:**

| Situation | Render |
|---|---|
| Tenant chose it off | **Hidden.** Not their business. |
| Plan does not include it | **Shown, locked, upgrade path.** This is a sales surface. |
| Role lacks permission | **Hidden.** Never advertise what this user cannot do. |

> **Prerequisite:** F-2 in `01_BACKEND_AND_DATA.md` §03.3 — API routes must be guarded before anything is hidden. Hiding a menu item whose route is open is a vulnerability, not a feature.

### Command bar

One entry point, `Cmd/Ctrl-K`, replacing the current `CommandPalette.jsx` + `OmniSearch.jsx` + `FloatingAiBubble.jsx` — three separate entry points today.

Four result kinds, in priority order:

1. **Actions** — "new invoice", "add expense"
2. **Records** — products, parties, invoices, jobs (existing search)
3. **Capabilities** — "do we have batch tracking?" → the capability card with an **Enable** button (Vena tiers 0–2, no LLM cost)
4. **Ask** — free text falls through to Vena

**Done when:** nav parity green (registry output byte-identical to the legacy array for 8 reference tenants × 7 roles); command bar reaches every action in under 2 keystrokes plus the query; verified in every offered theme.

---

## 03 — Dashboard

**Extract:** `Domain/dashboard/useDashboard.js` — one hook per widget, not one for the page. Today `DashboardController` computes everything in a single method, so a tenant without inventory still pays for stock queries and one widget error takes down the page.

**Build:** `Next/Screens/Dashboard/` on `Next/Shell/CardGrid.jsx`.

- 12-column snapping grid, drag to move, drag edge to resize, pin to lock
- Layout persists to `layout_preferences` (surface `'dashboard'`), per user, seeded from the store default
- Widget catalogue filtered by `capabilities.provides_cards` — a services-only tenant never sees a stock card, and it is not offered in the "add card" list either
- Every widget loads independently with its own skeleton; one failing widget shows an inline error, not a blank page
- **Default layout with no `layout_preferences` row must render today's dashboard exactly** — that is the dashboard parity test

**Widgets in V1:** Today's takings · Receivables ageing · Payables ageing · Low stock · Top products · Cash position · Recent activity · Open jobs · Expiring contracts · Growth Engine opportunities

**Done when:** dashboard parity green; a widget throwing does not blank the page; layout survives logout; five-theme review passed.

---

## 04 — Invoice / Sale form

**The most important form in the product.** It has to carry goods, services and job-derived lines on one document without becoming a spreadsheet.

**Extract:** `Domain/invoice/useInvoiceForm.js` — lines, quantities, discounts (line and document), tax (inclusive/exclusive via `TaxService` rules), rounding, payment allocation, party balance display, validation, submit. `Domain/invoice/invoiceSchema.js` holds the field definitions both shells read.

**Build:** `Next/Screens/Invoice/InvoiceForm.jsx`.

### What must be different from today

| Today | New |
|---|---|
| Fields fixed for every business | Field visibility driven by capability — no batch column without `batch_tracking`, no serial column without `serial_lifecycle` |
| One flat line table | **Sectioned:** Goods · Services · Charges, each subtotalled. Sections with no lines are not rendered. |
| "Customer" | `t('customer')` — Client, Patient, Guest, Member |
| Totals recomputed on blur | Live, with the arithmetic visible on hover — trust in the number matters more than elegance |
| Desktop-first | Keyboard-first on desktop, thumb-reachable on tablet. Line entry never requires the mouse. |
| — | **Job link.** An invoice raised from a job shows its parts and labour pre-filled and read-only, with a link back. |

### Print / PDF

Document rendering is not the form. Both shells emit the same payload to the same server-side generator. **DUP-3 in the backend plan (20 separate `Tools/*Service` PDF generators → one Document Engine with templates) is the highest-ROI refactor in the repo** and this screen is the reason: a tenant who renames "Invoice" to "Fee Note" and picks their own accent colour expects the PDF to follow.

**Done when:** identical totals, validation and POST body between shells for 40 fixture invoices including inclusive tax, mixed tax rates, line + document discount, rounding, part payment, multi-currency, service lines, job-derived lines.

---

## 05 — POS

**Hardest screen. Do not rush it.** Offline-capable via Dexie (`LocalDB.js`, 12 stores) + `SyncService.js`.

**Extract:** `Domain/pos/useCart.js`, `useOfflineCatalog.js`, `usePayment.js`, `useOccupancy.js`. The offline layer is retail-shaped and must be generalised alongside — see `03_SERVICES_AND_FIELD_WORK.md` §02.2.

**Build:** `Next/Screens/Pos/`.

- **Tile grid rearrangeable** — categories reordered, grid or list, quick-action row configurable, persisted to `layout_preferences` surface `'pos'`
- **Occupancy strip** (after R-4) — the same component labelled Tables / Chairs / Bays / Held sales by terminology. Hidden entirely when `occupancy` is off.
- **Services tab** alongside product categories; a service line takes hours or units, never touches stock
- **Offline banner is honest** — states what will and will not sync, not just "offline"
- Barcode scanning, split payment, cash rounding, WebUSB printing all unchanged in behaviour

**Done when:** an offline sale containing goods **and** services syncs cleanly with correct stock effects for goods and none for services; occupancy open/resume/close round-trips; the screen is usable one-handed on a 7-inch tablet.

---

## 06 — Product / Service form

**Extract:** `Domain/product/useProductForm.js`.
**Build:** `Next/Screens/Product/ProductForm.jsx`.

**The type selector is the first field and it changes the form:**

| Type | Sections shown |
|---|---|
| `standard` | Pricing · Stock · Barcodes · Tax · Variants |
| `weighted` | as standard + weight unit |
| `composite` | as standard + Composition (was Recipe) |
| **`service`** | Pricing (fixed/hourly/per-unit/quote) · Duration · Skill tag · Requires visit · Tax. **No stock section at all.** |

Capability-driven sections: Batches only with `batch_tracking`; Serials only with `serial_lifecycle`; Variants only with `product_variants`; Composition only with `composition`.

**Done when:** creating a service produces zero stock rows and zero FIFO lots, proven by test; the form for a services-only tenant shows no stock concept anywhere.

---

## 07 — Party (customer / supplier)

**The most-renamed object in the product** — Client, Patient, Student, Member, Tenant, Guest, Donor, Vendor.

**Extract:** `Domain/party/usePartyForm.js`, `usePartyLedger.js` (which consumes `PartyBalanceQuery`, formerly `LedgerService`).
**Build:** `Next/Screens/Party/`.

- Every heading, button and column through `t('customer')` / `t('supplier')`
- Balance, ageing and statement unchanged in logic — they are the strongest part of the product
- **Custom fields**, capability-gated: a clinic needs date of birth, an electrician needs site address. Do not build vertical-specific forms; build one custom-field mechanism.
- Contact channel row (phone, WhatsApp, email) feeding the single Communication capability that replaces the five notification mechanisms in DUP-4

**Done when:** a full rename to "Patient" changes every user-visible string on the screen and in its PDF statement, with zero code change.

---

## 08 — Expense

Small screen, high frequency, and it sets the pattern every simple form follows.

**Extract:** `Domain/expense/useExpenseForm.js` — category, account, payment source, tax, attachment, recurring flag.
**Build:** `Next/Screens/Expense/`.

- Attachment drop zone routed through **SmartCapture** — photo → structured expense. That machinery already exists with an alias book and a learning loop; this screen is the best place to surface it.
- Recurring toggle reuses `recurring_invoices`, not a second scheduler
- Account picker shows the chart-of-accounts path, not a bare name — "Operating › Utilities › Electricity"
- Job link: an expense attributable to a job posts against it and shows in job profitability

**Done when:** SmartCapture round-trips a photographed bill into a saved expense; posting matches the classic shell's journal entry exactly.

---

## 09 — List views — one spec, ~40 screens

**Do this once and correctly.** It is the largest single win in the programme by screen count.

**Extract:** `Domain/shared/useListView.js` — filters, sort, pagination, column set, bulk selection, export. Every list screen becomes a configuration object plus a cell renderer map.

**Build:** `Next/System/Table.jsx` + `Next/Screens/*/List.jsx`.

- **Column chooser** — show/hide, reorder, resize; persisted per user per list in `layout_preferences`
- Saved filters, named, shareable across the store
- Bulk actions in a sticky footer that appears on selection
- Sticky header, virtualised body past 200 rows
- Export respects the visible column set — currently exports ignore it, which is a real complaint
- **Every column header through `t()`**
- Empty states that offer the create action, not just an illustration

**Done when:** one `Table` component drives every list; column preferences persist; export matches the on-screen columns.

---

## 10 — Job / Work order (new)

No old equivalent, so build only — `Next/Screens/Job/`.

- **Board** — columns by status (Scheduled · In progress · Awaiting parts · Completed · Invoiced), drag to change status, filter by technician and date
- **Job detail** — header (client, site, priority, SLA if under contract) · lines (services, parts, ad-hoc) · assignments with hours · timeline of `job_events` · photos · signature capture
- **Parts issue** — pick from the technician's van warehouse; setting `consumed_at` is an explicit action with a confirmation, because it moves stock
- **Convert to invoice** — one action, opens the invoice form pre-filled and read-only on job-derived lines
- **Profitability panel** — revenue − FIFO parts cost − hours × `hourly_cost`, live

**Done when:** quotation → job → parts issued → completed → invoiced produces correct stock, FIFO cost and journal entries; a restaurant tenant with `work_orders` on but job children off sees only the kitchen view.

---

## 11 — Reports

Many screens, one frame. `ReportsLayout.jsx` exists; the new one replaces it.

**Extract:** `Domain/report/useReport.js` — date range, comparison period, grouping, drill-down, export. Every figure continues to come from `FinancialReportingService`, which is the single source of financial truth and must not be bypassed for any reason.

**Build:** `Next/Screens/Report/`.

- One frame: filter bar · summary strip · body · export. Every report is a configuration of it.
- Report availability driven by capability — no stock valuation report without `inventory`; no P&L without the ledger (which is always on)
- **Service revenue and goods revenue as separate P&L lines** — required by every Tier B business
- Job profitability report — new
- Drill-down from any figure to the transactions behind it. This is the single most requested feature in accounting-adjacent software and the data is already there.

**Done when:** every figure matches the classic shell to the last decimal for 20 fixture tenants; `ReportTierGate` still enforced.

---

## 12 — Settings + Studio

`Settings` keeps the operational things. **`Studio` is new and is where the product's positioning lives** — it is the screen a prospect is shown in a demo.

```
Studio
├── My ERP            capability browser: on/off, dependency consequences, search
├── Terminology       rename the ~25 term keys, live preview of nav + a sample invoice
├── Appearance        theme · primary · accent · density · radius, all live-previewed
├── Layout            reset arrangements, set the store default for new staff
└── Templates         apply a business template; see exactly what it changes first
```

### My ERP — the capability browser

- Grouped by the 12 existing capability groups
- Each capability: label, plain description, status (live/beta/soon), and the **consequence** of turning it off — named dependents, never a silent cascade
- Enabling pulls in its `requires` closure, **shown before confirming**
- Disabling with dependents is **refused**, with the dependents listed
- Plan-excluded capabilities shown locked with an upgrade path
- Search across capabilities via `capability_search_index` — same soundex + metaphone + FULLTEXT pattern proven in `product_search_index`

### Onboarding (first run)

```
Business type  →  a few questions  →  recommendation  →  build
```

- Pick from the 48 templates in `06_BUSINESS_CATALOGUE_V1.md`, or type free text, or "not sure"
- **Only ask questions that change configuration.** Every question must map to at least one capability or terminology decision. Anything else is a form for the sake of a form.
- Recommendation shown in three groups: **Included · Optional · Not applicable** — with the reason for each
- Everything editable before applying, and reversible after

**Done when:** applying a template produces exactly the documented capability set and terminology map; the user can undo it completely; a demo of Studio takes under four minutes end to end.

---

## 13 — Cross-cutting checklist — every screen

Before any screen is marked done:

- [ ] All logic in `Domain/`; the `Next/` file renders only
- [ ] No hardcoded colour; no string outside `t()`
- [ ] Reviewed in every currently-offered theme
- [ ] Reviewed at comfortable and compact density (before either is unpinned)
- [ ] Keyboard-navigable end to end; visible focus ring
- [ ] WCAG AA contrast with a user-chosen primary at both ends of the curated hue range
- [ ] Works at 360px wide
- [ ] Loading skeleton, empty state and error state all designed — not afterthoughts
- [ ] Capability-off variant checked: the screen degrades, it does not break
- [ ] Byte-identical DOM test passing on the classic page after extraction
