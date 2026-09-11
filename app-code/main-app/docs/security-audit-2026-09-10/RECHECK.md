# Independent remediation recheck — 10 September 2026

**Superseded snapshot:** see [11 September fixes and verification](FIXES-2026-09-11.md). Claude subsequently implemented another code-remediation round, and Codex completed the remaining dependency updates and local verification. The findings below describe the earlier reviewed state.

**Verdict: substantial implementation exists, but “only human tasks remain” is incorrect. Launch readiness is not established.** This reviews the current working tree against Claude's REMEDIATION-STATUS.md, not a deployed release. No production attack or DDoS test was performed. Source review is not end-to-end validation.

## Independently reproduced results

| Check | Result |
|---|---|
| Frontend `npm test` | 103 tests passed in 4 files |
| PHP syntax of changed/new application PHP files | 66 files checked, zero syntax failures; see recheck-php-lint.json |
| Main application fresh npm audit | 4 affected packages: 1 high, 3 moderate |
| Windows application fresh npm audit | 14 affected packages: 1 critical, 9 high, 4 moderate |
| Fresh Composer audit of lockfile | 44 advisory entries across 11 packages: 3 critical, 16 high, 20 medium, 5 low |
| Existing terminal credential transition | Security gap reproduced with real controller/credential code and mocked persistence; see recheck-terminal-probe.php and recheck-terminal-result.json |

Dependency counts are different measurement units; do not add them together as a count of exploitable application vulnerabilities. A vulnerable package's reachability still requires assessment. Raw fresh scans are saved beside this file as recheck-npm-main.json, recheck-npm-windows.json and recheck-composer.json.

Claude reports 40 targeted backend tests passing, and a full backend run with approximately 215 failures classified as pre-existing/environmental. I inspected the new tests, but did not independently reproduce these backend runs. The transfer directory contains source/patch archives; that is not equivalent to a verified test run. The local PHPUnit configuration targets an existing MySQL/MariaDB test database and uses RefreshDatabase. I did not run destructive migrations against that database. A disposable database run and per-failure comparison are still required; “zero new failures” does not mean “all tests pass.”

## What is actually present

“Source present” below means implementation was inspected; it does not mean deployed or fully regression-tested. “Claimed” means this recheck has not independently closed that item.

| Original item | Recheck status | Evidence and remaining qualification |
|---|---|---|
| SEC-01 Global account edits/deletes | Source present | AdminController now resolves store membership, rejects login credential changes and platform targets, and deletes membership rather than global user. HTTP regression run pending. |
| SEC-02 Stale tenant access | Source present | EnsureActiveStoreMembership requires active membership and binds the store; sync routes use it. End-to-end session/token revocation checks pending. |
| SEC-03 Backup/Drive authorization | Partially verified | Explicit data-recovery permissions on restore and Drive routes; tenant manifest and exclusions added. Full malicious-backup and restore regression validation still required. |
| SEC-04 Terminal authentication/screenshots | Incomplete; confirmed residual gap | Device secrets exist, but legacy secret enrollment still trusts a device ID alone. Screenshot key still derives from device ID. Windows pairing input/submission missing. |
| SEC-05 Platform PIN/MFA | Source present | Require2FA now registered in web middleware; platform accounts gated. This does not establish MFA coverage of every API/token path. Production setup/recovery and bypass tests pending. |
| SEC-06 Windows origin/IPC | Partially verified | Sender/frame/origin checks and navigation restrictions present. Packaged runtime and hardware tests pending; vulnerable Electron dependency remains. |
| SEC-07 Installer | Source present | InstallerLock denies production, requires explicit flag elsewhere and restricts diagnosis to loopback. Live environment value remains unverified. |
| SEC-08 Updater CSRF | Source present | Updater off by default; enabled session requests checked for CSRF; valid update token remains an alternative credential. Keep disabled for launch. |
| SEC-09 Error-report flooding | Claimed | Claude reports rate limits, deduplication and a global cap. Not independently closed by this recheck. |
| SEC-10 PIN export | Source present | Sync users implementation has removed the prior PIN-hash export. Offline device behavior needs regression testing. |
| SEC-11 Suspended rejoin | Claimed | Claude reports rejection, code rotation and stronger codes. New regression cases exist; execution and deployed code rotation remain unverified. |
| SEC-12 Drive OAuth state | Source present | Random hashed nonce, session storage, single-use pull and expiry validation added. Provider callback tests pending. |
| SEC-13 Import paths | Source present | Random cached handle bound to user/store, expiry and realpath containment check implemented. Full import workflow testing pending. |
| AUTH-01 Email OTP | Implemented with remaining work | Password flow defers Auth::login until OTP; signup defers creation. Service has expiry, attempt limits, session binding, HMAC and locked consumption. Queue mail implements encryption. Sending/resending needs concurrency hardening; production delivery unverified. |
| AUTH-02 Google linking | Source present | Verified email required; returning identity resolved by Google ID; linking an existing email account requires emailed OTP. Real Google callback/linking tests pending. |
| AUTH-03 First-user platform promotion | Source present | Public registration no longer promotes the first account; controlled owner-creation command added. Bootstrap/deployment verification pending. |
| WEB-01 Analytics consent | Source present | Analytics loading gated by stored consent, with consent-change handling. Browser network/cookie verification pending. |
| WEB-02 Contact form | Claimed | Claude reports Turnstile and corrected success/error contract. Real submit, error and delivery tests remain unverified here. |
| WEB-03 Favicon sizes | Claimed | Claude reports smaller icons and correct dimensions. Browser asset verification not repeated here. |

