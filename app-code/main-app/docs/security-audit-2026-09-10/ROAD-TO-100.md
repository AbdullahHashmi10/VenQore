# VenQore: evidence-based path to 100/100 launch readiness

Updated 11 September 2026. Current instructions and completion criteria; older reports remain historical evidence. Scope: the web application, customer data, paid subscriptions, and Windows Station. Nothing in this update deploys software, alters production data, sends mail or purchases services.

## What “100/100” means

100 means every acceptance gate below has evidence for the **same identified release and its intended operating environment**. It does not mean immunity from hacking, guaranteed uptime, unlimited free capacity or permanent compliance. A clean vulnerability feed is a dated finding, not “dependency security is perfect.”

The previous 73/100 overall score and 94/100 application-security score were subjective estimates without a defined scoring method. They should not be used for release approval or advertising. The previous 100/100 dependency rating meant zero known advisories, not comprehensive dependency security. This document replaces those estimates with 20 explicit gates worth five points each. Award five points only when every acceptance criterion for that gate passes; record evidence and reviewer. No partial credit merely for a status-document claim. Any critical security/data-integrity blocker prevents launch regardless of score.

**Current release score: not yet certified.** Two gates below have current direct evidence (dependency scans and frontend tests); the others have varying amounts of implemented work but need their final acceptance evidence. Do not interpret this evidence gap as “only 10% of the product is built.” Release approval and implementation progress are different measurements. Freeze the candidate under G01, bind evidence to it, then publish its score. A claimed test count by itself cannot establish it.

The previous “15 remaining actions” grouped several activities together. This plan separates them into **20 auditable gates: two currently evidenced and 18 still requiring completion or final verification**, plus optional paid enhancements. It adds explicit checks for the newer migrations, release provenance, monitoring and test coverage. It does not claim 18 new bugs or 18 tasks that only the founder can perform.

## Reconciliation of Claude's claims

| Claim | Evidence checked in this update | Conclusion |
|---|---|---|
| Changes applied with checksums | Recomputed every entry in `scratch/_claude_transfer/final-all.sha`: 443 matching main-app files, no missing or changed entries | Latest main-app transfer matches its manifest. This proves file consistency, not correctness or deployed state. The supplied “73 files” message concerns an earlier transfer. |
| Web dependencies clean | Fresh `npm audit --json`: zero vulnerabilities | Confirmed now. |
| Composer updates and QR installation still left to a human | Fresh Composer locked audit: zero advisories/abandoned packages; our prior verified installation includes endroid/qr-code 5.1 | Outdated claim; these upgrades were completed by Codex. Do not repeat `composer update` on production. |
| Electron/build-tool upgrades still left | Current Windows audit: zero vulnerabilities; earlier local build/smoke evidence records Electron 44.3.0 and builder 26.15.3 | Upgrade work complete. Physical hardware acceptance still open. |
| Frontend tests | Reran `npm test`: 126 passed in seven files | Confirmed for current source. The previous 103 result is historical. |
| 2,594 / 2,599 backend tests; latest status says 2,638, no skips | `REMEDIATION-STATUS.md` now describes round 4 with 2,638 tests / 21,670 assertions. New scenario/Hardening files exist and match the transferred manifest. The searched report and transfer locations did not contain a raw successful round-4 run matching that total. Existing `tests/reports/junit.xml` contains older failures and is not that evidence. | Reported by Claude, not independently reproduced in this update. Obtain the raw run or rerun G04; do not label old failures as current failures or assume old skipped counts still apply. |
| 45 browser checks, later 52; two-till race; 114-page crawl | Latest status describes these, but matching raw browser/race/crawl artifacts were not located in the searched locations | Claimed evidence to retrieve or reproduce. Not dismissed; not independently certified. |
| 118 “open” routes are all self-service | Ratchet ceiling is 118 and contains individual rationales including public tools, authentication, signed/token routes, webhooks, legacy stubs and self-service | “All self-service” is inaccurate. No `permission:` middleware does not automatically mean unauthenticated. Each route needs its applicable authorization/signature/ownership and abuse-control review under G06. |
| Terminal/OTP fixes | Current controller requires pairing for legacy terminals; token claim uses a conditional update; Station has pairing IPC and HKDF/AES-GCM; OTP budgets use a cache lock and resends a row lock; queued code validity is checked | Source implementations present. Earlier focused tests passed; final release concurrency/browser/hardware evidence is still required. “An old code is never emailed” is too absolute: a send-time check cannot retract an email already handed to the provider. |
| All human tasks only | New migrations alter existing inventory and can leave a constraint uninstalled; production and final-release evidence remains pending | Substantial implementation is real, but engineering verification and operator work both remain. |

