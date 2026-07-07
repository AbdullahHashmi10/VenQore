# GAPS.md — Brutally Honest Weakness Audit

> Grouped by severity. Every item: what, why it matters, affected files, business/user impact, effort (S <1d, M 1–3d, L 1–2w, XL >2w), and suggested fix.
> Method: full structural recon + deep reads of tenancy/accounting/inventory/billing/POS paths + targeted greps. Line numbers are approximate to v5.0.6.

---

## CRITICAL (fix before any public launch)

### C1. Unauthenticated terminal APIs allow cross-tenant writes and file upload
- **What:** `POST /api/terminal/activities` and `POST /api/terminal/screenshot` have **no auth middleware** (`routes/api.php:15-16`). The controller (`Api/TerminalActivityController`) resolves terminals `withoutGlobalScope('tenant')`, will **re-assign a terminal's `tenant_id`** based on attacker-supplied `store_slug`, binds arbitrary `device_id`s, and accepts screenshot uploads to storage.
- **Why it matters:** Anyone on the internet can pollute activity logs of any store, hijack terminal↔tenant mapping, and fill your disk/S3 with uploads. It is also a data-integrity attack on a system whose brand is integrity.
- **Impact:** Business: storage cost abuse, corrupted analytics, tenant-isolation story broken. User: staff-monitoring data becomes untrustworthy.
- **Effort:** S–M.
- **Fix:** Require Sanctum token per terminal (issue on terminal registration), reject `tenant_id` reassignment, validate screenshot mime/size, add `throttle:`, and signed device enrollment (one-time pairing code).

### C2. Money math uses PHP floats
- **What:** All monetary flows use `float` + `round(x, 2)` + epsilon comparisons (`V3\AccountingService::createEntry` `abs($d-$c) > 0.001`, `FifoService`, `SaleService`).
- **Why:** Float drift is how ledgers stop balancing at scale — exactly the failure mode the product promises can't happen. 0.001 tolerance already admits sub-cent imbalance per entry; millions of entries compound.
- **Files:** `app/Services/V3/*`, legacy `SaleController`, `FinancialReportingService`.
- **Impact:** Rare but catastrophic trust failures ("my P&L is off by 3 rupees"); support load; audit risk under FBR e-invoicing.
- **Effort:** L (mechanical but wide).
- **Fix:** Standardize on BCMath via a `Money` value object (string-based, 2/4 dp), or integer minor units. Start at `AccountingService::createEntry` (choke point), then FIFO cost math. Keep DECIMAL columns; ban `float` casts in models. Add a CI grep-gate.

### C3. Two parallel transaction engines; POS still posts through the legacy one
- **What:** Legacy `SaleController` (1,677 lines) still owns the POS hot path (`store.sales.store`, `web.php:1160`); V3 (`Services/V3`, 41 controllers, routes under `store.v3.*`) is the strategic engine. VenSynQ bypassing FIFO/ledger until 2026-07-07 is exactly the class of bug duality breeds.
- **Why:** Every invariant must be enforced twice; every fix must be made twice; reconciliation tests mitigate but don't remove drift risk.
- **Impact:** Slower velocity permanently; latent financial-correctness bugs.
- **Effort:** XL (highest-value engineering project in the codebase).
- **Fix:** Route POS checkout through `V3\SaleService::post` behind a per-tenant feature flag; shadow-post both engines for 2 weeks on internal store (`RunShadowMigration` exists); flip default; freeze legacy writes; delete after one quarter.

### C4. Offline sync can duplicate or silently lose sales
- **What:** `useOfflineSync.js` retries queued sales with no idempotency key, no retry cap, no dead-letter surface; the server response being lost (timeout) → resend → **duplicate sale + double stock deduction + double revenue**. Errors only `console.error`.
- **Why:** Offline-first is a headline feature; wrong offline math destroys the core promise. AccountingService already supports `idempotency_key` — unused from the client.
- **Files:** `resources/js/Hooks/useOfflineSync.js`, `Pos.jsx` (~line 1049), legacy `SaleController@store`.
- **Impact:** Real financial errors at the worst moment (spotty connectivity = your primary market).
- **Effort:** M.
- **Fix:** Generate UUID `client_sale_id` at queue time; unique index server-side; return 200-with-existing on replay; exponential backoff + max attempts + visible "needs attention" queue state; delete-on-sync confirmed rows (currently kept as `synced` forever).