These 19 rows are tracked findings, not 19 remaining confirmed vulnerabilities. The original 37-item Notion and 20-item screenshot checklist remains in REPORT.md; this recheck does not certify that every checklist row is complete. Presence of source files is insufficient to validate actual rendered pages, metadata, mobile layouts, accessibility, business policies or live services.

## Engineering tasks still remaining

1. **High priority — fix legacy terminal enrollment (SEC-04).** HeartbeatController issues a new secret whenever an existing paired terminal lacks one, without requiring a pairing token. A caller who knows that terminal's device ID can obtain the credential before the legitimate device does. The isolated probe confirms HTTP-response status 200 at controller level and a usable secret. Require an authorized, expiring pairing credential for migration; do not rely on first caller trust. Consume pairing tokens atomically to prevent concurrent reuse. Test unknown, legacy, newly paired and revoked devices.
2. **Windows release blocker — complete pairing.** The Windows heartbeat sends device ID/store information but no pairing_token; search of Windows source found no pairing_token submission. New devices are rejected by the secured server. Add the pairing input and submission/retry/recovery workflow, then test the packaged build.
3. **Windows data protection — replace screenshot key derivation or leave telemetry disabled.** main.js still derives AES key material from deviceId. A device identifier is not confidential key material. Default-off telemetry is a mitigation, not repaired encryption.
4. **Dependency remediation.** Composer advisories remain unchanged; npm advisories are reduced but not eliminated. Upgrade compatible packages and validate breaking Electron/build-tool changes. These are coding/testing tasks, not inherently human-only tasks. Package updates themselves do not require buying a service.
5. **OTP reliability and budget enforcement.** EmailOtpService checks budgets separately from incrementing them; resend checks/updates are not serialized with a row lock. Concurrent requests can pass the same limit/cooldown checks. Add atomic reservations and serialize resend with verification. The 90-email daily global default limits combined signup/login/resends, not 90 users; exhaustion blocks new password logins. Test quota exhaustion and reserve an operational recovery path. Queued mail carries a code but no challenge validity check, so expired/superseded codes can still arrive after queue delays; bound delivery by expiry.
6. **Release verification.** Independently run security/auth/backend tests on a disposable database, investigate the reported backend failures, exercise real inbox OTP and Google linking, test backup restoration and negative tenant-access cases, and validate packaged Windows behavior if included in launch. Browser checks and many deployment tasks are automatable once access exists.

All six workstreams can begin without a new paid service, using existing tools/infrastructure. This does not promise unlimited free email or hosting. Do not postpone a security blocker merely because a paid option exists; use a safe free implementation or keep the affected feature unavailable.

## Tasks that really need account access or your decisions

- Verify sender/domain ownership and DNS records; supply email provider credentials. A working mail queue and inbox delivery must be demonstrated before mandatory OTP goes live.
- Supply Cloudflare/Turnstile account configuration; verify proxy coverage, origin restrictions, TLS and rate limits. DDoS protection is **unverified**, not proven absent or guaranteed effective.
- Enroll the real platform owner's authenticator and store recovery codes privately.
- Approve accurate company/contact/privacy/terms information and payment-provider setup if payments are part of launch.
- Provide deployment/backup access and confirm the target environment. Migrations, configuration, queue/scheduler setup, backups and deployment checks can then largely be performed by an agent.

**Launch decision:** do not describe this as security-cleared today. A web-only limited launch could exclude unfinished Windows/telemetry features, but it still requires dependency risk resolution, working authentication, tenant-isolation regression evidence, tested recovery and live configuration verification. No finding here establishes that the product is unhackable.
