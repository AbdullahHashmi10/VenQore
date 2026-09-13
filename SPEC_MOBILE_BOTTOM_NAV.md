# Spec — mobile bottom navigation bar

Rules of engagement from the earlier instruction files still apply.

Source component: the 21st.dev `bottom-nav-bar`. It is a good starting point but it is
written for a different stack and design system. **Do not paste it in as-is.** The
adaptations below are not optional — each one is a thing that will break or look wrong.

---

## Part A — Port it to this codebase

The source is Next.js + TypeScript + shadcn. This app is Inertia + React + JSX + the V6
design system.

1. **Drop `"use client"`** — that is a Next.js directive and means nothing here.
2. **TypeScript → JSX.** Remove the `type BottomNavBarProps` block and the type
   annotations. File goes at `resources/js/Components/BottomNavBar.jsx`.
3. **`framer-motion`** — check `package.json` first. If it is not already a dependency,
   **do not add it for one component.** Replace the two animations with CSS: a
   `transition-all duration-normal` on the pill, and the expanding label as a
   `max-width`/`opacity` transition. Report which route you took.
4. **`cn` from `@/lib/utils`** — confirm it exists. If not, use the project's existing
   class-merging helper, whatever it is called.
5. **`<motion.button>` → Inertia `<Link>`.** These are navigation targets, not buttons.
6. **Remove the local `useState` active index.** Active state derives from the current
   route: `route().current('store.pos')` and so on, the same way `OneGlanceLayout` and
   `ReportsLayout` already do it. A local index will desync the moment someone navigates
   from anywhere else.

---

## Part B — V6 tokens, not shadcn tokens

The source uses shadcn semantic classes that do not exist in this design system. Map them
to what `OneGlanceLayout.jsx` and `ReportsLayout.jsx` already use — read those two files
first and match them exactly rather than inventing new values.

| Source | Use instead |
|---|---|
| `bg-card` / `dark:bg-card` | the surface token this app uses (`bg-surface`) |
| `border-border` / `dark:border-sidebar-border` | `border-line` |
| `text-muted-foreground` | `text-ink-muted` |
| `bg-primary/10` (active pill) | the brand tint already used for active nav |
| `text-primary` | the brand foreground already used for active nav |
| `hover:bg-muted` | `hover:bg-interactive-hover` |
| `duration-200` | `duration-normal` |
| `text-xs` and the `clamp()` font size | the existing `text-3xs` / `text-1xs` scale |

Follow `DESIGN-RULES.md` where it has anything to say about z-index and elevation — the
project has a documented z-index ladder and this bar must take its place in it, not pick
an arbitrary `z-20`.

---

## Part C — Which links, and how many

**Five slots maximum.** The source has six; at the 320px minimum width six items with an
expanding label will crush. Five is the ceiling on a 360px phone.

The set is **derived from enabled modules**, exactly like the sidebar — not hardcoded:

1. **Home** — dashboard. Always present.
2. **Sell** — POS if the `pos` module is on; otherwise New Invoice if `invoicing` is on;
   otherwise omit.
3. **Stock** — if `products` or `inventory` is on.
4. **Contacts** — if `customers` or `suppliers` is on.
5. **More** — always present. Opens the full navigation.

Rules:
- **Module-gated items are absent**, with no trace — same rule as everywhere else.
- **Plan-locked items do not appear at all.** Five slots on a phone are too valuable to
  spend on an upsell. Locks stay in the sidebar and the reports hub.
- Respect permissions as well as modules: a cashier without `users.manage` must not see a
  team link inside More.
- Labels come from the terminology helper (`useTermText`), so a plumber sees "Jobs" and a
  shop sees "Sales". Do not hardcode English strings.
- If fewer than three items resolve, render nothing — a two-item bar is clutter.

---

## Part D — Where it appears, and where it must not

- **Mobile only.** Render below the `lg` breakpoint. Desktop already has the sidebar.
- **Hide it on POS and checkout screens.** A floating bar pinned to the bottom will sit on
  top of the checkout button and the cart total, which is the single worst place in the
  app to lose a tap. Also hide it on any full-screen modal or document editor.
- **Safe area.** Use `padding-bottom: env(safe-area-inset-bottom)` (or the Tailwind
  equivalent) so it clears the iPhone home indicator instead of sitting under it.
- Add bottom padding to the scroll container on the pages where it shows, so the bar never
  covers the last row of a list.

---

## Part E — Accessibility

R26 in the audit was an icon-only control with no accessible name. Do not repeat it here.

- `aria-current="page"` on the active item.
- Every item has a real accessible name even when its label is collapsed — the visible
  `<span>` is fine when present, otherwise `aria-label`.
- Minimum 44×44px touch target per item. The source's `min-h-[40px]` is below the
  threshold; raise it.
- `aria-label` on the `More` control describing what it opens.

---

## Part F — Tests

Add to `resources/js/tests/` in the existing style:

1. With `modules: ['pos','products','customers']`, the bar renders Home, Sell, Stock,
   Contacts and More.
2. With `modules: []`, the bar renders nothing.
3. A module-gated item is absent from the markup, not merely hidden by a class.
4. The active item carries `aria-current="page"`.
5. Every item has an accessible name.

---

## Then

```bash
npm test
npm run build
```

Both summary lines raw. Take a screenshot at 360px and 414px width and confirm nothing
overlaps and no horizontal scroll appears. Commit, push, list the files.

No readiness score, no percentage, no verdict.
