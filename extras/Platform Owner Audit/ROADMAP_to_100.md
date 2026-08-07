# VenQore Platform Owner — The Road to 100/100

**A complete, sequenced, evidence-backed roadmap to make the Platform Owner (Super Admin) Command Center perfect in every dimension.**

> Companion to the audit (`VenQore_Platform_Owner_Audit.html` / `.docx`). This document turns every finding into an actionable, checkable task with file references, acceptance criteria, and a scoring rubric so you always know how far you are from 100/100.
>
> - **Prepared for:** Abdullah Hashmi
> - **Stack:** Laravel 12 · React 18 (Inertia) · MySQL · Vite
> - **Scope:** `/VenQore`, `/VenQore-login`, `app/Http/Controllers/{Admin,SuperAdmin}`, `resources/js/Pages/{SuperAdmin,Admin,PlatformOwner}`
> - **Rule:** Nothing here changes behavior silently. Every task ships behind tests and a clear "Definition of Done."

---

## 0. How to use this document

1. Work **top to bottom**. Phases are ordered by dependency and risk. Don't start Phase 2 until Phase 1's gate is green.
2. Each task is a checkbox. Check it only when its **Acceptance criteria** all pass.
3. Every phase ends with a **Phase Gate** — a short list that must be true before moving on.
4. The **Scoring Rubric** (Section 1) is the contract for "100/100." You are done when every dimension scores 10/10 and the Definition of Done (Section 8) is fully checked.
5. Effort sizing: **S** = ≤½ day · **M** = 1–2 days · **L** = 3–5 days · **XL** = 1–2 weeks.

---

## 1. The 100/100 Scoring Rubric

Ten dimensions, ten points each. "Perfect" = **100**. Current scores are my honest assessment from the audit.

| # | Dimension | What 10/10 looks like | Now | Target |
|---|-----------|-----------------------|:---:|:---:|
| 1 | **Financial correctness** | Revenue = real paid subscriptions; internal/demo excluded; computed server-side from one service | 3 | 10 |
| 2 | **Single source of truth (the Core)** | All KPIs/reports read from services; zero browser math; one price source | 3 | 10 |
| 3 | **Information architecture** | One shell, grouped nav, nothing orphaned, no duplication | 4 | 10 |
| 4 | **Monetization completeness** | Plans/coupons/trials/grace/regional fully editable & enforced | 6 | 10 |
| 5 | **Operations** | Demo, support, health, queues, webhooks, updates in one Ops center; demo survives deploys | 4 | 10 |
| 6 | **Testing & QA** | One-click categorized health check; CI gate | 3 | 10 |
| 7 | **Security & governance** | Role tiers, audit log, no browser-migrate, gated destructive actions | 4 | 10 |
| 8 | **UX & accessibility** | Keyboard-complete, consistent components, loading/empty states, responsive, a11y | 5 | 10 |
| 9 | **Performance & scale** | SQL aggregates, pagination, caching, no N+1, fast first paint | 5 | 10 |
| 10 | **Observability & docs** | Real activity/audit feed, metrics, runbooks, owner docs | 3 | 10 |
| | **TOTAL** | | **40** | **100** |

> **Headline:** the product *looks* ~80% done but *scores* ~40/100 because the two highest-weighted dimensions (money + single source of truth) are the weakest. The good news: most backends already work, so this is a **correctness + consolidation** program, not a rewrite.

---

## 2. Guiding principles (apply to every task)

1. **Core-first.** No screen computes business numbers. Screens *render* what a service returns. (Mirrors your store-side `LedgerService`/`FinancialReportingService`.)
2. **One price, one place.** The `plans` table is the only price source. Delete the hard-coded array and the `config/plans.php` fallback's role as a runtime source.
3. **Money is server-side and persisted.** No financial math in React. No `localStorage` ledgers.
4. **One shell.** Kill the tab-vs-sidebar split; every feature is a real route in one grouped layout.
5. **Exclude internal by default.** A new `is_internal` flag is honored everywhere money or counts are shown.
6. **Every destructive or money action is audited** and (optionally) passcode-gated.
7. **Ship behind tests.** Each task adds/updates a Pest test in the Testing Center category it belongs to.
8. **No silent failures.** Every form surfaces validation errors; every async action has loading + success + error states.

---

## 3. Target architecture

### 3.1 Layered model (the Core)

```
PRESENTATION   One shell · grouped sidebar · ⌘K palette · global search · real notifications · unified theme
      │         (thin Inertia pages — NO business math in the browser)
      ▼
SERVICES / THE CORE
      PlatformMetricsService   → stores, users, trends, churn, plan distribution
      PlatformRevenueService   → MRR, ARR, GMV, net (paid subs only, internal excluded)
      PlanPricingService       → single price resolver (USD + PKR) from `plans`
      SubscriptionService      → lifecycle from StoreLicense + LemonSqueezy jobs
      PlanRepository (exists)  → limits + tenant overrides
      LedgerService / FinancialReportingService (exist, store side)
      │         (single source of truth; internal-store rules live here)
      ▼
DATA   plans · plan_limits · plan_features · tenant_plan_overrides · coupons
       tenants(+is_internal) · store_licenses · payments · sales(GMV)
       pk_verifications(new) · platform_audit_logs(new) · platform_settings · users(+platform_role)
```

