# SECURITY.md — Full Security Audit (v5.0.6, 2026-07-07)

> Scope: authentication, authorization, tenancy isolation, web vulns, secrets, infra, logging, backup/DR, compliance. Verdict per area: ✅ solid · ⚠️ needs work · ❌ broken.
> Cross-references GAPS.md items (C#/H#/M#).

## 1. Authentication — ⚠️
- Breeze session auth + email verification middleware on tenant routes (`auth`,`verified`) ✅. Socialite Google login ✅. Sanctum for API ✅.
- POS staff PINs (`tenant_users.pos_pin`) are bcrypt-hashed and verified via `Hash::check` (confirmed in `AdminController`) ✅; treat PINs as secrets, never log.
- **Gaps:** no 2FA anywhere (owner accounts control money data — add TOTP, `ProfileSecurityController` is the natural home); no session device list/revocation UI; password policy unverified; login throttling relies on Breeze defaults — confirm `throttle` on login/register/password-email routes; no account-lockout alerting.
- Default local creds (`platform@venqore.com/admin1234`) — MUST be rotated + seeder must refuse to run in production (`app()->isProduction()` guard).

## 2. Authorization — ⚠️
- Two layers: platform (`is_platform_admin`, `/VenQore/*` 404-cloaked) ✅ nice; store-level granular permissions via `tenant_users` pivot overrides + `config/permissions.php` role map, enforced by route `permission:*` middleware ✅ design is sound.
- **Gaps:** wildcard `'*'` god-mode (GAPS H4) ❌; permission coverage is uneven — 751 named routes, only 85 `permission:` declarations in `routes/web.php` (the rest rely on `CheckPermissions` allowing empty-requirement requests). Inventory: generate a route→permission coverage report and close write routes first (sales void, purchases, settings, staff manage, backups, data management, recycle bin restore). Policies folder is not the primary mechanism — few/no Eloquent policies; server actions must not trust client-hidden UI as a gate.
- Impersonation: `ImpersonationGuard` exists ✅ — verify it blocks billing/destructive actions and marks audit rows as impersonated.

## 3. Multi-tenant isolation — ⚠️ (very good core, sharp edges)
- Core: `HasTenant` global scope + container binding + `1=0` fail-closed fallback + auto tenant_id fill + session regeneration on store switch + store-prefixed session key clearing ✅✅. This is genuinely above-average design.
- **Edges:** `last_store_id` fallback without live membership check (H2); `withoutTenantScope()` used in unauthenticated terminal API (C1) ❌; raw `DB::table()` queries in V3 services must always carry `tenant_id` — they consistently do (verified in AccountingService/FifoService/SaleService) ✅ but only convention protects new code: add an integration test that scans for `DB::table(` without `tenant_id` in the same statement block, or wrap in a query helper.
- UUID PKs on financial rows prevent cross-tenant ID guessing ✅; Tenant uses numeric ID but routes use slug ✅.

## 4. Web vulnerabilities
- **SQLi — ✅:** no interpolated `whereRaw` with user input found; query builder + bindings throughout.
- **XSS — ✅ frontend:** zero `dangerouslySetInnerHTML` in 364 JSX files (verified). Watch: any PDF/print templates (dompdf blade) — escape party/product names there too.
- **CSRF — ✅/⚠️:** Inertia+axios handle tokens; webhooks correctly exempted with HMAC (LemonSqueezy ✅, Woo ✅). **Pusher webhook has no signature verification (H6) ❌.** VenSynQ OAuth `state` now single-use + `hash_equals` (fixed 2026-07-07) ✅.
- **Mass assignment — ⚠️:** 49 × `$guarded=[]` (H3).
- **File uploads — ❌:** unauthenticated screenshot endpoint (C1); audit all upload paths (logo, product images, SmartCapture, chat attachments) for mime/size validation, random names, non-executable storage, and S3 (not webroot).
- **SSRF:** Woo/VenSynQ clients call user-configured URLs — restrict schemes to https, block private IP ranges when fetching user-supplied endpoints.
- **Rate limiting — ⚠️:** POS search 300/min ✅; smart-capture 10–30/min ✅; system reset 5/min ✅; chatbot/vena/heartbeat/pusher ❌ (H6). Add global `throttle:web` sane ceiling.
- **Security headers — ⚠️ unverified:** add CSP (Inertia-compatible nonce), HSTS, X-Frame-Options DENY (except chat widget embed route), Referrer-Policy, Permissions-Policy at the proxy.

## 5. Secrets & config — ⚠️
- `.env` local committed in working tree with real local creds (C5); Google tokens encrypted at rest ✅; `Tenant.$hidden` hides tokens ✅.
- Actions: secrets scanner (gitleaks) in CI; rotate anything ever committed; `APP_DEBUG=false`+`APP_ENV=production` deploy assertion (fail boot otherwise); Lemon Squeezy signing secret only via env ✅ already.

## 6. Self-hosted/updater channel — ⚠️ (unique risk this product has)
- Update ZIPs applied by `UpdaterController` (pclzip) with `UpdaterLock`/`PreventAccessDuringUpdate` ✅ operationally. **No package signature verification observed (M14): sign releases (ed25519), verify before extract, pin update host, and path-traversal-check every entry (zip-slip).** DRM validate endpoint is unauthenticated by design — ensure license checks are server-signed and replay-resistant, and it leaks nothing about other licenses.

## 7. Logging, monitoring, audit — ⚠️
- Good: `AuditService` (journal events), `ActivityLog`/`StoreActivityLog`/`PlatformAuditLog`, hourly `finance:audit`, `ErrorLog` model, health endpoints + DB health middleware.
- Gaps: no external error tracker (M6); debug `Log::info` in hot paths incl. TenantMiddleware every request (H1); no log shipping/retention policy; no alerting on: failed webhooks, failed demo reset, failed scheduler runs (`schedule:list` + healthchecks.io pings per critical task), queue depth.
- PII in logs: SaleService logs `debug_backtrace` on tenant-resolution failure — fine; ensure no card/PIN data ever logged (grep gate).

## 8. Backups & disaster recovery — ⚠️→❌ for platform
- Per-tenant Google Drive nightly ✅ (differentiator!). Platform-level: no automated full-DB offsite snapshot/restore drill found (H9). For a system of record this is the #1 operational risk. Define RPO ≤ 24h (target 1h binlog), RTO ≤ 4h; write RUNBOOK.md; drill quarterly.

## 9. Compliance & privacy — ⚠️
- Policies pages exist (Privacy/Terms/Refund JSX) — need counsel pass. Staff activity + screenshot monitoring needs explicit consent flows + retention limits (H10). Data export/delete (DSR) partial via `DataManagementController` — make it complete per-tenant export (zip of CSVs + media). FBR e-invoicing: keep audit trail immutability claims accurate (reversal-only ledger helps ✅). PCI: card payments are handled by LemonSqueezy (SaaS billing) — POS itself records tender types only ✅ keep it that way (never store PANs).

## 10. Priority fix list (ordered)
1. C1 terminal APIs (auth + validation + throttle) — day 1.
2. Pusher webhook signature + chatbot/vena throttles (H6).
3. Production guards: seeder prod-refusal, APP_DEBUG assert, rotate creds (C5).
4. 2FA for owners/platform admins; login throttle verification.
5. Wildcard permission removal (H4) + route-permission coverage report + close write routes.
6. Platform DB backups + restore drill + RUNBOOK (H9).
7. Sentry + scheduler/queue alerting (M6/M7).
8. Mass-assignment hardening on financial models (H3).
9. Security headers + gitleaks CI.
10. Update-package signing (M14); upload-path audit.
11. `last_store_id` membership check (H2).
12. Pen-test pass (even a $2–4k community pentest) before AppSumo traffic.

**Overall security posture: 58/100 today → ~85/100 after items 1–9 (~2–3 weeks of focused work).** The tenancy core and financial-integrity design are strong; the perimeter (public endpoints, headers, ops hygiene) is where the holes are.
