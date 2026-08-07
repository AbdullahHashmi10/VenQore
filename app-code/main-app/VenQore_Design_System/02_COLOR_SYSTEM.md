# VenQore Design System — Section 2: Signature Color System

> **Color Discipline**: Color in VenQore is an operational signal, never a decoration. If a color does not convey state, domain context, or financial truth, it does not exist on the screen.

---

## 1. Palette Architecture & Scientific Rationale

VenQore rejects consumer blue (`#3B82F6`) and startup purple (`#8B5CF6`). These saturated wavelengths cause visual fatigue over 12-hour retail shifts. 

Instead, VenQore introduces **Tungsten & Obsidian Architecture**:
* **Base Neutrals:** Formulated using ultra-low-chroma Slate-Graphite (OKLCH hue 260° in Dark Mode, OKLCH hue 90° Warm Quartz in Light Mode) to prevent screen glare.
* **Primary Brand Accent:** **Tungsten Amber (`#D8A24A`)**, a deep, warm metallic hue echoing gold bullion, precision brass instruments, and architectural craftsmanship.
* **Domain & State Chromas:** Strictly mapped to specialized spectral bands (Swiss Emerald for cash/finance, Oxide Crimson for systemic risk, Cyan Ice for offline/sync, Copper Rust for inventory/manufacturing).

---

## 2. Dark Theme Color Tokens

### Background & Surface Scale (Dark)

| Token Name | CSS Variable | Tailwind Class | HEX | RGB | OKLCH | HSL | AAA Ratio (vs Text Main `#F3F4F6`) | Usage Rules |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Canvas** | `--vq-dark-bg-base` | `bg-vq-dark-base` | `#090A0C` | `9, 10, 12` | `0.12 0.01 260` | `220 14% 4%` | 17.8:1 (AAA) | Application window root background |
| **Surface 1** | `--vq-dark-bg-surface-1` | `bg-vq-dark-s1` | `#101216` | `16, 18, 22` | `0.15 0.01 260` | `220 16% 7%` | 16.4:1 (AAA) | Sidebar, header, sticky table containers |
| **Surface 2** | `--vq-dark-bg-surface-2` | `bg-vq-dark-s2` | `#171A21` | `23, 26, 33` | `0.18 0.015 260` | `220 18% 11%` | 14.8:1 (AAA) | Cards, active panels, table row default |
| **Surface 3** | `--vq-dark-bg-surface-3` | `bg-vq-dark-s3` | `#20242E` | `32, 36, 46` | `0.22 0.02 260` | `221 18% 15%` | 12.9:1 (AAA) | Modal dialogs, dropdown popovers, tooltips |
| **Surface 4** | `--vq-dark-bg-surface-4` | `bg-vq-dark-s4` | `#2B303C` | `43, 48, 60` | `0.27 0.02 260` | `222 17% 20%` | 10.4:1 (AAA) | Hovered table rows, active input fills |

---

### Text & Neutral Scale (Dark)

| Token Name | CSS Variable | Tailwind Class | HEX | RGB | OKLCH | HSL | AAA Ratio (vs Base `#090A0C`) | Usage Rules |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Text Primary** | `--vq-dark-text-primary` | `text-vq-dark-primary` | `#F3F4F6` | `243, 244, 246` | `0.96 0.003 260` | `220 14% 96%` | 17.8:1 (AAA) | Page titles, primary metrics, active values |
| **Text Secondary**| `--vq-dark-text-secondary`| `text-vq-dark-secondary`| `#9CA3AF` | `156, 163, 175` | `0.70 0.01 260` | `218 11% 65%` | 8.4:1 (AAA) | Table headers, metadata labels, body text |
| **Text Tertiary** | `--vq-dark-text-tertiary` | `text-vq-dark-tertiary` | `#6B7280` | `107, 114, 128` | `0.52 0.01 260` | `220 9% 46%` | 4.7:1 (AA) | Helper text, disabled options, timestamp footers |
| **Border Hairline**| `--vq-dark-border-hair` | `border-vq-dark-hair` | `#1F242D` | `31, 36, 45` | `0.21 0.015 260` | `219 18% 15%` | N/A (1px separator) | Subtle 1px structural dividers |
| **Border Strong** | `--vq-dark-border-strong` | `border-vq-dark-strong` | `#374151` | `55, 65, 81` | `0.33 0.02 260` | `217 19% 27%` | N/A (Focus/Input) | Form field borders, selected table row outlines |

---

### Brand & Primary Accent (Dark)

| Token Name | CSS Variable | Tailwind Class | HEX | RGB | OKLCH | HSL | AAA Ratio (vs Surface `#171A21`) | Usage Rules |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Tungsten Main** | `--vq-accent-tungsten` | `bg-vq-tungsten` | `#D8A24A` | `216, 162, 74` | `0.72 0.11 76` | `37 66% 57%` | 8.6:1 (AAA) | Primary brand CTA, active tab indicator |
| **Tungsten Hover**| `--vq-accent-tungsten-h` | `bg-vq-tungsten-hover`| `#E5B35C` | `229, 179, 92` | `0.77 0.12 76` | `38 72% 63%` | 10.1:1 (AAA) | Primary button hover state |
| **Tungsten Muted**| `--vq-accent-tungsten-sub`| `bg-vq-tungsten-sub` | `#2C2213` | `44, 34, 19` | `0.23 0.04 76` | `36 40% 12%` | 1.8:1 (Badge BG) | Primary active badge background tint |

---

## 3. Light Theme Color Tokens

### Background & Surface Scale (Light)