### 3.2 New information architecture (one shell, five groups)

```
VENQORE · Command Center
│
├─ ◎ Overview                         KPIs (Revenue vs GMV), trends, alerts, quick actions
│
├─ 👥 Customers
│   ├─ Stores                         (merge the 2 duplicate store screens)
│   ├─ Platform Users                 (merge the 2 duplicate user screens)
│   ├─ Tenant Overrides
│   ├─ Impersonation (+ audit log)
│   └─ 🇵🇰 PK Verifications            (new — CNIC review queue)
│
├─ 💳 Monetization
│   ├─ Platforms (product lines)
│   ├─ Plans & Limits                 (+ trial_days, is_ltd, archive)
│   ├─ Coupons & Promotions           (+ full edit + delete)
│   ├─ Revenue (paid)                 (server-side, internal excluded)
│   ├─ GMV / Merchant Volume          (clearly separated from revenue)
│   └─ AppSumo / LTD codes            (re-enable or remove dead routes)
│
├─ 🛠 Operations
│   ├─ Support Inbox                  (merge V1 + Vena + Digital-Hub chats)
│   ├─ Live Chat / Agent Inbox
│   ├─ Chatbot (Vena) Settings
│   ├─ Demo & Sandbox                 (+ snapshot/restore)
│   ├─ Broadcasts / Newsletter
│   └─ Digital Products
│
├─ ⚙ System
│   ├─ Health & Errors
│   ├─ Testing Center
│   ├─ Jobs & Queues (Horizon)
│   ├─ Webhooks & Integrations
│   ├─ Storage
│   ├─ Feature Flags
│   ├─ Updates & Version
│   └─ Platform Settings
│
└─ 🔐 Profile & Security              password · login PIN · action passcode
```

### 3.3 Data-model changes (full list — see each task for detail)

| Change | Table | Purpose | Task |
|--------|-------|---------|------|
| Add `is_internal` (bool, default false) | `tenants` | Exclude owner/internal/test stores from money & counts | T1.1 |
| Backfill flag on your own store(s) | `tenants` | Make exclusion real | T1.2 |
| New table `platform_audit_logs` | new | Audit impersonation, money, destructive actions | T7.3 |
| New table `pk_verifications` | new | CNIC verification + one-account-per-ID | T3.7 |
| New table `platform_settings` (or scope existing `settings`) | settings | Real platform config store | T4.6 |
| Add `is_ltd`, `trial_days` to plan create/update | `plans` (cols exist) | Make LTD/trial editable | T3.3 |
| Persist equity/partners | new `platform_equity_*` | Replace localStorage ledger | T1.6 |

---

## 4. The phased roadmap

Legend: `[P0]` launch-blocker · `[P1]` fix soon · `[P2]` polish · effort **S/M/L/XL**.

---

### Phase 0 — Pre-flight & safety net `(do first, half a day)`

- [ ] **T0.1 — Branch & staging** `[P0]` `S` — Create a `platform-hardening` branch; deploy a staging copy pointed at a **clone** of `venqore_pos`. Never test destructive changes on production.
- [ ] **T0.2 — Full backup** `[P0]` `S` — Snapshot the DB and `storage/`. Confirm restore works once.
- [ ] **T0.3 — Baseline the Testing Center** `[P0]` `S` — Run the existing Smoke suite (`platform.smoke-tests.run`) and record current pass/fail as the baseline you must not regress.
- [ ] **T0.4 — Freeze the numbers** `[P0]` `S` — Screenshot the current dashboard (the $52k volume, MRR, plan distribution) so you can prove the before/after of the revenue fix.

**Phase Gate 0:** staging works, backup restored once, baseline tests recorded.

---

### Phase 1 — P0: Financial correctness & the Core `(the launch blockers)`

This phase alone moves dimensions **1, 2, and part of 7** from red to green. It is the most important phase in the document.

#### T1.1 — Add an `is_internal` flag to tenants `[P0]` `S`
**Why:** There is no way to exclude your own/internal/test stores from money or counts — the root of the $52k bug. Today the only filter is `is_demo`.
**Files:** new migration; `app/Models/Tenant.php` (`$fillable`, `$casts`).
**Steps:**
1. Migration: `ALTER TABLE tenants ADD is_internal TINYINT(1) NOT NULL DEFAULT 0 AFTER is_demo;`
2. Add `'is_internal'` to `$fillable` and `'is_internal' => 'boolean'` to `$casts`.
3. Add a query scope `scopeBillable($q)` → `$q->where('is_demo',false)->where('is_internal',false)`.
**Acceptance:**
- [ ] `Tenant::billable()` excludes demo + internal in one place.
- [ ] Migration is incremental (no data loss); rolls back cleanly.

#### T1.2 — Flag your own/internal stores `[P0]` `S`
**Why:** The flag is useless until your store is marked.
**Steps:** Add a toggle on the Stores screen ("Internal / non-billable") + a one-time tinker/seed to set `is_internal=true` on your account's tenant(s).
**Acceptance:**
- [ ] Your personal store shows an "Internal" badge and is excluded from all KPIs.

