# VenQore — Launch Readiness Mandate

**Companion to:** `VENQORE_AI_CONSOLIDATION_MANDATE.md`, `VENQORE_RECKONER_COVERAGE_MANDATE.md`
**Target agent:** IDE coding agent with full repo access
**Repo root:** `app-code/main-app`

Two parts. **Part 1 is launch-blocking** — four items, mostly decisions and small code. **Part 2 is the header consolidation** — larger, ships when it ships, but it is what makes the product feel like one thing instead of four.

---

# PART 1 — Launch blockers

## 1.1 Verify the free API key is on a paid Google project ⚠ **do this first**

`app/Services/Ai/Providers/KeyResolver.php` routes three modes to `SMART_CAPTURE_FREE_API_KEY`:

```php
$isFreeTier = in_array($entitlementMode, ['free', 'staff', 'public_tool'], true)
    || $feature === 'public_tool';
```

Google's Gemini API Terms draw a hard line. On **Unpaid Services**: *"Google uses the content you submit… to provide, improve, and develop Google products"* and *"human reviewers may read, annotate, and process your API input and output."* On **Paid Services** they explicitly do not.

Smart Capture transmits customers' invoices, supplier bills, prices and party names. So:

- [ ] Confirm in Google Cloud Console that the project behind `SMART_CAPTURE_FREE_API_KEY` has **billing enabled**. Code cannot verify this — a human must look.
- [ ] If it does not, either enable billing or point the variable at the paid project. Cost is ~**$0.05 per free-trial user** for the full 10-scan allowance.
- [ ] **Decide whether `staff` belongs in that list at all.** Staff mode is unmetered internal use on real tenant data; it should almost certainly resolve to the paid key. Recommendation: remove `'staff'` from `$isFreeTier`.
- [ ] Leave `public_tool` as-is — it is a marketing demo on a shared budget.

**Acceptance:** every `ai_usage_events` row with `key_mode = 'platform_free'` traces to a billing-enabled project.

## 1.2 Shared catalogue consent

**Decided approach: an unticked checkbox at signup, stating the benefit and the boundary.** Not bundled into T&C acceptance — consent bundled into terms is not valid consent under GDPR (it must be specific, informed, unambiguous and freely given), and AppSumo sends EU/UK buyers.

The honest ask also converts better, because the offer is genuinely good.

- [ ] Add to the signup flow, **unticked by default**, above the T&C checkbox and visually separate from it:

  > **Help build the shared product catalogue**
  > Get thousands of common products pre-filled in your catalogue, confirmed by other shops.
  > In return, product names you confirm are added to the shared pool.
  > **Never shared:** your prices, costs, stock, margins, customers, suppliers, or your business identity.

- [ ] Persist to the existing `tenants.shared_catalog_opt_out` (invert on write, or add `shared_catalog_opt_in` and migrate — do not maintain both).
- [ ] Add the same control to **Settings → Data**, so it can be changed any time and anyone who skipped it at signup can find it.
- [ ] Existing tenants are **not** auto-opted-in. Show them the ask once, in-app, on next login.
- [ ] Add a plain-language section to the Terms of Service describing the pool, what is shared, what never is, and how to leave it. The checkbox is the consent; the ToS is the explanation.
- [ ] Raise `smartcapture.shared_catalog_threshold` from **3 to 5**. A name five unrelated shops carry is a common commercial product; three can still be one shop's franchise.

**Acceptance:** a tenant who never touches the checkbox contributes nothing — assert it in a test that calls `SharedCatalogService::contribute()` for an opted-out tenant and expects zero rows.

## 1.3 Decide the LTD AI allowance

Migration `2026_08_04_000006_fix_null_ai_page_limits.php` sets managed tenants to `ai_pages_limit = 500`, `ai_queries_limit = 2500`. At correct model defaults that is ≈ **$2.96/tenant/month** — fine against a $36–129/month subscription, and unbounded against a one-time AppSumo payment.

- [ ] Set LTD plans explicitly in `PlanFeatureMatrixSeeder` — do **not** let them inherit 500/2500.
- [ ] Recommended: LTD gets a small managed allowance (e.g. 50 pages / 250 queries per month) with **BYOK for anything beyond**. A tenant on their own key costs nothing, forever.
- [ ] Surface BYOK prominently in the LTD onboarding, not buried in settings.

