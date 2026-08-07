# VenQore — Manual Pre-Launch Checklist (Human Steps)

**Prepared:** 2026-07-08
**What this is:** the things a person must do by hand before going live — the stuff no test can verify for you. Engineering tasks still left in code are in `REMAINING_WORK_PLAN.md`. Do those first (at least the 🔴 blockers), then work this list.

Each item: **Why it matters / How to do it / Done when.** Tick the box when complete.

---

## 1. Database & backups (do these first — they make everything else recoverable)

- [ ] **Take a full backup of `venqore_pos` before any deploy.**
  - Why: this is your undo button. If a migration or deploy goes wrong, you restore.
  - How: `mysqldump venqore_pos > venqore_pos_backup_YYYYMMDD.sql`, then copy it off the server (to S3 or local).
  - Done when: you have the `.sql` file in **two** places and have confirmed its size is non-zero.

- [ ] **Test a restore of that backup into a scratch database.**
  - Why: a backup you've never restored is not a backup.
  - How: `mysql -e "CREATE DATABASE restore_test"; mysql restore_test < venqore_pos_backup_YYYYMMDD.sql`. Log in against it and click around.
  - Done when: the app runs against `restore_test` and data looks correct.

- [ ] **Set up automated recurring backups** (daily minimum) with off-server storage and a retention window.
  - Done when: you can see at least one automated backup that ran on its own.

- [ ] **Run the migrations-vs-production schema diff** (also R4 in the work plan) and apply any missing migrations on a staging copy **before** production.
  - Done when: `diff` between a fresh-migrated schema and `venqore_pos` is clean.

- [ ] **Run pending migrations on production** during the deploy window, immediately after the backup.
  - How: `php artisan migrate --force` (note the new `add_missing_v3_columns_to_sales_orders_table` and `update_plan_prices` migrations will run).
  - Done when: `php artisan migrate:status` shows all "Ran".

---

## 2. Payments & billing (real money — verify with real transactions)

- [ ] **Run one real end-to-end payment through the live gateway** (not test mode) with a real card, then refund it.
  - Why: sandbox passing ≠ live keys, webhooks, and settlement working.
  - Done when: the charge appears in the gateway dashboard, the sale/ledger is correct in VenQore, and the refund clears.

- [ ] **Verify the AppSumo / LemonSqueezy code redemption flow end-to-end** with a real (or real-sandbox) code.
  - Why: AppSumo is your launch channel; the import path was just changed (campaign/status now stored in `metadata`).
  - How: import a batch (`php artisan appsumo:import-codes …`), redeem one, confirm the tenant gets the right plan/tier and limits.
  - Done when: redemption upgrades the account correctly and a second/third stack behaves per your rules.

- [ ] **Confirm the pricing shown to customers is correct.**
  - Why: the last commit changed `Pricing.jsx`, `Billing/Index.jsx`, `WhatIsIncluded.jsx`, and added a `update_plan_prices` migration. Customers will be charged what these say.
  - Done when: prices on the marketing/pricing pages and in the billing screen match your intended numbers in every currency shown.

- [ ] **Verify webhook endpoints are reachable from the providers** (LemonSqueezy, WooCommerce, Pusher) and signatures validate.
  - Done when: a test webhook from each provider is received and processed (check `webhook_logs`).

---

## 3. Domain, TLS, and email

- [ ] **DNS points to the production server** for `venqore.com` (and any subdomains / tenant subdomains you use).
  - Done when: `nslookup venqore.com` resolves to the right IP and the site loads.

