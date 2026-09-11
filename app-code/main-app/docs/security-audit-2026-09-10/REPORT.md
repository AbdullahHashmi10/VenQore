# VenQore pre-launch security audit — 10 September 2026

**11 September update:** [Remaining remediation completed locally](FIXES-2026-09-11.md) records patched dependencies, build/test evidence and remaining account-access/hardware launch checks. Use that update for current status; this document retains the original findings and master checklist.

**Remediation update:** see [Independent recheck of Claude's changes](RECHECK.md) for current evidence, fresh dependency counts and unfinished engineering work. Findings below preserve the original audit; do not interpret their original state as a claim that no remediation has since occurred.

**This is now the master launch plan.** It contains the original security findings plus an [integrated checklist](#integrated-startup-and-website-checklist) covering all 37 Notion checks and all 20 screenshot checks, with duplicates cross-referenced. Use the [execution queue](#single-execution-queue) to decide what to do next. The third-party lists are suggestions evaluated against VenQore, not instructions or automatic evidence of compliance.

**Budget constraint: no new spending authorized.** Cost labels are attached to every execution-queue row. Keep paid options in the plan as deferred; prioritize the [zero-additional-budget approach](#budget-and-free-email-options) and [DDoS/data-protection gates](#ddos-and-customer-data-protection). Existing hosting/domain bills, development time and service quotas are not assumed to be free.

**Decision: NO-GO for an unrestricted customer-data launch in the reviewed state.**

This audit found **13 distinct application security findings: 1 critical, 8 high, 4 medium**. These are reviewed code defects/design weaknesses, with three isolated controller/resolver probes. They are not 13 successful attacks against a deployed server. Dependency scanners separately flagged **31 web npm packages, 24 Windows npm packages, and 11 PHP packages (44 PHP advisory entries)**. Do not add these numbers together as a count of distinct exploits: dependency chains and advisories overlap.

The critical issue lets an administrator of one store target a global user identity through legacy account-management routes. Other launch blockers concern revoked staff access, backup authorization, terminal authentication, platform login, import files, and desktop hardware access.

## Scope and confidence

Reviewed the current working tree under `app-code/main-app`, plus Windows main/preload/shell files and the small mobile `lib` tree. Inspected public and authenticated route groups, authentication, tenant scoping, authorization, backup/Drive integration, installer/updater, telemetry, webhook signature handling, selected file/import and rendering paths, deployment configuration, dependency locks, and test configuration. Existing uncommitted application changes were preserved.

This is a time-bounded source audit and isolated testing exercise, **not an exhaustive review of every function or a production penetration-test certification**. No deployed URL, hosting configuration, production accounts, release artifact, or production database was tested. No real accounts were modified, telemetry sent, backups restored, or customer records accessed. The PHP integration suite was not run: its documented database lifecycle includes `migrate:fresh`; an independently verified disposable database is required first. Financial correctness, browser checkout flows, backup recovery, concurrency, mail delivery, and live billing remain launch gates.

Evidence files beside this report:

- `isolated-probes.php` and `probe-results.json`: actual controller/resolver code, mocked persistence, no app boot or database.
- `npm-main.json`, `npm-windows.json`, `composer.json`: complete registry audit output.
- `frontend-test-results.txt`: existing frontend suite passed, 4 files / 103 tests. These tests do not establish backend authorization or launch readiness.

Line references below are relative to `app-code/main-app` unless explicitly identified as Windows files. They refer to the reviewed working tree and may shift as edits continue.

## Findings and required fixes

### SEC-01 — Critical: legacy store administration can modify global user accounts

**Evidence:** `routes/web.php:1937–1938`; `app/Http/Controllers/AdminController.php:627–705,792–804`; `app/Models/User.php:33`. Legacy routes require store settings and user-management permissions, but `updateUser()` and `destroyUser()` use global `User::findOrFail($id)`. Update changes name/email/password before any membership handling. Delete only rejects the acting user's own ID. User is a global identity model without tenant scope. The safer `authorizeMemberAction()` used by newer methods is absent here.

**Impact:** a privileged user in store A can reset another global user's password or soft-delete their account, including users outside A. This potentially reaches platform-owner identities. The deletion controller probe confirmed that actor 7 reaches deletion of unrelated user 900 with no membership query; persistence was mocked. Password replacement is established by source tracing, not a live account takeover.

**Change before launch:** remove the legacy account mutation routes or route them through strict membership policies. Store staff management should mutate store membership, not global login credentials. Deny platform-account targets and enforce role hierarchy server-side. Scope all target lookups before mutations; audit both newer and legacy paths.

**Acceptance:** two stores and a platform account in a disposable test database; admin A cannot edit/delete B's users, the platform user, or promote itself through either route family. Expect 403/404 and unchanged rows.

### SEC-02 — High: saved store IDs bypass membership revocation

**Evidence:** `routes/api.php:26–34`; `app/Http/Controllers/Api/SyncController.php:18–21,27–50,159–190`; `app/Traits/HasTenant.php:36–70`; `app/Http/Middleware/ApiTenantResolver.php`. Sync authenticates the global account but trusts `last_store_id`. The tenant trait also falls back to that ID without checking active membership. ApiTenantResolver's refusal to bind a revoked membership is insufficient if later model scopes use the stale fallback.

**Impact:** a still-authenticated suspended/removed member can retain access to store data, including raw-query inventory and staff sync. Batch sync also binds that store and calls sale creation without the usual route-level permissions. Exact downstream sale effects need HTTP tests. The resolver probe confirmed store ID acceptance without a membership lookup.

**Change before launch:** mandatory active-membership resolution for every store API; fail closed when absent. Remove unverified `last_store_id` fallback from model read/write scope. Apply operation permissions, subscription limits and token abilities to sync, and revoke tenant/device access on membership changes.

**Acceptance:** suspended/deleted memberships with existing session and bearer token cannot read sync data or submit sales. Verify both JSON APIs and legacy routes; still-active members retain only their assigned permissions.

### SEC-03 — High: store members can reach destructive backup and Drive operations

**Evidence:** `routes/web.php:450–472`; `app/Http/Controllers/VqBackupController.php:112–184,194–331`; `app/Http/Controllers/GoogleDriveAuthController.php`. Export has `permission:data.export`, but import and Drive download/delete/restore/sync routes lack equivalent role authorization. Controller methods check store context, not actor permissions. Module/plan availability is not an authorization policy.

**Impact:** a low-privilege active member can restore an available valid encrypted backup, roll back transactions and staff membership, or delete connected Drive backups. Import requires a valid encrypted `.vq`; this is not evidence that arbitrary plaintext can be decrypted. Drive restore offers a path using existing backups when their IDs are available.

**Change before launch:** dedicated owner/admin policies for restore, delete, Drive linkage and export; recent password/MFA confirmation for restore; tenant-bound backup manifests, allowlisted tables and schema validation; upload limits, audit records and a tested rollback snapshot. Exclude security identities/permissions from routine business-data restoration unless separately authorized.

**Acceptance:** cashier/viewer requests fail before any filesystem, Drive or database operation. Restore a fixture into a disposable tenant and verify balances, references, and membership invariants.

### SEC-04 — High: public terminal telemetry accepts forged store activity

**Evidence:** `routes/api.php:12–18`; `Api/TerminalActivityController.php:17–80,88–132,168–174`; `Api/HeartbeatController.php:48–137` under `app/Http/Controllers`. Activity creation accepts arbitrary device IDs and a store slug even when no terminal exists. Its initial terminal-claim path also lacks the pairing-token check present in heartbeat. Existing-terminal heartbeat relies on identifiers, not a device credential.

**Impact:** anonymous callers can insert fake activity into a named store. This was confirmed by the isolated controller probe returning 200 for an unregistered device. Screenshot upload treats device ID as authentication and writes caller-selected basenames in a shared directory, permitting collisions if a valid device identifier is known. Screenshot encryption derives its key from that same identifier; it is not an independent secret and CBC does not authenticate ciphertext.

**Change before launch:** disable telemetry until devices have revocable random credentials established by pairing. Verify device/store binding on every request; use timestamp/nonce or equivalent replay protection, bounded activity batches, server-generated tenant/device-specific screenshot paths and authenticated encryption with secret keys. Never allow activity submission to claim a terminal.

**Acceptance:** unpaired and wrong-store devices cannot create/update anything; replay and filename collision tests fail safely; invalid ciphertext is rejected.

### SEC-05 — High: platform-owner login permits a short PIN with no enforced MFA

**Evidence:** `app/Http/Controllers/Auth/PlatformOwnerAuthController.php:88–115`; `routes/auth.php`; `app/Http/Middleware/Require2FA.php`; `bootstrap/app.php`. PIN login accepts 4–8 characters, scans platform administrators for a match and creates a remembered login. Throttling is per IP only. Require2FA exists but is not registered in the reviewed routes/bootstrap/providers, and the platform login does not challenge MFA.

**Impact:** a short platform PIN is a standalone credential for the most privileged account; distributed guessing defeats an IP-only ceiling. Merely having a 2FA controller does not provide protection.

**Change before launch:** disable public platform PIN login. Require strong password plus MFA; register challenge/enrollment routes and enforcement on every platform entry point; add per-account and global abuse limits and session revocation. Remove the unconditional test bypass when writing MFA-specific tests.

**Acceptance:** password or PIN alone cannot create a usable platform session, including direct navigation/API calls. Test remembered sessions, recovery codes, logout and password change.

### SEC-06 — High: Windows hardware bridge lacks an origin boundary

**Evidence:** `app-code/windows-app/shell.html:41–43`, `shell-renderer.js:32–34`, `preload.js`, `main.js:418–427` and other IPC handlers. The webview receives privileged hardware APIs; navigation/window-origin restrictions and IPC sender validation are absent from the reviewed code. `allowpopups` is enabled. The local shell has Node integration and no context isolation; the remote guest correctly has Node disabled and context isolation enabled.

**Impact:** navigating the privileged guest to untrusted content can expose printing, cash-drawer, serial and other bridge capabilities. Main-process handlers do not independently check the sender. **No arbitrary native-code execution was demonstrated**; the local shell's Node settings alone are not proof that the remote site can run Node.

**Change before distributing Windows builds:** allowlist the exact HTTPS application origin, block unexpected navigation and new windows, validate IPC sender/frame plus arguments, restrict external-link schemes, minimize preload APIs, isolate/sandbox the shell and upgrade Electron/dependencies. Follow [Electron's security guidance](https://www.electronjs.org/docs/latest/tutorial/security).

**Acceptance:** navigate a test guest to a local untrusted page and prove it cannot invoke hardware APIs; malformed IPC cannot change preferences or open arbitrary schemes. Re-test printer/scanner workflows on actual hardware.

### SEC-07 — Medium, deployment-dependent: installer exposure depends on one marker file

**Evidence:** `app/Http/Middleware/InstallerLock.php:20–24`; `routes/web.php:973–1047`; `bootstrap/app.php:77–84`. Missing `storage/installed` opens installation APIs without authentication. The diagnostic endpoint returns configuration metadata and a tail of the application log. Installer APIs are CSRF-exempt.

**Impact:** during a fresh deployment or lost marker, visitors can reach setup and diagnostic functions. Installed production exploitability was not verified. Log contents may include sensitive details; the diagnostic does not directly return the database password.

**Change:** disable web installation in production or require a one-time secret plus restricted network access; keep diagnostics local-only. Verify installed state before enabling traffic.

**Acceptance:** production configuration denies installation/diagnostics even when the marker is removed in a disposable environment.

### SEC-08 — Medium: authenticated updater is exempt from CSRF

**Evidence:** `bootstrap/app.php:81`; `routes/web.php:1059–1065`; `app/Http/Controllers/UpdaterController.php:137–163`. Session authentication does not replace CSRF protection. The POST endpoint selects state-changing steps from request input.

**Impact:** cross-site/same-site attacker-controlled content may initiate update operations in a privileged session where browser cookie delivery permits it. Production's configured SameSite=Lax reduces ordinary cross-site POST exposure; no full browser exploit was demonstrated. This is not a finding that unauthenticated ZIP upload is allowed.

**Change:** restore CSRF validation, send tokens on chunk uploads, require recent privileged authentication, and bind update tokens to a session/job with expiry and strict step order. Prefer deployment outside the web application.

**Acceptance:** all updater mutation requests without valid CSRF and authorization fail before maintenance or filesystem changes.

### SEC-09 — Medium: public error reporting has no application rate limit

**Evidence:** `routes/web.php:1079`; `bootstrap/app.php` CSRF exclusions; `app/Http/Controllers/Api/ErrorReporterController.php:15–40`. Anonymous callers can submit database-backed reports. Individual strings have limits but no route-level throttling or aggregate budget exists here.

**Impact:** varying report content can create storage/processing pressure and corrupt monitoring signal. No load test was performed; hosting/WAF controls were not inspected.

**Change:** per-IP/session and global limits, retention/quotas, sampling and bounded deduplication. Handle missing nullable fields with defaults.

**Acceptance:** burst requests produce 429; unique-message floods remain bounded; legitimate minimal reports return a successful response without undefined-key errors.

### SEC-10 — High: general sync exports staff PIN hashes

**Evidence:** `app/Http/Controllers/Api/SyncController.php:27–50` returns `tenant_users.pos_pin as passcode` through the authenticated sync route. PIN setters allow short PINs. This raw query bypasses model-hidden fields.

**Impact:** any user with access to the endpoint can obtain all active staff's PIN verifiers and attempt offline guessing; online throttle controls cannot stop offline guessing. SEC-02 extends exposure to stale memberships. These are hashes, not plaintext passwords.

**Change:** remove this response from ordinary sessions; redesign offline authentication around device enrollment, least-privilege offline credentials and revocation/expiry. Do not distribute privileged online staff credentials as an offline convenience.

**Acceptance:** ordinary user sync responses never contain PIN/password hashes; offline login remains constrained to the enrolled device and approved capabilities.

### SEC-11 — High: join code reactivates suspended membership

**Evidence:** `app/Http/Controllers/StaffController.php:261–285`; `routes/web.php:381–382`. Only an existing *active* membership takes the early return. All other states go through `updateOrCreate(... status => active, role => cashier)` using the store join code.

**Impact:** suspended staff who retain the shared join code can restore their own access. The route also lacks a dedicated code-guessing rate limit in the reviewed registration.

**Change:** deny self-reactivation of suspended/removed memberships; require owner approval, revocable expiring invites and rate limits. Rotate exposed join codes.

**Acceptance:** a suspended fixture knowing the correct join code stays suspended and receives 403; normal valid invitations still work.

### SEC-12 — Medium: Drive OAuth state is not single-use or session-bound

**Evidence:** `app/Http/Controllers/GoogleDriveAuthController.php:27–40,57–108`; `routes/web.php:359–360`. State encrypts tenant ID/slug without a nonce, expiry or actor binding. The public callback uses `stateless()` and writes Drive tokens to that tenant without rechecking initiating membership.

**Impact:** a previously obtained state remains usable after membership revocation and can bind a newly authorized Drive account to that tenant. Encryption prevents fabricating another tenant's state but does not provide freshness or proof of the current actor. A full Google OAuth exchange was not performed.

**Change:** store a random expiring one-time state tied to authenticated user, tenant and intended action; consume it once; recheck backup-admin permission at callback. Treat token/link changes as audited security actions.

**Acceptance:** expired, replayed, wrong-session and revoked-member callbacks fail before token persistence.

### SEC-13 — High: import processing accepts caller-selected server paths

**Evidence:** `app/Http/Controllers/ImportMappingController.php:14–31,137–156`; `routes/web.php:560–562,1908–1911`. Processing accepts arbitrary `file_path`, concatenates it to `storage/app/`, checks only existence and passes it to spreadsheet imports. Uploads share `temp_imports` and use a timestamp plus client filename, without an owner-bound import handle.

**Impact:** a user allowed to import can select another tenant's temporary spreadsheet or traverse outside the import directory to a parser-readable file. This can cross tenant boundaries or process unintended local files. It is not proof that any arbitrary server file is returned verbatim or that the scanner's SSRF/RCE advisory is exploitable here.

**Change before enabling imports:** use an opaque random import ID stored with tenant/user ownership and expiry; resolve paths server-side within a canonical allowlisted directory. Restrict types, compressed/uncompressed sizes and processing time. Upgrade spreadsheet dependencies before processing untrusted files.

**Acceptance:** other-tenant handles, `../` paths, absolute paths, expired handles and oversized/hostile files fail before parser invocation.

## Dependency results

| Component | Critical | High | Medium/moderate | Low | Count meaning |
|---|---:|---:|---:|---:|---|
| Web npm | 2 | 19 | 8 | 2 | 31 flagged packages, including dev/transitive chains |
| Windows npm | 1 | 17 | 5 | 1 | 24 flagged packages, including build tooling |
| Composer | 3 | 16 | 20 | 5 | 44 advisory entries across 11 PHP packages |

Composer severity totals must be read alongside `composer.json`; individual advisories can depend on optional extensions or a particular call path. Web npm critical entries are `shell-quote` and its affected parent `concurrently` (one dependency chain, development tooling). Windows critical entry is `tar`. PHP critical advisories include `mtdowling/jmespath.php` CompilerRuntime injection and two PhpSpreadsheet advisories. The app has spreadsheet import paths, so parser upgrades and hostile-file tests are a launch priority; JMESPath CompilerRuntime reachability was not demonstrated.

Do not use `npm audit fix --force` blindly. Upgrade direct dependencies and their resolved trees in an isolated change, review advisory prerequisites, rebuild client/SSR and Windows packages, run relevant tests and rescan. Some fixes may require a major version or replacing a package. npm's `dev` label is not sufficient to dismiss a dependency: this project puts runtime browser libraries such as React/Axios in devDependencies.

## What is already helping

- Lemon Squeezy signature middleware and Pusher webhook code reject missing secrets/signatures; Pusher also checks timestamp age.
- TenantMiddleware and some newer membership mutation methods explicitly check store membership/authorization.
- Production env template uses production mode, debug off, secure cookies and database-backed cache/session/queue settings. These are template observations, not proof of live deployment settings.
- Backups use Laravel authenticated encryption, and imports overwrite row tenant IDs. These controls do not replace authorization or reference validation.
- Windows remote guest already disables Node integration and enables context isolation.
- Existing test bootstrap recognizes production-database hazards; verify the actual database independently before running migration-based suites.

## Launch sequence and effort

Estimates are engineering planning ranges, not a promised completion time. Several fixes can overlap only if assigned separately and integrated carefully.

1. **Immediate containment, approximately 1–3 hours:** disable legacy global-user mutations, public platform PIN login, unsafe sync, import/restore and terminal endpoints. Pause Windows distribution. Keep registration/customer-data entry closed while these are unresolved. Preserve a verified backup and immutable release snapshot.
2. **Core authorization repair, approximately 1–2 engineering days:** centralize active membership and operation policies; repair legacy routes, revocation/rejoin, backup/Drive authorization and file ownership. Add cross-tenant and role-matrix regression tests. A full unrestricted launch today is not a credible commitment from this evidence.
3. **Authentication/device/dependency work, approximately 1–3 additional days:** MFA enrollment/challenge and recovery, device credentials, bridge isolation, dependency updates, hostile-import tests and integration verification. Removing these features from the initial release can reduce launch scope.
4. **Staging verification, at least several hours after the final changes:** run security/integration tests on a disposable MySQL database; build client and SSR; exercise sales, refund, split payment, offline retries/idempotency, staff revocation, backup restore, signed webhook replay/duplicates, mail/verification and subscription changes. Check logs and error alerts.
5. **Production gate:** verified backup restore and rollback, exact release hash, production document root at `public/`, debug off, HTTPS/secure cookies, restricted database credentials, installed/config caches, worker and scheduler health, offsite backups and alerts. Keep `.env`, logs, archives, test fixtures and legacy copies outside the web root. See [Laravel deployment guidance](https://laravel.com/framework/docs/12.x/deployment).

If a public presence is essential today, publish a **separate static marketing/waitlist release** while the data-processing application remains closed. A banner or hidden navigation on this existing backend is not adequate containment: unsafe routes must be unreachable server-side.

## Remaining verification gaps

No production TLS/DNS/WAF/header inspection; no server or database configuration audit; no deployment/archive secret-history scan; no live billing/Google integration; no full backend test suite, browser checkout, restore drill or load/concurrency test; no comprehensive SQL injection/XSS/SSRF coverage; no Windows installer/hardware runtime test; no signed mobile binary inspection. The checked mobile source is small and UI-focused, so it does not establish readiness of a production mobile client.

**Changes made in this audit:** evidence and report files only. Application security fixes have not yet been applied. All findings remain open until remediation and acceptance tests pass.

## Integrated startup and website checklist

Added 10 September 2026 following the user's request. Sources: [Nico Burkart's public 37-check Notion database](https://nicoburkart.notion.site/e6e88fff5ddf48a09248e2c8368445d1?v=3a293082ae3e81d0b778000c94c436d0) and the supplied 20-item Instagram screenshot. All 37 database rows were read across the rendered page, including its lower sections. The screenshot was read directly. Notion's boxes were not edited. Source labels below are paraphrased; numbering preserves category order. **57 source checks are accounted for; they are not 57 missing features or 57 additional security defects.**

Status legend: **Present** = found in source, still needs release verification; **Partial** = implementation exists with a gap; **Verify** = no sufficient release/account evidence; **Fix** = concrete source issue; **Optional** = a deliberate product choice. Nothing is marked release-complete merely because a component exists. All rows remain unchecked until the stated acceptance evidence is recorded, or an optional item is explicitly deferred.

Priority: **P0** = before exposing customer data, paid processing or affected functionality; **P1** = before public launch of the affected user journey; **P2** = first week; **P3** = optional. Suggested owners are responsibilities, not assignments already accepted by named people: Engineering, Operations, Product, and Business/legal owner.

### Changes to the social-media advice

- Database RLS is not a switch we can simply turn on in this Laravel/MySQL application. Preserve its purpose through private database access, least privilege and strict server-side tenant authorization. SEC-01/02 are the applicable blockers; a database migration is not required solely to follow this list.
- Use Lemon Squeezy webhook/payment tests rather than adding Stripe. Also verify the separate local PKR payment route described by the current terms. Confirm the seller/merchant role for each payment path before charging customers.
- HTTPS and affordable limits on public AI usage are P0 here, even though Notion calls them first-week tasks. An OG image, a specific PageSpeed score or an analytics product is not equivalent to a customer-data security blocker.
- A separate app subdomain, a sending subdomain, session replay, sticky mobile CTA and standalone thank-you page are choices, not universal requirements. Adopt them when their benefit outweighs complexity.
- Informative images need meaningful alternatives; decorative images should usually use empty alt text. Do not add meaningless text to every decorative logo/icon just to satisfy a checklist. See [W3C's image decision tree](https://www.w3.org/WAI/tutorials/images/decision-tree/).
- Consent must control tracking behavior; a banner alone is insufficient. Session recordings should default to deferred for a POS/ERP handling customer and financial data. This review checks implementation consistency, not jurisdiction-specific legal compliance.

### Evidence key for this extension

Paths are relative to `app-code/main-app`.

| Key | Evidence inspected | What it establishes / does not establish |
|---|---|---|
| E1 | `app/Support/MarketingSeo.php`, `app/Support/ToolSeo.php`, `resources/views/app.blade.php:68–112` | Server-side metadata infrastructure, icons, manifest and OG tags exist. Does not prove every deployed URL has correct unique output. |
| E2 | `routes/web.php:318–321`, `app/Http/Controllers/Marketing/SitemapController.php`, `public/robots.txt`, `public/llms.txt` | Sitemap generation and crawler files exist. Main robots group allows public pages and disallows private paths; named groups differ. Does not prove Search Console submission or deployed indexing. Robots directives are not access control. |
| E3 | `resources/js/Pages/LandingPage.jsx:109–160`, `Components/Site/SiteHeader.jsx`, `resources/css/venqore-v6/site-chrome.css` | Hero CTA, fixed shared header, responsive styles and mobile navigation exist. Screen-size/browser validation still needed. |
| E4 | `resources/js/Pages/Marketing/Contact.jsx:155–216`, `public/v6/assets/venqore-forms.js:102–183`, `routes/web.php:59–60`, `app/Http/Controllers/Marketing/ContactController.php` | Real fetch submission, loading/error/success UI, durable record and best-effort email exist. The `data-demo` attribute does **not** by itself mean the form is fake. See WEB-02. |
| E5 | `resources/views/app.blade.php:23–60`, `resources/js/Components/CookieConsent.jsx:188–205`, landing/shared layout cookie mounts | GA4 starts unconditionally; banner saves choices and emits an event. No connection from that event/storage key to GA consent/loading was found in the inspected resources/assets. See WEB-01. |
| E6 | `/terms` and `/privacy` routes; `Pages/TermsOfService.jsx`, `Pages/PrivacyPolicy.jsx`, `Pages/Marketing/Contact.jsx` | Legal pages and public contact details exist. Business identity, processor list, jurisdiction applicability and factual claims need owner review. Contact says Okara; terms list Lahore—could be legitimate separate locations but needs clear labels. |
| E7 | `resources/views/errors/404.blade.php`; original security/dependency evidence above | Custom error page and security work exist. Still need true HTTP 404 behavior, backend negative tests, staging and rollback validation. |
| E8 | `public/images/og/venqore-og.png`, `public/favicon.ico`, `public/favicon.png`, `public/manifest.json` | OG asset exists (237,989 bytes). ICO is 432,254 bytes and PNG 668,090 bytes: icon optimization is warranted. This is not a complete image inventory or a measured speed regression. |
| E9 | `bootstrap/app.php` Sentry/error reporting; `app/Http/Middleware/VerifyTurnstileToken.php`; AI gateway/limits code identified in original audit | Monitoring, bot checks and AI budget/rate-limit code exist. Live configuration and alerts/budget effectiveness remain unverified; these files are undergoing other working-tree edits. |

### All 37 Notion checks mapped to VenQore

| Done | ID | Check, adapted to this app | Status / evidence | Priority; owner | Required next step and completion evidence |
|---|---|---|---|---|---|
| [ ] | N01 | Private database and row/tenant isolation | **Fix** — SEC-01/02 | P0; Engineering/Ops | Repair tenant authorization; verify DB is not publicly reachable; two-store negative tests pass. |
| [ ] | N02 | Server-enforced authentication and plan access | **Fix** — SEC-01/02/03/05, plan middleware exists | P0; Engineering | Exercise direct API/legacy requests as guest, suspended member and lower-tier user; no UI-only protection. |
| [ ] | N03 | Environment files inaccessible over HTTP | **Verify** — deployment not inspected | P0; Ops | Check deployed `/.env`, config/log/archive paths return safe 403/404 with no file contents; serve only `public/`. |
| [ ] | N04 | No private keys in browser bundles | **Verify** — not a completed secret scan | P0; Engineering/Ops | Scan final client/SSR artifacts and source history with redacted output; distinguish public site keys/GA IDs from secrets; rotate actual exposed secrets. |
| [ ] | N05 | HTTPS and valid certificates | **Verify** — canonical/HSTS middleware exists | P0; Ops | Test all production hosts, HTTP redirects, certificate chain/renewal and mixed content on the deployed release. |
| [ ] | N06 | Rate and spend limits for AI | **Partial** — E9 and original API review | P0; Engineering | Test guest/IP/account/tenant/global quotas, concurrent requests and failure paths; budget must bound paid upstream calls. |
| [ ] | N07 | Authenticated outgoing email DNS | **Verify** — DNS/provider account not checked | P1; Ops | Configure SPF/DKIM/DMARC for actual sending domain; retain passing received-message authentication headers. |
| [ ] | N08 | Transactional mail flows | **Partial** — auth routes and E4 | P1; Engineering/Ops | Verify signup, email verification, reset, invitation and billing mail; links target production and tokens expire. |
| [ ] | N09 | Gmail and Outlook delivery | **Verify** — no test mail sent | P1; Ops | Approved test inboxes receive mail and links work; inspect inbox/spam and authentication results. |
| [ ] | N10 | Separate mail sending subdomain | **Optional** — live sender unknown | P2; Ops | Decide whether isolation is useful; if adopted configure aligned DNS. A healthy root-domain sender is not automatically a blocker. |
| [ ] | N11 | External mail quality score | **Optional** | P3; Ops | Use a synthetic test email if useful; investigate failures, not an arbitrary 9/10 target. |
| [ ] | N12 | Social link preview | **Present** — E1/E8 | P2; Product | Fetch rendered metadata and preview actual share cards for home/pricing/key tools; image resolves with correct content type. |
| [ ] | N13 | Search Console sitemap submission | **Verify** — E2 only establishes sitemap code | P2; Ops/Product | Confirm verified property, submit canonical sitemap and check processing/index coverage. |
| [ ] | N14 | Public pages crawlable | **Partial** — E2 | P1; Engineering | Check public HTML, robots and HTTP/X-Robots/meta directives on final host; retain noindex/auth protection on private pages. |
| [ ] | N15 | Unique public-page metadata | **Partial** — E1 | P2; Product/Engineering | Crawl actual public route inventory; fix missing/duplicate titles/descriptions, stale claims and conflicting canonical/OG tags. |
| [ ] | N16 | Remove staging/demo leftovers from release | **Verify** — ongoing source changes | P1; Engineering | Scan built URLs, placeholders and dead controls; exclude legacy/test artifacts. Do not delete legitimate local-development config blindly. |
| [ ] | N17 | App and marketing on separate hosts | **Optional** | P3; Engineering/Ops | Choose deliberately; validate cookie/auth/OAuth/canonical behavior if split. Required security is access isolation, not this URL layout. |
| [ ] | N18 | Crawler guidance files | **Present** — E2 | P2; Product | Validate deployed robots syntax and sitemap URL; llms.txt is supplementary and already present. |
| [ ] | N19 | Measure real page performance | **Verify** — no PageSpeed run in this extension | P1; Engineering | Measure home/pricing/signup on mobile and desktop plus app startup; record bottlenecks and fix unusable loading before launch. |
| [ ] | N20 | Optimize image payloads | **Partial** — E8 | P2; Engineering/Design | Resize/re-encode icons and heavy images, preserve quality, use appropriate dimensions/formats. Squoosh is optional tooling. |
| [ ] | N21 | Prevent layout jumps | **Verify** — responsive source alone insufficient | P1; Engineering | Measure shifts during fonts/images/widgets/consent loading; reserve space and verify forms/CTAs stay usable. |
| [ ] | N22 | Remove unused dependencies | **Verify** — advisory inventory exists | P2; Engineering | Trace real imports and bundle graph before removal; prioritize vulnerable reachable code, rebuild and regress. |
| [ ] | N23 | Working analytics | **Fix** — GA present, E5 consent mismatch | P1; Engineering/Product | Resolve WEB-01; verify permitted pageviews including SPA navigation and no duplicate/private-data events. |
| [ ] | N24 | Real-user performance metrics | **Verify** — no dedicated web-vitals integration found in sampled entry files | P2; Engineering | Decide metrics pipeline, add consent-appropriate LCP/INP/CLS collection and verify dashboard receipt. |
| [ ] | N25 | Bot/abuse protection | **Partial** — Turnstile and throttles exist, E9/WEB-02 | P0 for paid/public abuse; Engineering | Verify tokens end-to-end; define production behavior for missing config/upstream failure; enforce quotas independently. |
| [ ] | N26 | At least one conversion funnel | **Verify** — GA snippet is not funnel evidence | P2; Product/Engineering | Define visit → builder/signup → first completed sale → paid activation; validate deduplication and exclude PII. |
| [ ] | N27 | Error collection and actionable alerts | **Partial** — E9, SEC-09 | P1; Ops/Engineering | Trigger a sanitized staging error; prove alert delivery/ownership, retention and redaction. |
| [ ] | N28 | Consent-based session recordings | **Optional — defer** | P3; Product | Do not add by default to POS/ERP. If justified later, exclude authenticated/sensitive screens, mask data, verify consent and retention. |
| [ ] | N29 | Accurate terms and privacy pages | **Present; review required** — E6 | P1; Business/legal owner | Verify entity, prices/refunds, actual processors/retention, support contact and DPA claims against real operations; legal applicability remains separate. |
| [ ] | N30 | Identify merchant/seller for each payment path | **Partial** — Lemon Squeezy and direct PKR wording | P0 before charging; Business/Ops | Confirm live contracts/account approval, receipts, tax/refund responsibilities and seller disclosures for each payment method. |
| [ ] | N31 | Consent controls for tracking | **Fix** — E5/WEB-01 | P1 before optional tracking; Engineering | Implement load gating/update/withdrawal; record clean-browser network behavior for reject, accept, revisit and withdrawal. |
| [ ] | N32 | Production payment/webhook verification | **Verify** — signed Lemon Squeezy handler exists | P0 before charging; Engineering/Ops | Use sandbox first; coordinate any real transaction separately. Verify signature rejection, duplicates/replays, amounts, activation, cancellation and refunds; no Stripe requirement. |
| [ ] | N33 | Second browser and desktop tests | **Verify** | P1; Engineering/Product | Record results for Chrome/Edge and Firefox or Safari across marketing/signup/POS; fix blocking differences. |
| [ ] | N34 | Complete key mobile journeys | **Verify** — E3 | P1; Product/Engineering | Run signup/builder/checkout at small widths and on real mobile; check keyboard, touch, scroll, validation and cookie overlaps. |
| [ ] | N35 | Validate interactive controls and links | **Partial** — E3/E4, WEB-02 | P1; Product/Engineering | Crawl links and manually exercise menus/CTA/forms; no dead buttons, fake success or production placeholder destinations. |
| [ ] | N36 | Adversarial form/error tests | **Partial** — E4/WEB-02; original security findings | P1; Engineering | Test empty/invalid/large/duplicate requests, denied permissions, 422/429/500/offline and CAPTCHA expiry; preserve input and never falsely report success. |
| [ ] | N37 | Real custom 404 behavior | **Present** — E7 | P2; Engineering | Request a nonexistent URL; verify HTTP 404, helpful navigation, accessible layout and no stack trace. |

### All 20 screenshot checks mapped to the same work

These rows preserve the screenshot numbering. Cross-references point to the existing task instead of creating duplicate implementation work.

| Done | ID | Screenshot item | Status / existing evidence | Decision and next step |
|---|---|---|---|---|
| [ ] | I01 | Custom 404 | **Present**, E7 | Reuse N37; test status code, not just page appearance. |
| [ ] | I02 | CTA in the first screen | **Present in source**, E3 | P1, Product: verify hero CTA visible and actionable at 360px mobile and typical desktop sizes, including cookie banner. |
| [ ] | I03 | Page titles | **Partial**, E1 | Reuse N15; enumerate every public page rather than assume shared defaults suffice. |
| [ ] | I04 | Meta descriptions | **Partial**, E1 | Reuse N15; meaningful descriptions for indexable public pages, not a blanket SEO requirement for private POS screens. |
| [ ] | I05 | Open Graph image | **Present**, E1/E8 | Reuse N12; test actual resolved asset and metadata. |
| [ ] | I06 | Favicon set | **Partial**, E8 | P2, Engineering: reduce ~422 KiB ICO/~652 KiB PNG; verify real sizes, conventional browser/touch icons and manifest. |
| [ ] | I07 | robots.txt | **Present**, E2 | Reuse N18/N14; never treat disallow rules as data security. |
| [ ] | I08 | sitemap.xml | **Present as dynamic endpoint**, E2 | Reuse N13; no static XML file required. Check canonical public URLs and no private URLs. |
| [ ] | I09 | Image alt text | **Partial/unverified coverage**, sampled header/footer logos use empty alt | P1, Product/Engineering: audit rendered informative images and linked-image accessible names; preserve empty alt on truly decorative/redundant images. |
| [ ] | I10 | Mobile breakpoints | **Present in CSS; unverified behavior**, E3 | Reuse N34; inspect 320/360/390/768/1024px, zoom and landscape for overflow/overlap. |
| [ ] | I11 | Sticky mobile CTA | **Optional**, fixed header/mobile menu exists | P3, Product: persistent conversion CTA not established. Add only if testing shows benefit; avoid blocking POS controls, keyboard, chat or consent UI. |
| [ ] | I12 | Loading feedback | **Present on sampled contact flow**, E4 | P1, Engineering: cover signup/builder/payment/offline sync; disable duplicate submit, show progress and recover from timeout. |
| [ ] | I13 | Form validation/errors | **Partial**, E4/WEB-02 | Reuse N36; provide field-level errors, clear CAPTCHA recovery and accessible announcements. |
| [ ] | I14 | Thank-you page | **Inline success exists; standalone page optional**, E4 | P1 for truthful confirmation; P3 for separate URL. A message shown only after durable acceptance is enough; never clear fields on an error redirect. |
| [ ] | I15 | Privacy policy | **Present; factual review pending**, E6 | Reuse N29; make tracking behavior match it. |
| [ ] | I16 | Terms | **Present; factual review pending**, E6 | Reuse N29/N30; verify real merchant/refund/contact details. |
| [ ] | I17 | Cookie banner | **Present but behavior disconnected**, E5 | Reuse N31/WEB-01; this is an implementation gap, not a missing banner design. |
| [ ] | I18 | Analytics installed | **Present but needs correction/verification**, E5 | Reuse N23/N26; no need to install a second analytics service. |
| [ ] | I19 | Real contact address | **Partial**, E6: email and city published | P1, Business/Ops: verify hello@venqore.com receives mail; distinguish Okara operating location and Lahore legal location if both are accurate. Publish appropriate real business details; do not invent an address. |
| [ ] | I20 | Compressed images | **Partial**, E8 | Reuse N20; start with oversized icons, then inventory actual loaded assets. |

### Newly identified website gaps

These are tracked separately from the original 13 security findings to avoid silently changing that audit's counts. They are source-level findings; no live submission or browser consent test was performed in this extension.

**WEB-01 — Tracking starts before the user's choice (P1 before enabling optional analytics).** `resources/views/app.blade.php:23–60` unconditionally loads Google Tag Manager's gtag script and configures GA4. CookieConsent saves preferences and emits `cookie-consent-changed`, but the reviewed GA setup does not wait for or process those choices. The banner explicitly promises optional analytics only with permission. Fix by loading nonessential analytics only after the appropriate choice, respecting saved choices on first paint, handling withdrawal and testing all public/authenticated layouts. Acceptance: clean-browser network captures demonstrate the intended no-tracking state before/reject and correct tracking after acceptance, with no private customer/financial data in events. Consult [Google's consent implementation documentation](https://developers.google.com/tag-platform/security/guides/consent) when integrating; decide behavior deliberately rather than assuming the banner is sufficient.

**WEB-02 — Contact request omits CAPTCHA proof (P1 before advertising the form).** `venqore-forms.js:118–149` manually builds FormData with name/email/message/company/subject/CSRF only. `/contact` has `turnstile` middleware; when configured, `VerifyTurnstileToken` requires `cf-turnstile-response`, `X-Turnstile-Token` or `turnstile_token`, none of which the inspected handler submits. It is therefore expected to reject production submissions when the secret is configured. Missing secret currently bypasses the guard rather than proving the flow works. Also, the client treats any final HTTP 2xx response as success, so redirected validation responses must be tested to avoid false confirmations. Fix the widget/token lifecycle and explicit JSON success/error contract; map field errors and preserve input. Acceptance: valid test submission creates exactly one durable record; missing/expired CAPTCHA and invalid data never show success; delivery is checked in an approved test inbox. **Correction to initial suspicion:** the `data-demo` marker has a real fetch handler; the form is not classified as fake solely because of that attribute.

**WEB-03 — Excessive favicon payload (P2).** The checked ICO/PNG are ~422/652 KiB respectively. Re-export correctly sized optimized assets, preserve brand clarity and verify browser/touch/manifest behavior. Do not classify this as a security blocker or claim a measured page-speed impact without measuring.

### Single execution queue

Use this order across the original audit and the new lists. A row closes only when implementation **and** acceptance evidence are recorded. The checkboxes in the source mappings are coverage pointers; update shared references together when a task closes.

| Done | Queue | Scope and references | Suggested owner | Completion gate / timing |
|---|---|---|---|---|
| [ ] | Q01 | **[NO NEW SERVICE FEE]** Contain account/tenant risks: SEC-01/02/03/10/11; N01/02 | Engineering | P0; disable unsafe surfaces or fix policies and pass two-tenant/role/revocation tests before customer data. |
| [ ] | Q02 | **[NO NEW SERVICE FEE; HARDWARE TESTS USE EXISTING DEVICES]** Harden login/device/desktop/import: SEC-04/05/06/13; N25 | Engineering | P0; verified authentication and ownership, or affected features excluded server-side from release. |
| [ ] | Q02a | **[CODE: NO NEW SERVICE FEE; EMAIL: FREE-TIER LIMITS]** Email OTP, safe Google linking and controlled owner setup: AUTH-01–03 below | Engineering/Ops | P0 before account launch; pending users have no app access, each new password login completes OTP, Google identity is verified server-side and public registration never grants platform privileges. |
| [ ] | Q03 | **[NO NEW SERVICE FEE; STORAGE QUOTAS APPLY]** Installer/updater/reporting/Drive: SEC-07/08/09/12 | Engineering/Ops | Resolve original acceptance tests; keep production setup/update endpoints restricted. |
| [ ] | Q04 | **[NO NEW SERVICE FEE FOR CODE UPDATES]** Dependencies and final release artifacts; N04/16/22 | Engineering | Triage advisory reachability, update/rebuild/test/rescan; no exposed secrets or dev servers. |
| [ ] | Q05 | **[EXISTING HOSTING; EXTRA CAPACITY/STORAGE MAY COST]** Hosting, HTTPS, quotas, backups and rollback; N03/05/06 | Ops/Engineering | P0; final deployed config evidence, bounded spend and successful isolated restore/rollback drill. |
| [ ] | Q06 | **[PAYMENT TRANSACTION FEES; LIVE TEST MAY COST]** Payments and seller responsibilities; N30/32 | Business/Ops/Engineering | P0 before charging; approval/config plus tested lifecycle and duplicate webhook handling. |
| [ ] | Q07 | **[CODE: NO NEW SERVICE FEE; PAID LEGAL REVIEW OPTIONAL]** Repair consent and verify legal facts; WEB-01, N23/29/31, I15–18 | Engineering/Business | P1; tracking obeys actual preference and notices match real operations. |
| [ ] | Q08 | **[EMAIL FREE-TIER/EXISTING ALLOWANCE; UPGRADE COSTS]** Contact, email and trustworthy confirmation; WEB-02, N07–09/35/36, I12–14/19 | Engineering/Ops | P1; valid/invalid CAPTCHA flows, durable record, received test mail, real contact details. Budget roughly half a day including delivery checks; DNS may take longer. |
| [ ] | Q09 | **[EXISTING DEVICES/LOCAL TOOLS; HOSTED MONITORING MAY COST]** Core journeys, responsive/accessibility and alerts; N19/21/27/33–36, I02/09/10/12/13 | Product/Engineering | P1; staging browser/mobile/keyboard tests and actionable alerts. Reserve at least half a day after final UI changes. |
| [ ] | Q10 | **[NO NEW SERVICE FEE]** Discovery and asset polish; N12–15/18/20/37, I01/03–08/20, WEB-03 | Product/Engineering | P1 for broken public routes; P2 for SEO polish. Crawl metadata, preview assets, optimize images and submit sitemap. |
| [ ] | Q11 | **[OPTIONAL SERVICES: FREE-TIER OR PAID; DEFER PAID]** Measurement and optional growth choices; N10/11/17/24/26/28, I11/14 | Product/Ops | P2/P3; document adopt/defer decisions, not mandatory purchases or services. |

**Business facts still needed at execution time:** approved production hosts/release artifact, correct business/legal contact locations, actual email provider and test inboxes, Google Analytics/Search Console access, actual merchant arrangements and intended tracking behavior. These are recorded as verification dependencies; missing access is not evidence that the feature is absent. No mail, payment, account setting or third-party service was changed for this review.

The previous security **NO-GO** remains in force. Adding marketing polish does not close the security findings. A static marketing/waitlist release today remains possible only with the unsafe application endpoints inaccessible and the selected public forms/consent/contact journey verified. This extension changes the plan only; it does not claim to have implemented the listed fixes.

## Email OTP, Google login and signup abuse prevention

Added following the user's explicit requirement: **email/password signup and every new email/password login must complete an emailed OTP before application access. Google sign-in should remain faster, using verified Google identity rather than routinely sending another email code.** This is an implementation requirement, not an already deployed feature. No trusted-device exemption from password-login OTP is assumed. Reloading an already authenticated session does not constitute a new login.

### Current implementation and new gaps

- **AUTH-01 — OTP gate missing (P0 product/security requirement).** `RegisteredUserController::store()` creates a user, emits `Registered`, and immediately calls `Auth::login()`. `LoginRequest::authenticate()` uses `Auth::attempt()` and `AuthenticatedSessionController::store()` proceeds to normal routing. `routes/auth.php` has signed email-verification links, so email verification is not wholly absent. However, link verification is not a mandatory OTP challenge for each new login. Some routes use `verified`; that does not prove pending accounts cannot reach all APIs or trigger provisioning. Existing throttle is 10 auth requests/minute/IP, plus password failures keyed by email/IP; this is not layered signup/OTP abuse control.
- **AUTH-02 — Google linking needs review before OTP bypass (P0).** `GoogleAuthController::callback()` retrieves identity through Socialite and looks up a user by Google ID **or matching email**, then attaches the Google ID if absent and logs in. No explicit verified-email/authority check is visible in this controller; newly created Google users are not explicitly assigned `email_verified_at` here. Retain Socialite's OAuth state validation, examine the provider's verified claims, and make account linking an explicit secure operation. Do not silently attach an arbitrary Google identity to an existing password account solely because email strings match. This is source evidence requiring provider-flow tests, not a demonstrated live Google account takeover.
- **AUTH-03 — Public first signup can receive platform-owner privileges (critical, conditional on empty active-user count).** `RegisteredUserController::store()` checks `User::count() === 0` and grants `is_platform_admin=true` and `platform_role=platform_owner`. Remove this from public registration. Provision the first owner with a controlled deployment/admin command, enforce privileged MFA, and make creation race-safe. Empty tables, restored databases and soft-deleted users must not turn public signup into an admin bootstrap. This is an additional source finding beyond the original 13, not silently included in their historical severity count.

### Required authentication journeys

| Journey | Required behavior before granting a full session |
|---|---|
| Email/password signup | Validate input and abuse controls; create a short-lived pending registration rather than an active user/tenant; send OTP; verify and atomically consume it; create/activate the account, mark the proven email verified, regenerate the session, then continue onboarding. Preserve hashed passwords only in pending storage, never plaintext. |
| Existing email/password login | Check password without creating a full login/remember cookie/token; on success create a pending login challenge and send OTP. Only successful OTP consumption creates the authenticated session. Existing `email_verified_at` does not bypass this per-login rule. |
| New Google signup | Verify the OAuth response server-side and provider identity/email authority; create the normal account and verified-email state when justified. Do not send a redundant email code for authoritative Google identity. Still apply signup quotas and provisioning/AI limits. |
| Returning linked Google user | Resolve by stable Google provider ID, verify the OAuth transaction, check account/membership status, then sign in. Keep platform-owner stronger MFA requirements; Google login must not bypass SEC-05. |
| Existing password user choosing Google for the first time | Require proof of ownership of the existing account before linking. A one-time linking challenge is an account-takeover safeguard; subsequent linked Google logins remain fast. |
| Password reset, email change, invitation or gift | Do not let these alternate paths bypass the new session gate. Bind proof to its purpose; a password-reset or email-change code is not a login code. Preserve safe intended redirects and pending onboarding state. |
| Staff POS PIN and offline mode | Do not silently break cashier workflows by requiring an email on every sale/unlock. Restrict PIN access to an enrolled trusted terminal and least-privilege staff session (SEC-04/10), not a generic bypass into a full cloud account. Review all legacy PIN endpoints. Offline mode cannot claim to validate an emailed OTP without connectivity. |

Google's guidance distinguishes authoritative Gmail/Workspace identity from third-party email addresses attached to Google accounts. For the latter, additional ownership proof may be necessary, particularly for account linking. Verify provider identifiers rather than relying only on email. See [Google identity verification guidance](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).

### OTP and abuse-control specification

The following are starting design values to validate against real delivery latency and shared-store networks, not universal standards:

- Generate a cryptographically random 6-digit code; expire it after **5 minutes**; permit **5 failed verification attempts per challenge**. Expired/consumed/locked challenges cannot authenticate. Resending invalidates the previous code and must not reset cumulative abuse limits.
- Bind each challenge to a random opaque ID, purpose, account/normalized email and pending browser session. Store a keyed hash/HMAC of the code with a server-side secret kept outside the challenge store; short numeric codes should not be stored plaintext or as an unsalted fast hash. Consume once atomically so parallel requests cannot both succeed.
- Begin with a **60-second resend cooldown** and **5 sends/hour per email**. Add independent IP/network, pending-session and global email-send budgets before enqueueing. Tune IP ceilings for legitimate users behind shared business networks. Use temporary backoff rather than permanent account lockout that attackers can trigger.
- Apply bot checks before paid email/provisioning calls, not only at the final OTP form. Bind and validate CAPTCHA server-side. Monitor signup velocity, failures, email bounces and resource use. Google users also need these service-use limits: OAuth is not proof that a user is human.
- Keep signup/login responses appropriately generic, including comparable response behavior for unknown/known addresses. Do not leak codes or account state through debug responses, logs, analytics or client payloads. Do not send login codes until the password is correct.
- Keep pending registrations bounded and expiring; avoid creating stores, trial credits, queued AI jobs or paid resources until identity checks pass. Enforce email uniqueness transactionally at activation so concurrent attempts cannot create duplicates. Do not let one pending signup permanently reserve another person's email.
- Queue mail with retry/backoff and a monitored worker. Protect temporary email-job payloads (which necessarily contain the code) through encryption and restricted access; redact failed-job/error output and do not deliver expired/superseded challenges. Never fall back to password-only login on email/queue/storage failure.
- Provide paste/autofill-friendly code entry, resend countdown, change-email/restart controls, clear expiry/network errors and recovery that does not bypass proof. Do not advertise guaranteed instant delivery until measured.

Email OTP proves access to a mailbox; it is not proof of a unique human and bots can operate real mailboxes. Require stronger authenticator/passkey MFA for platform owners and sensitive administration rather than treating emailed codes as phishing-resistant protection. Layer rate limits, bot checks and monitoring as described in [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

### Redis: purpose and adoption decision

**Redis is backend infrastructure, not an OTP provider or a visible quality badge.** It can hold shared, short-lived rate-limit counters and challenge state, and run queues so all application workers enforce the same limits. It does not send email, distinguish people from bots or automatically make authentication secure.

This repository already contains Redis cache/queue definitions in `config/cache.php`, `config/queue.php` and `config/database.php`. The production env template currently uses **database-backed cache, sessions and queues**. Redis is not required to implement secure OTP: a dedicated database challenge table with transactions plus shared database-backed limits and a working mail queue is a valid initial design. Keep the source of truth for users/memberships in MySQL.

**Initial recommendation:** build and test OTP with the supported shared storage first. Adopt private/managed Redis if the selected hosting supports a compatible PHP client, secure connectivity and reliable supervised workers, or measurements show database cache/queue contention. Confirm those hosting capabilities before switching environment variables. Do not assume the shared-hosting target supports Redis or permanent workers merely because config files exist. Laravel supports [cache-backed rate limiting](https://laravel.com/framework/docs/12.x/rate-limiting) and [multiple queue backends](https://laravel.com/framework/docs/12.x/queues).

If Redis is adopted:

1. Use private access, authentication/ACLs and TLS where appropriate; never expose its port publicly. Separate environments and namespaces.
2. Use atomic scripts/transactions for challenge attempts and single-use consumption; preserve per-account/global budgets across app workers. Do not use an eviction-prone general cache as the only source of abuse limits without a defined safe failure policy.
3. Separate security state/queues from disposable cache; configure memory/eviction and queue persistence deliberately. Missing challenge state denies verification; storage outages must not authenticate users or silently bypass rate limits. Choose either a consistently enforced shared fallback or a controlled retry response, not worker-local counters.
4. Switch cache/queue drivers in staging first. Keep sessions on their existing database driver initially; changing all three at once adds unnecessary session/recovery risk. Confirm PHP client availability, worker supervision, restart behavior, retry visibility and alerts before rollout.
5. Monitor send latency, challenge success/failure, bounce rate, budget rejections, queue backlog and Redis health. Record rollback behavior; a rollback must not resurrect consumed OTPs.

### Implementation and release evidence

| Done | Task | Acceptance evidence |
|---|---|---|
| [ ] | AUTH-01a: challenge model/service, send/resend/verify routes and mail template | Expiry, single-use, session/purpose binding, attempt limits, resend invalidation and concurrent consumption tests pass. |
| [ ] | AUTH-01b: pending signup/login UI and session gate | No normal session, remember cookie, API token, tenant or paid work before successful OTP; protected routes reject direct requests from pending sessions. |
| [ ] | AUTH-01c: route inventory and alternate-flow migration | Password/reset/invite/gift/staff/platform/API routes cannot bypass the chosen authentication policy; no broken verification-link shortcuts. |
| [ ] | AUTH-02: verify/link Google identity safely | State failure, wrong identity, untrusted email linkage, suspended account and duplicate account cases fail safely; normal linked Google sign-in stays fast. |
| [ ] | AUTH-03: remove public owner bootstrap | Public signup on an empty disposable database creates no administrator; controlled owner setup and concurrent registration tests pass. |
| [ ] | AUTH-04: layered limits and delivery operations | Synthetic bursts stay within email/resource budgets; Gmail/Outlook delivery, expiry, resend, worker failure and storage outage behave correctly. No real OTP mail sent during this planning review. |
| [ ] | AUTH-05: Redis readiness decision | Record keep-database or adopt-Redis decision with hosting evidence; if adopting, demonstrate concurrency, outage, persistence and rollback behavior. Redis procurement/setup remains unperformed. |

Suggested delivery order: AUTH-03 containment first; then challenge service and mail queue; pending-session gate and screens; Google linking/alternate paths; adversarial tests and staged rollout. Allow roughly **1–3 engineering days plus delivery/staging verification** for a reliable implementation, depending on alternate-login compatibility and hosting. This work belongs in Q02a before account launch and depends on Q08's mail delivery checks. It does not replace the original access-control repairs.

## Budget and free email options

User constraint: **do not incur new charges now. Retain paid items, label their costs and defer optional purchases until revenue.** No paid signup, upgrade, trial, payment method, DNS change or service installation was performed. Prices and quotas below were checked against vendor documentation on **10 September 2026**; they are not lifetime guarantees.

Cost labels mean:

- **NO NEW SERVICE FEE:** code/configuration work or tools usable with the existing environment. Engineering time, current hosting bills, storage/CPU and existing account limits still apply.
- **FREE-TIER / EXISTING ALLOWANCE:** potentially $0 additional cash, subject to eligibility, capacity, retention and provider policies. Verify before depending on it.
- **REQUIRES MONEY / DEFER:** a subscription, usage/transaction charge, hardware purchase or professional service. It stays in the plan; do not enable it without an explicit budget decision.
- **UNKNOWN / CHECK FIRST:** actual hosting contract or account settings have not been inspected. Do not treat this as either definitely free or definitely paid.

### Cost register covering the execution queue

| Work / service | Cost status now | Budget decision and connection to plan |
|---|---|---|
| Tenant/role fixes, safe account setup, OTP code, CSRF, validation, consent, Google linking, dependency updates | **NO NEW SERVICE FEE** | Prioritize Q01–04/Q07 and AUTH-01–03. These do not require buying a security platform. OTP delivery is a separate service cost below. |
| Domain and Laravel/MySQL hosting | **EXISTING RECURRING COST / UNKNOWN RENEWAL** | Confirm current term/capacity. Cloudflare Free does not host this existing PHP/MySQL app for free or pay domain renewals. |
| Cloudflare Free proxy/DDoS features | **FREE PLAN** | Start here for web traffic, subject to correct proxy/origin configuration. Premium WAF/bot features are **REQUIRES MONEY / DEFER** unless a verified gap makes them necessary. |
| Cloudflare Turnstile | **FREE PLAN** | Suitable initial bot-check option; currently includes unlimited challenges with widget/hostname limits. No Enterprise requirement established. [Official plans](https://developers.cloudflare.com/turnstile/plans/). |
| Receiving `hello@…` through Cloudflare Email Routing | **FREE SERVICE; EXISTING DOMAIN/DESTINATION INBOX REQUIRED** | Forward to an existing controlled mailbox. Receiving/forwarding is different from sending OTPs; verify MX migration before any later DNS change. |
| Cloudflare sending OTPs to arbitrary customers | **REQUIRES MONEY / DEFER** | Current Email Service requires Workers Paid for arbitrary recipients. Free delivery to preverified destination addresses is not a general customer OTP service. See vendor pricing below. |
| OTP/transactional sending through existing host SMTP | **UNKNOWN / CHECK FIRST** | Check whether already included, allowed for automated transactional mail, rate-limited appropriately and reliably delivered; do not assume a mailbox includes suitable sending capacity. |
| OTP/transactional sending through Resend Free | **FREE-TIER / CAPACITY-LIMITED** | Candidate for a small controlled launch: currently 100 emails/day and 3,000/month, including inbound if used. Production approval/domain setup/deliverability need verification. Paid upgrade **REQUIRES MONEY / DEFER**. |
| Database-backed challenges, cache and queue | **NO NEW SERVICE FEE within existing capacity** | Initial AUTH-05 choice. Verify worker/scheduler support and monitor latency rather than buying Redis immediately. |
| Redis | **OPTIONAL / HOSTING-DEPENDENT** | Using an available instance may add no bill; managed Redis, a new VPS or extra capacity may **REQUIRE MONEY**. Defer procurement, not correct atomic limits. |
| Email SPF/DKIM/DMARC configuration | **NO NEW SERVICE FEE with existing DNS/provider** | Q08 prerequisite. Paid deliverability dashboards are optional and deferred; real mail delivery still consumes quota. |
| Backup/restore code and tests | **NO NEW SERVICE FEE** | Required. An independent backup destination may fit existing storage allowance; extra storage **REQUIRES MONEY**. Do not postpone recoverable backups merely because a paid product is deferred. |
| Local error logs, queue monitoring and alert code | **NO NEW SERVICE FEE** | Use existing capacity; external alert delivery consumes its allowance. Hosted APM/uptime retention has provider-specific free tiers or fees: verify before adopting. |
| Metadata, 404, responsive fixes, image compression and browser checks | **NO NEW SERVICE FEE using existing tools/devices** | Q09/Q10. Paid SEO crawlers, device clouds and design services are optional/deferred. |
| Analytics/funnels/session replay | **EXISTING/FREE-TIER or OPTIONAL PAID** | Correct current consent first. No need to buy a new analytics product; paid analytics/replay is deferred, and replay remains optional for sensitive ERP screens. |
| AI API calls / OCR / hosted model services | **USAGE COST OR LIMITED EXISTING CREDITS** | Public AI is not assumed free. Set hard budgets; disable paid upstream features when no funds/credits are available and use an honest non-AI fallback where implemented. Never imply a paid LLM becomes free behind Cloudflare. |
| Payment processing and live purchase/refund tests | **TRANSACTION FEES / MAY REQUIRE MONEY** | Retain Q06. Fees can arise when collecting revenue; live tests may incur nonrefundable fees. Use provider sandbox first; no real charge authorized. |
| Professional legal review / independent penetration test / certification | **REQUIRES MONEY if commissioned / DEFER PURCHASE** | Keep as future assurance. Defer optional procurement, not the applicable legal obligations or remediation of known security defects; narrow launch scope if a required gate cannot be met. |
| Windows code signing, extra test hardware, mobile store distribution | **MAY REQUIRE MONEY / DEFER DISTRIBUTION COSTS** | Verify chosen release channel requirements; web-only initial scope can avoid purchasing these now. Code fixes/testing on available devices can continue. |

### Cloudflare email: what is actually free

[Cloudflare Email Service pricing](https://developers.cloudflare.com/email-service/platform/pricing/) currently lists unlimited inbound routing, but requires Workers Paid to send to arbitrary recipients. That paid plan includes 3,000 outgoing messages/month, then $0.35 per 1,000; the Workers subscription is additional underlying cost. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) defines the base plan. Free sends to verified destination addresses are for addresses approved in the Cloudflare account, not every new customer's signup email.

The unnamed GitHub repository has not been provided or assessed. Do not call it “free forever” or adopt it as the authentication mail service yet. Its review must identify receiving versus sending support, any external SMTP provider, Workers/storage usage, limits, license, maintenance, data handling and deliverability. An open-source inbox UI cannot remove the underlying outbound provider's pricing or eligibility restrictions.

**Proposed $0-additional-service starting setup:** existing domain/hosting; Cloudflare Free web proxy and Turnstile; optional Cloudflare inbound forwarding to an existing inbox; eligible free-tier or already-included transactional sender; MySQL-backed OTP state/limits/queue. DNS changes must preserve the existing mail system and configure sender authentication correctly, potentially using a sending subdomain. No repository or new email service has been deployed.

[Resend's current quota documentation](https://resend.com/docs/knowledge-base/account-quotas-and-limits) lists 100/day and 3,000/month for free transactional mail. Treat this as a constrained pilot, not unlimited growth. Example: 30 users making two password logins/day consume **60 OTP emails/day** before signup, resends, resets, invitations or other messages. Reserving the remaining capacity is necessary; a quota-exhaustion attack can otherwise prevent legitimate logins.

Keep the user's every-new-password-login OTP rule. If capacity is insufficient, reduce new-user intake, improve abuse control or seek an explicitly approved budget—do not silently skip OTP, rotate accounts to evade provider limits or turn on billable overages. Prefer a free-only plan with a provider-enforced stop, plus application caps and warnings below the limit. Budget alerts alone are not a spending cap. Explain temporary delivery/quota failures honestly; an unlimited, always-available OTP service is not promised at $0.

## DDoS and customer data protection

**Current answer: DDoS readiness is unverified; the application has known security weaknesses and must not be described as unhackable.** We have not inspected the live Cloudflare account, DNS proxy state, origin firewall, hosting controls or final release. A Cloudflare/Turnstile configuration key in source is not evidence that traffic actually receives DDoS mitigation. The prior controller probes established unsafe application behavior even without flooding anything.

DDoS primarily targets availability. Tenant/account takeover, injection and exposed backups target confidentiality/integrity; ransomware or destructive access can affect all three. Protection therefore needs both edge controls and application/data controls. No plan, paid or free, eliminates every attack. A paid WAF does not repair SEC-01's missing tenant authorization.

Cloudflare provides DDoS protection across its plans for covered traffic; see [DDoS documentation](https://developers.cloudflare.com/ddos-protection/). Its website proxy is not blanket protection for an exposed origin, database port, mail server or all arbitrary network protocols. Follow [origin protection guidance](https://developers.cloudflare.com/fundamentals/security/protect-your-origin-server/) and the host's capabilities. Configuration/verification below comes before any claim of protection; no load/flood test was conducted or scheduled against production.

| Done | Gate | Cost label | Acceptance evidence |
|---|---|---|---|
| [ ] | NET-01: route production web traffic through the intended proxy | **FREE PLAN / EXISTING DNS** | Inspect each relevant hostname's DNS/proxy configuration and responses; DNS-only records are not assumed protected. Preserve mail and other non-proxied service functionality. |
| [ ] | NET-02: prevent direct-origin bypass | **EXISTING-HOST CAPABILITY; UPGRADE MAY COST** | Restrict inbound web traffic at the origin using supported firewall/authenticated-origin/tunnel controls. Verify direct-origin requests cannot access the app. A hidden IP alone is insufficient; shared hosting may constrain options. |
| [ ] | NET-03: end-to-end TLS and protected infrastructure accounts | **NO NEW FEE where supported** | Validate strict origin TLS, renewal, least-privilege deployment/API credentials, registrar/hosting/Cloudflare MFA and recovery access. Do not use Flexible TLS as the target configuration. |
| [ ] | NET-04: targeted edge rules and trustworthy client IPs | **FREE FEATURES within plan; ADVANCED OPTIONS MAY COST** | Verify available WAF/rate rules and real client IP handling behind only trusted proxies. Do not trust spoofed forwarded headers; avoid putting all users in one proxy-IP bucket. Check webhook/Google callbacks remain usable without broadly exempting them from protection. |
| [ ] | NET-05: bounded application resource use | **NO NEW SERVICE FEE** | Limit OTP/AI/report/upload/search/import requests, payload sizes, execution time, concurrency and queue backlog; fail safely when dependencies are unavailable. Close SEC-04/09/13 and AUTH-04. |
| [ ] | NET-06: safe caching and traffic shedding | **NO NEW FEE with existing tools** | Cache eligible public assets; authenticated HTML/API responses and customer records must not enter shared CDN caches. Confirm two users cannot receive each other's responses. Provide bounded 429/503 behavior rather than unbounded worker growth. |
| [ ] | DATA-01: least privilege and account/tenant isolation | **NO NEW SERVICE FEE** | Close SEC-01/02/03/10/11 and AUTH-03; private DB access, restricted service credentials, tested authorization for every mutation/export and no frontend secrets. |
| [ ] | DATA-02: minimize, encrypt and recover customer data | **EXISTING CAPACITY; EXTRA STORAGE MAY COST** | Review collected data/retention, sensitive log redaction, backups and encryption/key access; retain independent recovery copies and restore-test them. Do not keep the only backups under the same credentials as the live app. Check host storage encryption rather than assuming it. |
| [ ] | OPS-01: incident detection and response | **LOCAL/EXISTING TOOLS; HOSTED UPGRADES MAY COST** | Alerts for 5xx/latency, auth failures, quota spikes and failed backups; written containment, session/key revocation and restoration steps with an owner. Preserve sanitized audit evidence. |
| [ ] | TEST-01: staged security and capacity verification | **LOCAL/EXISTING TOOLS; EXTRA TEST HOSTING MAY COST** | Regression tests for cross-tenant access, MFA/OTP bypass, CSRF, uploads, signatures/replays and secrets; controlled bounded staging load tests. No claims that all SQLi/XSS/SSRF paths are safe from the current sample. |

These gates extend Q05/Q09 and share the original security fixes; they do not require buying every paid security option. **If a necessary protection cannot be achieved with the available hosting/budget, postpone the affected launch or reduce its scope, rather than postponing customer-data safety while leaving the feature exposed.** The immediate goal is defensible, tested protection and recovery, not a marketing promise of “100% secure.”

