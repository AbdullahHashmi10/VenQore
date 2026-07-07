# IMPLEMENTATION.md — Baby-Step Execution Plan (Days 1–30, junior-proof)

> Format per task: Purpose · Files · Depends · Acceptance · Time · Risk · Rollback · Test. Ordered — do them top to bottom. Matches ROADMAP 0–30d. Conventions: work in a feature branch per task; every task ends with `php artisan test` green + CHANGELOG.md entry.

## WEEK 1 — Perimeter & safety

### T1. Secure terminal APIs (GAPS C1) — Day 1
- **Purpose:** close unauthenticated write/upload endpoints.
- **Files:** `routes/api.php` (lines ~12–16), `app/Http/Controllers/Api/TerminalActivityController.php`, `app/Http/Controllers/Api/HeartbeatController.php`, new migration `terminals.api_token` (hashed), `Pages/...` terminal pairing UI (or reuse existing terminal registration screen), the desktop/station client config (`amd-station`).
- **Steps:** (1) add `auth:sanctum` + `throttle:60,1` middleware to the three routes; (2) issue per-terminal Sanctum token at terminal registration (show once); (3) in controller: drop `store_slug`-driven tenant reassignment — derive tenant from the token's terminal; (4) validate screenshot: `image`, max 2MB, random filename, non-public disk; (5) heartbeat: keep public but throttle 30/min + respond 204 only.
- **Acceptance:** unauthenticated POST → 401; wrong-tenant terminal id → 403; oversized/wrong-mime screenshot → 422; existing station client updated + works.
- **Time:** 4–6h · **Risk:** breaks deployed station clients → version the endpoint (`/api/v2/terminal/...`), keep old one returning 410 with upgrade message after 30 days. · **Rollback:** revert route middleware. · **Test:** feature tests for 401/403/422/200 paths.

### T2. Throttle + verify public endpoints (H6) — Day 1–2
- **Files:** `routes/api.php` (chatbot, vena, pusher webhook), `app/Http/Controllers/PusherWebhookController.php`, `bootstrap/app.php` (rate-limiter definitions).
- **Steps:** named limiters `chat:20,1` per session+IP, `vena:30,1`, pusher webhook: verify `X-Pusher-Key`/HMAC per Pusher docs or drop endpoint if unused (grep usage first).
- **Acceptance:** 429 after limit; pusher webhook rejects bad signature. **Time:** 3h · **Risk:** low · **Test:** feature tests per limiter.

### T3. Production guards + secrets (C5 part 1) — Day 2
- **Files:** `database/seeders/SuperAdminSeeder.php` (+ AdminUserSeeder), new `app/Providers/DeploymentGuardProvider.php` (or boot check in `AppServiceProvider`), `.gitignore`.
- **Steps:** seeders `abort if app()->isProduction() && !env('ALLOW_ADMIN_SEED')`; boot assertion: production + APP_DEBUG=true → log critical + optionally abort; add `.env`, `*.zip`, `scratch/`, `composer.phar` to .gitignore; rotate prod admin password + DB password when deploying next.
- **Acceptance:** prod boot with APP_DEBUG=true refuses/alerts; seeder refuses on prod. **Time:** 2–3h · **Risk:** none locally.

