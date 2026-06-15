# VenQore — 10-Day Launch Plan
**Hard deadline:** Day 10 = code freeze. Day 11+ = soft launch (AppSumo / Product Hunt onboarding begins).

---

## Ground Rules

- **No new features** unless they're already on this list. If something new comes to mind during the 10 days, write it down in the "Parking Lot" at the bottom of this file — don't touch it now.
- **Dad's shop = your regression test environment.** Every day, after finishing dev work, go test the relevant feature live. If something breaks, fix it the same day before moving to the next item — don't let bugs stack up.
- **Data safety:** Nothing in this plan should touch/reset your dad's live data except the final spot-check (read-only) and the optional "fresh baseline" (which happens AFTER day 10, by agreement).
- Items are ordered by **risk** — the things that could silently corrupt money/data or block real users come first. If you run behind, the LATER days are the ones to compress or push into Fast-Follow, not the earlier ones.

---

## DAY 1 — Roles & Permissions, Part 1 (Backend Foundation)

**Why first:** This touches the most surface area (every controller, every menu item) and everything else (plan gating, fund security, etc.) builds on top of it. Get this right first so later days don't need rework.

**Tasks:**
1. Expand permission enforcement from the current 12 "legacy broad categories" (`$legacyMap` in `CheckPermissions.php`) to check all 45 granular keys properly. The 45 keys already exist in `config/permissions.php` and the UI (`Users.jsx` → `PERMISSION_CATEGORIES`) — the gap is purely in enforcement.
2. Implement the "Admin = everything except billing" rule:
   - `owner` role = all 45 permissions (already correct).
   - `admin` role = all 45 except `admin.billing_store` (already correct in config — just confirm it's actually enforced end-to-end now that granular checks are live).
3. Implement the UI flow you described: selecting a preset role (Admin/Manager/Cashier/etc.) auto-checks its associated permissions in the UI, but the underlying storage is always the `custom` permissions array on `tenant_users.permissions`. Selecting "Admin" pre-fills, then individual checkboxes can be unchecked/modified freely — saved as custom.
4. Add `admin.billing_store` as the ONE permission that is **never** assignable to anyone except the `owner` role — hard-block it in both the backend save logic and the UI (don't even render the checkbox for non-owners).

**Files involved:** `app/Http/Middleware/CheckPermissions.php`, `config/permissions.php`, `resources/js/Pages/Admin/Users.jsx`, `app/Models/User.php` (`getPermissionsAttribute`, `hasPermission`).

**Dad's shop test:** None yet — this is backend groundwork. Don't touch the manager's live account today.

---

## DAY 2 — Roles & Permissions, Part 2 + Security PIN Backend Gaps

**Tasks:**

**A. Finish role system:**
1. Test the new granular permission system using a NEW test user (not your manager yet) — assign a custom role with very specific permissions (e.g., POS checkout + sales view, but NOT settings, NOT reports.audit, NOT the Owner Daily Pulse). Confirm the menu AND the backend routes both respect this.
2. Once confirmed working, prepare (but don't yet execute) the migration plan for your manager: define the exact permission set you want him to have (Admin minus: admin panel access, Daily Pulse / insight reports, billing).

**B. Security PIN backend gaps (the bypassable funds routes the audit found):**
3. Add backend PIN verification directly inside `FundController.php` and `V3/FundController.php` for `add`, `remove`, `transfer`, `adjust` — don't rely on the frontend modal alone.
4. Fix `PartyController::bulkDestroy()` — the `passcode` field is validated but never actually checked; wire it to the real verification.
5. Unify the two passcode systems: system-settings updates currently check a separate `admin_passcode` from the settings table, while fund actions check `tenant_users.security_pin`. Pick ONE (recommend: `security_pin`, since it's per-user) and point both flows at it.
6. Add basic rate-limiting/lockout on `ProfileSecurityController::verifySecurityPin()` (e.g., lock for 5 minutes after 5 wrong attempts) to prevent brute-forcing.
7. Implement the "first-time popup" flow: if a user without a `security_pin` set tries an action that requires one, show a "set up your security PIN now" modal (using the existing `Profile/Edit.jsx` security-pin UI as the basis, just triggered contextually instead of requiring a settings visit).
8. Confirm the existing "change PIN via Profile + login password" flow satisfies your "reset with own credentials" requirement — if it works, no new reset flow needed; if it requires the OLD pin to change it, remove that requirement (login password is sufficient proof of identity).

**Files involved:** `app/Http/Controllers/FundController.php`, `app/Http/Controllers/V3/FundController.php`, `app/Http/Controllers/PartyController.php`, `app/Http/Controllers/ProfileSecurityController.php`, `resources/js/Components/SecurityPinModal.jsx`, `resources/js/Pages/Profile/Edit.jsx`.

**Dad's shop test:** Have the manager try a Fund action — confirm the PIN modal still appears and now ALSO confirm on the backend it can't be skipped (try a manual request if comfortable, just to confirm the block).

---

## DAY 3 — Charity Fix + Manager Role Migration (careful day — live account change)

**Tasks:**

**A. Charity feature (build properly, was never used so safe to rebuild):**
1. Fix `CharityController::add()` to call `AccountingService::createEntry()` like every other module — proper double-entry: DR Charity/Donation Expense, CR Cash/Bank. No more direct balance mutation.
2. Build the missing toggle: add a per-store setting (Settings page) "Enable Charity Donations feature" — off by default. When ON, the Charity option becomes visible to users with the relevant finance permission.
3. Test: toggle it on, make a small charity entry, confirm it shows correctly in Day Book, Trial Balance, and P&L (should reduce both cash and net profit by the same amount).

**B. Manager role migration (THE careful part):**
4. With the new granular system from Days 1-2 tested and working, log in as yourself (owner) on dad's shop and switch the manager's account from `admin` to a custom role with the permission set you defined yesterday (everything except admin panel, Daily Pulse/insight reports, billing — and obviously settings if you don't want him changing those either).
5. **Do this in person or while on a call with the shop**, during a quiet moment — if anything looks wrong, you can immediately revert him back to `admin` temporarily while you debug.
6. Walk through a normal day's actions as the manager (open POS, make a sale, add funds with his PIN, check what he can/can't see) to confirm the new role feels right in practice.

**Dad's shop test:** This whole day basically IS the dad's-shop test — the manager role switch + a full walkthrough of his daily tasks under the new role.

---

## DAY 4 — Barcode Bug Fix + Hide Untested/Deferred Features

**Tasks:**

**A. Barcode scan bug (confirmed: the "type a number to set last item's qty" shortcut is unused):**
1. Remove the `else if (results.length === 0 && /^\d+$/.test(val) && lastAddedItemId)` block in `Pos.jsx` (~L725-736) entirely — this is the code that misreads a second barcode as a quantity.
2. Fix the broken `searchInputRef` — attach it properly to the `<AsyncProductCombobox>` so the search field correctly refocuses after each scan (currently a no-op due to the ref never being passed down).
3. Test: scan item A, scan item B, scan item A again — confirm A's quantity increases by 1 and B is added correctly, with no quantity getting overwritten by barcode digits.

**B. Hide WooCommerce (everywhere, regardless of plan):**
4. Set `woocommerce` feature flag to `false` across ALL plan tiers in `PlanFeatureMatrixSeeder.php` / `plan_limits` (overriding the current Growth+/Business `true` values).
5. Remove the conditional in `OneGlanceLayout.jsx` (`isStarterOrLtd1 ? {...locked} : 'WooCommerce Sync'`) so the menu item is hidden unconditionally for now.

**C. Disable VenSynQ (same treatment):**
6. Set `VENSYNQ_ENABLED=false` in production `.env`. Confirm `VenSynQController.php` and any related menu items respect this flag and stay hidden.

**D. Cookbook — unlock + add real backend gating:**
7. Remove `locked: true` from the Cookbook menu item in `OneGlanceLayout.jsx`.
8. Add `PlanGate::enforce('cookbook')` to `CookbookController.php` (every action).
9. Add `'cookbook' => ['starter' => false, 'growth' => true, 'business' => true, ...]` to the plan feature matrix (Starter locked, everyone else gets it).
10. Test: confirm Cookbook is reachable from the top-bar nav (not sidebar, per your earlier note) and works end to end for a non-Starter test account; confirm a Starter test account gets the upgrade modal if they try the URL directly.

**Dad's shop test:** Barcode scanning — scan 5-10 different real products in quick succession at the actual POS terminal, mixing repeats and new items, confirm quantities are always correct.

---

## DAY 5 — Plan-Gating for Production, E-Invoicing, Bank Reconciliation, Marketing Campaigns, Invoice Reminders + Fund Management Unlock

**Tasks:**

**A. Apply the "Cookbook pattern" to 5 more features** (Starter/LTD-1 locked, everyone else allowed, real backend check added):
1. **Production (Manufacturing)** — add `PlanGate::enforce('production')` to `ProductionController.php`, add to feature matrix.
2. **E-Invoicing** — add `PlanGate::enforce('e_invoicing')` to `EInvoicingController.php`, add to feature matrix.
3. **Bank Reconciliation** — add `PlanGate::enforce('bank_reconciliation')` to `BankReconciliationController.php`, add to feature matrix.
4. **Marketing Campaigns** — add `PlanGate::enforce('marketing_campaigns')` to `MarketingCampaignController.php`, add to feature matrix.
5. **Invoice Reminders** — add `PlanGate::enforce('invoice_reminders')` to `InvoiceReminderController.php`, add to feature matrix. (Note: audit flagged this as "currently in stub status" — confirm what currently happens when this page is opened; if it's genuinely non-functional, consider whether it should stay `locked: true` in the UI for ALL plans for now, separate from the Starter-only gate, until it's actually built.)

**B. Fund Management — unlock for everyone:**
6. Remove `locked: true` from Fund Management in `OneGlanceLayout.jsx` — make it available on ALL plans including Starter.
7. Confirm `FundController.php` / `V3/FundController.php` routes are properly tenant-scoped (a user can only ever see/modify their OWN store's funds) — this matters more now that it's universally accessible.

**Dad's shop test:** Open Fund Management as the manager (under his new role from Day 3) and confirm he can still do what he's supposed to, nothing broke from the unlock.

---

## DAY 6 — Reports Hub: Plan-Tier Gating (43 Reports)

**Tasks:**
1. Build ONE config map (`config/plans.php` or a new `config/report_tiers.php`): `report_key => minimum_plan_tier`. Don't write 43 separate enforce calls — one shared map, one shared check function.
2. Apply the agreed split:
   - **Starter gets (~16):** Day Book Journal, Daily Sales Report, Sales Analytics Report, Transactions Log, Sales Orders History, Sale Order Items Detail, Inventory Valuation Report, Low Stock Alerts, Stock Movement Audit, Purchases History, Consolidated Expense Ledger, Partners Directory Statement, Owner Daily Pulse Console, **Profit & Loss**, **Cash Flow Statement**, **Tax Compliance Report**.
   - **Growth/Business+ gets the remaining ~27:** Balance Sheet, Trial Balance, Bank Statement, Loan Statements, Sale Aging Receivables, Bill-wise Profit Margins, Discount Leakage, Item-wise Discounts, Stock Summary by Category, Expiry Report, Stock Aging, Item Detail, Item-wise Profit, Item Category P&L, Expense by Category, Expense by Item, Tax Rate Breakdown, Customer Profitability, Item Report by Party, Party Report by Item, Sale/Purchase by Party, Sale/Purchase by Party Group, Day Book Drill-down, Visual Charts Analytics, and the remaining utility/system report views.
3. Wire this map into `ReportController.php` / `V3/ReportController.php` so that opening a report not included in the tenant's tier throws `PlanLimitException` (same 403 → UpgradeModal pattern as WooCommerce/Growth Engine).
4. Also hide locked report links in `ReportsHub.jsx` for Starter tenants (cosmetic, but pairs with the backend check).
5. Test with a Starter test account: confirm P&L/Cash Flow/Tax Compliance work, confirm Balance Sheet/Trial Balance show the upgrade prompt instead.

**Dad's shop test:** None needed — your dad's store should be on a tier that gets everything, so nothing changes for him. Just sanity-check his P&L still loads fine after the change.

---

## DAY 7 — Payments, Printing, Chat Widget, SmartCapture Final Check

**Tasks:**

**A. Lemon Squeezy — live test purchase:**
1. Enable Lemon Squeezy sandbox/test mode. Do ONE full test purchase with a test card on a throwaway test account.
2. Confirm the chain works: `subscription_created` webhook fires → `ProvisionTenantJob` runs → tenant gets `plan` + `status: active` + a `StoreLicense` record created.
3. Test a plan change (`subscription_updated`) and a cancellation (`subscription_cancelled`) on the same test subscription if time allows, to confirm `HandleSubscriptionUpdatedJob` / `HandleSubscriptionCancelledJob` behave correctly.

**B. A4 print template:**
4. Print one real A4 invoice end-to-end (thermal already confirmed working). Check VAT/tax totals, business letterhead, and layout match expectations.

**C. AI Chat widget — fix the PWA prompt z-index collision:**
5. The PWA install prompt (`z-[9999]`, `bottom-4 right-4`) sits exactly on top of the chat bubble (`z-[9998]`, `bottom-6 right-6`), completely blocking it. Fix: either lower the PWA prompt's z-index below the chat widget's, or reposition one of them (e.g., move the PWA prompt to `bottom-left` or make it dismiss/shrink after first view). This is almost certainly why the widget "wasn't showing" on the Business plan — the flag was correct, it was just covered.
6. Confirm: chat bubble now visible and clickable on a fresh session (where the PWA prompt would normally appear).

**D. SmartCapture — final verification pass:**
7. You said it tested "nearly perfect" — do one more full run-through: upload an invoice image, confirm AI extraction → product matching → confirmation flow works end to end, and (for non-Starter test account) confirm the human-escalation path triggers correctly when AI confidence is low.

**Dad's shop test:** Print an A4 invoice for a real sale. Open the website on a phone at the shop and confirm the chat bubble is visible/clickable.

---

## DAY 8 — Google Drive Backup & Restore (Full Test, Safely)

**Tasks:**
1. Complete the Google Drive OAuth connection flow for the first time on a TEST tenant (`Link Google Drive` button → consent screen → confirm `google_refresh_token` gets saved).
2. Run `php artisan backup:google-drive` (or click "Sync Now") — confirm it now finds the connected store and successfully uploads a backup (previously it exited early with "No stores found with Google Drive backups enabled" since nothing was connected).
3. **Set up the local test store** (per your plan): create a second local tenant, seed it with sample data.
4. Take the backup generated from your DAD'S real store (read-only — just generating a backup file doesn't touch his data) and RESTORE it into the local test store.
5. Verify: does the test store now correctly show all of dad's products, sales history, ledger balances, etc.? Spot-check a few numbers (total stock value, a recent sale) against the real store.
6. If restore has any issues, fix and re-test — all within the local test store, zero risk to production.

**Dad's shop test:** None directly — this is the local test store day. Just confirm the BACKUP step (step 2) ran cleanly against the real store without modifying anything (backup = read-only export).

---

## DAY 9 — Mobile Responsiveness: Tier 1 Critical Views (~25-30 pages)

**Tasks:** Go through the following pages on a real phone (or browser dev tools mobile view) and fix any layout breakage using the patterns already documented in your audit (grid stacking, table→card swap, floating bottom action bars):

1. **Auth/Onboarding (13 views):** Register, Login, Staff PIN Login, Accept Invite, Forgot/Reset Password, Verify Email, Confirm Password, Setup Wizard, Invite Accept/Invalid, Create/Join Store.
2. **Pricing page** (`Marketing/Pricing.jsx`).
3. **POS — all 4 views** (Standard, Senior Mode, Parked Sales drawer, Profit Sneak Peek) — this is the single most important screen.
4. **Executive Owner Dashboard** (`Admin/ExecutiveDashboard.jsx`).
5. **Cashier Dashboard** (`Dashboards/CashierDashboard.jsx`).
6. **Top reports for mobile:** Profit & Loss, Day Book, Stock Levels/Valuation, Sales Analytics, Owner Daily Pulse.

For each: check on a phone width (~375px), fix anything that overflows, doesn't stack, or has unreachable buttons. Don't aim for pixel-perfect — aim for "fully usable, nothing cut off or unreachable."

**Dad's shop test:** Pull up the POS, Executive Dashboard, and P&L report on an actual phone at the shop. Walk through making a sale entirely from a phone if possible.

---

## DAY 10 — Full Regression Day + Reconciliation Spot-Check + Buffer

**Tasks:**

**A. Morning — Reconciliation spot-check (the one you agreed to do):**
1. Compare VenQore's reported "Cash in Hand" balance against the actual cash in the drawer.
2. Pick 5-10 random products and compare VenQore's stock quantity against a quick physical count.
3. Note any discrepancies — if small/explainable (e.g., a sale mid-count), fine. If large/systemic, this is the one thing that might need emergency triage before launch.

**B. Full regression — run through EVERYTHING fixed in Days 1-9, in order, as different roles:**
4. As Owner: full POS sale, purchase with whole-bill discount (yesterday's fix, re-confirm), funds add/remove with PIN, Charity toggle on + test entry, P&L/Cash Flow/Tax reports.
5. As Manager (new role from Day 3): confirm permission boundaries — can do POS/sales/funds, cannot access admin panel/Daily Pulse/billing.
6. As a Starter test account: confirm Cookbook/Production/E-Invoicing/Bank Reconciliation/Marketing/Invoice Reminders are locked with upgrade prompts; confirm P&L/Cash Flow/Tax Compliance reports DO work; confirm Balance Sheet/Trial Balance/etc. show upgrade prompt.
7. As a Growth/Business test account: confirm everything from #6 is now unlocked.
8. Barcode: re-test scan sequence one more time on the real POS hardware.
9. Mobile: quick pass on the Tier 1 pages from Day 9 on a real phone.

**C. Buffer:**
10. Whatever broke in the regression pass — fix it now. This day exists specifically so you're not debugging on launch morning.

---

## GO / NO-GO CHECKLIST (end of Day 10)

- [ ] Role/permission system: granular enforcement working, manager successfully running on new custom role
- [ ] Security PIN: backend-enforced on all fund actions, unified passcode, first-time-setup popup working
- [ ] Charity: proper double-entry, toggle built and working
- [ ] Barcode: scan-scan-scan sequence correct on real hardware
- [ ] WooCommerce + VenSynQ: fully hidden, no plan shows them
- [ ] Cookbook, Production, E-Invoicing, Bank Reconciliation, Marketing Campaigns, Invoice Reminders: Starter locked (with real backend block), all others working
- [ ] Fund Management: available on all plans, tenant-scoped correctly
- [ ] Reports Hub: 43 reports correctly split by tier, backend-enforced
- [ ] Lemon Squeezy: live test purchase → plan activation confirmed
- [ ] A4 print: confirmed working
- [ ] AI chat widget: visible and clickable (PWA overlap fixed)
- [ ] SmartCapture: final pass confirmed working incl. human escalation
- [ ] Google Drive: OAuth connected, backup+restore proven on local test store
- [ ] Mobile Tier 1 (~25-30 pages): usable on phone
- [ ] Reconciliation spot-check: no major discrepancies (or discrepancies understood and explainable)

If everything above is checked → **go live on Day 11.**
If 1-2 items aren't done → assess: is it customer-facing on day 1, or invisible until a customer reaches that specific feature? Launch can proceed with a clearly-noted "fix this in week 1" item, as long as it's not a money/security issue.

---

## FAST-FOLLOW (Weeks 2-4 post-launch)

- **"Fresh baseline" reconciliation** with dad's shop: real physical stock count + cash count → new opening balances in VenQore, going forward.
- **Historical stock valuation:** build `inventory_batch_movements` ledger table so "stock value as of [past date]" becomes possible (currently only "right now" is supported).
- **SmartCapture multi-image upload** (limit: 5 images per scan, per your decision).
- **SmartCapture multilingual / handwritten OCR** support.
- **Staff login page** testing (low priority, you said this can wait).
- **Mobile Tier 2:** Sell/Purchase/Stock module list & create pages (the next ~40-50 most-used views).
- **Begin full V3 legacy migration** (the original 10-15 day plan): route-by-route, store-by-store, behind feature flags, using the "Parallel Run Auditing" approach — start with your own store since it's your live test environment.
- **Invoice Reminders:** if it was left in "stub" status on Day 5, prioritize finishing this.

---

## LONG-TERM ROADMAP

- **VenSynQ full build-out:** Amazon SP-API (approved), eBay, TikTok Shop multi-channel sync.
- **WooCommerce two-way sync:** proper testing once a real store needs it — including the Pipeline A/B accounting-gap fix (route Woo orders through `V3\SaleService::post()`).
- **Mobile Tier 3:** SuperAdmin panel, full Reports suite admin views, V3 next-gen admin pages, support/logs/system management (~60 views) — desktop-acceptable for now.
- **Full V3 cleanup:** delete 15+ legacy controllers once migration is complete and stable.
- **AppSumo / Product Hunt / G2 / Capterra listings** using the existing Copy Bible and five-phase category-leadership roadmap.

---

## PARKING LOT
*(Anything new that comes up during the 10 days — write it here, don't act on it now.)*

-
-
-
