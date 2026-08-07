# VenQore Design System — Section 12, 13 & 14: Accessibility, Iconography & Data Vis

> **Universal Precision**: Accessible design is not a compromise; it is the ultimate test of clarity and visual rigor.

---

# SECTION 12: ACCESSIBILITY & SENIOR-FRIENDLY SPECIFICATIONS

## 1. WCAG AAA Compliance Standards

VenQore enforces strict **WCAG 2.1 AAA** requirements across all light and dark interfaces.

* **Contrast Ratios:**
  * Primary Body & Table Text: Minimum **7:1** against surface background.
  * Large Headings (20px+): Minimum **4.5:1** against surface background.
  * Interactive Control Borders: Minimum **3:1** against canvas.
* **Touch & Click Target Boundaries:** Minimum touch target size is **44px × 44px** across all POS touch interfaces. Compact data density tables maintain a minimum click hit-area of 36px with 8px invisible hit-padding.
* **Color Blindness Provisions:** Color is NEVER used as the sole indicator of state. All status badges combine a unique icon + explicit text label + semantic background tint.

---

## 2. Keyboard Ergonomics & Screen Reader Tree

* **Focus Indicator:** 2px high-visibility solid Tungsten Gold focus ring (`#D8A24A`) with 2px offset.
* **ARIA Roles:** All tables implement `role="grid"`, `aria-rowcount`, `aria-colcount`, and `aria-selected` attributes.
* **Screen Reader Announcer:** Dynamic live regions (`aria-live="polite"`) broadcast real-time stock updates, checkout totals, and offline status changes without interrupting navigation.

---

# SECTION 13: ICONOGRAPHY SYSTEM

## 1. Grid & Geometry Standards

VenQore icons follow a strict, crisp pixel grid:

* **Primary Icon Grid:** `20px × 20px` (embedded in buttons, tables, navigation).
* **Large Module Icons:** `24px × 24px` (dashboard widgets, feature cards).
* **Stroke Weight:** Constant `1.5px` stroke with clean round caps (`stroke-linecap="round" stroke-linejoin="round"`).
* **Outline vs. Fill Rule:** Icons are strictly **Outlined** in neutral states. Filled variants are used ONLY to indicate active selection (e.g. active tab in sidebar).

```xml
<!-- Standard VenQore Icon Spec SVG Template -->
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 5H17M3 10H17M3 15H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

---

# SECTION 14: DATA VISUALIZATION

## 1. Accounting & Financial Chart Rules

Financial charts must communicate trend direction and exact magnitude instantly.

* **Zero Baseline:** Bar and area charts MUST always start at `0` on the Y-axis. Never truncate Y-axes to exaggerate micro-fluctuations.
* **Area Fills:** Area charts use a 10% opacity gradient stroke fill, avoiding heavy solid colors that obscure grid lines.
* **Hover Tooltips:** Hovering over any chart data point displays a high-contrast monospaced tooltip container showing:
  * Exact Date/Time (`2026-07-26 14:00`)
  * Precise Metric Value (`$148,920.50`)
  * Comparative Delta (`+$3,210.00 / +2.2%`)

```
┌────────────────────────────────────────────────────────────────────────┐
│                     FINANCIAL CHART SPECIFICATION                      │
├────────────────────────────────────────────────────────────────────────┤
│ $150k ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ────────┬─────────────────── │
│                                                   │ Tooltip:           │
│ $100k ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ───▲──────┤ $148,920.50        │
│                                           │       │ +2.2% vs yesterday │
│ $50k  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │ ─ ─ ─ ┴─────────────────── │
│                                           │                            │
│ $0k   └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴─── │
│      08:00   10:00   12:00   14:00   16:00   18:00                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Heatmaps & Stock Velocity Diagrams

* **Inventory Velocity Scale:**
  * High Turnover (Fast Moving): `#10B981` (Swiss Emerald)
  * Steady Turnover: `#38BDF8` (Ice Cyan)
  * Slow / Dead Stock: `#F59E0B` (Cadmium Ochre)
  * Out of Stock (Critical): `#EF4444` (Oxide Crimson)
* **Heatmap Grid:** 1px hairlines between cells with 4px rounded corner squares.