#### T1.3 — Create `PlatformRevenueService` (server-side money) `[P0]` `L`
**Why:** Money must be computed once, on the server, from real records — not hard-coded and not in the browser.
**Files:** new `app/Services/Platform/PlatformRevenueService.php`; consumed by `SuperAdminController@dashboard`.
**Data it reads:** `store_licenses` (status/active, `valid_until`), `tenants` (`lemon_squeezy_subscription_id`, `subscription_ends_at`, plan, status), priced via **`PlanPricingService`** (T1.4). Excludes `Tenant::billable()` negatives.
**Methods:**
- `mrr()` — sum of monthly-equivalent price of **active, paid** subscriptions (has a `lemon_squeezy_subscription_id` **or** a valid non-comp `StoreLicense`).
- `arr()` = `mrr() * 12`.
- `gmv($period)` — sum of `sales.total` for billable tenants (clearly **not** revenue).
- `netRevenue()` — gross minus gateway fees & refunds (server-side, configurable rate from `platform_settings`).
- `planDistribution()` — count + MRR per plan from the `plans` table.
**Acceptance:**
- [ ] Dashboard MRR/ARR come **only** from this service.
- [ ] Manually-activated stores with **no** payment record are **not** counted as revenue.
- [ ] Demo + internal excluded everywhere.
- [ ] A Pest test asserts: seed 1 paid + 1 internal + 1 demo + 1 comp → MRR counts exactly the paid one.

#### T1.4 — Create `PlanPricingService` (one price source) `[P0]` `M`
**Why:** Three disagreeing price sources (the hard-coded `['starter'=>19,...]` array in `SuperAdminController:39`, `config/plans.php`, and the `plans` table). Editing a plan price changes nothing on the dashboard.
**Steps:**
1. New `PlanPricingService::monthly($planSlug,$currency)` reads the `plans` table (`price_monthly`/`price_monthly_pkr`, annual→/12, lifetime→amortized policy).
2. **Delete** the hard-coded `$planPrices` array in `SuperAdminController`.
3. Make `config/plans.php` a **seed-only** fallback (used at first boot, never as a live price).
**Acceptance:**
- [ ] Changing a price in the Plans UI immediately changes dashboard MRR.
- [ ] Grep shows **zero** hard-coded plan prices in controllers/JSX.

#### T1.5 — Split "Revenue" vs "GMV" in the UI `[P0]` `M`
**Why:** The "Platform Volume" card (`Dashboard.jsx:3019`) is merchant GMV mislabeled as money you earn.
**Steps:** Two distinct tiles: **"MRR / Revenue (paid)"** and **"Platform GMV (merchant volume)"**, each with a tooltip ("excludes internal & demo"). Remove any implication that GMV is your income.
**Acceptance:**
- [ ] No screen labels GMV as "revenue."
- [ ] Both tiles read from `PlatformRevenueService`.

#### T1.6 — Move the Revenue tab math server-side; kill the localStorage ledger `[P0]` `L`
**Why:** `Dashboard.jsx:1121–1184` computes P&L in React; `:1578` stores partner equity in `localStorage` — not a system of record.
**Steps:**
1. Move gross/net/ARR/margin math into `PlatformRevenueService`.
2. Persist partners & equity drawings in new tables (`platform_partners`, `platform_equity_drawings`) with server endpoints; remove all `localStorage` financial state.
3. The React tab becomes a **renderer** of service output.
**Acceptance:**
- [ ] Clearing browser storage does not change any financial figure.
- [ ] Two devices show identical numbers.
- [ ] Equity drawings are auditable rows in the DB.

#### T1.7 — Remove/secure the browser migration routes `[P0]` `S`
**Why:** `GET /VenQore/run-migrations` runs DB migrations from a URL — and it's declared **twice** (`web.php:359` and `:562`).
**Steps:** Delete both; if a manual trigger is truly needed, make it an artisan command or a POST behind the action-passcode + CSRF, logged to the audit table.
**Acceptance:**
- [ ] No GET route runs migrations.
- [ ] Only one migration path exists (the Updater / CLI).

#### T1.8 — Fix the `/VenQore-login` PIN keyboard `[P0]` `S`
**Why:** Your example, confirmed. PIN mode (`PlatformOwner/Login.jsx:219,261–271,420–457`) has on-screen buttons only — no `keydown` listener, no input — so the physical keyboard, Backspace, and Enter do nothing. The fix already exists in `PasscodeModal.jsx:21–51` and `SecurityPinModal.jsx:32–51`.
**Steps:**
1. Add a `useEffect` keydown listener: digits → `handlePinKey(d)`, `Backspace` → `handlePinKey('del')`, `Enter` → `submitPin()`, with cleanup.
2. Autofocus the PIN area when PIN mode mounts; add a visually-hidden `inputMode="numeric"` input for mobile.
3. Auto-submit on the 4th–8th digit per your policy.
**Acceptance:**
- [ ] Typing digits fills the dots; Backspace deletes; Enter submits.
- [ ] Works on desktop + mobile; on-screen keypad still works.

**Phase Gate 1 (LAUNCH-READY money):** dashboard shows your real revenue (≈ correct, your own store excluded); zero browser financial math; no browser-migrate route; PIN keyboard works. Dimensions 1 & 2 ≥ 9/10.