| Token Name | CSS Variable | Tailwind Class | HEX | RGB | OKLCH | HSL | AAA Ratio (vs Text Main `#111827`) | Usage Rules |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Canvas** | `--vq-light-bg-base` | `bg-vq-light-base` | `#F8F9FA` | `248, 249, 250` | `0.98 0.003 90` | `210 12% 97%` | 18.2:1 (AAA) | Light application root background |
| **Surface 1** | `--vq-light-bg-surface-1`| `bg-vq-light-s1` | `#FFFFFF` | `255, 255, 255` | `1.00 0.00 0` | `0 0% 100%` | 19.5:1 (AAA) | Sidebar, header, card containers |
| **Surface 2** | `--vq-light-bg-surface-2`| `bg-vq-light-s2` | `#F1F3F5` | `241, 243, 245` | `0.96 0.004 90` | `210 10% 95%` | 16.8:1 (AAA) | Table row default background, embedded well |
| **Surface 3** | `--vq-light-bg-surface-3`| `bg-vq-light-s3` | `#E9ECEF` | `233, 236, 239` | `0.93 0.005 90` | `210 10% 92%` | 15.2:1 (AAA) | Hovered table rows, popover containers |
| **Border Hairline**| `--vq-light-border-hair`| `border-vq-light-hair` | `#E2E8F0` | `226, 232, 240` | `0.92 0.006 240`| `214 32% 91%` | N/A (Divider) | Subtle 1px light mode separators |

---

## 4. Semantic State Colors

Semantic colors provide unambiguous operational cues across both light and dark themes.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SEMANTIC SPECTRUM MAPPING                       │
├──────────────┬──────────────────┬─────────────────┬────────────────────┤
│ STATE        │ HEX (DARK / LIGHT)│ OKLCH          │ OPERATIONAL INTENT │
├──────────────┼──────────────────┼─────────────────┼────────────────────┤
│ SUCCESS      │ #10B981 / #059669│ 0.68 0.16 155   │ Ledger balanced    │
│ WARNING      │ #F59E0B / #D97706│ 0.74 0.16 70    │ Low stock alert    │
│ ERROR / RISK │ #EF4444 / #DC2626│ 0.62 0.22 25    │ Terminal failure   │
│ INFO / NOTE  │ #06B6D4 / #0891B2│ 0.70 0.13 210   │ System notification│
│ PENDING      │ #8B5CF6 / #7C3AED│ 0.62 0.18 290   │ Batch in transit   │
│ ARCHIVED     │ #6B7280 / #4B5563│ 0.52 0.01 260   │ Historical record  │
└──────────────┴──────────────────┴─────────────────┴────────────────────┘
```

---

## 5. Domain & Module Context Colors

VenQore assigns specific color accents to major ERP modules so operators immediately recognize functional context.

| Module | HEX | RGB | OKLCH | HSL | AAA Ratio | Usage Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Offline Mode** | `#38BDF8` | `56, 189, 248` | `0.75 0.12 220` | `198 93% 60%` | 11.4:1 | Offline database active indicator badge |
| **Sync Engine** | `#A7F3D0` | `167, 243, 208` | `0.90 0.08 160` | `152 76% 80%` | 15.1:1 | Real-time network sync pulse dot |
| **Accounting** | `#10B981` | `16, 185, 129` | `0.68 0.16 155` | `160 84% 39%` | 8.8:1 | Double-entry journal status & General Ledger |
| **Inventory** | `#F59E0B` | `245, 158, 11` | `0.74 0.16 70` | `38 92% 50%` | 10.2:1 | SKU quantities, reorder point alerts |
| **Manufacturing** | `#E67E22` | `230, 126, 34` | `0.66 0.15 45` | `28 80% 52%` | 7.9:1 | Bill of Materials (BOM) & Work Orders |
| **POS / Sales** | `#D8A24A` | `216, 162, 74` | `0.72 0.11 76` | `37 66% 57%` | 8.6:1 | Active cash register & terminal transactions |
| **Returns** | `#EC4899` | `236, 72, 153` | `0.67 0.20 340` | `330 81% 60%` | 8.1:1 | Credit notes & return authorizations |
| **AI Copilot** | `#C084FC` | `192, 132, 252` | `0.70 0.18 300` | `270 95% 75%` | 10.8:1 | Automated anomaly detection & AI queries |

---

## 6. Data Visualization Color Palette

For charts, financial graphs, heatmaps, and stock velocity diagrams, VenQore uses an **optically balanced, color-blind accessible sequential palette**:

```
Series 1 (Primary Metric)  : #D8A24A (Tungsten Amber)
Series 2 (Comparative/Past): #4B5563 (Graphite Neutral)
Series 3 (Revenue/Inflow)  : #10B981 (Swiss Emerald)
Series 4 (Expense/Outflow) : #EF4444 (Oxide Crimson)
Series 5 (Forecast/AI)     : #06B6D4 (Cyan Ice)
Series 6 (Tax/Liabilities) : #8B5CF6 (Amethyst Violet)
```

---

## 7. Interactive State Colors (Hover, Focus, Selection)

* **Hover (Buttons/Rows):** Increase lightness by `+5%` in dark mode, decrease lightness by `-4%` in light mode. Zero tint shifts.
* **Focus Ring (Keyboard):** `2px solid #D8A24A` with `2px offset #090A0C`. High-visibility focus indicator mandatory for WCAG AAA.
* **Selection State (Tables):** `background: rgba(216, 162, 74, 0.08)` with a `2px solid #D8A24A` left accent border on selected table rows.
