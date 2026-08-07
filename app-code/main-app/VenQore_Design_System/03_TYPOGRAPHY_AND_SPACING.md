# VenQore Design System — Section 3 & 4: Typography & Spacing Systems

> **Precision Scale**: Typography in VenQore is an architecture of information. Spacing is the rhythm that enforces cognitive calm.

---

# SECTION 3: TYPOGRAPHY SYSTEM

## 1. Primary Font Stacks

VenQore selects system-native, performance-optimized, high-legibility variable font typefaces:

* **Primary Body & Interface Font:** `Inter Variable` (fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`)
* **Financial & Data Font:** `JetBrains Mono` / `SF Mono` (fallback: `"Roboto Mono", "Courier New", monospace`)
* **Display & Editorial Font (Landing Page / Formal Invoice Headers):** `Newsreader Variable` / `Cinzel` (fallback: `Georgia, serif`)

```css
:root {
  --vq-font-sans: 'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --vq-font-mono: 'JetBrains Mono', SFMono-Regular, Menia, Monaco, Consolas, monospace;
  --vq-font-serif: 'Newsreader Variable', Georgia, Cambria, 'Times New Roman', serif;
}
```

---

## 2. Typography Scale & Hierarchical Specs

| Role | Font Family | Size (px / rem) | Weight | Line Height | Letter Spacing | Case | Numeric Variant |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Header** | Serif / Sans | `40px / 2.5rem` | 600 (SemiBold) | 1.15 | `-0.025em` | Title Case | Proportional |
| **Page Title (H1)** | Sans | `28px / 1.75rem`| 600 (SemiBold) | 1.20 | `-0.020em` | Title Case | Proportional |
| **Section Title (H2)**| Sans | `20px / 1.25rem`| 600 (SemiBold) | 1.30 | `-0.015em` | Title Case | Proportional |
| **Card / Widget Title (H3)**| Sans | `15px / 0.9375rem`| 600 (SemiBold)| 1.35 | `-0.010em` | Title Case | Tabular |
| **Body Primary** | Sans | `14px / 0.875rem`| 400 (Regular) | 1.45 | `0.000em` | Sentence | Standard |
| **Body Secondary** | Sans | `13px / 0.8125rem`| 400 (Regular) | 1.40 | `0.005em` | Sentence | Standard |
| **Table Header** | Sans | `11px / 0.6875rem`| 600 (SemiBold) | 1.30 | `0.060em` | ALL CAPS | Tabular |
| **Table Cell Data** | Mono / Sans | `13px / 0.8125rem`| 400 / 500 | 1.35 | `0.000em` | Sentence | `tabular-nums` |
| **Financial Ledger Num**| Mono | `13px / 0.8125rem`| 500 (Medium) | 1.25 | `0.020em` | Standard | `tabular-nums` |
| **Micro Badge Text**| Sans | `10px / 0.625rem` | 700 (Bold) | 1.20 | `0.080em` | ALL CAPS | Tabular |

---

## 3. Number Alignment & Tabular Figures Discipline

Financial numbers that do not align vertically create cognitive confusion. 

```
❌ WRONG (Proportional Figures - Jittery & Misaligned):
   $1,111.11
   $9,999.99
   $4,444.44

DECIMAL JITTER CAUSES OPERATOR EYE STRAIN

YES CORRECT (Tabular Monospaced Figures - Perfectly Aligned Vertical Column):
   $  1,111.11
   $  9,999.99
   $  4,444.44

VERTICALLY LOCK DECIMALS DOWN EVERY TABLE COLUMN
```

```css
/* Mandated CSS Rule for All Monetary and Stock Quantities */
.vq-number-tabular {
  font-family: var(--vq-font-mono);
  font-variant-numeric: tabular-nums lining-nums;
  font-feature-settings: "tnum" 1, "lnum" 1;
  text-align: right;
}
```

---

## 4. Typography Never-Do Rules

* 🚫 **NEVER use light font weights (<400) under 16px.** Light text creates severe illegibility on POS screens under fluorescent retail lights.
* 🚫 **NEVER mix proportional figures inside data tables.** All numeric columns MUST enforce `tabular-nums`.
* 🚫 **NEVER use geometric display fonts (e.g. Futura, Montserrat, Outfit) for financial numbers.**
* 🚫 **NEVER set line-height below 1.2 on body text.** Compressed text leads to scanning errors during fast stock counts.
* 🚫 **NEVER apply letter-spacing (tracking) to monospaced numbers.** Expanding tabular numbers breaks exact vertical alignment.

---

# SECTION 4: SPACING SYSTEM

## 1. The 4pt Atomic Grid Philosophy

VenQore strictly enforces a **4pt Atomic Grid System** (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`).

### Rationale:
1. **Sub-pixel Hardware Perfection:** Modern retail touchscreens and dual POS monitors operate at varying device pixel ratios (1.25x, 1.5x, 2x). Multiples of 4 cleanly snap without anti-aliasing blur.
2. **Dense Data Ergonomics:** A 4pt baseline enables compact 28px table rows and 36px input fields required by high-speed supermarket cashiers, while seamlessly expanding for spacious boardroom reporting.

---

## 2. Spacing Scale Definition

| Token | Value (px) | Value (rem) | Primary Usage |
| :--- | :--- | :--- | :--- |
| `--vq-space-1` | `4px` | `0.25rem` | Icon-to-text gap, badge inner vertical padding |
| `--vq-space-2` | `8px` | `0.50rem` | Compact button vertical padding, form field label gap |
| `--vq-space-3` | `12px` | `0.75rem` | Card internal element spacing, table cell horizontal padding |
| `--vq-space-4` | `16px` | `1.00rem` | Standard container padding, modal inset padding |
| `--vq-space-6` | `24px` | `1.50rem` | Section breaks, dashboard grid gap |
| `--vq-space-8` | `32px` | `2.00rem` | Major module separation, page header bottom margin |
| `--vq-space-12`| `48px` | `3.00rem` | Landing page hero vertical margins |
| `--vq-space-16`| `64px` | `4.00rem` | Major marketing section padding |

---

## 3. Layout Density Modes

VenQore provides 3 explicit layout density modes to adapt to different retail and administrative environments:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LAYOUT DENSITY VARIATIONS                       │
├───────────────────┬────────────────┬─────────────────┬─────────────────┤
│ DENSITY MODE      │ TABLE ROW H    │ INPUT FIELD H   │ PRIMARY TARGET  │
├───────────────────┼────────────────┼─────────────────┼─────────────────┤
│ COMPACT (POS)     │ 28px           │ 32px            │ Supermarkets    │
│ COMFORTABLE (ERP) │ 36px           │ 40px            │ Back-office ERP │
│ SPACIOUS (BOARDS) │ 48px           │ 48px            │ Analytics/Exec  │
└───────────────────┴────────────────┴─────────────────┴─────────────────┘
```

```css
/* Compact Density Variable Overrides */
[data-vq-density="compact"] {
  --vq-table-row-height: 28px;
  --vq-input-height: 32px;
  --vq-card-padding: 12px;
  --vq-font-size-table: 12px;
}

/* Comfortable Density Default Overrides */
[data-vq-density="comfortable"] {
  --vq-table-row-height: 36px;
  --vq-input-height: 40px;
  --vq-card-padding: 16px;
  --vq-font-size-table: 13px;
}

/* Spacious Density Overrides */
[data-vq-density="spacious"] {
  --vq-table-row-height: 48px;
  --vq-input-height: 48px;
  --vq-card-padding: 24px;
  --vq-font-size-table: 14px;
}
```
