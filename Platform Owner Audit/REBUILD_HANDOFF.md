# VenQore Platform Owner — Command Center Rebuild · Handoff

A complete frontend rebuild of the Platform Owner area into one unified
**Command Center** shell, plus the audit's **P0 backend correctness fixes**.
Built against the audit (`VenQore_Platform_Owner_Audit.html`) and
`ROADMAP_to_100.md` as the source of truth.

---

## ⚠️ Run these 3 commands before testing (on your Windows machine)

The sandbox can't run your Windows-built Node/PHP toolchain, so the migration,
Ziggy regen, and Vite build must be run by you:

```bash
php artisan migrate                # adds tenants.is_internal
php artisan ziggy:generate         # new route platform.store.toggle-internal + removed routes
npm run build                      # (or: npm run dev)  compiles the new UI
php artisan optimize:clear
```

Then mark your own store(s) internal so they're excluded from revenue:

```bash
php artisan tinker
>>> \App\Models\Tenant::where('slug','your-store-slug')->update(['is_internal'=>true]);
```
(Or use the new **Internal / non-billable** toggle on the Stores screen.)

---

## What changed

### One shell, new information architecture (audit D3)
- **`resources/js/Layouts/PlatformLayout.jsx`** — the new unified shell:
  grouped collapsible sidebar (Overview · Customers · Monetization · Operations
  · System · Account), premium header with **global search + ⌘K command
  palette + real notifications + theme toggle**, ambient motion, fully
  responsive (desktop → mobile drawer). Honors the global `ThemeContext`
  (light **and** dark) — fixes the audit's theme-inconsistency finding.
- **`resources/js/Platform/nav.js`** — single nav model driving both the
  sidebar and the ⌘K palette. `safeRoute()` guards every link so a missing
  route never breaks the shell.
- **`resources/js/Platform/theme.js`** + **`ui.jsx`** — the design system:
  tokens (light/dark), KPI cards, DataTable, Drawer, ConfirmModal (with
  type-to-confirm), Badge, Button, EmptyState, Skeleton, ComingSoon, Select,
  Field/Input. Used by every page for consistency.

### Overview (the flagship dashboard)
- **`resources/js/Pages/Platform/Overview.jsx`** — rebuilt command center:
  the **Revenue (paid) vs GMV (merchant volume)** split tiles (the audit's
  headline fix), KPI strip, store-growth chart, plan distribution, quick
  actions, recent activity, expiring trials.

### Every existing page moved into the new shell
The 12 existing SuperAdmin pages (Stores, Users, Plans, Coupons, Platforms,
Overrides, Health, DigitalHub, Newsletter, AppSumo) now render through
**`resources/js/Layouts/PlatformShell.jsx`** (a drop-in adapter → PlatformLayout).
Their bodies are unchanged; only the layout wrapper was swapped. Orphan pages
(Agent Inbox, Chatbot Settings, Webhooks, Updater) are now linked in the nav.

### In-shell views (`?view=` on the dashboard route)
`Dashboard.jsx` is now a thin dispatcher. New views in
**`resources/js/Pages/Platform/Views.jsx`**: Revenue, Merchant GMV, Testing
Center, Demo & Sandbox, Support Inbox, Impersonation, **PK Verifications**,
Platform Settings, Jobs & Queues, Storage, Feature Flags, AppSumo. Pages whose
backend isn't built yet show a production-quality interface clearly marked
**Coming Soon / Backend Pending** (never fake data).

> The old 3,117-line monolith is preserved at
> `storage/legacy-platform-ui/Dashboard.legacy.jsx.txt`.

---

## P0 backend correctness fixes (audit Phase 1)

| Fix | File |
|-----|------|
| `is_internal` flag + `scopeBillable()` (excludes demo **and** internal) | migration `2026_07_01_000001…`, `app/Models/Tenant.php` |
| `PlanPricingService` — one price source, reads the `plans` table (USD+PKR) | `app/Services/Platform/PlanPricingService.php` |
| `PlatformRevenueService` — server-side MRR/ARR/GMV/net, **paid-only**, internal+demo excluded | `app/Services/Platform/PlatformRevenueService.php` |
| Dashboard now reads money from the service; deleted the hard-coded `['starter'=>19,…]` array | `app/Http/Controllers/Admin/SuperAdminController.php` |
| Plan create/update now persist `is_ltd` + `trial_days`; price cache flushed on every write | `app/Http/Controllers/SuperAdmin/PlanController.php` |
| `extendTrial` no longer demotes a paying store to "trial" | `SuperAdminController@extendTrial` |
| Removed **both** `GET /VenQore/run-migrations` browser routes | `routes/web.php` |
| Fixed `/VenQore-login` PIN keyboard: physical digits, Backspace, Enter + autofocus + mobile keypad | `resources/js/Pages/PlatformOwner/Login.jsx` |

**Result:** the dashboard now shows real paid-subscription revenue (your own
store excluded), GMV is labelled separately, there is **no** financial math in
the browser and **no** `localStorage` ledger, and editing a plan price changes
the dashboard MRR immediately.

---

## Notes
- No production data touched. The migration is incremental and reversible.
- The `?view=` pages avoid needing dozens of new backend routes; wire real
  backends later and swap the placeholder views for live data.
- `Command_Center_Preview.html` (this folder) is a static visual preview of the
  new Overview + shell.