My earlier independent backend run: 2,420 passed, 127 skipped, 44 incomplete, with two failures subsequently resolved and passed in targeted reruns. That result predates round 4. It must neither be advertised as the latest complete run nor used to accuse round 4 of retaining those placeholders.

## The 20 gates and exactly how to finish them

Owner labels: **You** means an account-owner action, business decision or possession of physical equipment; **Engineer** includes Codex once the necessary access is available. Time estimates are planning allowances after access is ready, not deadlines or promises. Provider approvals and DNS propagation may add waiting time.

### G01 — Freeze and identify the release (5 points; open)

**Engineer; no new service fee; allow 1–2 hours.** Review the combined dirty working tree, including both Claude and Codex changes. Preserve the transfer backups until review is complete. Select a release commit/tag; record main app and Station source identifiers, lockfile hashes, build identifiers and migration list. Recheck all transfer manifests relevant to the release, not just the earlier 73-file list. Retrieve Claude's final JUnit, browser traces, concurrency script/results and crawl output, including environment versions and source identifier. If absent, reproduce through G04/G05/G15/G17.

**Pass:** one immutable candidate, traceable evidence manifest, and no unexplained missing/extra security-related files. Subsequent relevant changes invalidate affected test evidence. A checksum manifest supplied by the same author proves transfer integrity, not an independent code review.

### G02 — Dependency audit and installation reproducibility (5 points; current scans passed)

**Engineer; no new service fee.** Current PHP, web and Windows audits are all clean. Preserve their JSON results with timestamps and candidate lock hashes. Use the committed lockfiles for installation. On the target host run `composer check-platform-reqs --no-dev`; install with `composer install --no-dev --optimize-autoloader`. On a build machine use `npm ci`, then build. Never ignore platform requirements on production merely because Windows testing ignored Horizon's Unix-only extensions. Schedule periodic advisory checks as a later operator action; none has been scheduled by this document.

**Pass:** no unaddressed applicable critical/high advisory, all other findings resolved or explicitly reviewed, reproducible locked installs and target platform requirements passing. Revalidate scans when locking the final release. Paid scanners are optional.

### G03 — Frontend regression suite (5 points; current run passed)

**Engineer; no new service fee.** Current `npm test` result is 126/126. Save output tied to the candidate. Maintain regression checks for retained login input, MFA setup, approval UI, error states and theme behavior. Re-run when those sources change. This gate does not replace browser, accessibility or production build checks.

**Pass:** the declared frontend suite passes without suppressed failures on the frozen candidate. There is no requirement to reproduce an arbitrary historical test count after legitimate test changes.

### G04 — Latest backend and coverage evidence (5 points; open)

**Engineer; local resources or existing staging; several hours including failures.** Use a separately provisioned disposable database; independently verify its host/port/database before any migration or RefreshDatabase test. Match production PHP/database versions as closely as possible. Run the declared Unit/Feature suite and the applicable Routes/Performance suites; state exactly what ran. Save JUnit and console output. Confirm the replaced scenario tests actually perform financial/state assertions. “Covered elsewhere” tests that merely verify another method exists are links, not independent behavioral coverage. Review conditional skips and every uncovered critical path; zero skips is not achieved by deleting meaningful tests or weakening expectations.

**Pass:** all relevant tests pass, all scope exclusions are justified, and critical authentication/tenant/payment/ledger paths have behavioral evidence. Reconcile the claimed 2,638 result with actual suite discovery and source hash. Do not run `php artisan test` against an unverified existing database configuration.

### G05 — Browser authentication and core journeys (5 points; open)