### C5. Repo hygiene / leak surface: secrets, debug scripts, update ZIPs, 100+ stale docs at root
- **What:** `.env` with real local creds committed to working tree; ~100 ad-hoc `check_*.php`/`debug_*.php`/`audit_*.php` scripts at root (some open DB connections with hardcoded creds); 30+ release ZIPs; default admin creds documented; `composer.phar` committed.
- **Why:** If any of these ship inside the deploy artifact or webroot, they're remote DB consoles. They also bloat every clone and confuse every agent/human (context poisoning — contradictory old plans).
- **Impact:** Security exposure; onboarding chaos; "which doc is true?" tax on every future session.
- **Effort:** S–M.
- **Fix:** Move scripts to `scratch/` (gitignored), ZIPs to external storage/releases, archive stale docs to `docs/archive/`, add `.gitignore` entries, verify deploy bundler excludes them (`bundle_for_update.ps1`), rotate admin + DB creds on prod, add root-file allowlist check to release script.

### C6. No CI pipeline evidence; MySQL-only tests make CI harder, so tests likely run rarely
- **What:** No `.github/workflows` observed; tests require MySQL `amd_pos_test`; suites duplicated in both `tests/` and `Tester/tests/` (composer maps `Tests\` → `Tester/tests` — the other tree is dead weight that will silently rot).
- **Why:** 535 tests you don't run on every push are decorative. The changelog itself says "PHP lint/test run was not possible in this sandbox."
- **Impact:** Regressions ship; the invariant suite loses meaning.
- **Effort:** M.
- **Fix:** GitHub Actions: mysql:8 service, `composer test:ci`, `npm run build`, Pint, eslint. Delete the duplicated `tests/` tree. Block merge on red.

---

## HIGH

### H1. TenantMiddleware does heavy per-request work
5 `EXISTS` queries (`onboarding_metrics`) + limit counting (`checkLimitsStatus` → products/users/warehouse counts) + a **debug `Log::info` on every request** (line ~255). Fix: cache per-tenant for 5–15 min, invalidate on writes; delete the log line. (M)

### H2. `HasTenant` fallback trusts `last_store_id` without membership check
Outside store routes, a user whose membership was revoked still queries their old store's data until `last_store_id` changes. Files: `app/Traits/HasTenant.php` (lines 66-71). Fix: verify active membership (cached) in the fallback, or scope fallback to read-only route allowlist. (S–M)

### H3. Mass assignment: 49 models use `$guarded = []`
Combined with `$request->all()`-style writes anywhere, this is a foot-gun (e.g., posting `tenant_id`, `status`, `is_reversed`). Fix: explicit `$fillable` on financial models first (JournalEntry, JournalItem, Sale, Invoice, Payment, Stock, Tenant), FormRequests with `validated()` only. (M)

### H4. Wildcard `'*'` permission god-mode
`CheckPermissions` honors `in_array('*', $userPerms)` despite the "God Mode deleted" comment. Any pivot row with `*` bypasses all store-level checks. Fix: remove wildcard; make `owner` role explicit-permission-complete instead. Audit existing pivots for `*`. (S)

### H5. Fat legacy controllers / monolith route file
`SaleController` 1,677 lines; `routes/web.php` 1,980 lines; violates the stated thin-controller convention; merge conflicts and agent errors concentrate here. Fix: split routes by domain (`routes/store/*.php` required from web.php); extract legacy sale posting into a service as part of C3. (M–L)

### H6. Public endpoints without rate limiting
`/api/heartbeat`, `/api/{store_slug}/chatbot/*`, `/api/{store_slug}/vena/*`, `/api/webhooks/pusher` have no visible `throttle`. Chatbot hits Gemini → attacker can burn your AI budget. Fix: `throttle:` groups per endpoint class; per-session token for visitor chat; verify Pusher webhook signature (currently a bare POST). (S–M)

### H7. Database queue + database cache + database sessions on one MySQL
Fine pre-launch; a thundering herd at AppSumo launch (thousands of trials in 48h) will contend on the same DB as POS writes. Fix: Redis for cache/session/queue + Horizon on the SaaS deployment before launch; keep database driver for self-hosted. (M infra)

### H8. Single-server assumptions in the SaaS deployment
Local file storage for logos/uploads (logo existence checked via `Storage::exists` on local disk), updater designed for single box, no health-checked horizontal story. Fix: S3 for all tenant media (flag exists), stateless web tier, run scheduler/queue on worker role. (M–L)

### H9. Backups: per-tenant Google Drive exists, platform-level DR does not (verified: no platform dump command/cron found)
Nightly `backup:google-drive` covers tenants who connected Drive. There is no observed platform-wide DB snapshot + offsite copy + restore drill. Fix: automated `mysqldump` (or managed DB snapshots) hourly/daily with 30-day retention + quarterly restore drill documented in RUNBOOK. (S–M)

### H10. Legal/compliance surface for a payments-adjacent product
Privacy Policy / ToS / Refund Policy pages exist as JSX but content review, data-processing terms (staff monitoring! screenshots!), GDPR-ish export/delete, and PK data rules are unverified. Staff screenshot capture without consent tooling is a liability in several markets. Fix: counsel review; in-product consent + retention config for terminal screenshots; DSR (export/delete) endpoints — `DataManagementController` is the seed. (M, mostly non-code)

---

## MEDIUM

- **M1. Pos.jsx is a 3,577-line component** — extract cart, payment modal, search, offline banner into components/hooks; state via reducer. (L)
- **M2. Reports N+1 / heavy queries unaudited** — 44 report pages, `FinancialReportingService` 1,403 lines; add query budgets + `DailySnapshot` pre-aggregation (model exists) for the top 10 reports. (L)
- **M3. Duplicated test trees** (`tests/` vs `Tester/tests/`) — delete one. (S)
- **M4. `SaleService` constructor resolves tenant at construction** (`app('current.tenant')->id` line 20) — crashes queue/CLI contexts that build the service before binding tenant; `getTenantId()` exists but isn't used consistently. (S)
- **M5. Client-visible plan logic drift risk** — features shared to frontend via `featuresArray()` while some UI checks names that differ (`email_marketing` vs `marketing_campaigns` class of bugs; two already fixed 2026-07-03). Add a single generated TS/JS constants file from the seeder. (M)
- **M6. No error monitoring** — no Sentry/Bugsnag/Flare wiring observed; `ErrorLog` model is homegrown. Wire Sentry (Laravel + React) before launch. (S)
- **M7. No uptime/APM** — add basic uptime checks + slow-query log review cadence; Horizon metrics unused while queue=database. (S)
- **M8. i18n incomplete** — `language_code` on tenant exists; no `lang/` resource strategy for Urdu/RTL observed in React pages; hardcoded English strings everywhere. If Pakistan is the beachhead, Urdu UI is a conversion lever. (XL, phased)
- **M9. Accessibility unknown** — keyboard-first POS is claimed; no aria audit; SweetAlert2 modals and custom comboboxes are classic a11y holes. (M–L)
- **M10. Email deliverability** — mail=log locally; no observed production provider config, SPF/DKIM/DMARC runbook, or transactional templates inventory (trial reminders exist). (S–M)
- **M11. Demo store safety** — demo reset relies on scheduler at 04:00 UTC; if it fails, public demo degrades silently; add failure alerting to the two demo commands. (S)
- **M12. `Transaction` model is anemic while carrying the core name** — `$guarded=[]`, no casts, relations minimal; V3 writes via query builder. Decide: promote it or rename to avoid confusion. (S doc / M code)
- **M13. Ziggy full route dump to client** — 751 named routes shipped to every visitor inflates payload and reveals internal surface (`/VenQore/*`). Use Ziggy groups/filters. (S–M)
- **M14. Update ZIP self-updater security** — verify signature/checksum on update packages before extract (pclzip). If the update feed is ever MITM'd or the bucket is writable, that's RCE on every self-hosted install. (M)

## LOW

- L1. `composer.json` description still "The skeleton application…"; name `venqore/erp` fine. (S)
- L2. Debug `Log::info` sprinkled in hot paths beyond H1 (grep `Log::info` count is high); demote to `debug` + sampling. (S)
- L3. Dead code: legacy `routes` marked GAP-fixed comments, `bb6ad85.jsx` at root, `Untitled.canvas`, `3D/`, `Semrush/` folders in repo. (S)
- L4. `pclzip` is ancient; prefer `ZipArchive`. (S)
- L5. Icons/version strings: `AMD POS` vs `VenQore` branding split across files/folders (`AMD_POS_VERSION.txt`) — finish the rename everywhere user-visible. (S–M)
- L6. `.editorconfig`/Pint config presence unverified; enforce in CI. (S)
- L7. README.md is not a real README for humans; write a 60-line one pointing at docs/. (S)

---

## What is NOT broken (credit where due)

Real double-entry with enforced invariants + hourly self-audit; FIFO with row locks and deterministic tiebreakers; batch-exact returns; fail-closed plan gating with DB-driven packaging + overrides + LTD stacking; session regeneration on store switch; encrypted OAuth tokens; HMAC-verified LemonSqueezy + Woo webhooks; impersonation guard; recycle bin; audit/activity logs; 535 tests including invariant suites; an honest, current CHANGELOG. The bones are good. The gaps above are launch-blockers and polish — not rot.

**Bottom line:** fix C1–C6 (≈3–4 focused weeks) and this codebase is legitimately launchable.