- [ ] **Valid TLS/SSL certificate installed and auto-renewing** (e.g. Let's Encrypt).
  - Done when: `https://venqore.com` shows a valid padlock and the cert expiry is >30 days out with auto-renew configured.

- [ ] **Transactional email actually delivers** (registration, password reset, invoice emails, staff invites).
  - Why: local uses the `log` mailer; production needs a real SMTP/API mailer configured, with SPF/DKIM/DMARC so mail isn't spam-filed.
  - How: register a test account, trigger a password reset and an invoice email to an external inbox (Gmail/Outlook).
  - Done when: each email arrives in the **inbox** (not spam) with correct branding and links.

- [ ] **`.env` is production-correct:** `APP_ENV=production`, `APP_DEBUG=false`, real `APP_URL`, real DB/mail/queue/storage creds, real payment keys.
  - Done when: `APP_DEBUG=false` confirmed (no stack traces shown to users) and no test keys remain.

---

## 4. Runtime: queue, cache, storage, scheduler

- [ ] **Queue worker / Horizon is running as a supervised service** (so it restarts on crash/reboot).
  - Why: offline sync, WooCommerce stock sync, emails, and jobs depend on it.
  - Done when: `php artisan horizon:status` (or your supervisor) shows it running, and a queued job processes.

- [ ] **Scheduler cron is installed:** `* * * * * php artisan schedule:run`.
  - Why: recurring invoices, daily snapshots, WooCommerce stock sync, trial reminders, demo cleanup all run on the scheduler.
  - Done when: `php artisan schedule:list` looks right and a scheduled task has run once.

- [ ] **Run the production caches** after deploy: `php artisan config:cache route:cache view:cache` (and `ziggy:generate` if routes changed).
  - Done when: no stale-config errors; routes resolve.

- [ ] **S3 (or file) storage is configured and writable** for uploads, receipts, terminal screenshots, backups.
  - Done when: upload a product image and a receipt PDF and confirm they store and load.

---

## 5. Monitoring & observability

- [ ] **Error monitoring (Sentry or equivalent) is live and actually receiving events.**
  - Why: this is how a leftover bug becomes a Tuesday ticket instead of a silent disaster.
  - How: trigger a harmless test exception and confirm it appears in Sentry.
  - Done when: you see the test event and alerts are routed to a channel you watch.

- [ ] **Uptime monitoring** on the main URL and a health endpoint (you have `HealthController`).
  - Done when: an external monitor pings the health route and will alert you on downtime.

- [ ] **Log rotation** configured so `storage/logs/laravel.log` doesn't fill the disk.

---

## 6. Security pass (human review — the tests can't judge intent)

- [ ] **Confirm the two terminal/heartbeat security fixes are deployed** (cross-tenant hijack). Both `TerminalActivityController` and `HeartbeatController` now reject a conflicting `store_slug` with 403.
  - Done when: the `TerminalOwnershipGuardTest` (and a heartbeat equivalent) pass on the deployed build.

- [ ] **Review the committed `unprotected_write_routes.json` baseline** — confirm every listed write route without `permission:` middleware is *intentionally* public. Anything that shouldn't be, add the middleware.
  - Done when: you've eyeballed the list and it's all expected.

- [ ] **Change all default credentials** — the `platform@venqore.com / admin1234` default and any seeded demo/admin passwords must not exist in production.
  - Done when: default logins fail on production.

- [ ] **Confirm `APP_KEY` is set and secret**, and that `.env`, `safe.env`, and any `*.sql` backups are **not** web-accessible or committed to the repo.

- [ ] **Rate limiting is active** on the public/device endpoints (heartbeat, terminal, sync, chatbot). (Throttle was added to the device endpoints; confirm it's effective in production.)

---

## 7. Final real-world smoke test on production (or a production-identical staging)

- [ ] **Complete POS sale** with a real product, discount, and tax → verify the receipt, the stock decrement, and the ledger entry.
- [ ] **Purchase → receive stock → pay supplier** → verify inventory value and the payable/ledger.
- [ ] **Sale return / refund** → verify stock restored and COGS/revenue reversed.
- [ ] **Create a second store (tenant)** and confirm its data is completely isolated from the first (no cross-tenant visibility).
- [ ] **Offline POS test:** make a sale offline, go online, confirm it syncs exactly once (no duplicate).
- [ ] **Cross-device / cross-browser visual QA** of the POS and dashboard (desktop + the tablet/device your customers will use).
- [ ] **Reports reconcile:** P&L, balance sheet, and trial balance agree with the underlying ledger for the day's test transactions.

---

## 8. Rollback plan (write it down before you need it)

- [ ] You have a **written rollback procedure**: how to restore the DB backup, how to redeploy the previous release build, and who does it.
- [ ] You know **how to put the app into maintenance mode** (`php artisan down` / `up`) during the deploy.
- [ ] Done when: someone other than you could execute the rollback from the written steps.

---

### Bottom line before flipping the switch
Green tests + this checklist complete = you've verified everything that can realistically be verified. It does **not** mean zero bugs (no software ships at zero) — it means the blast radius of anything left is small and recoverable, because you have backups, monitoring, and a rollback plan. That is the real finish line.