## 1.4 Write the dashboard ↔ assistant parity test

`AiController::executeFunction()`'s 8 tools were re-pointed at the Reckoner. Nothing yet proves they agree with the dashboard.

- [ ] Add `tests/tests/Feature/Reckoner/AssistantParityTest.php`: seed one tenant, then for **revenue, net profit, receivables and stock value**, assert the figure returned by the assistant tool equals the figure returned by `Reckoner::read()` for the same period, exactly.

This is the test that makes "one central calculation engine" a checkable claim rather than an assertion.

## 1.5 Wire the system manifest into CI

- [ ] Run `php artisan venqore:manifest` and commit `storage/app/system-manifest.json`.
- [ ] Add `php artisan venqore:manifest --check` to CI. It fails when the registries change and the manifest was not regenerated.
- [ ] Confirm `tests/tests/Feature/SystemManifestTest.php` passes.

---

# PART 2 — The AI Island

## 2.1 The problem

The current header has **four doors to one system**: the "Search anything" bar, the Growth Engine pill, the sparkle button, and the floating bubble bottom-right. Plus a clock that is always there whether wanted or not, and a notification bell that shows nothing — no count, no content — despite a working backend (`notifications` table, `NotificationController` with index / mark-read / mark-all-read / destroy).

Everything behind those four doors is one system with one face. The UI should say so.

## 2.2 The concept

**One pill, centred in the header. It is the only AI surface in the product, and it is also where notifications live.**

It behaves like an iPhone Dynamic Island: small at rest, growing when it has something to say, shrinking back when done. It is the single element that survives on fullscreen screens where the rest of the header hides.

**The inversion rule:** the island is **dark in light theme and light in dark theme** — always the inverse of the page. It is the one element on screen that is not the page's colour, which is what makes it read as a live surface rather than a form field.

## 2.3 What it replaces

| Removed | Becomes |
|---|---|
| "Search anything" input | The island's resting state |
| Growth Engine pill | Ambient insight line + a section in the open state |
| Sparkle (✨) button | Nothing — the island is it |
| Floating bubble (bottom-right) | Nothing — the island persists on fullscreen instead |
| Notification bell | The island's notification state |
| Clock pill | An opt-in header preference (§2.9) |

**Header after:** logo (left) · **island** (centre) · settings (right). That is all.

## 2.4 States

All widths are the pill's own; the header's height is a Layout Law shell constant and **must never change**. The island expands as an absolutely-positioned overlay beneath the header line, never by pushing layout.

**1 · Rest** — ~420px, single line, muted placeholder.
When Growth Engine has an unread insight, the placeholder is replaced by the highest-priority one, in muted text:
> *Cash dips below Rs 40,000 around Sep 18*

It rotates every ~8s if there are several, and falls back to `Search anything…` when there are none. This is how the Growth Engine surfaces — **ambient, not a button.** It earns attention by being useful rather than by occupying header space, and it makes the island feel alive at rest, which no badge can do.

**2 · Focused** — clicked or ⌘K. Widens to ~640px, caret appears, camera and mic icons become active. Below it an overlay panel opens:

- **Recent** — the user's last ~8 queries, clickable to re-run *(explicitly requested)*
- **Insights** — today's Growth Engine signals
- **Suggestions** — 3–4 contextual to the current screen

**3 · Results** — panel fills with grouped results as the user types: *Answers · Records · Screens · Actions · Help*. "Help" is where support lives; there is no separate support widget.

**4 · Working** — a slow shimmer along the pill's edge while a request is in flight. No spinner, no layout shift.

**5 · Notification** — expands to ~520px, shows an icon, one line of text, and up to one action:
> ⚠ *Subscription renews in 3 days* · **Manage**

Auto-collapses after 4s to a resting pill carrying a small count dot. Clicking the dot opens the notification list in the same panel.

**6 · Critical** — same as notification but does not auto-collapse; requires dismissal. Reserved for: subscription expiring, payment failed, sync broken, AI spend cap tripped, backup failed.

## 2.5 Behaviour rules — non-negotiable

These exist because an expanding element in the centre of the screen is exactly the thing that can ruin a transaction.

