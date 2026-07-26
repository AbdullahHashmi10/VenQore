# VenQore Design System — Section 16: Complete UI Blueprints

> **Execution Blueprint**: Architectural specs for building the three core surfaces of VenQore: Landing Page, Main Dashboard, and Enterprise List View.

---

# BLUEPRINT A: LANDING PAGE

```
┌────────────────────────────────────────────────────────────────────────┐
│ [NAVBAR] Brand Mark (Tungsten) | Product | Security | Pricing | [SIGN IN]│
├────────────────────────────────────────────────────────────────────────┤
│ [HERO SECTION]                                                         │
│ Tagline (Monospace): VERIFIED LOCAL DOUBLE-ENTRY TRUTH                 │
│ Headline (Serif 40px): The Indestructible Retail Operating System.     │
│ Subhead (Sans 16px): Zero Cloud Latency. Non-Stop POS & ERP.           │
│ CTA: [LAUNCH LOCAL DEMO (Tungsten)]  [EXPLORE ARCHITECTURE (Secondary)]│
├────────────────────────────────────────────────────────────────────────┤
│ [INTERACTIVE TERMINAL PREVIEW WIDGET]                                  │
│ Real-time simulated 60fps POS transaction feed with monospaced log.   │
├────────────────────────────────────────────────────────────────────────┤
│ [PROOFS OF RELIABILITY MATRIX]                                         │
│ 1. Offline SQLite Engine  │ 2. Sub-10ms POS  │ 3. AAA Senior-Friendly│
└───────────────────────────┴───────────────────┴────────────────────────┘
```

## 1. Spatial & Typography Blueprint

* **Navbar:** 64px height, `#090A0C` baseline background with a `1px bottom hairline` `#1F242D`.
* **Hero Heading:** `Newsreader Variable`, 40px/2.5rem, weight 600, line-height 1.15, tracking `-0.025em`. Color: `#F3F4F6`.
* **CTA Group:** 16px gap. Primary CTA uses `#D8A24A` fill with `#090A0C` bold text (`font-weight: 600`, 40px height, 5px radius). Secondary CTA uses `#171A21` background with 1px border `#374151`.
* **Interactive POS Live Preview:** Milled container (`#101216`) with 12px corner radius, 1px highlight hairline (`rgba(255,255,255,0.08)`), containing a live interactive checkout simulator operating at 60fps.

---

# BLUEPRINT B: MAIN DASHBOARD

```
┌────────────────────────────────────────────────────────────────────────┐
│ HEADER: [Store: Supermarket 01 ▼]  (🟢 SYNQ OK - 0ms)  [ ⌘K Search ]   │
├─────────────┬──────────────────────────────────────────────────────────┤
│ SIDEBAR     │ KPI GRID (4 CARDS)                                       │
│ [VENQORE]   │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│ • Terminal  │ │ NET SALES    │ │ CASH BALANCE │ │ LOW STOCK    │       │
│ • Inventory │ │ $48,920.00   │ │ $112,450.00  │ │ 2 ITEMS      │       │
│ • Accounting│ └──────────────┘ └──────────────┘ └──────────────┘       │
│ • Manufact. ├────────────────────────────────────┬─────────────────────┤
│ • Settings  │ FINANCIAL STREAM CHART             │ QUICK ACTIONS MENU  │
│             │ (Tungsten vs Emerald area chart)   │ [ + New Invoice ]   │
│             │                                    │ [ + Stock Adjustment]│
│             ├────────────────────────────────────┴─────────────────────┤
│             │ REAL-TIME TRANSACTIONS TABLE                             │
│             │ Time | SKU | Customer | Amount | Ledger Status           │
└─────────────┴──────────────────────────────────────────────────────────┘
```

## 1. Widget & Component Specifications

* **Sidebar:** 240px width, `#101216` background, 1px right border `#1F242D`. Navigation items are 36px tall with 13px Inter font and 20px SVG icon. Active navigation state is marked by `#D8A24A` left accent bar.
* **KPI Cards:** 4-column layout (`gap: 16px`). Background `#171A21`, 5px border-radius, 16px padding. Title is 11px uppercase monospaced `#9CA3AF`; value is 24px monospaced `#F3F4F6` with `tabular-nums`.
* **Quick Actions Panel:** `#171A21` container featuring 1-click keyboard shortcut triggers (`N` for New Invoice, `A` for Stock Adjustment, `P` for Post Journal Entry).

---

# BLUEPRINT C: RECORD / LIST PAGE

```
┌────────────────────────────────────────────────────────────────────────┐
│ HEADER: INVENTORY CATALOG  │  [ Export CSV ]  [ + ADD NEW SKU ]        │
├────────────────────────────────────────────────────────────────────────┤
│ FILTER BAR: [ Search SKU / Name... (/) ] [ Category: All ▼ ] [ Status ]│
├────────────────────────────────────────────────────────────────────────┤
│ TABLE (FULL KEYBOARD NAV: J/K to navigate, SPACE to select, ENTER edit)│
│ [☐] SKU (Sticky)  | Product Name    | Stock Count | Unit Price | Status│
│ ────────────────────────────────────────────────────────────────────── │
│ [☐] SKU-8849-X    | Organic Milk 1L | 1,420       | $3.50      | 🟢 OK │
│ [☑] SKU-1204-A    | Jasmine Rice 5kg| 12          | $18.99     | ⚠️ LOW│
│ [☐] SKU-9931-B    | Mineral Water   | 840         | $1.20      | 🟢 OK │
├────────────────────────────────────────────────────────────────────────┤
│ FOOTER: Showing 1-100 of 14,290 SKUs  │ Page [ 1 ] of 143 < >           │
└────────────────────────────────────────────────────────────────────────┘
```

## 1. Enterprise Table Specifications

* **Sticky Columns:** `SKU` column (left sticky, `#101216`) and `Actions` column (right sticky, `#101216`).
* **Row Geometry:** 36px height (comfortable mode), 1px bottom divider `#1F242D`.
* **Focus & Keyboard Navigation:** Up/Down arrows (`J`/`K`) shift row focus indicator immediately (`outline: 2px solid #D8A24A; outline-offset: -2px`). Pressing `Enter` opens the slide-over inspection drawer in under 120ms.