### T4. Repo cleanup (C5 part 2) — Day 2–3
- **Steps:** `mkdir scratch docs/archive`; `git mv` all root `check_*.php debug_*.php audit_*.php find_*.php *_test.php` scripts → `scratch/`; move stale root MD/planning docs → `docs/archive/` (KEEP at root: CLAUDE.md, README.md, CHANGELOG.md, canonical blueprints listed in PROJECT.md §8); move `AMD_POS_Update_v*.zip` out of the repo (external release storage); delete `tests/` duplicate tree (verify `composer.json` maps to `Tester/tests` — it does); update any script referencing moved paths (`package.json` build already uses `scratch/audit_ziggy_routes.cjs` — create `scratch/` FIRST and keep that file's path stable).
- **Acceptance:** `ls` root ≤ 30 entries; `npm run build` still passes; `php artisan test` green. **Time:** 3–4h · **Risk:** a moved script referenced by CI/build → grep references before moving. · **Rollback:** git revert.

### T5. CI pipeline (C6) — Day 3–4
- **Files:** `.github/workflows/ci.yml`.
- **Steps:** jobs: (a) php: mysql:8 service (db `amd_pos_test`), `composer install`, `cp .env.ci .env`, key:generate, migrate, `composer test:ci`; (b) js: `npm ci`, eslint, `npm run build`; (c) gitleaks action. Create `.env.ci`. Badge in README.
- **Acceptance:** push → green run; intentional failing test → red. **Time:** 4–6h · **Risk:** env-specific test failures — fix or `->group('local-only')` them explicitly (document each).

### T6. Sentry + alerting (M6/M7) — Day 4
- **Steps:** `composer require sentry/sentry-laravel`, DSN via env, test event; React: `@sentry/react` in `app.jsx` ErrorBoundary; healthchecks.io ping wrappers on scheduler entries: `demo:reset`, `backup:google-drive`, `finance:audit`, `woo:sync-all`, `tenants:process-expired-trials` (append `&& curl -fsS $PING_URL`... via `->thenPing()`/`->pingOnSuccess()` scheduler methods).
- **Acceptance:** forced exception appears in Sentry (BE+FE); killed scheduler fires email within 1h. **Time:** 3–4h.

### T7. Platform backups + RUNBOOK (H9) — Day 5
- **Steps:** nightly `mysqldump --single-transaction venqore_pos | gzip` → S3 bucket w/ 30-day lifecycle + weekly copy to second region/account; `php artisan backup:verify` command that restores latest dump into `venqore_restore_check` and counts core tables; write `docs/RUNBOOK.md` (restore steps, deploy steps, incident contacts, update-package build steps).
- **Acceptance:** restore drill executed once, timed, documented. **Time:** 4–6h · **Risk:** disk space on restore box.

## WEEK 2 — Auth & correctness

### T8. 2FA for owners + platform admins — Day 6–8
- **Files:** `ProfileSecurityController`, new `user_two_factor` columns (secret encrypted, recovery codes hashed), `Pages/Profile/*`, login flow challenge page, `pragmarx/google2fa-laravel` or Fortify's trait.
- **Acceptance:** enroll → QR → challenge on login → recovery codes work; platform admin login REQUIRES 2FA (enforce flag). **Time:** 2–3d · **Risk:** lockouts → recovery codes + support unlock runbook entry. · **Test:** feature tests enroll/challenge/recovery.

### T9. Offline sale idempotency (C4) — Day 8–10
- **Files:** `resources/js/Hooks/useOfflineSync.js`, `resources/js/Pages/Pos.jsx` (checkout payload), migration: `sales.client_sale_id` unique-per-tenant nullable, legacy `SaleController@store` + (flag-ready) `V3\SaleService::post`.
- **Steps:** (1) generate `client_sale_id = crypto.randomUUID()` when sale is CREATED (not when synced); include in payload both online + offline paths; (2) server: if `(tenant_id, client_sale_id)` exists → return existing sale 200 (idempotent replay); (3) client: exponential backoff (1/5/15min), `attempts` counter, status `failed` after 5 → surface in a "Needs attention" drawer with per-sale retry/discard; (4) delete queue rows on confirmed sync (keep 24h tombstone).
- **Acceptance:** simulate lost response (server 200 but client timeout) → resend → exactly one sale row; stock deducted once; drawer shows failures. **Time:** 2–3d · **Risk:** legacy controller shape — add unique index CONCURRENTLY-equivalent (MySQL: just add, table small pre-launch). · **Test:** duplicate-post feature test + Dexie unit test (vitest) for queue transitions.

### T10. Wildcard permission removal (H4) + coverage report — Day 10
- **Steps:** remove `'*'` branch from `CheckPermissions`; make owner role enumerate all keys in `config/permissions.php`; artisan command `permissions:coverage` printing routes w/o `permission:` middleware grouped by risk (write verbs first); close top-20 write routes.
- **Acceptance:** owner still passes everywhere (test per module); coverage report count tracked in CI artifact. **Time:** 1d · **Risk:** hidden `*` pivots — migration to expand `*` into full key list first.

### T11. TenantMiddleware perf (H1) — Day 11
- **Steps:** delete debug `Log::info` (line ~255); wrap `onboarding_metrics` + `checkLimitsStatus` in `Cache::remember("tenant:{id}:...", 300s)`; bust on product/sale/staff writes via model observers (or accept 5-min staleness — fine); keep `plan_usage` lazy.
- **Acceptance:** debugbar/query-log shows ≤ 3 queries added by middleware on warm cache (from ~9). **Time:** 0.5–1d · **Test:** existing suites + manual query count.

### T12. Mass-assignment hardening (H3, financial models first) — Day 12
- **Files:** JournalEntry, JournalItem, Sale, SaleItem, Invoice, Payment, Stock, InventoryBatch, Tenant, TenantUser models.
- **Steps:** replace `$guarded=[]` with explicit `$fillable`; run full suite; fix fallout (usually seeder/factory fields).
- **Acceptance:** suite green; attempt to mass-assign `tenant_id`/`is_reversed` via request → stripped. **Time:** 1d · **Risk:** runtime "not fillable" in untested paths → deploy behind full regression pass + Sentry watch week.

## WEEKS 3–4 — Activation & platform

### T13. EmptyState component + rollout (UIUX 1) — Day 13–15
Create `Components/EmptyState.jsx` (icon, title, body, primaryAction, docsHref). Apply to all 44 report pages (ReportsLayout can inject default) + 12 index pages. Acceptance: fresh store shows zero blank tables. Time: 2–3d.

### T14. Activation checklist widget (UIUX 7) — Day 15–16
`Components/ActivationChecklist.jsx` reading shared `onboarding_metrics` (already on every page): add product → record purchase → make sale → view P&L → enable backup. Dismissible, reappears via Settings. Acceptance: completes/updates live; clicks deep-link to the right pages. Time: 1–1.5d.

### T15. Redis + Horizon on SaaS deploy (H7) — Day 17–18
`.env` prod: `CACHE_STORE=redis`, `SESSION_DRIVER=redis`, `QUEUE_CONNECTION=redis`; supervisor: `horizon`; keep database drivers documented for self-hosted. Acceptance: sessions survive deploy, Horizon dashboard live (gate: platform admin), queue latency <5s under 200-job burst. Time: 1–2d incl. staging soak.

### T16. Demo-store reset alerting + failure banner (M11) — Day 18
`->pingOnFailure()` + platform notification; public demo shows "resetting" state if golden-master copy fails. Time: 0.5d.

### T17. H2 membership check in HasTenant fallback — Day 19
Cache `user:{id}:membership:{store}` 5 min; verify active before applying `last_store_id` scope; else `1=0`. Acceptance: revoked member's next non-tenant-route query returns empty, test proves it. Time: 0.5–1d (careful: hot path — cached only).

### T18. Counsel-ready compliance pack (H10) — Day 19–20 (parallel, non-eng)
Export current Privacy/ToS/Refund JSX text → docs for counsel; draft staff-monitoring consent copy + retention setting (screenshots auto-delete after N days — implement the pruning command, 0.5d code).

### T19. Pre-launch pen-test-lite — Day 20–21
Run: OWASP ZAP baseline on staging, `composer audit`/`npm audit` fixes, manual checks of SECURITY.md §10 list. Acceptance: no high findings open. Time: 1–2d.

### T20. V3 cutover prep (C3 phase 0) — Day 21–30
- **Steps:** (1) map legacy `SaleController@store` payload → `V3\SaleService::post` input (write the adapter, don't change the POS payload); (2) tenant flag `pos_engine=v3`; (3) shadow mode: post legacy (authoritative) + V3 (shadow, marked `is_shadow`) on internal store; nightly `reconcile:engines` command diffs totals/COGS/journals; (4) after 14 clean days → flip internal store authoritative-V3; (5) document flip/rollback in RUNBOOK.
- **Acceptance:** 14 consecutive zero-diff days on internal store. **Time:** 5–7d spread. · **Rollback:** flag off per tenant, shadow rows purged by command. · **Test:** reconciliation command IS the test; plus adapter unit tests for edge payloads (offline replay, split tender, promo items, negative stock).

## Definition of done (applies to every task)
Code + tests + CHANGELOG entry + (if routes changed) `php artisan ziggy:generate` + docs touched (RUNBOOK/PROJECT) + deployed to staging + verified by hand once.
