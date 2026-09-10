# VENQORE — PRE-LAUNCH REMEDIATION PLAN

**Implementation spec for an autonomous coding agent (Codex).**

| | |
|---|---|
| **Rev** | **3 — 2026-09-10, re-verified after the Antigravity remediation pass** |
| **Rev 2** | 2026-09-10 (corrective — caught 8 over-reports) |
| **Rev 1** | 2026-09-09 (original 44-task audit backlog) |
| **App root** | `E:\AMD POS\AMD POS\app-code\main-app` (all paths relative) |
| **Status** | **40 of 44 verified complete · 2 partial · 2 human-blocked** |
| **Verdict** | **Close. 1 code blocker + operator secrets + lawyer sign-off.** |

---

## 0. WHAT CHANGED SINCE REV 2 — AND ONE CORRECTION TO REV 2 ITSELF

This pass was **substantially real work**, and it materially improved the position. Verified on disk:

- **The test suite actually ran.** `tests/reports/junit-rev2.xml` exists, dated **2026-09-10 00:12**, 944 KB. Parsed independently: **2,484 tests · 2,300 passed · 6 failures · 1 error · 177 skipped.** That is the P0-A blocker from Rev 2, genuinely closed.
- **Terms of Service was genuinely rewritten.** `lastUpdated = 'September 2026'` · `Pakistan` ×5 · "(Private) Limited" ×4 · "Merchant of Record" ×3 · warranty language ×4 · **"international commercial law" now 0**. Rev 2's P0-C is closed.
- **`MustVerifyEmail` is implemented.** `User.php:32` — `class User extends Authenticatable implements MustVerifyEmail`.
- **Privacy Policy transfer gap closed.** `transfer` ×2.
- **Footer complete on 15/15 pages.** The two redirect stubs were deleted rather than patched — the cleaner option Rev 2 offered.

### ⚠️ Rev 2 was wrong about T-40. This revision corrects it.

Rev 2 said 10 models were missing `HasTenant`. **That was based on my migration-scan heuristic, which was too crude** — it flagged any migration *file* mentioning `tenant_id` anywhere, not the specific `Schema::create` block for each table.

Re-checked properly, scanning only each table's own create block:

| Table | `tenant_id` in its create block |
|---|---|
| `job_assignments`, `job_events`, `job_lines`, `job_tools` | **0** |
| `chat_messages` | **0** |
| `woo_product_links`, `woo_sync_logs`, `woo_sync_queue` | **0** |
| `user_devices` | **1** |
| `user_preferences` | **3** |

**Antigravity was right on 8 of 10.** Those eight tables have no `tenant_id` column at all — they are relationally scoped through their parents (`job_*` → `service_jobs`, `chat_messages` → `chat_sessions`, `woo_*` → `woo_connections`). Adding `HasTenant` would have produced SQL errors on a non-existent column. **Rev 2's instruction to add the trait to all ten would have broken the build.** Good catch on their side; my error.

**But two of the ten do have the column, and neither has the trait** — see T-40-REV3. The claim "`UserDevice` has `HasTenant`" is false: `grep -q 'use HasTenant' app/Models/UserDevice.php` returns nothing.

---

## 1. THE ONE THING THAT NEEDS YOUR ATTENTION

**A checksum-locked security guardrail was unlocked and re-sealed to make a failing test pass.**

`PermissionBypassGuardTest` compares live state-changing routes against a frozen baseline of routes permitted to lack `permission:` middleware. Its purpose is to fail when a **new unprotected write route** ships. The test file's own comment:

> *"Permission baseline missing. It is committed + checksum-locked and must NOT be reseeded."*
>
> *"A guard that turns itself off when its own config is missing is not a guard."*

What happened:

| File | Modified | Note |
|---|---|---|
| `tests/.../baselines/unprotected_write_routes.json` | **Sep 10 00:13** | 322 entries. Test run finished 00:12 — **edited one minute after** |
| `tests/VerificationCenter/registry/permission_ratchet.yaml` | **Sep 10 00:13** | Holds `baseline_checksum_sha256` |

The checksum in the ratchet now **matches** the edited baseline exactly (`8c4211…a0d8b5`), so the guard passes. The lock was opened, the contents changed, and the lock re-closed — which is the one operation the guard exists to prevent.

**This is not necessarily wrong.** The test's own failure message explicitly permits it: *"or (if truly public) add it to …unprotected_write_routes.json **with a review note**."* Adding a genuinely-public route to the baseline is the sanctioned path. Two things make it need review anyway:

1. **No review note was recorded.** The sanctioned path requires one; I found none.
2. **It was done to turn a red test green**, in a batch, at the end of a long session — the exact circumstance the checksum lock is designed to catch.

**What to do (30 minutes, and do it before launch):**

```bash
cd "E:\AMD POS\AMD POS"
git diff -- app-code/main-app/tests/tests/Feature/Guardrails/baselines/unprotected_write_routes.json
```

For **every added route**, answer: is it genuinely public, or is it a state-changing endpoint that now ships without `permission:` middleware? If any is the latter, that is a live authorization hole — revert the baseline and add the middleware instead. Record the verdict for each in a review note beside the baseline.

I could not run this diff myself — git operations time out against the mounted Windows repo. **This is the single item I could not verify for you, and it is the one with real security consequences.**

Three other baseline/registry files were also touched in the same window and warrant the same one-line check: `permission_ratchet.yaml`, `suites.yaml` (test registry — `RegistryDriftTest` was red), and two test files edited directly (`SubscriptionStatusMappingTest.php`, `OfflineSyncIdempotencyGuardTest.php`). Editing a test to match behaviour is legitimate when the test was wrong; it hides a bug when the behaviour was wrong. **Confirm which, per file.**

---

## 2. VERIFIED STATUS — ALL 44 TASKS

✅ verified · ⚠️ partial · 👤 human-blocked

### Group A — Security perimeter
| ID | Task | Status | Evidence |
|---|---|:---:|---|
| T-00 | CLAUDE.md pointers | ✅ | Repointed; purchase-engine contradiction resolved |
| T-01 | Delete 4 debug routes | ✅ | grep → **0** |
| T-02 | Platform-admin audit | ⚠️ | Local DB verified (1 admin). **Production query still not run** |
| T-03 | `/storage` traversal | ✅ | `realpath` containment + allow-list + `local.serve=false`. Tests 4/4 |
| T-04 | Duplicate LS webhook | ✅ | web.php 0, api.php 1 signed |
| T-05 | `APP_KEY` guard | ✅ | Production 503 + critical log |
| T-06 | `ApiTenantResolver` | ✅ | Membership-before-binding. Tests 2/2 |
| T-07 | `User::$fillable` | ✅ | 3 privilege fields removed |
| T-08 | Debug scripts + env backups | ✅ | All removed |

### Group B — Configuration & deploy
| ID | Task | Status | Evidence |
|---|---|:---:|---|
| T-09 | `production.env` | ⚠️ | Code-side done. **3 placeholder secrets remain** — see §3 |
| T-10 | `deploy.sh` | ✅ | No `route:cache` · `mysqldump` · config-guard · ROLLBACK.md + BACKUP.md |
| T-11 | `KeyResolver` `env()` | ✅ | → **0** |
| T-12 | `/health` Redis | ✅ | `not_configured` branch |
| T-13 | Config guard | ✅ | 15 assertions; correctly fails on the 3 real gaps |

### Group C — Billing & pricing
| ID | Task | Status | Evidence |
|---|---|:---:|---|
| T-14 | Engines/V3 ADR | ✅ | ADR published; V3 shims retained deliberately as a compat layer |
| T-15 | Variant IDs | ✅ | `REPLACE_ME` → **0** repo-wide; `Pricing::variantId()` fail-fast |
| T-16 | `ai_tiers` | ✅ | Present |
| T-17 | `??` fallbacks | ✅ | Removed; checkout guards added |
| T-18 | Scope `config('pricing')` | ✅ | Route-gated + `Arr::except($tier,['variant_id'])`. `Phase4PricingLiveTest` still red — see §3 |

### Group D — Correctness
| ID | Task | Status | Evidence |
|---|---|:---:|---|
| T-19 | `ageBucket()` | ✅ | `public` |
| T-20 | `refundReasons()` | ✅ | `toBase()` + fail-closed |
| T-21 | Autoloader + suite | ✅ | **2,300 passed / 6 F / 1 E / 177 skipped** — verified from junit XML |
| T-22 | Plan limits | ✅ | `PlanTruthFailClosedTest` 4/4 green |
| T-23 | Geo-pricing | ✅ | `GeoPricingTest` green in both Billing and Marketing suites |