**Engineer with approved test accounts; You supplies inboxes; allow half a day.** On staging run signup → wrong/expired/replayed OTP → correct OTP; confirm no account/workspace access beforehand. Test password login and Google signup, existing-account linking and returning Google login. Test enabled MFA on all relevant entry points, recovery use/reuse, stable setup secret after a wrong code, password reset and session revocation. Include store creation, a sale, refund, contact form and unknown-page 404. Inspect browser console/network responses, database effects and authorization failures. Use rate-limit-aware test fixtures rather than exhausting the real provider quota.

**Pass:** trace/screenshots and assertions for success and failure branches on the final release; no authentication bypass and no success message after failed persistence. Retrieve or reproduce Claude's 52 checks. Real inbox delivery is additionally G08.

### G06 — Route and tenant authorization review (5 points; open)

**Engineer; no new service fee; allow half to one day.** Export the final route list with middleware. Categorize every ratchet exception as public, self-service, webhook, authentication, legacy no-op or another justified category. Review handler-level ownership and signature checks, not route names alone. Test guest, ordinary staff, cashier, manager, owner, suspended/removed member and platform roles using two stores. Attempt cross-store IDs on payments, uploads, exports, settings, approvals and the new V3 fixes. Exercise browser sessions and API tokens separately. Compare baseline edits and checksum changes to reviewed rationales.

**Pass:** no unexplained authorization exception; all applicable negative tests pass; the guard rejects a new unauthorized write route. Never raise the ratchet or change expected status codes simply to obtain green tests. A total of 118 does not by itself prove security.

### G07 — Production data migration safety (5 points; open, launch blocker)

**Engineer + You for actual inventory values; existing staging/storage; allow several hours.** Restore a production-like backup on staging. Inspect pending migrations and take a before-state export of affected batches, purchases/debit notes and serial identifiers. The new remaining-quantity migration clamps negative quantities to zero for non-`negative_stock` batches; this is a business-data change, not just adding a constraint. Investigate affected rows and approve a reconciliation before production execution. The opening-cost migration logs invalid rows and returns without adding its CHECK constraint; migration success therefore does not prove the guard exists.

Read-only preflight queries on the verified database:

```sql
SELECT id, tenant_id, batch_type, remaining_qty, unit_cost
FROM inventory_batches
WHERE (remaining_qty < 0 AND batch_type <> 'negative_stock')
   OR (batch_type = 'opening' AND (unit_cost <= 0 OR unit_cost IS NULL));

SELECT CONSTRAINT_NAME
FROM information_schema.TABLE_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = DATABASE()
  AND TABLE_NAME = 'inventory_batches'
  AND CONSTRAINT_NAME IN ('chk_remaining_qty_positive', 'chk_opening_batch_cost');
```

**Pass:** affected data reconciled against records, both intended constraints verified, negative-stock policy preserved, serial/debit-note migrations tested, and stock valuation/trial balance unchanged except for approved corrections. If a migration already returned without adding a guard, use a reviewed corrective migration/command after fixing the data; do not blindly run `migrate:refresh` on production. Keep APP_KEY and an independently restorable backup safe.

### G08 — Real email and OTP operations (5 points; open, launch blocker)

**You: provider/domain ownership; Engineer: integration and tests; free allowance initially, upgrades require approval.** Choose a sender that actually supports outbound transactional mail. Domain inbox forwarding alone is not enough. Use the provider's exact SPF/DKIM records and verify DMARC alignment; do not invent a DKIM value or add conflicting SPF records. Configure credentials privately on the host, not in this report/chat. Send approved test signup/login, reset and invitation messages to Gmail and Outlook, inspect spam and authentication headers, and test links on the production hostname.

Run and supervise the queue worker and scheduler, test a restart, inspect failed jobs, and confirm queue age stays comfortably below the five-minute OTP expiry. The current 90/day cap covers signup, login and resends; other transactional messages also consume the provider allowance. Warn before exhaustion, prevent billable overages, and reduce signup intake if needed. Do not automatically disable OTP when email is unavailable.