1. **Never auto-expand while the user is transacting.** On POS, invoice creation, purchase entry, payment or any screen with an open form and a dirty field, notifications **queue silently** — the dot updates, the island does not move. They present when the transaction completes or the user opens the island. The only exception is **Critical**, and even then it appears as a dot with a red tint, not an expansion.
2. **Never steal focus.** Expanding for a notification must not move keyboard focus or the caret. Only user-initiated opening (click / ⌘K) moves focus into the input. A cashier mid-quantity must not lose a keystroke.
3. **Overlay, never reflow.** The panel is `position: absolute` under the header. Header height is fixed. No page content moves, ever.
4. **One at a time.** Notifications queue; they never stack or interrupt each other. Max one expansion in flight.
5. **Respect `prefers-reduced-motion`.** Under it, all size transitions become opacity fades. No spring, no shimmer.
6. **Escape always collapses.** Click-outside always collapses. There is no state the island can be stuck in.

## 2.6 Motion

Use the existing design tokens — do not invent easing values:

- Expand / collapse: `--vq-ease-spring` (`cubic-bezier(.34, 1.56, .64, 1)`), 260ms
- Notification entry: `--vq-ease-spring-soft`, 220ms
- Insight text rotation: `--vq-ease-out`, 180ms crossfade
- Working shimmer: 1.6s linear, infinite, `opacity` only

## 2.7 Persistence on fullscreen

On POS, invoice, and any fullscreen surface the header hides — **the island does not.** It docks to the top centre, floating over the page at the same coordinates it occupied in the header, so it never appears to move between contexts.

This replaces the bottom-right bubble entirely. It is out of the way, always in the same place, and never in a corner.

## 2.8 Notifications — wire the existing backend

The backend exists and is unused by the header.

- [ ] Add `GET /api/notifications/summary` returning `{ unread_count, critical_count, latest: [...] }`, tenant- and user-scoped.
- [ ] Poll every 60s, or push over the existing Reverb/websocket setup if simpler.
- [ ] Classify each notification as `info | important | critical`. Only `critical` may bypass the transaction guard in §2.5.1.
- [ ] Wire mark-read and dismiss to the existing routes (`notifications.mark-read`, `notifications.mark-all-read`, `notifications.destroy`).
- [ ] Seed the classes that matter at launch: subscription expiring, payment failed, plan limit approaching, sync failure, backup failure, AI spend cap tripped.

## 2.9 Header preferences

Right side of the header is **one settings button**. Inside it:

- [ ] **Show clock in header** — default **off**, default **on** for cashier/POS roles (they work shifts and want it).
- [ ] **Theme** — the segmented control below.
- [ ] Optional future additions live here too, so the header never accumulates pills again.

## 2.10 Theme control

Reuse the animated segmented control from the V6 design system — a sliding indicator that springs into place under the active label.

- **Everywhere:** two segments — `Light` · `Dark`
- **On the V6 dashboard only:** three — `Light` · `Mesh` · `Dark`
- Indicator transition: `--vq-ease-spring`, 260ms
- Wire to the attributes the code already sets: `data-theme` (`light`/`dark`) and `data-bg` (`mesh`), persisted to `localStorage` key `vq-dashboard-v6-theme`

**Note:** mesh is already fully implemented — 79 CSS rules and a complete `:root[data-bg="mesh"]` block. If it looks missing, that is a stale `localStorage` value, not deleted code. Do not rebuild it.

## 2.11 Build order

1. Island shell — rest + focused + results, replacing the search bar. Ship with the sparkle button and Growth Engine pill removed.
2. Recent history and Growth Engine ambient line.
3. Notification states + the summary endpoint + the transaction guard.
4. Fullscreen docking; remove the floating bubble.
5. Header preferences and the segmented theme control.

Each step ships on its own. Do not do all five before the first review.

## 2.12 Acceptance

- [ ] Exactly **one** AI entry point exists in the app; no sparkle button, no Growth Engine pill, no floating bubble
- [ ] Header height never changes in any island state, on any viewport
- [ ] Typing in the POS quantity field while a notification arrives loses **zero** keystrokes and moves no focus
- [ ] With a dirty form open, a non-critical notification does not expand the island
- [ ] `prefers-reduced-motion` removes every size transition
- [ ] Escape and click-outside collapse from every state
- [ ] The island is present and identically positioned on POS fullscreen
- [ ] Notification count matches `NotificationController@index` unread count
- [ ] Theme control shows 2 segments off-dashboard, 3 on the V6 dashboard, and mesh renders
- [ ] Clock is hidden by default and appears when enabled in settings