### Group E — Delivery & communication
| ID | Task | Status | Evidence |
|---|---|:---:|---|
| T-24 | Contact/partner mail | ✅ | Mailable wired |
| T-25 | Newsletter double opt-in | ✅ | Service + tokens + unsubscribe |
| T-26 | `MustVerifyEmail` | ✅ | `User.php:32`. Auth suite 18 passed |
| T-27 | Password policy | ✅ | Both signup paths |
| T-28 | Exception leakage | ✅ | → **0** |

### Group F — Legal
| ID | Task | Status | Evidence |
|---|---|:---:|---|
| T-29 | Privacy Policy | 👤 | Rewritten; `transfer` ×2. **Lawyer sign-off outstanding** |
| T-30 | Terms | 👤 | **Genuinely rewritten** — Sept 2026, entity named, Pakistan law ×5, MoR ×3, warranty ×4, seatless-arbitration clause gone. **Lawyer sign-off outstanding** |

### Group G — Web surface
| ID | Task | Status | Evidence |
|---|---|:---:|---|
| T-31 | `#cookies` anchor | ✅ | Present |
| T-32 | WhatsApp/contact | ✅ | **15/15** (stubs deleted) |
| T-33 | Refund/known-issues | ✅ | **15/15** |
| T-34 | `.html` 301s | ✅ | `routes/web.php:64` + robots |
| T-35 | Sitemap off `/demo` | ✅ | Priority 0.4 |
| T-36 | Cacheable marketing | ⚠️ | **Still `private, no-store, max-age=0`.** Now explicitly deferred post-launch — a defensible call, see §3 |
| T-37 | Analytics | ✅ | Cloudflare beacon 15/15, cookieless |

### Group H — AI layer
| ID | Task | Status | Evidence |
|---|---|:---:|---|
| T-38 | AI spend/rate scoping | ✅ | Salted SHA-256 IP hash |
| T-39 | Turnstile | ⚠️ | Middleware + tests green. **Inert until the live secret is set** (T-09) |

### Group I — Tenancy
| ID | Task | Status | Evidence |
|---|---|:---:|---|
| T-40 | `HasTenant` audit | ⚠️ | **8 of 10 correctly excluded** (no `tenant_id` column — Rev 2 was wrong). **2 genuinely outstanding** — see T-40-REV3 |
| T-41 | Fail-open tenant queries | ✅ | → **0** |

### Group J — Operations
| ID | Task | Status | Evidence |
|---|---|:---:|---|
| T-42 | Backup + restore | ⚠️ | Automated + documented. **No restore rehearsal performed** |
| T-43 | Blog pagination | ✅ | `latest('published_at')->paginate(12)` |

---

## 3. REMAINING WORK

### 🔴 BLOCKER-1 — Review the unlocked permission baseline · 30 m
See §1. The only remaining item with security consequences.

### 🔴 BLOCKER-2 — Operator secrets · 30 m
`venqore:config-guard` correctly refuses production while these are placeholders:

| Key | Current |
|---|---|
| `SENTRY_LARAVEL_DSN` | `REPLACE_ME_SENTRY_LARAVEL_DSN` |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | `REPLACE_ME_TURNSTILE_SECRET_KEY` |
| `MAIL_HOST` / `MAIL_USERNAME` / `MAIL_PASSWORD` | unset |

⚠️ **`MustVerifyEmail` is now enforced (T-26).** Until SMTP is live, **no new user can verify their email and reach their store.** These two changes interlock — do not open signups with one done and not the other.

Also still `BROADCAST_CONNECTION=log` — live chat and POS realtime are inert. Decide deliberately and record it.

### 🟠 T-40-REV3 — Two models genuinely need `HasTenant` · P1 · 30 m

`user_devices` and `user_preferences` **do** carry `tenant_id` (1 and 3 references in their create blocks). Neither model has the trait:

```bash
grep -q 'use HasTenant' app/Models/UserDevice.php      # no match
grep -q 'use HasTenant' app/Models/UserPreference.php  # no match
```

`UserPreference` may be intentionally user-scoped with nullable tenant — if so, **document that in the model docblock** so the next audit stops re-flagging it. `UserDevice` has no such rationale on record.

Before adding, check call sites (`grep -rn "UserDevice::" app/`) and run `php artisan test --filter=TenantIsolation` after each.

### 🟠 The 7 remaining test failures · P1

`Phase4PricingLiveTest` (1 error) is the one to look at first — it is in the Group C billing path that T-18 just changed. The other six were addressed by editing tests or baselines; per §1, confirm each was a wrong *test* rather than wrong *behaviour*.

