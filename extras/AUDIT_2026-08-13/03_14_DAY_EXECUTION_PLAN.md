# VenQore — 14-Day Execution Plan to AppSumo
**Plan for 14 days. Celebrate if you finish in 12. Do not tell yourself 10.**

Assumption: ~12 productive hours/day with AI assistance. I have deliberately *not* planned for 15–16, because a plan that requires your best day every day for 14 days is a plan that fails on day 9.

---

## PHASE STRUCTURE

| Phase | Days | Goal |
|---|---|---|
| **0 — Get to green** | 1–3 | Test suite exit code 0. No new features. |
| **1 — Foundation** | 4–6 | Capability/entitlement split, registry, presets |
| **2 — AI Builder** | 7–9 | Discovery, AI service, validator, apply |
| **3 — UI** | 10–12 | 6 onboarding screens, capability nav, terminology |
| **4 — Harden & submit** | 13–14 | Migration, tests, cleanup, listing assets |

**Days 1–3 are not optional and cannot be shortened.** Every hour of AI Builder work built on a red test suite is an hour you may have to redo.

---

## PHASE 0 — GET TO GREEN (Days 1–3)

### Day 1 — Kill the cascade
**Objective:** clear ~90 of 197 failures with one fix.

Tasks:
- Fix `GoldenCompanySeeder.php:516` ↔ `app/Engines/PaymentService.php:223` purchase-id mismatch (`PUR_001` not found in `purchases` for tenant 999991). Trace where the purchase is actually written after the V3→Engines consolidation.
- Delete the stale `V3\` references in `PaymentService` comments so the next reader isn't misled.
- Re-run `RUN_FULL.bat`. Record the new number.

**Acceptance:** Golden suite runs to completion. Financial Engine area = passing. Total failures < 20.
**Do NOT:** touch capabilities, AI, or UI today.

### Day 2 — The money bugs
**Objective:** no entitlement leaks, no AppSumo-breaking bugs.

Tasks (in priority order):
1. **`PlanTruthFailClosedTest`** — `growth_engine` enabled by default on `ltd_2`. *You are giving a metered AI product away free, forever, to every LTD buyer.* Fix first.
2. **`AppSumo\CodeStackingTest`** — code stacking is how buyers upgrade tiers. Broken stacking = mass refunds on day one.
3. `RegistryDriftTest` ×2 — regenerate `suites.yaml`.
4. `SuiteIntegrityTest` — the archived `Tester/Golden/tests` path expectation.
5. `Tests\Unit\Experience\AppearanceTest` ×3.
6. CSRF `X-Inertia-Location` assertion; route sweep ×2; the Guardrails `Undefined array key "production"`.

**Acceptance:** `RUN_FULL.bat` → **exit code 0**. Write the number down. This is your baseline for the next 12 days.

### Day 3 — Security & hygiene
**Objective:** the repo is safe to show to a payment processor, a partner, or a security-minded buyer.

Tasks:
- **`safe.env` in the repo root — inspect it today.** If it holds live credentials: rotate them, remove the file, verify `.gitignore`, and check whether it exists in git history (`git log --all -- safe.env`). If yes, treat those credentials as compromised.
- Move ~200 root scripts (`tmp_*`, `debug_*`, `check_*`, `audit_*`, `fix_*`, `restore_*`, `test*.php`, `first()))`, `*.log`) into `scratch/`, gitignore it.
- **Verify none of `truncate_tables.php`, `clean_db.php`, `wipe_test_data.php`, `create_test_user.php`, `fix_admin_passcode.php` is reachable from the web root in production.** Confirm the deploy artifact excludes them.
- Confirm `vendor/` and `node_modules/` are gitignored.
- Re-run full suite. Tag the commit: `pre-ai-builder-green`.

**Acceptance:** green suite, clean root, no secrets in the repo, tagged commit to roll back to.

---

## PHASE 1 — FOUNDATION (Days 4–6)

### Day 4 — Capability/entitlement split
- Migration: `tenant_capabilities` (Doc 02 §3.2)
- Backfill migration: every existing tenant gets all currently-visible capabilities enabled (Doc 02 §8.2)
- `App\Services\CapabilityService`: `enabled($tenant,$key)`, `visible() = entitled AND enabled`, cached, cache invalidated on write
- Change `TenantDefaultSeeder::seedTemplateBuildingBlocks()` to write `tenant_capabilities`, not `tenant_plan_overrides`

**Tests:** existing tenant sees identical nav before/after backfill (the single most important test in this phase); disabled capability hides but does not delete; `visible()` is false when entitled but disabled, and when enabled but not entitled.
**Do NOT:** change `tenant_plan_overrides` or any of the 132 route enforcement points.

### Day 5 — Capability registry
- Hand-write `config/capabilities.php` — **25–35 capabilities only**, each mapped to a feature that genuinely works in `app/Engines/`
- Rewrite `CapabilitiesRegistrySeeder` to read that config (delete the `file_get_contents` + `preg_match` scraping)
- Expand `CapabilityDependencyResolver` (86 lines today): `requires` cascade-enable, `conflicts`, cascade-disable protection, data-safety refusal (Doc 02 §3.4)

**Tests:** every registry key maps to a real route/feature; enabling `manufacturing` auto-enables `inventory`; disabling `inventory` with data present is refused.
**Acceptance:** `php artisan capabilities:validate` passes with zero orphan keys.

### Day 6 — Presets
- `presets` table; `BusinessTemplatesSeeder` populates it
- Take the 9 existing presets to **15** (add the 6 from Doc 02 §5.3)
- `ApplyConfigurationService` — transactional: capabilities + terminology + dashboard cards + `tenant_config_versions` snapshot
- `tenant_config_versions` table + `revert()`

**Tests:** a golden test per preset — apply it to a fresh tenant, assert nav, terminology, dashboard cards. 15 tests. Write them; they're your regression net for everything that follows.
**Do NOT** add Construction/Projects. **Do NOT** exceed 15 presets.

---

## PHASE 2 — AI BUILDER (Days 7–9)

### Day 7 — Discovery + AI service
- `BusinessDiscoveryService` — the 5-question funnel (Doc 02 §6.4)
- `ConfigurationAIService` — prompt assembly (registry + presets), model call, JSON parse, retry-once-on-malformed
- Wire `AiSpendGuard` / `AiRateLimiter` / `AiUsageRecorder` (all exist ✅) from the first call
- Fallback path: AI unavailable → preset picker, always

**Tests:** 10 fixture business descriptions → expected preset (bakery, salon, phone shop, pharmacy, restaurant, hardware, clothing, wholesaler, freelancer, supermarket). **Mock the AI in tests** — never call a live API in CI.

### Day 8 — Validator + apply
- `ConfigurationValidator` — **no AI**: unknown keys dropped, entitlement filtered, dependencies resolved, conflicts rejected
- Wire validator → `ApplyConfigurationService` (built Day 6)
- `ModificationParser` — the 4 intents (ENABLE / DISABLE / RENAME / ADD_CARD), everything else → logged "not supported yet"

**Tests:** AI proposing a non-existent capability is dropped silently; AI proposing an unentitled capability is filtered; malformed JSON degrades to the preset picker without a 500.
**Acceptance:** an adversarial/nonsense AI response can never corrupt a tenant.

### Day 9 — End-to-end + buffer
- Full flow works via API/tinker with no UI: description in → configured tenant out
- **Half of this day is deliberate buffer.** Days 7–8 will overrun; this is where that overrun goes. If they don't, you're a half-day ahead going into UI week — which you will need.

**Acceptance:** `php artisan ai:build-demo "I run a small bakery..."` produces a fully configured tenant.

---

## PHASE 3 — UI (Days 10–12)

### Day 10 — Shell + screens 1, 2, 5
- `Next/Shell/Nav.jsx`: `props.plan.features` → `props.capabilities`
- Terminology on the ~40 high-visibility strings (Doc 02 §4.1)
- Welcome/path-choice screen; preset picker; building animation

### Day 11 — Screens 3 & 4 (the money screens)
- AI discovery flow, one question per screen, progress bar, skip link
- **The proposal screen** — module cards, inline rename, reasoning line per module, toggles, "add something else". **Give this screen your best hours.** It is your demo video, your listing screenshot, and your differentiation.

### Day 12 — Screen 6 + polish
- First-run dashboard, teaching empty states, "⚙ Customize my system" entry point
- Mobile responsive pass on the 6 new screens only
- **Record the AppSumo demo video today, while the flow is fresh.** Do not leave this to day 14.

**Do NOT** touch the 301 classic pages. If a classic page looks dated next to the new shell, that is acceptable and normal — every SaaS product looks like that mid-redesign.

---

## PHASE 4 — HARDEN & SUBMIT (Days 13–14)

### Day 13 — Full regression + migration rehearsal
- `RUN_FULL.bat` — must be **exit code 0**
- **Restore a production-shaped database backup, run the backfill migration against it, and confirm an existing tenant's nav, reports and permissions are byte-identical before and after.** This is the highest-risk step in the whole plan; give it real hours, not a token check.
- Manual pass: 5 presets, signup → configure → create a sale → check the ledger balances
- Load-check the AI onboarding path (concurrent signups)

### Day 14 — Listing & submit
- Listing copy, screenshots (proposal screen leads), demo video final cut, pricing tiers, FAQ
- Changelog for existing customers: *"Your system just got an AI Builder — free, nothing changed, here's the button"*
- Submit.

---

## FEATURE FREEZE — STOP BUILDING THESE, TODAY

**INFERENCE.** Your latest commit is *"Complete Composable Dashboard Builder (Phases B0-B4)"*. That is a sophisticated piece of infrastructure and it is exactly the pattern you asked me to help you break. Freeze it where it is.

| Stop | Why |
|---|---|
| **Composable Dashboard Builder — any further phases** | Already good enough. Presets just need to pick cards. |
| **Growth Engine / GrowthBrainStat / GrowthSignalEvent** | Marketing infrastructure for a product with no customers yet. Zero launch value. |
| **Marketing tools suite (28 test files!)** | Barcode/QR/price-tag/label tools. Lead-gen for a product not yet listed. Real work, wrong time. |
| **SmartCapture / AI extraction** | Impressive. Not needed for a single AppSumo sale. |
| **VenSynQ expansion** | 36 tests passing. Leave it exactly there. |
| **Blog seeder / SEO articles / OpenSEO** | Post-launch activity. |
| **Desktop / mobile app builds (`app-code/windows-app`, `mobile-app`)** | Web-only for AppSumo V1. This is weeks of work hiding in plain sight. |
| **Migrating the 301 classic pages to the Next shell** | The single biggest timeline risk in the project. Do not start. |
| **Construction / Projects domain** | New models = new product. Roadmap item, not V1. |
| **Any new ERP module of any kind** | You have more modules than your competitors already. |
| **Open-ended AI chat builder** | 5 fixed questions ship in a day; open chat costs a week and tests worse. |
| **Embeddings in `capability_search_index`** | Aliases + fulltext are enough for 35 capabilities. |
| **More than 15 presets** | Diminishing returns per preset, linear testing cost. |

**The test:** *"Will a paying AppSumo customer notice this in their first week?"* If no — freeze it.

---

## TESTING GATE — what must pass before you submit

**Hard blockers (submission is impossible without these):**

| # | Gate |
|---|---|
| 1 | `RUN_FULL.bat` → exit code 0, zero failures |
| 2 | Golden financial suite fully green (ledger, FIFO, COGS, AR/AP reconciliation) |
| 3 | `AppSumo\CodeStackingTest` passing |
| 4 | `PlanTruthFailClosedTest` passing — no paid feature on by default |
| 5 | Tenant isolation 13/13 passing |
| 6 | Backfill migration verified against a production-shaped DB: existing tenant unchanged |
| 7 | 15 preset golden tests passing |
| 8 | Disable-never-deletes test passing |
| 9 | AI-returns-garbage test: no corruption, no 500 |
| 10 | AI-unavailable test: preset picker fallback works |
| 11 | Route sweep green |
| 12 | No secrets in repo; dangerous scripts unreachable in production |

**Should-have (fix if time allows, note as known issues if not):** performance under concurrent signup, 5 manual preset walkthroughs, mobile responsive on the 6 new screens.

---

## RISK REGISTER

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| The Golden seeder fix is deeper than one id mismatch | Medium | **High** — could cost 2–3 days | Timebox Day 1 to 8 hours. If unsolved, escalate: it means the V3→Engines consolidation left real breakage, and *that* changes the launch date. Do not push through silently. |
| Terminology sprawl (you start re-wording all 301 pages) | **High** | High | Hard cap: 40 strings. Ship the Terminology settings page as the release valve. |
| Scope creep on the proposal screen | High | Medium | Timebox to 1.5 days. It can be beautiful in v1.1. |
| AI accuracy is poor on odd businesses | Medium | Medium | Proposal screen is fully editable + preset escape hatch. Accuracy is a nice-to-have, not a blocker. |
| Backfill breaks an existing tenant | Low | **Critical** | Day 13 rehearsal on a real DB copy. Non-negotiable. |
| Burnout at day 9–10 | **High** | High | Plan 12h not 16h. Day 9 has built-in buffer. A day off on day 10 costs less than a mistake in the ledger. |
| AppSumo review is faster than you expect | Low | Medium | Check today (Doc 01 §8) — it changes everything about this schedule. |

---

## IF THINGS SLIP — cut in this order

1. Presets: 15 → 10
2. Terminology: 40 strings → 20 (sidebar + page titles only)
3. `ModificationParser`: 4 intents → 2 (ENABLE, RENAME)
4. Screen 6 tour → plain dashboard
5. Mobile responsive → post-launch

**Never cut:** the green test suite, the backfill safety test, code stacking, or the entitlement-leak fix. Those are the four things that turn a launch into refunds.

---

## THE ONE-LINE VERSION

> **Days 1–3: make it green. Days 4–6: separate capability from entitlement. Days 7–9: AI writes JSON, never code. Days 10–12: six screens, and only six. Days 13–14: prove nothing broke, then submit.**
