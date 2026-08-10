# Prompt: Convert VenQore Dashboards to a Customizable Widget System

## Context

VenQore currently has two dashboards (Executive Dashboard and Overview) built as static, fixed-position cards with heavy visual styling (gradient icon badges, donut charts, glow effects). User testing feedback: the visuals look polished but feel like "too much" — too dense, too decorative, nothing the user can control.

We are replacing the static card layout with a **user-customizable widget grid**, similar to iOS/Android home screen widgets: users can add, remove, resize, and rearrange widgets, and the layout persists per user.

This is not a visual restyle — the number one goal is user control over layout. Visual density should also come down as a side effect of giving users the ability to remove what they don't need, but do not treat this as "redesign the cards to look different." Keep individual widget content/data as-is; change how they're arranged and contained.

## Tech decisions (already made — do not re-litigate these)

- **Grid/drag/resize engine:** `react-grid-layout`. Use its responsive grid (`WidthProvider` + breakpoints) so this also behaves reasonably on tablet widths, even though primary use is desktop.
- **Persistence:** new DB table `dashboard_layouts`, not localStorage. Layout must survive login from a different device/browser.
- **Resize model:** grid-cell snapping with **size presets** (Small / Medium / Large — and Wide where a widget's content needs horizontal room, e.g. a chart). Not free-form pixel resize. Each widget type declares which presets it supports; not every widget needs all four.

## What "widget" means here

Every current dashboard card (Pending Actions, Profit Margin, Overdue Payments, Net Balance, Purchases Trend, Inventory, Payments, Expenses, Active Staff, System Status, Last Backup, Alerts, Business Activity, Performance, Outstanding, Net Profit, Revenue Analytics, Top Products, Low Stock Alerts, Recent Purchases, Cash in Hand, Stock Value, Activity) becomes an independent widget with:

1. A stable `widget_type` identifier (e.g. `net_balance`, `revenue_analytics`, `low_stock_alerts`)
2. A declared set of supported sizes (grid units), e.g. `{ small: {w:2,h:2}, medium: {w:4,h:2}, large: {w:4,h:4}, wide: {w:6,h:2} }`
3. A **minimum size** it cannot shrink below (below which content would clip or become unreadable) — this is enforced by only offering presets that keep content usable, not by allowing arbitrary shrink-then-clip
4. Its own data-fetching, independent of other widgets, so removing one widget doesn't break others
5. A "plan/permission requirement" (see below)

## Plan-awareness / conditional availability

Different subscription tiers and different tenants have different data available (e.g. not every business tracks Payables/Receivables). Requirements:

- Each widget declares what it needs to be meaningful: a plan tier minimum, and/or a feature flag / module being enabled for that tenant (e.g. `requires_module: 'accounts_payable'`).
- The **widget picker** (the "add widget" UI) only shows widgets the current tenant/plan actually supports. Don't show a widget the user can add and then have it render "N/A" or an upsell nag — just don't offer it.
- If a widget *was* on a user's saved layout and their plan later changes so it's no longer available (e.g. downgrade), gracefully drop it from the rendered layout (and ideally notify the user once, not on every load) rather than erroring.
- Default/starter layout (see below) must only include widgets available to that tenant's current plan — compute the default at render time based on plan, don't hardcode one static default set for everyone.

## Default experience for new users

- Ship a sensible default layout per plan tier (a curated starting set of widgets in reasonable positions/sizes) so the dashboard isn't empty on first login.
- On first visit to the new dashboard, show a lightweight one-time hint (dismissible, not a blocking modal) explaining: "This dashboard is yours to customize — add, remove, resize, and rearrange widgets." Don't over-engineer this into a full onboarding tour.

## Core interactions to build

1. **Edit mode toggle** — an explicit "Customize" / "Edit Layout" button. Drag/resize handles should only be active in edit mode, not live on every page load (avoids accidental drags during normal use). A clear "Done"/"Save" exits edit mode and persists.
2. **Drag to reposition** — standard react-grid-layout drag behavior, other widgets reflow around it.
3. **Resize via preset picker** — not a free-drag resize handle in the corner (since we're doing preset sizes, not free-form). On each widget in edit mode, expose a small size control (e.g. a compact menu or button group: S / M / L / Wide) that swaps the widget's grid dimensions to the matching preset. Animate the reflow.
4. **Add widget** — a panel/drawer listing available-but-not-currently-added widgets (respecting plan/module rules above), grouped logically (e.g. Finance, Inventory, Operations, Team). Clicking/tapping adds it to the grid, ideally at the next available open slot or appended to the bottom.
5. **Remove widget** — a small remove (×) control on each widget, visible in edit mode. Confirm before removing if it seems risky, but a single click + undo toast is preferable to a confirmation modal.
6. **Reset to default** — a "Reset to default layout" action (with confirmation, since it's destructive) for users who've made a mess of it.
7. **Persistence** — every layout change (position, size, add, remove) should be saved to `dashboard_layouts` scoped by `user_id` + `tenant_id`. Debounce saves during drag (don't fire a save on every pixel of movement — save on drag-stop/resize-stop), but the "Done" button should force-flush any pending save.

## Data model (proposed — adjust to fit existing schema conventions)

```
dashboard_layouts
- id
- tenant_id
- user_id
- dashboard_key        -- e.g. 'executive', 'overview' (since there are two dashboards)
- layout_json           -- array of { widget_type, x, y, w, h, size_preset }
- created_at
- updated_at
```

One row per (user, tenant, dashboard_key). Keep it simple — a single JSON blob for the layout array is fine; we don't need a normalized per-widget table.

## Visual/density guidance (secondary to functionality)

- Keep the current dark navy design system (`#03070F`, `#060C18`, `#0B1422`, teal `#00C9A7`, blue `#3D9BFF`, red `#FF4D6A`, amber `#FFB020`) — this is not a rebrand.
- Reduce ornamentation *within* each widget now that widgets are user-controlled: fewer redundant icons, less gradient-badge repetition, tighter padding. The user already testing this said it "feels like too much" — resizing/removing helps, but also trim decorative elements that don't carry information (e.g. duplicate icons next to a label that's already self-explanatory).
- Empty/zero states ("No sales data yet", "No purchases recorded yet") should stay but can be visually quieter — they don't need their own icon treatment in every widget.
- Do not introduce new colors, fonts, or a different visual language. Syne stays as the wordmark/heading font per existing identity.

## Explicit non-goals for this pass

- Do not build cross-dashboard widget sharing/sync in this pass — `executive` and `overview` layouts are independent per user.
- Do not build a widget marketplace/plugin system — the widget catalog is a fixed, code-defined list for now, just conditionally visible per plan.
- Do not change the underlying data/API layer for existing cards unless required to split them into independent widgets — reuse existing endpoints where possible.

## Suggested build order

1. Define the widget registry (type, supported sizes, min size, plan/module requirement, data source) as a single source of truth on the frontend (and mirror the plan/module gating server-side too, so the "add widget" list is enforced, not just hidden by CSS).
2. Set up `dashboard_layouts` migration + API endpoints (GET current layout, PUT/PATCH save layout, POST reset-to-default).
3. Wire up `react-grid-layout` with the responsive/breakpoint config, rendering from saved layout (or computed default if none exists).
4. Build edit mode: drag, size-preset control, remove control.
5. Build the "Add Widget" drawer/panel with plan-aware filtering.
6. Build reset-to-default + first-visit hint.
7. Pass over each existing widget's internals to trim decorative elements per the density guidance above.
8. Test across at least 3 plan tiers to confirm widget availability differs correctly, and test a simulated downgrade to confirm graceful widget removal from an existing saved layout.

## Questions to resolve with me before/while building (ask if unclear)

- Exact list of which widgets require which plan tier / module flag (I'll need to give you the mapping — don't guess this).
- Whether "Executive Dashboard" and "Overview" should have fully independent widget catalogs, or share one catalog with different defaults.
- Mobile behavior: should edit mode (drag/resize) be available on small screens at all, or should mobile be view-only with the desktop-configured layout, single column, sizes auto-collapsed?
