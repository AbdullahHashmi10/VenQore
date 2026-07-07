# UIUX.md — Interface Audit & Path to 100

> **Method & honesty note:** this audit was performed by reading the frontend codebase (364 JSX files, 102 components, 8 layouts, measured patterns below), the design docs (`MIDNIGHT_NEBULA_DESIGN.md`, `VenQore_Copy_Bible_V1.md`), and flow wiring — not by pixel-inspecting rendered screens. Scores are engineering-grade heuristics: structure, states, consistency, interaction affordances. Validate visually against the demo store before treating any single score as gospel.
> Benchmarks referenced for quality bar (not for copying): Linear (speed/keyboard), Stripe (forms/errors), Notion (empty states/onboarding), Vercel (dashboard restraint), Figma (density controls).

## Measured facts
- 8 layout shells (Authenticated, Guest, Platform, PlatformShell, SuperAdmin, Reports, OneGlance, GlobalProvider) → consistent chrome ✅
- Skeleton/loading patterns in **74 files** ✅ unusually good
- Explicit empty-state components in only **~2 pages** ❌ (44 report pages will render blank tables for new stores)
- `aria-*` attributes in only **2 of 102 components** ❌ a11y debt
- SweetAlert2 for confirms (imperative dialogs), driver.js onboarding tours ✅, react-grid-layout customizable dashboard ✅, dark mode `class` strategy ✅, `prefers-reduced-motion` respected on landing ✅
- Custom fonts (Space Grotesk headline), gradient identity, glow effects on marketing pages

## Scores by surface (0–100)

| Surface | Score | Justification & top fixes |
|---|---|---|
| Marketing site (LandingPage, Pricing, Features, Blog…) | **82** | Strong narrative ("The Books Are Always Right"), FAQ, reduced-motion, SEO meta present. Fix: real customer proof (logos/testimonials/video), page-speed budget (glow/gradient cost), consistent CTA density, live demo embed above fold. |
| POS terminal (Pos.jsx) | **74** | Keyboard-first search, barcode flow, offline banners, parked sales, PIN — feature-rich. Risks: 3,577-line component = interaction bugs hide; error surfaces via toasts only; offline queue state not glanceable enough (needs persistent pending-badge + "needs attention" list); tender screen ergonomics unreviewed. Benchmark: a cashier should complete a 3-item cash sale in ≤6 keystrokes, zero mouse. |
| Dashboard(s) | **76** | Grid-layout customization + OneGlance layout is ambitious; Owner Daily Pulse is a genuinely differentiated artifact. Fix: first-run state for empty stores (currently metrics-driven redirects exist, but cards need "what to do next" affordances), number formatting consistency (currency symbol from tenant everywhere). |
| Reports (44 pages, ReportsLayout) | **68** | Huge breadth; tiered gating wired (`allowed_reports`). Fixes: empty states everywhere, saved filters/date presets, export consistency (PDF/Excel on all), drill-down links (P&L line → journal entries → source doc: the "always right" proof moment — make it a signature interaction), print CSS. |
| Sales/Purchases/Inventory CRUD | **72** | Async comboboxes for product/party are the right pattern. Fixes: uniform validation error rendering (Stripe-style inline + summary), destructive-action confirms consistent (SweetAlert2 everywhere vs mixed), bulk actions on tables, column visibility memory. |
| Accounting/Finance (journal, CoA, reconciliation, funds) | **70** | The engine outclasses the veneer. Fixes: journal entry viewer with debit/credit visual balance check, reversal flow with reason capture (backend supports it), reconciliation progress affordances. |
| Onboarding (SetupWizard, tours, onboarding_metrics) | **75** | Wizard + skip tracking + step metrics + demo store = solid activation toolkit. Fixes: time-to-first-sale under 10 minutes as the wizard's explicit goal; sample-data offer; checklist widget persistent until 4 key actions done (product, purchase, sale, report — metrics already shared to every page). |
| Platform/SuperAdmin | **65** | Functional density fine for internal. Fix later; don't spend launch cycles here. |
| Auth/Billing/Hub | **73** | Store switcher (Hub), trial banners, grace-period messaging wired to real state ✅. Fix: plan-change preview (proration story), card-failure recovery emails + in-app states. |
| Mobile responsiveness | **60 (unverified)** | Tailwind responsive classes exist; POS on tablet is the critical path — needs a deliberate tablet layout audit; `VenQore_Mobile_Dashboard_Design.html` suggests intent, `amd_erp_mobile`/Flutter plan is future. |
| Accessibility | **35** | 2/102 components with aria; custom comboboxes/dialogs likely keyboard-trap or unlabeled. Not launch-blocking for SMB POS, but fix the POS + checkout + forms first (focus rings, labels, roles, Esc handling); it also improves speed-of-use for power cashiers. |

**Overall UI/UX: 71/100.** Consistent shells, excellent loading-state discipline, real onboarding machinery — undermined by empty-state gaps, a11y debt, and a monolithic POS component.

## The 10 changes that move it to ~90
1. **EmptyState component** (icon + one-liner + primary action + docs link) applied to all 44 reports and every index page. (S–M)
2. **Drill-down everywhere:** every number on dashboard/reports clicks through to the underlying journal/docs. This is the product thesis made tangible. (M–L)
3. Decompose Pos.jsx; add a visible offline queue drawer with retry/resolve states. (L)
4. Inline + summary form-error pattern standardized (one `<FormField>` wrapper). (M)
5. Focus/keyboard pass on POS & top 10 forms (tab order, Esc, Enter-to-submit, focus rings). (M)
6. Currency/number/date formatting via one util, tenant-aware, everywhere. (S–M)
7. Persistent activation checklist widget wired to `onboarding_metrics`. (S)
8. Saved report filters + date-range presets + consistent export buttons. (M)
9. Plan-gate upsell moments: locked feature → beautiful explainer modal with one-click trial/upgrade (PlanGate already throws typed exceptions to catch). (M)
10. Tablet-POS layout audit + print stylesheet for receipts/invoices. (M)

## Copy & voice
`VenQore_Copy_Bible_V1.md` exists — enforce it: sentence-case UI, verbs on buttons ("Post sale", not "Submit"), numbers right-aligned tabular-nums in tables, error copy = what happened + how to fix. The accounting brand demands numeric typography discipline (tabular figures, consistent 2dp, explicit currency).