**Pass:** actual authenticated messages arrive and work; worker recovery and expiry behavior demonstrated; documented daily/monthly capacity and operator response. Cloudflare now documents its [Email Service](https://developers.cloudflare.com/email-service/); verify outbound availability and terms for the chosen account rather than assuming any “free forever” repository includes delivery. If considering Resend, use its [current pricing/limits](https://resend.com/pricing). No provider purchase is required by this plan.

### G09 — Turnstile and abuse limits (5 points; open)

**You: account/key ownership; Engineer: configuration and verification; free tier where available.** Create production keys for the actual hostnames, configure server secret privately, and test valid, missing, expired and reused challenge responses. Verify public forms do not fail open when production configuration is missing. Test OTP and costly AI/import/report endpoints with bounded request volumes on staging; verify limits by IP/account/store and globally. Behind Cloudflare, validate trusted proxy/client-IP handling so spoofed headers cannot evade limits or put every user in one shared bucket.

**Pass:** rejected attempts create no account, email, record or paid upstream call; legitimate requests remain usable; worker/backlog and spending ceilings hold under concurrency. Redis is not required if the existing database/cache implementation passes these tests.

### G10 — Real administrator and secret protection (5 points; open)

**You + Engineer; normally no additional fee.** Create/confirm the legitimate platform owner using the controlled command, enroll authenticator MFA and store recovery codes privately. Enable MFA on hosting, domain registrar, Cloudflare, email and payment accounts. Use least-privilege deployment/database credentials. Review active platform admins, unused tokens and test accounts. Scan final source history/release archives/browser assets for private credentials, printing redacted results only; rotate confirmed exposed keys. Public Turnstile site keys and analytics IDs are not passwords.

**Pass:** authenticated owner/recovery flow proven, no unauthorized privileged accounts, secrets absent from publicly served artifacts, and recovery does not depend on a single person losing one phone.

### G11 — Cloudflare, origin, TLS and cache isolation (5 points; open, launch blocker)

**You: hosting/Cloudflare access; Engineer: configuration and evidence; existing/free capability where supported.** Verify each web hostname is proxied; preserve mail-specific DNS. Configure strict end-to-end TLS and certificate renewal. Use supported firewall, authenticated-origin or tunnel controls to prevent direct-origin bypass; hiding the IP is insufficient. Keep the database private. Serve only Laravel `public/` and block private paths/archive copies. Check safe responses for `/.env`, logs and composer files without exposing their contents. Ensure authenticated pages/API data never enter shared CDN caches. Test Google/payment callbacks without broadly exempting the app from protections.

**Pass:** hostname/redirect/TLS/origin and two-user cache tests succeed, edge limits recorded, and no private file/database exposure. Follow [Cloudflare's origin-protection guidance](https://developers.cloudflare.com/fundamentals/security/protect-your-origin-server/). If shared hosting cannot enforce essential controls, request a supported alternative or postpone the affected launch; an upgrade may cost money. No live flood attack is needed or authorized.

### G12 — Final builds, host compatibility and deployment (5 points; open)

**Engineer with host access; existing hosting; allow several hours.** Build the frozen release on staging, including client/SSR/font/theme/design/route checks. Run config guard and resolve all findings. Verify target PHP/database support and extensions; plan upgrades for unsupported database versions rather than equating a passing old local database test with supported hosting. Install the updated locked packages, configure production environment, execute only reviewed migrations, generate the system manifest, and build caches. Confirm workers/SSR/broadcasting and scheduler use the intended current release after restart. Ensure the dev-server `public/hot` marker and development/test/transfer archives are excluded from deployment.

**Pass:** identical release passes staging and production smoke checks, `APP_DEBUG=false`, private config protected, required background processes healthy, release hash recorded and rollback ready. Laravel's [deployment guidance](https://laravel.com/framework/docs/12.x/deployment) documents public-root serving and configuration/caching requirements. Build once and promote tested artifacts where supported. Production is not the place to resolve new package versions.

### G13 — Backups and recovery (5 points; open, launch blocker)

**You: independent storage/account ownership; Engineer: drill; existing capacity first, extra storage may cost.** Take database and required private-file backups; retain encryption key/recovery material separately and securely. Keep a copy the live application credentials cannot delete. Restore to an isolated staging instance and verify users, stock, ledger, attachments and encrypted data can be read. Agree acceptable data loss and restoration time before the drill; record achieved values. Test scheduled backup failure alerts and restoration after a bad release.

**Pass:** a timed restore produces correct data and working authentication; backup age and recovery meet your agreed targets. A successful export or existence of a backup file is not a restore test. Do not roll back a database blindly after accepting new sales.

### G14 — Payments and subscription lifecycle (5 points; open if charging)

**You: merchant approval; Engineer: tests; transaction/live-test fees may apply.** Complete provider onboarding, verify signed webhook secrets and production URLs. Test plan/add-on purchase, success/cancel, failed renewal, refund and subscription changes. Replay duplicate/out-of-order webhook events and ensure one entitlement/payment effect. Verify tax/invoice/refund responsibilities against the chosen provider and your actual business. Obtain explicit approval before a real-card test involving charges.

**Pass:** paid access and ledger match provider events, no duplicates or cross-store entitlement changes, live credentials/approval confirmed. A free pilot can leave charging disabled and document this gate as outside its scope; it cannot claim the paid product is complete.

### G15 — Financial, inventory and concurrent-sale acceptance (5 points; open)

**Engineer + You for realistic sample workflows; no new service fee; allow half to one day.** On the frozen candidate test actual spreadsheet import, opening stock, sale, split payment, partial then full returns, tax, cartons/UOM, freight/discounted purchases, supplier refund and sale-order conversion. Check exact journal lines, stock/FIFO quantities, balances and named approving manager where required. Reproduce two tills selling the last unit simultaneously; verify configured negative-stock policy in each mode. Repeat offline retry/reconnect without duplicate sales or ledger entries.

**Pass:** raw race evidence, one expected result per request, precise inventory/ledger reconciliation and cross-tenant refusal. The many round-4 money fixes make this necessary even though earlier sales tests passed. Unit counts do not replace realistic business acceptance.

### G16 — Windows Station and existing tills (5 points; open for Windows release)

**You: physical devices; Engineer: observe/debug; no new fee using existing hardware.** Install the final package on representative supported Windows PCs. Pair a new till and re-pair a legacy till, test wrong/expired/reused codes, revoke then re-pair. Exercise printer widths, scanner input, drawer, scale, manager/exit PIN, offline licensing, reconnect, queued telemetry if enabled, and the approved update path. Verify local screen-capture behavior is intentionally enabled and explained to affected users; leave unused telemetry off. Confirm packaged native modules, IPC sender checks and navigation controls work under Electron 44.

**Pass:** recorded results with device models/package hash; no credential bypass, lost sales or unsupported mandatory peripheral. Earlier successful packaging/serialport loading is useful but is not this test. Code signing is an optional paid distribution decision; remain explicit if shipping unsigned.

### G17 — Website/mobile/accessibility/discovery checklist (5 points; open)

**You supplies phone/browser access if needed; Engineer performs checks; free tools initially.** Reconcile all original 37 Notion and 20 screenshot rows against the final site. Crawl public routes for actual 200/404 status, unique accurate titles, descriptions, canonical URLs, robots/sitemap and no indexing of private areas. Check OG preview, favicon, compressed images, meaningful alt text (empty for decorative images), loading/error/confirmation states, primary CTA and keyboard/form labels. Test a real phone plus another browser engine, zoom and layout stability. Measure representative page performance under realistic throttling; fix unusable results. Sticky mobile CTA and a separate thank-you page are design choices, not universal security requirements.

Verify Search Console and submit the sitemap when the production domain is ready. Evaluate long titles/descriptions for clarity; arbitrary length thresholds are not an absolute Google rule.

**Pass:** every original checklist row has evidence or a reasoned not-applicable decision; core journeys usable across the target devices; no broken public routes/forms or accidentally public customer data. Cosmetic/SEO improvements can be scheduled after a controlled pilot, but then this full-product gate remains open.

### G18 — Business truth and privacy (5 points; open)

**You decides facts; Engineer updates product; paid professional review optional depending on needs.** Resolve Core versus Growth across marketing, application and billing. Confirm trial/card requirements and enforced limits. Confirm company name, actual address (Okara/Lahore), contact inbox and support owner. Review policies against actual data collection, retention, deletion/export, processors and international transfers; include analytics, email, Cloudflare, payment provider and Google Drive where used. Test consent decline/accept/withdrawal with browser network inspection. Determine jurisdiction-specific requirements with qualified advice when needed; this report is not a legal certification or a requirement to buy a lawyer's signature.

**Pass:** no known contradictory business facts or misleading security promises; published notices reflect actual operations and consent behavior. Never market the product as “100% secure.”

### G19 — Alerts, incident response and capacity (5 points; open)

**You names an operator; Engineer configures; local/existing tools first.** Define alerts for failed OTP/jobs, approaching send/spend quotas, 5xx/latency, storage growth, failed backups and privileged access. Trigger a test event and prove an operator receives it. Write actions for disabling an affected feature, revoking sessions/keys, preserving logs and restoring service. On staging, run a bounded capacity test at the expected pilot load plus an agreed margin; inspect CPU/memory/database/queue behavior and safe rejection under overload. Do not use a production DDoS flood as a test.

**Pass:** alert delivery, operator ownership and recovery runbook proven; acceptable latency/throughput and finite resource/spend limits recorded. Suggested initial targets to agree: OTP delivery within 60 seconds, no accounting duplication, and no sustained 5xx rate over 1%; tune for actual traffic and sample size. Hosted monitoring is optional and may cost money.

### G20 — Controlled release and final acceptance (5 points; open)

**You approves launch scope; Engineer executes with access.** Start with a limited number of stores, defined daily signup volume and a support contact. Confirm G01–G19 for the selected scope, review unresolved risks and rollback triggers, then promote the release. Watch errors/latency and key journeys for at least 15 minutes and through a representative trading cycle. Stop or restrict the affected workflow on an authentication bypass, cross-store exposure, incorrect ledger/stock result, persistent OTP outage or failed recovery protection. Use the rehearsed rollback/reconciliation plan; preserve newly accepted transactions.

**Pass:** candidate/source/evidence records agree, critical journeys work live, monitoring is healthy, operator can recover, and the owner signs the acceptance record. Only then award 100 for this scope/date. Continued maintenance, expiring credentials, new advisories and subsequent releases reopen relevant gates.

## Your personal to-do list

You do not need to perform all engineering commands yourself. Your indispensable inputs are:

1. Give access through the appropriate secure account/host mechanism to the sending domain, hosting and Cloudflare; keep credentials out of report files.
2. Choose the free-budget email arrangement, approve test recipient inboxes and the initial signup/capacity limit.
3. Enroll the actual platform owner and infrastructure accounts in MFA; privately retain recovery material.
4. Supply true business/contact details, choose Core or Growth, and confirm card/trial wording and operating jurisdictions.
5. Provide merchant approval/payment account setup if charging, and approve any test charge beforehand.
6. Provide a representative till/phone and peripherals, and re-pair existing tills once.
7. Provide independent backup access, agree recovery/data-loss targets, identify the incident operator, and approve final pilot/release scope.

With access, Codex can help configure services, inspect DNS, execute staging checks, collect evidence and prepare deployments. Access limitations are not proof that the task is intrinsically human-only.

## Budget and order of work

**No new spending is authorized.** Dependency updates, local tests, source review and most configuration use existing resources. Email free tiers have finite daily/monthly limits. Existing hosting/domain bills still apply. Extra storage, hosting capacity, outbound mail beyond quota, code signing, hosted monitoring, professional legal/security reviews and real payment transactions may cost money; keep them explicitly deferred unless necessary protection cannot be achieved safely with existing capacity. Do not expose an unsafe feature while postponing its protection.

Suggested order: G01–G07 establish the candidate and data safety; G08–G13 establish access, delivery, hosting and recovery; G14–G19 complete real-world acceptance; G20 is the final release decision. Several independent tasks can proceed together. Allow multiple focused work sessions plus provider/DNS waiting time; promising an unrestricted same-day launch before seeing the host and current data would be misleading.

For each gate store: candidate hash, environment/version, test date, actor/reviewer, steps, expected/actual result, redacted evidence path, cost approval if any, and PASS/OPEN/BLOCKED. Keep all 20 in the denominator for this full-product scope. A web-only or free-pilot score must be explicitly named as that narrower scope; do not silently remove difficult gates to inflate it.