---

### Phase 2 — Structural unification (one shell, real IA) `[P1]`

#### T2.1 — Adopt one Platform shell `[P1]` `L`
**Why:** Two shells: `Dashboard.jsx` uses `OneGlanceLayout` (store layout) with 9 tabs; everything else uses `SuperAdminLayout` with 9 sidebar links.
**Steps:** Build `PlatformLayout.jsx` (grouped collapsible sidebar from Section 3.2) honoring the global `ThemeContext`. Wrap **all** platform pages in it. Retire `OneGlanceLayout` from the platform area.
**Acceptance:**
- [ ] Every platform screen shares one sidebar + header.
- [ ] Theme toggle works consistently (no hard-coded dark).

#### T2.2 — Split the 3,117-line Dashboard into routes `[P1]` `L`
**Why:** A single mega-component holds Overview/Stores/Users/Revenue/Support/Feed/Demo/VenSynQ/Settings tabs.
**Steps:** Extract each tab into its own Inertia page/route under the new shell; share components (KPI card, DataTable). Delete dead tab-routing code.
**Acceptance:**
- [ ] No file over ~600 lines in the platform pages.
- [ ] Deep links work (`/VenQore/revenue`, `/VenQore/stores`, …).

#### T2.3 — Merge duplicate Stores & Users `[P1]` `M`
**Why:** Stores and Users each exist twice (sidebar page + dashboard tab) with different actions split across copies.
**Steps:** One Stores screen with **all** actions (suspend/activate/extend/trash/restore/purge/feature-flag/impersonate); same for Users. Delete the duplicate.
**Acceptance:**
- [ ] Exactly one Stores screen and one Users screen.
- [ ] Every previously-scattered action is present in the merged screen.

#### T2.4 — Reclaim the orphan pages into the nav `[P1]` `S`
**Why:** Health, Agent Inbox, Chatbot Settings, Webhooks, Updater are reachable only by URL.
**Steps:** Add them to the grouped sidebar (Operations / System) per Section 3.2.
**Acceptance:**
- [ ] Zero features reachable only by typing a URL.

#### T2.5 — Global header utilities `[P1]` `M`
**Steps:** Add global search, a ⌘K command palette (jump to any screen + quick actions like "extend trial", "create plan", "impersonate"), and a real notifications dropdown (open errors, new contacts, failed payments).
**Acceptance:**
- [ ] ⌘K opens anywhere; search finds stores/users/plans; bell lists real, clickable events.

**Phase Gate 2:** one shell, no duplicate or orphan screens, ⌘K + search + notifications live. Dimension 3 ≥ 9/10.

---

### Phase 3 — Monetization completeness `[P1]`

#### T3.1 — Surface plan-create validation & the Platform dependency `[P1]` `S`
**Why:** Plan creation 422s silently when no Platform exists (`platform_id` is required and the drawer defaults to `platforms[0]`).
**Steps:** If no Platform exists, show an inline "Create your first Platform" step before the plan form; render all validation errors prominently in the drawer.
**Acceptance:**
- [ ] Creating a plan with zero platforms gives a clear guided message, not a silent failure.

#### T3.2 — Persist `is_ltd` & `trial_days` on create/update `[P1]` `S`
**Why:** `PlanController@store/@update` never write `is_ltd`/`trial_days`, so LTD plans aren't counted as LTD and trials aren't editable.
**Steps:** Add both to validation + the form; set `is_ltd=true` automatically when `type==='ltd'`.
**Acceptance:**
- [ ] An LTD plan created in the UI is counted as LTD on the dashboard; trial length is editable.

#### T3.3 — Plan archive (not just active/visible) `[P2]` `S`
**Steps:** Add `archived_at` (soft state); archived plans are hidden from signup, kept for history, and excluded from "active plans" counts.
**Acceptance:**
- [ ] You can archive a plan without deleting it; existing tenants unaffected.

