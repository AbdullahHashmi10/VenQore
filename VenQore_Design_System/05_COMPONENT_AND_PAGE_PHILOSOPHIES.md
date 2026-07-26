# VenQore Design System — Section 8, 9, 10 & 11: Component & Page Philosophies

> **Operational Purpose**: Every UI component and layout must serve a single goal: maximum operational efficiency with zero cognitive friction.

---

# SECTION 8: COMPONENT PHILOSOPHY

## 1. Primary Component Specifications

### A. Buttons (`<button>`, `.vq-btn`)
* **Primary CTA (Tungsten Gold):** Solid `#D8A24A` fill with high-contrast `#090A0C` bold text. Used once per primary workflow view (e.g. "Complete Sale", "Post Journal").
* **Secondary Action:** Surface 3 background `#20242E` with 1px border `#374151` and `#F3F4F6` text.
* **Ghost / Tertiary Action:** Transparent background with subtle hover tint.
* **Destructive Action:** `#DC2626` background with white text or dark red border with red text.
* **Keyboard Focus:** Mandatory 2px Tungsten focus ring (`outline: 2px solid #D8A24A; outline-offset: 2px`).

### B. Input Fields (`<input>`, `.vq-input`)
* **Geometry:** 36px height (comfortable) / 32px (compact), 5px border-radius, 1px border `#374151`.
* **State Behavior:** Inactive inputs use low-contrast text labels; on focus, label shifts to primary color with a crisp Tungsten border highlight (`#D8A24A`).
* **Validation:** Inline error messages appear immediately below the input in 11px Monospaced Oxide Crimson text (`#EF4444`). Never rely on color alone; always pair with an alert icon (`!`).

### C. Data Tables (`<table>`, `.vq-table`)
* **Header Row:** Sticky top position, 11px monospaced uppercase headers, 1px bottom border `#374151`, zero background noise.
* **Cell Formatting:** Left-aligned text for text columns; right-aligned tabular monospaced numbers for financial figures.
* **Hover & Selection:** Hovering highlights the row in `#2B303C`; selected rows display a 2px left border accent in `#D8A24A`.

### D. Badges & Indicators (`.vq-badge`)
* **Structure:** 3px border-radius, 10px uppercase monospaced text, 2px vertical / 6px horizontal padding.
* **Palette:** Paired background tint (15% opacity) and 100% solid text color matching the semantic domain (Emerald, Oxide Crimson, Cadmium Ochre, Ice Cyan).

---

# SECTION 9: LANDING PAGE PHILOSOPHY

## 1. Emotional Narrative & Rhythm

The VenQore landing page is not a flashy consumer pitch; it is a **Statement of Enterprise Permanence**.

* **Tone:** Institutional trust, mathematical precision, quiet luxury.
* **Hero Strategy:** Clean dark background (`#090A0C`), ultra-crisp serif headline ("The Indestructible Operating System for Enterprise Commerce"), followed by an uncompressed, interactive 60fps high-density product demonstration.
* **Trust Signals:** Live transaction counters, zero network dependency metrics, real-time double-entry ledger verification widgets.
* **Typography Rhythm:** Alternate between massive, high-contrast headings and dense monospaced technical callouts.

---

# SECTION 10: DASHBOARD PHILOSOPHY

## 1. Post-Login Cognitive State: CALM CONTROL

When an operator logs into VenQore, the dashboard must immediately answer three core operational questions in under 2 seconds:

```
1. Is my cash ledger balanced right now?         →  [ GREEN CHECK: 100% BALANCED ]
2. Are any critical SKUs out of stock?            →  [ ALERT: 2 ITEMS AT REORDER POINT ]
3. What is today's net cash flow velocity?        →  [ METRIC: $42,890.00 (+4.2%) ]
```

```
┌────────────────────────────────────────────────────────────────────────┐
│                      DASHBOARD SPATIAL HIERARCHY                       │
├────────────────────────────────────────────────────────────────────────┤
│ HEADER: Store Selector │ Offline Status │ Global Search (⌘K) │ Profile  │
├──────────────┬─────────────────────────────────────────────────────────┤
│ SIDEBAR      │ KPI MATRIX: 4 Primary Metrics (Cash, Sales, Stock, GL)  │
│ - POS        ├────────────────────────────────────┬────────────────────┤
│ - Inventory  │ MAIN GRAPH: Real-Time Cash Flow    │ QUICK ACTIONS      │
│ - Accounting │ (Tungsten vs Emerald Stream)       │ [New Invoice]      │
│ - Manufact.  ├────────────────────────────────────┤ [Stock Adjust]     │
│ - Analytics  │ LIVE TRANSACTIONS TABLE            │ [Post Journal]     │
└──────────────┴────────────────────────────────────┴────────────────────┘
```

---

# SECTION 11: RECORD & LIST PAGES

## 1. The Enterprise Data Table Architecture

List pages are where ERP operators spend 90% of their time. VenQore tables are built for **Zero-Lag Keyboard Navigation**.

### Key Architectural Pillars:
1. **Keyboard Shortcuts:**
   * `J` / `K` or `Down` / `Up`: Navigate table rows.
   * `Space`: Select row checkbox.
   * `Enter`: Open row detail drawer.
   * `E`: Inline edit focused cell.
   * `/` or `⌘K`: Focus table search filter.
2. **Sticky Column Architecture:** First column (SKU / Invoice ID) and last column (Actions) remain fixed while intermediate data columns scroll horizontally.
3. **Advanced Multi-Column Filtering:** Filter bars support nested logical predicates (`Status = Active` AND `Stock < 10` AND `Category = Electronics`) without page reloads.
4. **Performance Mandate:** Tables render 10,000+ items seamlessly using virtualized row windowing (`react-window` / CSS container queries).