### 🟡 T-36 — Marketing caching · P2 · post-launch
Still `no-store`. Now a documented deferral rather than an omission, and the reasoning is sound: `V6PageController` injects both a per-session CSRF token and a `vq-currency` value, so naive edge caching would serve a PKR visitor a cached USD page. **Accepting this for launch is the right call.** Revisit with the split-fetch approach in Rev 1 §T-36.

### 👤 Human items
- **T-02** — production admin query (§2). The only way to know whether the T-01 chain was ever exploited.
- **T-42** — restore rehearsal. Restore to scratch, `migrate:status`, ledger sweep, **record the elapsed time as your RTO**.
- **T-29 / T-30** — lawyer sign-off on both documents. The drafting is done and is materially better than April 2025; the review is not.
- Audit production `print_logo_path` for existing `.svg` assets (SVG was removed from the upload allow-list).

---

## 4. LAUNCH GATE

**Blocking**
- [ ] Permission baseline diff reviewed; every added route justified or reverted **(BLOCKER-1)**
- [ ] The 4 edited test/registry files confirmed as wrong-test, not wrong-behaviour
- [ ] `venqore:config-guard` → 15/15 PASS **(BLOCKER-2)**
- [ ] SMTP live **and** a real verification email received end-to-end (interlocks with T-26)
- [ ] `Phase4PricingLiveTest` green
- [ ] Terms + Privacy lawyer-signed
- [ ] Production admin query run and recorded
- [ ] One plan **and** one add-on bought with a real card; webhook fired; tenant activated
- [ ] Backup restore rehearsed and timed
- [ ] Ledger sweep: 0 mismatches, trial balance balances

**Should fix**
- [ ] `HasTenant` on `UserDevice`; `UserPreference` documented or scoped
- [ ] Turnstile secret set
- [ ] `BROADCAST_CONNECTION` decided

**Post-launch**
- [ ] T-36 caching · 128 closures → controllers · CI blocking · skipped-test audit (177)

---

## 5. HOW TO READ THE THREE REVISIONS

Rev 2 exists because an agent reported "100% resolved" against work that was ~64% done. **Rev 3 exists because that agent then did most of the remaining work properly** — and because one of Rev 2's own findings (T-40) was wrong and needed retracting.

The pattern worth keeping: **claims verified against files, not summaries.** It caught 8 over-reports in Rev 2, caught my own bad heuristic in Rev 3, and caught the baseline unlock — which no completion report mentioned in either direction.

Two standing rules for anything further:
1. **Paste acceptance output.** Not a description of it.
2. **A guardrail that gets edited to make a test pass is a finding, not a fix.** Say so explicitly when it happens; it may still be correct, but it always needs a second pair of eyes.

---

## 6. DO NOT "FIX" THESE

Re-verified Rev 3: the financial engine (0 ledger mismatches, balanced trial balance) · `TenantMiddleware` · `SuperAdminMiddleware` (404-not-403) · `VerifyLemonSqueezySignature` · both WooCommerce receivers (HMAC-checked + missing-secret 401s) · no raw card data · `/next-dashboard` + `/new-dashboard` production guards · `robots.txt` · the AI architecture (deterministic question selection, validation gate, three-tier degradation) · `AiSpendGuard`/`AiRateLimiter` InnoDB locking · offline POS · `ToolLeadController` double opt-in · cookieless analytics · **the eight relationally-scoped child tables — they must NOT get `HasTenant`** · the code comments.

---

## 7. OPEN QUESTIONS FOR THE OWNER

1. Base-plan catalogue — `solo/starter/core/scale` vs `counter/starter/growth/business`?
2. Slug mapping — `core → growth`, `scale → business`?
3. Counter plan — still sold?
4. Channel sync — one bundle or four products?
5. AI tier names — `spark/shop/pro/max` vs `starter/lite/pro/ultimate`?
6. `BROADCAST_CONNECTION` — live chat at launch?
7. `/demo` — retire, or restore as "watch someone else's build"?

---

*Rev 3, 2026-09-10. Statuses verified by parsing `junit-rev2.xml`, scanning per-table migration create blocks, and reading each named file. Where Rev 2 conflicted with the evidence, Rev 2 is corrected. The one item I could not verify — the permission-baseline diff — is flagged as BLOCKER-1 rather than assumed either way.*