#### T3.4 — Coupons: full edit + delete `[P2]` `S`
**Why:** `CouponController@update` only edits a few fields; there's no delete.
**Steps:** Allow editing code/type/value/scope/limits (guard against changing a code that's already redeemed); add soft-delete + a redemptions view.
**Acceptance:**
- [ ] Coupons can be fully edited and safely removed; redemption history preserved.

#### T3.5 — Fix `extendTrial` downgrade bug `[P1]` `S`
**Why:** `SuperAdminController@extendTrial:386–396` forces `status='trial'`, which can demote a paying store.
**Steps:** Only set trial status if the store is currently trial; otherwise just push `trial_ends_at`/`grace_ends_at`. Log the change to the audit table.
**Acceptance:**
- [ ] Extending an active paid store never changes it to "trial."

#### T3.6 — Grace-period policy UI `[P2]` `M`
**Steps:** Expose grace settings (Tenant has `grace_ends_at`/`limit_grace_ends_at`) as plan-level policy in the Plans editor; enforce via `PlanRepository`.
**Acceptance:**
- [ ] Grace length is configurable per plan and enforced.

#### T3.7 — Pakistan CNIC verification (gated regional pricing) `[P1]` `L`
**Why:** PKR pricing is granted by IP/Cloudflare header + a `geo_country_override` session switch — VPN-gameable. You want **one account per ID card**.
**Steps:**
1. **Schema:** new `pk_verifications` (`id, tenant_id, user_id, cnic_hash (unique), phone, image_front_path, image_back_path, status [pending|approved|rejected], reviewed_by, reviewed_at, created_at`).
2. **Signup step:** when a PK/PKR plan is chosen, require CNIC number (13-digit checksum), `+92` phone with **OTP**, and front/back CNIC images (stored **private**; keep only a **hash** of the CNIC for uniqueness).
3. **Uniqueness:** unique index on `cnic_hash` → "One account may be created per CNIC."
4. **Review queue:** Customers → **PK Verifications** (pending/approve/reject); optional OCR pre-check.
5. **Entitlement:** PKR checkout unlocks only when `status=approved`; otherwise USD only. Region heuristic (IP) becomes a *hint*, not the gate.
**Acceptance:**
- [ ] A second signup with the same CNIC is blocked.
- [ ] PKR pricing is impossible without an approved verification.
- [ ] Raw ID images are not publicly accessible; only the hash is queryable.

#### T3.8 — AppSumo: decide & act `[P2]` `S`
**Why:** Full feature shipped but every route `abort(404)` behind `if(true)` (`web.php:382–394`).
**Steps:** Either re-enable behind a feature flag, or remove the dead routes/pages. No dead-but-present code at launch.
**Acceptance:**
- [ ] AppSumo is either fully working or fully removed — nothing half-present.

**Phase Gate 3:** plans/coupons/trials/grace fully editable & enforced; regional pricing gated by verified CNIC. Dimension 4 ≥ 9/10.

---

### Phase 4 — Operations Center `[P1]`

Bring every operational capability into one **Operations** group (and **System** for infra). Most backends already exist — this is consolidation + two new pieces.

#### T4.1 — Demo snapshot & restore (survives deploys) `[P1]` `L`
**Why:** The Updater is safe (incremental migrate), but a full install/`migrate:fresh` path or a manual deploy can wipe the demo, and there's no snapshot/restore. You want the demo to *stay*.
**Steps:**
1. Add `demo:snapshot` (dumps the demo tenant's rows to a versioned file in `storage/demo-snapshots/`) and `demo:restore` commands.
2. Hook `demo:restore` into the **post-update** step of `UpdaterController` so a fresh deploy auto-restores the demo if missing.
3. Protect the demo tenant with `is_golden_master` (already exists) + a guard that blocks accidental deletion.
**Acceptance:**
- [ ] After a simulated deploy on staging, the demo store is intact (auto-restored if needed).
- [ ] A one-click "Reset demo to golden master" works from Operations → Demo & Sandbox.

#### T4.2 — Unify the three support inboxes `[P1]` `L`
**Why:** Support is split across V1 tickets (`platform.tickets.*`), Vena chat tickets (`platform.vena.tickets`), and Digital-Hub chats.
**Steps:** One **Support Inbox** with a source filter (V1 / Vena / Digital), shared reply/status/assign UI; keep the underlying controllers but present one screen.
**Acceptance:**
- [ ] All tickets/chats are triaged from a single screen with consistent actions.

#### T4.3 — Health & Errors in the nav `[P1]` `S`
**Steps:** Move `SuperAdmin/Health/*` into System → Health. **Remove** the mtime-based `detectFixes()` auto-resolver (`SuperAdminController:544–574`) or relabel it clearly as a heuristic; false "resolved" states erode trust.
**Acceptance:**
- [ ] Errors/contacts are in the nav; no error is auto-marked resolved by file timestamps.

#### T4.4 — Jobs/Queues & Webhooks panels `[P1]` `M`
**Steps:** Embed Horizon (or a status widget) under System → Jobs & Queues; give Webhooks log a first-class screen with retry + payload view.
**Acceptance:**
- [ ] Queue depth, failed jobs, and recent webhooks are visible without leaving the shell.

#### T4.5 — Storage panel `[P2]` `M`
**Steps:** New System → Storage: per-tenant + total storage usage (uploads, backups, demo snapshots), with cleanup actions.
**Acceptance:**
- [ ] Owner can see and reclaim storage.

#### T4.6 — Real Platform Settings store `[P1]` `M`
**Why:** The "Settings" tab mostly holds a client-side PKR/USD rate. Platform config should be a real, server-persisted store.
**Steps:** Use the global `settings` table (tenant_id = null, as VenSynQ already does) or a `platform_settings` table: FX rate, fee rates, grace defaults, feature flags, support routing.
**Acceptance:**
- [ ] FX/fee rates used by `PlatformRevenueService` come from the DB, editable in Settings, cached + invalidated on save.

#### T4.7 — Updates & Version inside the shell `[P1]` `S`
**Steps:** Surface the `/updater` flow (and current version + history) under System → Updates; keep `UpdaterLock` middleware.
**Acceptance:**
- [ ] Owner can check version, see history, and run an update from the Command Center.

**Phase Gate 4:** demo survives deploys; one support inbox; health/jobs/webhooks/storage/updates all in-nav. Dimension 5 ≥ 9/10.

---

### Phase 5 — Testing Center (one-click platform health) `[P1]`

Grow the existing smoke runner (`SmokeTestController` + `SmokeTestRunner.jsx`) from one suite into a categorized health board.

#### T5.1 — Categorized suites `[P1]` `L`
**Steps:** Tag Pest tests into suites: **Financial integrity** (ledger balance, FIFO, the new `PlatformRevenueService` rules), **Tenant isolation**, **Billing & coupons**, **Auth & permissions** (incl. PIN), **Infra** (queue/mail/webhook), **Smoke** (live, read-only).
**Acceptance:**
- [ ] Each category runs independently and reports pass/fail with streamed log.

#### T5.2 — One-button full health check + aggregate banner `[P1]` `M`
**Steps:** "Run full health check" runs all categories; a single green/red banner summarizes readiness.
**Acceptance:**
- [ ] One click → overall healthy/not-healthy verdict; drill into any category.

#### T5.3 — CI gate `[P2]` `M`
**Steps:** Run the non-live suites in CI on every push; block deploy on red. Keep live smoke tests strictly read-only on `venqore_pos` (never `RefreshDatabase`, per your DB policy).
**Acceptance:**
- [ ] A failing financial/isolation test blocks deploy.

**Phase Gate 5:** one-click categorized health check; CI blocks on red. Dimension 6 ≥ 9/10.

---

### Phase 6 — UX & accessibility polish `[P1]/[P2]`

#### T6.1 — Keyboard everywhere `[P1]` `M`
**Steps:** Audit every modal/form for: Enter submits, Esc closes, logical tab order, autofocus on open, and (for code/PIN inputs) physical-keyboard support. (PIN login is T1.8; sweep the rest.)
**Acceptance:**
- [ ] Every dialog passes a keyboard-only walkthrough.

#### T6.2 — One reusable DataTable `[P1]` `L`
**Steps:** Build a shared table (search, filters, sort, pagination, bulk select, empty + loading + error states) and use it for Stores, Users, Coupons, Plans, Tickets.
**Acceptance:**
- [ ] All list screens share one table with consistent behavior and skeleton loaders.

#### T6.3 — Consistent create/edit drawers + visible validation `[P1]` `M`
**Acceptance:**
- [ ] Every create/edit uses the same drawer pattern; server validation errors always render inline.

#### T6.4 — Custom confirm modals (replace native `confirm()`) `[P2]` `S`
**Acceptance:**
- [ ] No native `confirm()`/`alert()` in the platform area; destructive actions use a branded modal with typed confirmation for purge/delete.

#### T6.5 — Empty & loading states `[P2]` `M`
**Acceptance:**
- [ ] Every screen has a branded empty state with a primary action and a skeleton loader while fetching.

#### T6.6 — Accessibility pass (WCAG AA) `[P2]` `M`
**Steps:** Focus rings, ARIA labels, 4.5:1 contrast, responsive down to tablet, prefers-reduced-motion.
**Acceptance:**
- [ ] Passes an automated a11y audit (e.g., axe) with no serious violations.

**Phase Gate 6:** keyboard-complete, shared components, consistent states, AA accessible. Dimension 8 = 10/10.

---

### Phase 7 — Security & governance `[P1]`

#### T7.1 — Role tiers (Owner / Admin / Support) `[P1]` `L`
**Why:** Access is a single `is_platform_admin` boolean; `platform_role` exists but is unused.
**Steps:** Define roles + a policy/gate map: **Owner** (money, plans, delete, settings, equity), **Admin** (stores/users/support/overrides, no money/settings), **Support** (inbox, audited impersonation, read-only KPIs). Enforce in middleware + UI.
**Acceptance:**
- [ ] A Support user cannot see revenue or change plans; enforced server-side, not just hidden.

#### T7.2 — Action-passcode-gate sensitive actions `[P1]` `S`
**Steps:** Require the action passcode (already built: `setActionPasscode`) for purge, plan delete, impersonation, equity changes, updates.
**Acceptance:**
- [ ] Each sensitive action prompts for the passcode and logs the attempt.

#### T7.3 — Platform audit log `[P1]` `M`
**Steps:** New `platform_audit_logs` (actor, action, target, before/after, ip, at). Replace the 2-query "Activity Feed" (`buildActivityFeed:161–188`) with a real, queryable log. Record impersonation start/end, money edits, suspends, deletes, plan/coupon changes.
**Acceptance:**
- [ ] Every privileged action appears in an immutable, filterable log.

#### T7.4 — Harden auth surface `[P1]` `S`
**Steps:** Keep the existing rate limiting; remove browser-migrate (T1.7); ensure impersonation is reversible, time-boxed, and audited; verify CSRF on all POSTs.
**Acceptance:**
- [ ] Security sweep passes; impersonation always ends cleanly and is logged.

**Phase Gate 7:** role tiers enforced, sensitive actions gated + audited, real audit log. Dimension 7 = 10/10, Dimension 10 ≥ 8/10.

---

### Phase 8 — Performance & scale `[P2]`

#### T8.1 — SQL aggregates instead of in-memory collections `[P1]` `M`
**Why:** `SuperAdminController@dashboard` does `Tenant::withTrashed()->get()` then filters/sums in PHP (`:35–48`) — loads every tenant per page view.
**Steps:** Push counts/sums into SQL (`selectRaw`, `groupBy`) inside `PlatformMetricsService`; only fetch what each card needs.
**Acceptance:**
- [ ] Dashboard issues a handful of aggregate queries, not a full-table load.
- [ ] `total_stores` excludes trashed (today it counts them via the `withTrashed` set, `:110`).

#### T8.2 — Cache KPIs `[P2]` `S`
**Steps:** Cache the Overview KPI payload (short TTL) and invalidate on relevant writes (new store, plan change, payment webhook).
**Acceptance:**
- [ ] Overview first paint is fast and consistent; cache busts on change.

#### T8.3 — Kill N+1s & paginate everything `[P2]` `M`
**Steps:** Eager-load relations on Stores/Users/Coupons; ensure every list is paginated server-side.
**Acceptance:**
- [ ] No N+1 in the platform area (verify with the query log / Telescope).

**Phase Gate 8:** dashboard is query-light, cached, paginated. Dimension 9 = 10/10.

---

### Phase 9 — Observability & docs `[P2]`

- [ ] **T9.1 — Real activity feed** `[P1]` `S` — Replace the hand-built feed with the audit log (T7.3) + system events (failed payments, churn, errors).
- [ ] **T9.2 — Owner runbook** `[P2]` `M` — Short docs: "How revenue is calculated," "How to add a plan/coupon," "How PK verification works," "How to restore the demo," "What each test category covers."
- [ ] **T9.3 — Metrics/alerts** `[P2]` `M` — Alert the owner on: payment failures spike, error-rate spike, queue backlog, failed deploy.

**Phase Gate 9:** real feed + runbooks + alerts. Dimension 10 = 10/10.

---

### Phase 10 — Launch readiness & sign-off `[P0 gate]`

- [ ] **T10.1** — Run the full Testing Center → all categories green.
- [ ] **T10.2** — Re-verify the revenue number against a manual calculation on staging (paid subs only).
- [ ] **T10.3** — Security sweep: no browser-migrate, roles enforced, sensitive actions gated + audited.
- [ ] **T10.4** — Keyboard + a11y walkthrough of every screen.
- [ ] **T10.5** — Backup/restore rehearsal; demo snapshot/restore rehearsal.
- [ ] **T10.6** — Score every rubric dimension; confirm **100/100** via Section 8.
- [ ] **T10.7** — Tag a release; record the version in Updates & Version.

**Phase Gate 10 = GO/NO-GO.** Ship only when Section 8 is fully checked.

---

## 5. Cross-cutting summaries

### 5.1 New migrations (incremental, MySQL — never `migrate:fresh` on prod)

```
2026_07_xx_add_is_internal_to_tenants            (T1.1)
2026_07_xx_create_platform_partners              (T1.6)
2026_07_xx_create_platform_equity_drawings       (T1.6)
2026_07_xx_add_archived_at_to_plans              (T3.3)
2026_07_xx_create_pk_verifications               (T3.7)
2026_07_xx_create_platform_audit_logs            (T7.3)
2026_07_xx_create_platform_settings (or reuse settings)  (T4.6)
```
> After adding/renaming any route, run `php artisan ziggy:generate` (per project convention) and `php artisan optimize:clear`.

### 5.2 New services (the Core for the platform layer)

| Service | Responsibility | Replaces |
|---------|----------------|----------|
| `PlatformRevenueService` | MRR/ARR/GMV/net, paid-only, internal-excluded | hard-coded array + browser math |
| `PlanPricingService` | single USD/PKR price resolver from `plans` | 3 disagreeing price sources |
| `PlatformMetricsService` | stores/users/trends/churn via SQL | in-memory collection filtering |
| `SubscriptionService` | lifecycle over `StoreLicense` + LS jobs | scattered status logic |

---

## 6. Master sequencing & milestones

| Milestone | Phases | Effort (rough) | Outcome |
|-----------|--------|:---:|---------|
| **M1 — Money is true** (launch-critical) | 0 → 1 | ~1 week | Correct revenue, server-side Core, PIN fixed, no browser-migrate |
| **M2 — One cohesive product** | 2 → 3 | ~1.5 weeks | One shell, no duplicates/orphans, full monetization + CNIC gate |
| **M3 — Operable & tested** | 4 → 5 | ~1.5 weeks | Ops center, demo survives deploys, one-click health |
| **M4 — Premium & safe** | 6 → 7 | ~1.5 weeks | Keyboard/a11y, roles, audit log |
| **M5 — Fast & launch-ready** | 8 → 10 | ~1 week | Performance, observability, sign-off at 100/100 |

> Dependencies: M1 must finish before M2 (Core feeds every screen). Testing (Phase 5) can start in parallel once the Core exists. Roles (Phase 7) should land before any non-owner admin gets access.

---

## 7. Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|:---:|:---:|------------|
| Revenue refactor changes numbers unexpectedly | Med | High | Freeze before/after (T0.4); Pest assertions (T1.3); verify on staging clone |
| `is_internal` mis-flagged → wrong exclusions | Low | High | Badge + audit; review flagged list before launch |
| CNIC images = sensitive PII | Med | High | Private storage, hash-only uniqueness, access-logged, retention policy |
| Splitting Dashboard breaks deep links | Med | Med | Keep redirects from old tab URLs; Pest route tests |
| Demo wiped by a future fresh-deploy | Med | Med | Snapshot + auto-restore (T4.1) + golden-master guard |
| Role enforcement only hides UI (not server) | Med | High | Enforce in middleware/policies; test as each role |

---

## 8. Definition of Done — the 100/100 checklist

You are at **100/100** only when **every** box below is checked.

**Financial correctness (10)**
- [ ] Dashboard revenue = real paid subscriptions only (verified vs manual calc).
- [ ] Your own/internal/demo/test stores excluded everywhere.
- [ ] "Revenue" and "GMV" are separate, correctly labeled tiles.

**Single source of truth (10)**
- [ ] All KPIs come from services; zero financial math in React.
- [ ] One price source (`plans`); hard-coded array deleted.
- [ ] No `localStorage` financial state anywhere.

**Information architecture (10)**
- [ ] One shell; no tab-vs-sidebar split.
- [ ] No duplicated screens; no URL-only orphan pages.

**Monetization (10)**
- [ ] Create/edit/duplicate/archive/delete plans incl. `is_ltd`/`trial_days`/grace.
- [ ] Coupons fully editable + deletable; redemptions visible.
- [ ] PKR pricing gated by approved CNIC; one account per CNIC enforced.

**Operations (10)**
- [ ] Demo survives deploys (snapshot/auto-restore).
- [ ] One support inbox; health/jobs/webhooks/storage/updates in-nav.

**Testing (10)**
- [ ] One-click categorized health check; CI blocks on red.

**Security & governance (10)**
- [ ] Role tiers enforced server-side; sensitive actions passcode-gated + audited.
- [ ] No browser-migrate route; impersonation time-boxed + logged.

**UX & accessibility (10)**
- [ ] Keyboard-complete (incl. PIN); shared DataTable/drawers; empty/loading states; WCAG AA.

**Performance (10)**
- [ ] SQL aggregates, cached KPIs, paginated lists, no N+1.

**Observability & docs (10)**
- [ ] Real audit/activity log; owner runbooks; alerts on failures.

---

## 9. Appendix — evidence index (verified file:line references)

| Topic | Reference |
|-------|-----------|
| Revenue = GMV incl. own store | `app/Http/Controllers/Admin/SuperAdminController.php:43–48` |
| "Platform Volume" card | `resources/js/Pages/SuperAdmin/Dashboard.jsx:3019–3021` |
| MRR hard-coded prices | `SuperAdminController.php:39–40` |
| Client-side P&L + localStorage equity | `Dashboard.jsx:1121–1184, 1578` |
| Only `is_demo` exclusion; no `is_internal` | `app/Models/Tenant.php:39–87` |
| Users exclude demo emails (volume doesn't) | `SuperAdminController.php:122` |
| Two shells | `Dashboard.jsx:20` (OneGlanceLayout) vs `resources/js/Layouts/SuperAdminLayout.jsx` |
| Dashboard tabs vs sidebar links | `Dashboard.jsx:59–69` · `SuperAdminLayout.jsx:29–39` |
| Plans CRUD | `app/Http/Controllers/SuperAdmin/PlanController.php` · `resources/js/Pages/SuperAdmin/Plans/Index.jsx:664–694` |
| Coupons CRUD | `app/Http/Controllers/SuperAdmin/CouponController.php` · `Coupons/Index.jsx:77–96` |
| Plan store/update miss `is_ltd`/`trial_days` | `PlanController.php:34–137` |
| Regional pricing (IP only + override) | `app/Services/GeoPricingService.php:18–52` |
| `extendTrial` downgrade | `SuperAdminController.php:386–396` |
| Error auto-resolve by mtime | `SuperAdminController.php:544–574` |
| Browser-migrate route (twice) | `routes/web.php:359` & `:562` |
| AppSumo disabled | `routes/web.php:382–394` |
| PIN keyboard missing | `resources/js/Pages/PlatformOwner/Login.jsx:219,261–271,420–457` |
| Working keydown pattern to copy | `PasscodeModal.jsx:21–51` · `SecurityPinModal.jsx:32–51` |
| Smoke test runner | `app/Http/Controllers/Admin/SmokeTestController.php` · `resources/js/Components/SuperAdmin/SmokeTestRunner.jsx` |
| Subscriptions / lifecycle | `app/Models/StoreLicense.php` · `LemonSqueezyWebhookController.php:31–59` (ProvisionTenant / SubscriptionUpdated / Cancelled / Expired jobs) |
| Plan limits Core | `app/Services/PlanRepository.php` |
| VenSynQ toggle persisted to settings (good pattern) | `SuperAdminController.php:605–622` |
| Demo seeding / golden master | `app/Console/Commands/FullDemoDeployCommand.php` · `ResetDemoTenant.php` · `Tenant.is_golden_master` |

---

*End of roadmap. Work the phases in order, check the boxes honestly, and when Section 8 is fully green you are at 100/100. Audit only — no application code was modified to produce this plan; line numbers reference the working tree at review time and may shift as code changes.*

