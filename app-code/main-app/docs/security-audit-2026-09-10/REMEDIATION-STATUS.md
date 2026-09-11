# VenQore pre-launch remediation — status, 10 September 2026 (round 4, final)

**11 September update (Codex):** the Composer, Electron and electron-builder upgrades were completed locally by Codex — see [FIXES-2026-09-11.md](FIXES-2026-09-11.md). Deploy from the updated lockfiles using `composer install` / `npm ci`; do not resolve fresh dependency versions on the production server. Round 4 below was built and tested on top of that work (Codex's code and test changes and your exact `vendor/` packages were pulled in before the final runs).

Companion to `REPORT.md` (the master plan) and `RECHECK.md` (the independent recheck). This file says what was changed, how it was proven, and what is left for you.

**Where it stands:** every engineering item from REPORT.md and RECHECK.md is done and tested, including the dependency upgrades (done by Codex this evening; verified below). The full suite runs with nothing skipped and no placeholders. What remains is on the "Only you can do this" list: accounts, keys, DNS, hosting, and checks on real hardware and inboxes. Launch once that list is ticked.

## How it was proven

- **Full backend suite, freshly created MariaDB database:** **2,638 tests, 21,670 assertions, 0 failures, 0 skipped, 0 incomplete.**
- **Frontend:** `npm test` 126/126. The full `npm run build` (font, design-system, theme and Ziggy route checks, then client and SSR builds) succeeds. ESLint: no new errors in any changed file (`Pos.jsx` 14 and `PartnerSupport.jsx` 2 were there before; they are React-compiler style rules on old code).
- **Composer:** your lock (updated at 19:40) covers every advisory from RECHECK.md: laravel/framework 12.69.2, phpspreadsheet 1.30.6, maatwebsite/excel 3.1.70, guzzle 7.15.5, commonmark 2.10.1, jmespath 2.9.2, phpseclib 4.0.1, dompdf 3.1.6, psysh 0.12.24, symfony/routing and yaml 7.4.18, plus endroid/qr-code 5.1.0. The full suite above was run on **exactly your installed packages** (copied from your `vendor/`), from an empty database: 2,638 passed.
- **Real browser, end to end (Playwright + Chromium against `php artisan serve`, its own database): 52/52 checks passed.**
  - 14 public pages render with no JavaScript errors; an unknown URL returns a real 404.
  - Signup → emailed code → wrong code refused → right code signs in.
  - Wrong password stays on the sign-in page and keeps the email typed; right password → emailed code → signed in.
  - Create a store (plan → name → setup wizard) → POS → ring a sale → stock −1, FIFO batch −1, ledger balances to 0.00, browser heartbeat accepted.
  - Turn on 2FA (wrong code refused, right code accepted) → sign out → sign in → email code → **2FA code asked** → wrong refused → right accepted.
  - Contact form → HTTP 201 → "Thank you" shown.
  - 2FA setup keeps the same key after a mistyped code.
  - Cashier rings a below-cost item → approval pop-up → wrong manager PIN refused (nothing saved) → right PIN completes the sale, "approved by" recorded, ledger balances.
  - Terminal pairing: code created in Settings → unpaired device refused → pairs with the typed code (any case, with or without spaces/hyphen) → code can't be reused → secret required on every call → wrong secret refused → owner disconnects it → it must pair again.
- **Race test (two tills sell the last unit at the same instant, real HTTP):** with "stop negative stock" on, exactly one sale goes through and stock ends at 0. With it off, both go through and stock goes to −1 by design (that is the store's own setting).
- **Crawl of all 114 sitemap URLs:** every page returns 200 with a title, description, canonical link and a server-written H1; no duplicate titles. 27 pages have titles over 70 characters or descriptions outside 50–170 characters (blog posts, tools). That is cosmetic; Google just truncates them.

## Round 4 — no skipped or placeholder tests left

**Before:** 131 skipped + 44 "incomplete" placeholders + 12 "covered elsewhere" placeholders that asserted nothing.
**After:** **2,638 tests, 0 failures, 0 skipped, 0 incomplete** on a freshly created MariaDB database (run twice from empty).

| What | Result |
|---|---|
| 44 placeholder scenario tests (rulebook S-xxx) | Replaced by real tests in `V3/Scenarios/Phase2InventoryScenariosTest`, `Phase3SalesScenariosTest`, `Phase4OperationsScenariosTest`, `Phase56ReportsInfraScenariosTest` (44 tests, ~1,000 assertions: exact journal lines, FIFO batches, balances). |
| 12 "covered elsewhere" placeholders | Now assert the covering test still exists (a rename can't orphan them). S-055 is a real test: a zero-cost opening batch is refused by the database. |
| 122 skipped Reckoner registry cases | Not skipped any more: each check only runs for the readings it applies to, plus a test that the split covers the whole registry (601 cases run). |
| 4 skipped QR-code tests | `endroid/qr-code` 5.1 (in your lock) — the tests run, and a generated code was decoded back to the right URL. |
| 3 "MySQL-only" tests | Run on MariaDB (production's database). They exposed that two database guards were never installed on MariaDB (see below). |
| 2 layout-mismatch skips | Fixed; one found two test files nothing was running, now moved into the suite. |

**Bugs the new tests found and fixed** (each has a regression test in `tests/tests/Feature/Hardening/` or the scenario files):

- **Database guards missing in production:** "stock can't go negative" and "opening stock must have a cost" CHECK constraints only installed for MySQL, never MariaDB. Two migrations install them on deploy (negative remaining stock rows, if any, are set to 0 first and logged; zero-cost opening batches block the second guard and are logged for you to fix).
- **Sales:** full return after a partial return double-reversed revenue, cost and stock; partial returns didn't reverse sales tax; overpaid cash went to the sales-tax account; returns in cartons restored 1 piece instead of 12; the returns screen allowed returning the same units twice; deleting/cancelling a part-returned sale never reversed the rest; sales-order conversion posted revenue twice.
- **Purchases:** returns didn't reverse the input tax; returns on freight-loaded stock cut the supplier balance by the freight; line discounts weren't in stock cost (inventory account drifted from stock value); the Payments screen over-allocated and allocated refunds to bills; supplier payments were missing from "paid"; debit notes didn't take stock out, crashed when they named a bill, and couldn't be refunded; input tax on expenses and debit notes went to Prepaid (1300) instead of 2300.
- **Approvals (money rules):** the real POS checkout had no server-side below-cost or discount-limit check — added, with a manager-PIN pop-up on the till (tested in a real browser). "Approved by" on sales, bad-debt write-offs, sales-order conversion, fiscal close and cash shortages now needs a real manager of that store with their PIN (it accepted any user id). The cashier's own sale stays under the cashier's name.
- **Store isolation:** customer and supplier payments, payroll, UOM conversions, price tiers, employees, insurance claims, roles, discount limits and ~60 validation rules across the V3 API accepted another store's ids or saved rows without a store; all now scoped (67-case cross-store test). Serial/IMEI numbers are now unique per store, not across all stores.
- **Things that simply didn't work:** fiscal year close (always failed), cash shortage (SQL error), final settlement, loans, depreciation, donations, bank transfers to a second bank, payroll and insurance claims on a new store (missing accounts), the Production screen (every submit failed), V3 product create (500), UOM delete (500), the hosted-until expiry job and the owner daily pulse (crashed; the pulse could mail another store's figures to a random user).
- **Ledger safety:** a failed posting could leave an empty journal entry behind; posting is now all-or-nothing.
- **Reports:** the COGS report dropped part-returned sales and every POS sale made on the last day of the range.
- **2FA setup:** after one mistyped code, the key on screen changed, so the authenticator app the user had just set up stopped working. The pending key is now kept on the account until confirmed (found in the browser run).

## Round 3 changes (after RECHECK.md)

| Item | What was done |
|---|---|
| RECHECK 1 — legacy terminal enrolment (SEC-04) | Trust-on-first-use is gone. A terminal with no device secret gets `PAIRING_REQUIRED` and must pair once with a fresh code from Settings → Terminals; a code from another store is refused. Codes are spent with a conditional update, so two devices can never pair with one code. Tests: `TerminalAppIntegrationTest` (legacy re-pair, single use). |
| RECHECK 2 — Windows pairing | Station shows a pairing-code box whenever the server answers `PAIRING_REQUIRED` or `DEVICE_AUTH_FAILED`, sends the code with the first heartbeat and stores the returned secret (`amd:pair`, shell-only IPC). The server side was tested end to end; the packaged app still needs a run on a real PC. |
| RECHECK 3 — screenshot encryption | No key comes from the device ID any more. Station encrypts its local queue with AES-256-GCM using a key derived (HKDF) from the device secret; it uploads the PNG over the authenticated HTTPS call; the server stores it encrypted with the app key. Old-format uploads and old stored files still open. Telemetry stays off by default. |
| RECHECK 4 — dependencies | Web npm: **0 advisories** (unused `adm-zip` removed, vitest 4.1.11). Composer: your updated lock, verified by the full suite (round 4). Windows: Electron 44.3.0, electron-builder 26.15.3, electron-updater 6.8.9 — 0 advisories (Codex, FIXES-2026-09-11.md). |
| RECHECK 5 — OTP reliability | Budget check-and-spend is one locked step. Resend runs under the challenge row lock, so it is serialised with verify and with other resends. A queued code email is dropped at send time if the code was replaced, used or expired. Tests added. |
| RECHECK 6 — release verification | Full suite + browser E2E + race + crawl above. |
| Route permission sweep ("327 unguarded routes") | About 220 store write routes now carry `permission:` middleware keyed to `config/permissions.php`. Unprotected store writes left: 118, all self-service (your own profile, appearance, notifications, layout, attendance, heartbeat). The ratchet (`permission_ratchet.yaml`) is lowered to 118, so a new unguarded route fails the build. Cashiers can still check out (`sales.create,pos.checkout`). |
| WooCommerce orders | Orders now post to the ledger through one idempotent poster (no duplicates on webhook retries; skips pending/failed/cancelled/refunded; revenue, tax and FIFO cost booked). The public Woo endpoints no longer answer 402 to every call (they had no store to check the plan against). |
| Other security | SSRF guard on user-supplied store URLs; password change/reset signs out other sessions and devices; the elevated-PIN endpoint no longer logs raw PINs or accepts the platform PIN as a store override; factory reset/delete are owner-only; dashboard edits are owner/admin-only; sort parameters are whitelisted; installer secrets are no longer logged; throttles on the remaining public forms; terminals list + disconnect in Settings. |
| **Bugs found by the browser run** | (1) Every page navigation re-wrapped the app layout, so React remounted each page and lost form state — a failed sign-in cleared the email box. (2) The signed-in browser POS heartbeat got 403 after the pairing change, so the licence timer never reset and the browser POS would eventually lock itself. (3) A store user who turned on 2FA was never asked for it. (4) Store settings (timezone, language) could leak between users through a shared cache key, so request times flipped between UTC and the store's zone; terminal heartbeats were also written hours off for stores outside UTC. (5) Local dev on any port other than 8000 broke every request ("Invalid URL"). All fixed, each with a test. |
| Content | Help Centre pages now have their own titles/descriptions (20 pages all shared "VenQore POS"). Two help articles contradicted the enforced plan limits (SKU caps, monthly sales caps); they now match `PlanFeatureMatrixSeeder`. Signup hint now says "We'll email your sign-in code here". |
| Test housekeeping | Four suite guards failed for reasons unrelated to the product: stale Ziggy route entries, the new `otp`/`2fa` route groups not declared, a registry-drift test that mis-read paths in this folder layout, and a reference bug in `tests/Scripts/update_suites.php` that silently overwrote registry entries. All fixed. |

## Round 1–2 changes (still true)

| ID | Status |
|---|---|
| SEC-01 … SEC-13 | Fixed and tested (see REPORT.md for each finding). SEC-04 and SEC-05 extended in round 3 as above. |
| AUTH-01 | Emailed 6-digit code for every email/password sign-in and signup; 5-minute expiry, single use, 5 tries, bound to the browser; per-email, per-IP and daily budgets (`VQ_OTP_*`). |
| AUTH-02 | Google needs a verified email; linking to an existing password account needs an emailed code first. |
| AUTH-03 | No "first signup becomes platform owner". Use `php artisan venqore:create-platform-owner`. |
| WEB-01 / 02 / 03 | Analytics only after consent and never for signed-in users; contact form confirms only on real success and uses Turnstile; favicons right-sized. |

## Deploy steps (in this order)

```bash
composer install                          # locally first: installs the updated lock
composer audit                            # expect no advisories
php artisan test                          # expect 2,638 passed, 0 skipped
composer install --no-dev --optimize-autoloader    # on the server
php artisan migrate --force
npm ci && npm run build
php artisan optimize:clear && php artisan optimize
php artisan venqore:manifest              # regenerates the system manifest the suite checks
php artisan venqore:rotate-join-codes
php artisan venqore:create-platform-owner you@venqore.com --name="Rehan"   # only if no owner exists
```

Keep a queue worker (`php artisan queue:work --tries=3`) and the scheduler (`* * * * * php artisan schedule:run`) running. Sign-in code emails go through the queue in production: no worker, no sign-ins.

## Only you can do this

**Before any customer data:**

- [ ] **Run `composer audit` once** on your machine to confirm "No security vulnerability advisories found" (the sandbox can't reach Packagist's audit feed). Then import one real spreadsheet as a smoke test.
- [ ] **After deploy, check the migration log** for two warnings from the new database guards: if any opening-stock batch has no cost, `chk_opening_batch_cost` is not added until you give it a cost (the log lists the batch ids).
- [ ] **Email sending:** set `MAIL_*` (Resend free tier or your host's SMTP), add SPF, DKIM and DMARC, and test a code into a real Gmail and Outlook inbox (not spam). The daily code budget is 90 (`VQ_OTP_GLOBAL_DAILY_BUDGET`); raise it when your provider allows more. If email is down, `VQ_EMAIL_OTP_REQUIRED=false` is the break-glass switch — turn it back on as soon as mail works.
- [ ] **Turnstile keys** in the production `.env`. Without them the public forms refuse requests in production.
- [ ] **Platform owner:** create it, sign in at `/VenQore-login`, set up the authenticator, keep the recovery codes offline.
- [ ] **Cloudflare / hosting:** proxy the hostnames, lock the origin, Full (strict) TLS, serve only `public/`, confirm `/.env`, `/storage/logs/laravel.log` and `/composer.json` return 404 live, MFA on registrar/host/Cloudflare accounts.
- [ ] **Backups:** one restore drill on staging; an off-site copy the live app can't delete.
- [ ] **Payments:** Lemon Squeezy live approval; sandbox-test duplicate/replayed/refund webhooks.
- [ ] **Confirm the trial wording:** the site now says "no credit card required" in the server-written pricing text. Make sure that is true for your checkout.

**Before the Windows app ships:**

- [ ] **Station on real hardware:** Electron 44 / electron-builder 26 are in (Codex; an unsigned build packaged and loaded serialport). Install it on a till and test printer, cash drawer, scanner, scale, the exit passcode, pairing a new and an existing till, disconnect/re-pair, and the manager-PIN pop-up.
- [ ] **Pair each existing till once** with a code from Settings → Terminals (tills paired before today have no secret and will show the pairing box).
- [ ] Decide on code signing.

**Before public launch of each journey:**

- [ ] Legal/contact facts (Okara vs Lahore), `hello@venqore.com` receives mail, privacy policy lists Google Analytics (consent-based), your email provider, Cloudflare, Lemon Squeezy and Google Drive.
- [ ] Search Console: verify and submit `https://venqore.com/sitemap.xml`.
- [ ] One pass on a real phone (signup, code entry, POS checkout) and one in Firefox or Safari.
- [ ] Plan names: pricing says Solo / Starter / **Core** / Scale, the in-app plan picker says **Growth** for the same plan. Pick one.

**Clean-up:** once you have reviewed and committed, delete `scratch/_claude_transfer/` in the AMD POS folder. Until then it is the undo button (see "Undo" below).

## Behaviour changes people will notice

- Every email/password sign-in asks for an emailed code. Google sign-in stays one click.
- Anyone who turns on 2FA is asked for it at every new sign-in. Platform admins must set it up.
- Only owners and admins can save store settings, change the plan, restore/delete backups, reset data or edit shared dashboards.
- Tills paired before today must be paired once more with a code.
- Store pages run on the store's own timezone and language setting.
- Changing or resetting a password signs out your other sessions and devices.
- Cashiers need a manager's PIN (pop-up on the till) to sell below cost or give a discount above their limit. Owners, admins and managers approve their own sales within their own discount limit.
- The legacy "refund to customer account" option on returns no longer changes the posting: a return reduces what the customer still owes first, then refunds the rest in cash.
- Money a customer overpays on a cash sale is kept as customer credit (2060), not booked as tax.
- Debit notes that name a bill must match that bill's supplier; stock goes back out of that bill's batch.
- A register's first use shows "Set up this register"; "Skip for now" works.

## Deliberately not done

- Session replay, sticky mobile CTA, app subdomain, sending subdomain: optional in REPORT.md.
- Paid tools (WAF add-ons, APM, device clouds, pen test, legal review): no budget approved.
- Offline PIN unlock on devices: PIN hashes are no longer sent to devices; a device-enrolment design is needed if you want offline staff unlock.
- POS sales have no client idempotency key. The till disables the button while a sale posts and offline sync is already idempotent, so a duplicate needs a network retry at exactly the wrong moment. Worth adding after launch.
- Long titles/descriptions on 27 pages (cosmetic).
- Non-recoverable input tax goes to expense (6000), as the product's rulebook says; under IAS 2 it would normally be added to stock cost. Your call.
- Pre-existing lint findings in `Pos.jsx` (14) and `PartnerSupport.jsx` (2): React-compiler style rules on old code, not bugs; left to avoid touching the till's core for style.
- Old data: returns made on the Returns screen before today don't carry `returned_quantity` on the original sale line (no production data yet, so nothing to back-fill).

## Undo

From the `AMD POS` folder:

```bash
git apply -R --directory=app-code/main-app scratch/_claude_transfer/main-round4.patch
git apply -R --directory=app-code/main-app scratch/_claude_transfer/main-round3.patch
git apply -R --directory=app-code/windows-app scratch/_claude_transfer/win-round3.patch
```
Test files that git ignores were overwritten in place; the originals are in `scratch/_claude_transfer/tests-before-round3.tgz` and `tests-before-round4.tgz`.
