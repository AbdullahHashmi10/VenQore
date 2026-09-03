# VenQore — AI Consolidation Mandate (Phase 1)

**Target agent:** IDE coding agent with full repo access
**Repo root:** `app-code/main-app`
**Estimated scope:** 3 working days
**Author's constraint:** pre-launch, 3 live tenants, 1 paying customer. Minimum-sellable scope. No speculative architecture.

---

## START HERE — the order across both mandates

There are two mandates: **this one** (AI consolidation) and **`VENQORE_RECKONER_COVERAGE_MANDATE.md`** (reading coverage + query composition). This section is the single ordering across both. Follow it top to bottom.

### Step 0 — Before either mandate (about one day, mostly minutes)

Four items are either actively costing money, actively leaking, or would ship something untrue. None is architectural. Do them today.

| Order | Item | Where | Time | Why now |
|---|---|---|---|---|
| 1 | **Seed `ai_model` / `ai_provider`; change the `gpt-4o` fallback** | FIX-6, `AiController.php:81-82` | **~15 min** | Removes up to **$59/tenant/month**. Highest return per minute in either document. |
| 2 | **Move `checkAccess()` above the intent router** | FIX-5, `AiController.php:31-51` | **~10 min** | A restricted cashier can currently pull full company receivables. |
| 3 | **Count distinct tenants in the shared catalog** | Appendix C.3 | **~1 hr** | One shop confirming a product 3× publishes its own product names to every tenant. Happening now. |
| 4 | **Truth gate: generate the V6 reading catalog from `ReckonerRegistry`** | Reckoner mandate, Part A | **~½ day** | V6 currently offers 108 readings of which 91 do not compute. Must not ship. |

### Step 1 — This mandate (3 days)

FIX-1 → FIX-4, then `AiGateway`, then the five call-site migrations. Bounded, ships in three days, and creates the one place where every later change lands.

**Pull one item forward from the Reckoner mandate:** do **F-A** — re-point the 8 `AiController` tools at the Reckoner — as part of call-site migration #5. You are rewriting how that file talks to the model anyway; rewriting what its tools call at the same time costs a few hours. Doing it later means opening the same file twice.

### Step 2 — Reckoner mandate, Part C1

Declare `dimensions` and `filters` on the **existing 25** readings. Largest jump in answerable questions in either document, with zero new calculations.

### Step 3 — Reckoner mandate, Part F laws (start with L1)

Tenant isolation first, then the remaining seven. Build these **before** the 40-odd new readings, so every new reading is born covered.

### Step 4 — Reckoner mandate, C2–C5

The new calculations, ordered by the `ai_reading_requests` miss log.

### Step 5 — Phase 3

Resolvers, conversational layout (Appendix A), shared-catalog opt-in and GTIN keying (Appendix C).

### Why this order

- **Money and leaks before architecture.** Steps 0.1–0.3 take under two hours combined and each stops something currently happening.
- **The gateway before the readings.** More readings make the AI more useful, but only once there is one clean place to call them from. Building coverage first means migrating it afterwards.
- **The laws before the readings they protect.** Adding 40 readings and then trying to prove them is the expensive order. Build the laws at 25 readings, and the next 40 arrive pre-covered.
- **Nothing user-facing ships untrue.** Step 0.4 is the gate on V6 and is independent of everything else.

---

## 0. Read this first — what this mandate is and is not

VenQore is *not* suffering from having "too many AI systems." A code audit established that only **five** code paths ever call an LLM. Four subsystems commonly described as "AI" make zero API calls and are already correct.

The real defects are: **guards that do not fire**, **a model registry nothing reads**, **an access-control bypass**, and **cheap-tier infrastructure that exists but is empty**.

This mandate does two things and nothing else:

1. **Phase 1 (bugs).** Fix six defects that will cost money or leak data at 100 tenants.
2. **Phase 2 (gateway).** Introduce `AiGateway` — one entry point that owns key resolution, model selection, timeouts, guards and telemetry — and migrate all five call sites onto it.

**Phase 3 is explicitly deferred.** But the Phase 2 contract is designed so Phase 3 is *additive*. Section 7 defines that seam precisely. Do not build Phase 3 now; do not design Phase 2 in a way that blocks it.

### Non-goals — do NOT do these

- Do **not** create `QoreRouter`, `QoreMemory`, `QoreConfidence`, `QoreTeacher`, or any `Qore*` class.
- Do **not** merge `AiExtractionService`, `ChatAIService`, `ConfigurationAIService` into one service.
- Do **not** move or rename the `Growth/`, `SmartCapture/`, or `AiBuilder/` capability folders.
- Do **not** refactor prompts for quality. Context *trimming* is in scope; prompt *rewriting* is not.
- Do **not** add an embedding store, vector search, or semantic cache.

Every one of the above is a reasonable Phase 3 idea and a scope-creep trap today.

---

## 1. Verified findings (evidence for every fix below)

All line numbers verified against the working tree.

| # | Finding | Evidence |
|---|---|---|
| F1 | **Rate limiting is entirely inert.** `ai_rate_buckets` is created by migration `2026_08_04_000002_*` and **no code anywhere inserts a row**. `AiRateLimiter::tryAcquire()` returns `['ok' => true]` when the row is missing (`AiRateLimiter.php:20-22`). All 5 call sites fail open. | `AiRateLimiter.php:16-23` |
| F2 | **Bucket keys are global, not per-tenant.** `'paid_key:query'`, `'paid_key:scan'`, `'visitor_chat'`, `'public_tool'` are shared across every tenant. One busy store exhausts every other store's allowance. `"ai_builder:{$tenant->id}"` *is* per-tenant — and therefore can never have a pre-seeded row, so it always fails open. | `AiController.php:58`, `SmartCaptureController.php:254`, `VisitorChatController.php:163`, `ConfigurationAIService.php:67` |
| F3 | **Spend caps cover the two cheapest paths only.** `AiSpendGuard` is used by `PublicToolController`, `VisitorChatController`, `ConfigurationAIService`. It is **not** used by Smart Capture (vision — the most expensive path) or by `AiController`. The `visitor_chat` scope is a **global** $3.00/day cap shared by all tenants. | `AiSpendGuard.php`, `VisitorChatController.php:173` |
| F4 | **`GenerateProductDescriptionsJob` has no guards at all** — no spend cap, no rate limit, no usage record, no entitlement check — and it always uses the **platform** key (`config('smartcapture.gemini_key')`), never tenant BYOK. Batched 20 products/job; a 5,000-product sync dispatches 250 unrecorded jobs billed to the platform. | `GenerateProductDescriptionsJob.php:28-46` |
| F5 | **Access-control bypass in the SQL intent router.** The intent loop returns at `AiController.php:33-45`, *before* `checkAccess()` at `:47`. A user whose role is in `ai_restricted_roles`, or any user when `ai_enabled = '0'`, can type "who owes me money" and receive full company receivables. | `AiController.php:31-51`, `:1101` |
| F6 | **No HTTP timeout on 8 calls in `AiController`.** `handleGemini`/`handleOpenAI` perform up to 3 sequential tool-calling round trips at Laravel's 30s default → ~90s worst case blocking a web request. | `AiController.php:175,213,241,305,340,392,397,437` |
| F7 | **`config/ai_models.php` is dead config.** Read by exactly one line — `ConfigurationAIService.php:104` — which reads `ai_models.default`, **a key that does not exist in the file**, so it always yields `'unknown'`. Its `deprecation_audit` block records `gemini-2.5-flash` EOL **2026-10-16** and nothing reads it. | `config/ai_models.php`, `ConfigurationAIService.php:104` |
| F8 | **`ai_model` / `ai_provider` settings are never seeded**, so `AiController.php:81-82` falls back to **`gpt-4o` on OpenAI** — 25× the cost of `gemini-2.5-flash-lite` — for any tenant that has an `openai_api_key` set. `AiSettingsSeeder` seeds `ai_enabled`, `ai_tier`, `ai_usage_limit`, `ai_restricted_roles` but not these two. | `AiController.php:81-82`, `AiSettingsSeeder.php` |
| F9 | **Four incompatible key-resolution chains** exist (`AiController.php:80-99`, `ChatAIService.php:23-60`, `AiExtractionService::resolveConfig():101-168`, `ConfigurationAIService.php:313`). BYOK works in Smart Capture and chat; it silently does **not** apply to AI Builder or catalog copywriting. | as listed |
| F10 | **Learning inflates cost instead of reducing it.** `LearningService::promptHints()` injects up to 60 learned aliases into every subsequent prompt (`smartcapture.hint_limit` = 60), and `matchFallback()` (`SmartCaptureController.php:503`) is a **second** API call. Learning never skips a call; each correction makes all future calls larger. | `AiExtractionService.php:1207`, `LearningService.php:181` |
| F11 | **The cheap tier is nearly empty.** `config/ai_intents.php` holds 5 intents / 20 literal phrases matched by `str_contains`. Config stores `'todays sales'`; a user typing `"today's sales"` misses. Its `handler` keys reference `App\Services\Reports\{Sales,Stock,Party}ReportService` — **that namespace does not exist**; dispatch actually happens via the `match` in `resolveSqlIntentReport()`. | `config/ai_intents.php`, `AiController.php:31-45,1101` |

### Findings that are already correct — do not "fix" them

- `app/Services/Growth/**` makes **zero** LLM calls. It is fully deterministic and is the reference standard. Leave it alone.
- `AiController@smartReorder` and `@cashFlowForecast` are deterministic. Leave them alone.
- `DataImportService.php` makes zero LLM calls despite a `list_import` profile in `config/ai_models.php`. The feature was never built. Do **not** build it in this pass; delete nothing.
- `SmartCaptureController.php:290-330` already implements correct context trimming (comments tagged `T0-3`, `T0-6`): party list removed, expense categories conditional, catalog capped at 300 with `name`+`sku` only, `thinking_budget_image` cut 1024 → 256. **This is the pattern to generalise, not to change.**

---

## 2. Unit economics (drives the defaults you will set)

Measured inputs: static scan prompt ≈ 1,620 tokens (`AiExtractionService::buildPrompt`, 9,456 source chars); catalog 300 × (name+sku) ≈ 4,200 tokens; 60 learned aliases ≈ 900 tokens; invoice image ≈ 1,300 tokens; output ≈ 800 + 256 thinking. Tool schema for the query path: 8 tools, 5,845 chars ≈ 1,500 tokens, **resent on every tool-calling turn**.

**Scan path** (~8,020 in / ~1,056 out):

| Model | Per scan | × 500 pages/mo |
|---|---|---|
| `gemini-2.5-flash-lite` | $0.00122 | **$0.61** |
| `gemini-2.5-flash` (current default) | $0.00505 | **$2.53** |

**Query path** (3 turns ≈ 7,000 in / 600 out):

| Model | Per query | × 2,500 queries/mo |
|---|---|---|
| `gemini-2.5-flash-lite` | $0.00094 | **$2.35** |
| `gpt-4o` (current fallback default, F8) | $0.0235 | **$58.75** |

Managed tenants are set to `ai_pages_limit = 500`, `ai_queries_limit = 2500` by migration `2026_08_04_000006_fix_null_ai_page_limits.php`. Against plans priced $36–$129/month:

- On correct defaults: **≈ $2.96/tenant/month.** Healthy.
- On the current `gpt-4o` fallback: **≈ $61/tenant/month.** Margin-negative on two of three tiers.

**AppSumo LTD warning.** LTD is a one-time payment against a recurring cost. At $2.96/month a fully-using LTD tenant costs ≈ $36/year forever. Set LTD `ai_pages_limit` / `ai_queries_limit` deliberately, or make LTD **BYOK-only** for AI. Do not inherit the managed 500/2500 defaults onto LTD plans.

---

## 3. Phase 1 — the six fixes

Do these first, in this order. Each is independently shippable.

### FIX-1 — Make the rate limiter actually work

`app/Services/Ai/AiRateLimiter.php`

- Change `tryAcquire()` to **auto-provision** a bucket when the row is missing instead of returning `['ok' => true]`. Insert using per-feature defaults from a new `config/ai_limits.php`, then evaluate normally. Use `insertOrIgnore` + re-select inside the existing transaction so concurrent first-hits cannot double-insert.
- Add `config/ai_limits.php` with per-feature `capacity`, `refill_per_sec`, `day_limit`.
- Widen `ai_rate_buckets.bucket_key` if needed to hold `"{feature}:{tenant_id}"` (UUID tenants → allow 96 chars). New migration; do not edit the existing one.

**Acceptance:** a fresh database with zero rows in `ai_rate_buckets` rate-limits correctly on the first request. A test asserting `tryAcquire()` returns `ok => false` after `day_limit` calls passes.

### FIX-2 — Make every bucket and spend scope tenant-aware

Replace the global keys with `"{feature}:{tenant_id}"`:

- `AiController.php:58` — `'paid_key:query'` → `"query:{$tenantId}"`
- `SmartCaptureController.php:254` — `'paid_key:scan'` → `"scan:{$tenantId}"`
- `VisitorChatController.php:163,173` — `'visitor_chat'` → `"visitor_chat:{$tenantId}"` (**both** limiter and spend guard)
- `PublicToolController.php:72,93` — leave global. It is genuinely a shared marketing budget.

**Acceptance:** tenant A exhausting its scan limit does not affect tenant B. Add a feature test for exactly this.

### FIX-3 — Spend cap on the expensive paths

- Add `AiSpendGuard::checkAndRecord("scan:{$tenantId}", $estimate, $cap)` to the Smart Capture extract path, with `reconcile()` on completion — mirror the existing pattern in `PublicToolController.php:93,133`.
- Same for the `AiController::query` path.
- Caps come from `config/ai_limits.php`, per plan, not hardcoded.
- Page quota (`ai_pages_used`) is a **volume** control, not a **cost** control. Keep both: the quota protects the tenant's fairness, the dollar cap protects the platform.

**Acceptance:** with the cap set to $0.001, the second scan of the day for that tenant is refused with a clear message and no upstream call is made.

### FIX-4 — Guard `GenerateProductDescriptionsJob`

`app/Jobs/GenerateProductDescriptionsJob.php`

- Resolve the key through the shared resolver (after Phase 2, through `AiGateway`) so tenant BYOK is honoured.
- Add entitlement check, `"catalog:{$tenantId}"` rate bucket, spend cap, and `AiUsageRecorder::record()` per product.
- If the tenant has no AI entitlement and no BYOK key: log and return without calling the API. Do not silently spend platform credit.

**Acceptance:** a tenant with BYOK configured sees `ai_usage_events` rows with `key_mode = 'byok'`; a tenant with no entitlement generates zero rows and zero upstream calls.

### FIX-5 — Close the intent-router access bypass

`app/Http/Controllers/AiController.php`

- Move the `checkAccess()` call (currently `:47`) **above** the intent-matching loop (`:31-45`).
- Keep the intent path free of the *entitlement/metering* gate — a zero-cost SQL report should not consume paid quota. Only the role/enabled check moves up.

**Acceptance:** a user whose role is listed in `ai_restricted_roles` receives 403 for `"who owes me money"`, not a receivables report.

### FIX-6 — Timeouts and model defaults

- Add `->timeout(config('ai_limits.timeout.query', 20))` to all 8 `Http::` calls in `AiController.php`.
- Cap the tool-calling loop at 2 round trips, with a total wall-clock budget; return the best partial answer on exhaustion.
- Seed `ai_model` and `ai_provider` in `AiSettingsSeeder` to `gemini-2.5-flash-lite` / `gemini`, and change the `??` fallbacks at `AiController.php:81-82` to match. **This alone removes the $58/tenant/month exposure in §2.**

**Acceptance:** no `Http::` call in `app/` lacks an explicit timeout (`grep -rn "Http::post\|Http::get" app/ | grep -v timeout` returns nothing outside the gateway).

---

## 4. Phase 2 — `AiGateway`

### 4.1 The contract

One entry point. This signature is **final** — it is the API Phase 3 will also use, so call sites migrate exactly once.

```php
$result = app(AiGateway::class)->resolve(
    AiRequest::for('scan_printed')       // key into config/ai_models.php
        ->tenant($tenant)
        ->input(['image' => $bytes, 'mime' => 'image/jpeg'])
        ->context($context)              // array, already budgeted
        ->expects(AiSchema::scanResult()) // JSON shape to validate against
);
```

```php
final class AiResult
{
    public bool    $ok;
    public mixed   $value;        // parsed + schema-validated payload
    public string  $source;       // 'deterministic'|'memory'|'cache'|'model'
    public ?string $model;        // null when no upstream call occurred
    public float   $confidence;   // 0.0–1.0
    public float   $costUsd;
    public int     $latencyMs;
    public bool    $learnable;    // safe to feed the learning store
    public ?string $failureCode;  // 'spend_capped'|'rate_limited'|'no_key'|...
}
```

`$source` and `$confidence` are **populated from day one** even though Phase 1 only ever returns `'model'`. They are the fields Phase 3 needs; adding them later means touching every call site again.

### 4.2 File layout

```
app/Services/Ai/
    AiGateway.php            # guards + pipeline runner. The only public entry.
    AiRequest.php            # immutable request value object
    AiResult.php             # immutable result value object
    AiSchema.php             # named JSON schemas + validation
    ContextBudget.php        # generalised T0-3 trimming (see 4.4)
    AiSpendGuard.php         # EXISTING — unchanged
    AiRateLimiter.php        # EXISTING — patched by FIX-1
    AiUsageRecorder.php      # EXISTING — unchanged
    Resolvers/
        AiResolver.php       # interface: attempt(AiRequest): ?AiResult
        ModelResolver.php    # Phase 1: the ONLY registered resolver
    Providers/
        ProviderContract.php
        GeminiProvider.php    # extracted from AiExtractionService::callGemini
        OpenAiProvider.php    # extracted from AiExtractionService::callOpenAi
        AnthropicProvider.php # extracted from AiExtractionService::callAnthropic
        DeepSeekProvider.php  # extracted from AiExtractionService::callDeepSeek
        KeyResolver.php       # ONE chain replacing the four in F9
```

`AiExtractionService` already contains working implementations of all four providers (`:540`, `:695`, `:834`, `:950`). **Move them; do not rewrite them.** They handle model substitution, pacing and provider quirks that took real effort to get right.

### 4.3 Guard order inside `AiGateway::resolve()`

Fixed, non-optional, executed once so no call site can forget one:

1. **Entitlement** — `AiEntitlementService::check*()`; short-circuit with `failureCode`.
2. **Rate limit** — `"{feature}:{tenant_id}"`.
3. **Spend cap** — `checkAndRecord()` with the profile's estimate.
4. **Resolver pipeline** — first non-null `AiResult` wins.
5. **Telemetry** — `AiUsageRecorder::record()` and `AiSpendGuard::reconcile()` in a `finally` block, so failures and exceptions are still recorded and refunded.

### 4.4 `ContextBudget` — the reusable version of what already works

Generalise `SmartCaptureController.php:290-330`. Signature:

```php
$context = ContextBudget::for('scan_printed')
    ->maxTokens(config('ai_models.scan_printed.context_budget', 3000))
    ->block('aliases',  $aliases,  weight: 3, format: fn($a) => $a['heard'].'='.$a['name'])
    ->block('catalog',  $products, weight: 1, format: fn($p) => $p->name.'|'.$p->sku)
    ->block('categories', $cats,   weight: 2, when: $isExpense)
    ->build();
```

Blocks are dropped lowest-weight-first until the estimate fits. Token estimate: `ceil(strlen($json) / 3.8)` — good enough; do not add a tokenizer dependency.

**Apply the existing SmartCapture judgement as the default weights:** learned aliases outrank the catalog, the catalog is droppable, party lists are never sent. When a block is dropped, set `AiResult::$confidence` no higher than 0.9 so the review screen still asks the user to glance at it.

While you are here: `SmartCaptureController.php:304` is a **cliff**, not a curve — a 300-product store sends ~4,200 tokens, a 301-product store sends zero and (per the code's own comment) matches fine locally. Replace `if ($productCount <= $inlineMax)` with a `ContextBudget` block so the catalog is trimmed to the budget rather than being all-or-nothing.

### 4.5 Wire the model registry (fixes F7)

- Add a `default` key to `config/ai_models.php` — it is currently read at `ConfigurationAIService.php:104` and always misses.
- Give every profile: `provider`, `model`, `thinking`, `max_output`, `context_budget`, `timeout`, `est_cost_usd`.
- Have `AiGateway` read this file as the **single** source of model selection. Reconcile it with `config/smartcapture.feature_models` — keep `ai_models.php` as the source of truth and have `smartcapture.php` defer to it.
- Implement `deprecation_audit`: on provider 404 / "model not found", consult `fallback_successor`, retry once, and log a warning. **`gemini-2.5-flash` is marked EOL 2026-10-16 — roughly six weeks out. This is time-critical.** Verify the successor chain is still valid before shipping; `gemini-1.5-flash` may already be retired.

### 4.6 Call-site migration

Migrate in this order, shipping each independently:

1. `GenerateProductDescriptionsJob` — smallest, no UI, safest first migration.
2. `ConfigurationAIService::call()` — single call, already guarded, good second.
3. `ChatAIService::respond()` + `classifyCategory()`.
4. `AiExtractionService::extract()` — largest; providers move out, orchestration stays.
5. `AiController::handleGemini()` / `handleOpenAI()` — hardest, has tool-calling; do last.

After each migration, delete that file's private HTTP method and its local key-resolution chain. **A migration is not complete while the old path still exists** — leaving both is how the four chains in F9 came to exist.

`ChatbotSettingsController` and `StoreChatbotSettingsController` only run connection probes; point them at `AiGateway::testConnection()` and drop their inline URLs.

---

## 5. What "structure ready for later" means concretely

The author's requirement: *do the 3-day scope now, but leave the pathway so the full restructure is never a re-audit or a rewrite.* Three properties deliver that, and they cost nothing extra today:

1. **One entry point.** After Phase 2, `grep -rn "generativelanguage\|api.openai.com\|api.anthropic.com\|api.deepseek" app/` returns hits in `app/Services/Ai/Providers/` **only**. Any future change — a new provider, a cache, a cost rule, a compliance log — is one file.
2. **A pipeline, not an if-chain.** `AiGateway` runs an ordered array of `AiResolver`s. Phase 1 registers one. Phase 3 prepends three more. No call site changes, ever.
3. **`source` and `confidence` on every result from day one.** Phase 3's routing and auto-accept thresholds need these fields to already be flowing.

Add this to `config/ai_limits.php` as the registration point, so Phase 3 is a config edit plus three new classes:

```php
'resolvers' => [
    // Phase 3 will prepend, in this order:
    // \App\Services\Ai\Resolvers\DeterministicResolver::class,
    // \App\Services\Ai\Resolvers\MemoryResolver::class,
    // \App\Services\Ai\Resolvers\CacheResolver::class,
    \App\Services\Ai\Resolvers\ModelResolver::class,
],
```

### Phase 3 backlog — record, do not build

Documented here so it is not re-derived later:

- **`DeterministicResolver`** — expand `config/ai_intents.php` from 5 intents to ~40, with normalisation (case, punctuation, apostrophes, stemming) instead of `str_contains`. Fix the dead `handler` keys (F11) or delete them. *This is the single highest-ROI cost item and it is pure PHP.*
- **`MemoryResolver`** — invert the learning loop (F10). Today a learned alias is injected into the prompt as a few-shot hint, making every future call larger. It should instead resolve locally and **skip the call**. `LearningService::resolve()` already does the lookup; it simply runs too late. Keep `promptHints()` only for aliases below the confidence threshold.
- **`CacheResolver`** — generalise `visitor_chat_cached_answers`, currently the **only** answer cache in the system, to all features via a `(tenant, feature, input_hash)` key.
- **Confidence-based auto-accept** — once `source`/`confidence` carry real data, set per-feature thresholds for auto-accept vs. ask-the-user.
- **Unify the UI under Vena** — 4 frontend entry points (`AiAssistantModal.jsx`, `OmniSearch.jsx`, `SmartCapturePanel.jsx`, `OneGlanceLayout.jsx`). Pure presentation; zero backend risk; can ship any time.

---

## 6. Verification checklist

Run before declaring this mandate complete.

```bash
# No provider URL outside the gateway
grep -rnE "generativelanguage|api\.openai\.com|api\.anthropic\.com|api\.deepseek" app/ \
  | grep -v "app/Services/Ai/Providers/"     # → must be empty

# No untimed HTTP call
grep -rn "Http::post\|Http::get\|Http::withToken" app/ \
  | grep -v "timeout" | grep -v "app/Services/Ai/"   # → must be empty

# Model registry is live
grep -rn "config('ai_models" app/                    # → hits in AiGateway

# Every LLM path records usage
grep -rln "AiUsageRecorder" app/Services/Ai/AiGateway.php   # → 1 hit, and only here
```

Behavioural tests to add:

- [ ] Fresh DB, zero `ai_rate_buckets` rows → limiter still enforces (FIX-1)
- [ ] Tenant A exhausting scan quota does not affect tenant B (FIX-2)
- [ ] Spend cap tripped → no upstream call, clear error (FIX-3)
- [ ] `GenerateProductDescriptionsJob` with BYOK → `key_mode = 'byok'` in `ai_usage_events` (FIX-4)
- [ ] Restricted role + `"who owes me money"` → 403, not a report (FIX-5)
- [ ] Tool-calling loop terminates within the wall-clock budget (FIX-6)
- [ ] `ContextBudget` drops the catalog before dropping learned aliases (4.4)
- [ ] Provider 404 → successor model retried once, warning logged (4.5)
- [ ] Existing Smart Capture, Vena, OmniSearch, AI Builder and public-tool flows unchanged end-to-end

---

## 7. Ordering summary

| Day | Work |
|---|---|
| 1 | FIX-1 → FIX-6. Ship. These are independently valuable and carry no architectural risk. |
| 2 | `AiRequest` / `AiResult` / `AiSchema` / `KeyResolver` / providers extracted / `ModelResolver` / `AiGateway` with guard order. Migrate call sites 1–3. |
| 3 | `ContextBudget`. Migrate call sites 4–5. Delete every dead HTTP method and key chain. Wire `ai_models.php` + deprecation fallback. Run §6. |

Stop at the end of Day 3. Phase 3 is a separate mandate.

---

# Appendix A — Conversational Layout Control ("Vena, add a card")

**Status: Phase 3 feature. Specified here so it is not re-derived later. Do NOT build it during the 3-day scope.**

The proposal: let a user say *"add a card showing last month's sales"*, *"rearrange these so they look better"*, *"make my POS screen more spacious"* — and have it happen. Not new capability; existing capability, reached by talking.

## A.1 Verdict

**Build it. It is close to free, it is low-risk if constrained correctly, and it is the single best demonstration of the product.** The reason is specific to VenQore's existing code, not general optimism.

## A.2 Target surface: the V6 dashboard

This targets the **new dashboard** — `resources/js/Pages/NewDashboard.jsx` (5,067 lines) + `NewDashboard.css`, built against Design System tokens, `VENQORE_LAYOUT_LAW.md` v2.0 and the six card categories — not the older `dashboard_cards` / `DashboardRegistry` path.

That is the right target, and V6 is a **better** substrate for this feature than the old one:

| Component | Location | Size |
|---|---|---|
| Reading catalog | `NewDashboard.jsx:50` (`READINGS`) | **108** readings |
| Reading metadata | each entry | `key, label, short, shape, unit, area, module, extra` |
| Shapes | — | `SCALAR` (86), `BREAKDOWN` (8), `SERIES` (4), `RANKING` (4), `TABLE` (2), `FEED`, `GAUGE`, `STATUS`, `MULTI_SERIES` |
| Areas | — | Sales (32), Finance (28), Inventory (26), Operations (11), Purchasing (11) |
| Per-reading descriptions | `NewDashboard.jsx:83+` | one plain-English line each |
| Categories + fit ladder | `FITS`, `SPECIAL_FITS`, `FIT_INSIDE`, `CATS` | C1–C6 |
| Geometry resolver | `resolveFit()`, `sizeLegal()`, `fitsFor()`, `catsFor()`, `fitToGrid()` | Layout Law v2.0 |

### The consequence: the model's job shrinks to almost nothing

Because `shape` determines the legal chart types, and `resolveFit()` / `sizeLegal()` / `catsFor()` derive category, fit and geometry from the reading and the available space, **the model never chooses geometry at all.** Its entire output is:

```json
{ "op": "add_card", "reading_key": "sales.revenue", "period": "last_month" }
```

Two fields. Everything else — chart type, category, fit, width, height, position — is computed by code that already exists and is already verified (*18 viewport widths × every chart type × every legal category × every legal fit × 4 tones × light/dark/mesh — 0 overflow, 0 collisions, 0 clipping*).

This is the strongest possible safety property: **the model cannot emit an illegal layout, because it never emits a layout.** It names a reading; the Layout Law places it. No prompt engineering, no validation heuristics, no way to regress the verification result above.

`label`, `short`, `area`, `module` and the per-reading descriptions are, again, **a synonym corpus you already wrote** — 108 of them. A local matcher over those fields answers most phrasings with no API call: the `DeterministicResolver` from §5, with this as its first customer.

## A.3 The real gate is Reckoner coverage, not AI

Measured against the live calculation engine:

| | Count |
|---|---|
| Readings declared in V6 `NewDashboard.jsx` | **108** |
| Readings implemented in `app/Reckoner/ReckonerRegistry.php` | **25** |
| **Present in both — i.e. real today** | **17** |
| Declared in V6 with **no Reckoner implementation** | **91** |

The V6 catalog is currently ahead of the engine; its `rowNames` / `sliceNames` are sample data (*"Basmati 5kg"*, *"Rana Traders"*), which is correct for a design-verification pass.

**So the AI can only add cards for readings that actually compute — 17 today.** The feature is gated on Reckoner coverage, not on anything AI-related. Build the readings; the conversational layer is comparatively trivial.

This makes the miss log in A.6 load-bearing rather than nice-to-have: it is how you decide which of the 91 to implement first, ordered by what users actually ask for.

## A.4 Cost

Compressed prompt: 108 readings as `key|short` (~1,200 tok) + instruction (~250) + current layout summary (~150) + utterance (~20) ≈ **1,620 input**; output ≈ **40 tokens**. Pre-filtering the catalog by the user's permissions and the active area cuts input to ~770.

| Path | Cost per command |
|---|---|
| Local match (no API) | **$0.00000** |
| `gemini-2.5-flash-lite`, area pre-filtered | **≈ $0.00009** — ~11,000 commands per dollar |
| `gemini-2.5-flash-lite`, full 108-reading catalog | **≈ $0.00018** — ~5,500 commands per dollar |
| Naive build (full catalog + card defs + examples, on `flash`) | ≈ $0.0050 — **~28× more for identical output** |

A tenant issuing 20 layout commands a month costs **well under half a cent**. Expect ~70% to resolve locally once the alias store warms, so the blended figure is lower again.

That ~28× gap is the entire lesson of this mandate in one row. Same feature, same quality; the difference is whether you send a closed vocabulary or a data dump.

## A.5 The hard rule

> **The model names a reading and an intent. It never generates UI, SQL, geometry, or a calculation.**

Its entire output surface is a JSON array of ops drawn from a fixed set:

`add_card` · `remove_card` · `set_period` · `rename_card` · `move_card` · `resize_card` · `reorder_all` · `set_density`

`move_card` and `resize_card` carry **intents, never numbers** — `"to_top"`, `"bigger"`, `"smaller"` — which `resolveFit()` and the grid packer translate into legal geometry. The model has no vocabulary for `x`, `y`, `w`, `h`, `category` or `fit`.

Validation, server-side, before anything is written:

1. **Schema** — op is known; every field is in its enum. Reject the whole patch on any violation; never partially apply.
2. **Reading exists *and* computes** — the key must be in the V6 `READINGS` catalog **and** in `ReckonerRegistry::exists()`. Per A.3 that is 17 keys today. A key present in V6 but absent from the Reckoner is a miss (A.7), not a card.
3. **Permissions** — see the note below. Filter against the *acting user's* permissions, server-side, after the model proposes. **This is finding F5 waiting to happen again**: a cashier must not obtain `finance.net_profit` by asking Vena nicely.
4. **Layout Law** — automatic. Geometry comes from `resolveFit()` / `sizeLegal()` / `fitToGrid()`, the same path manual edits use. There is no second validator to keep in sync and no way for the AI path to bypass the Law.
5. **Preview + undo** — snapshot the layout before applying; show the change and offer one-click revert. The layout payload is small; snapshots are cheap.

If validation fails, do not retry with a bigger prompt. Say what could not be done and offer the nearest legal alternative.

> **⚠ Note for the V6 wiring generally, not just for AI.** The V6 `READINGS` entries carry `key, label, short, shape, unit, area, module, extra` — but **no `permissions` field**, which `ReckonerRegistry` does have. When V6 is bound to real data, permissions must be resolved from the Reckoner side. Otherwise the *manual* card picker becomes a permission bypass on its own, before any AI is involved. Worth fixing while V6 is still pre-release.

## A.6 Command tiers

| Tier | Example | Path | Cost |
|---|---|---|---|
| **Layout-only** — no new data | *"move receivables to the top"*, *"make this bigger"*, *"more spacious"*, *"arrange these properly"* | Pure deterministic. Position and density are arithmetic over the existing layout; sizing is `resolveFit()`. **No model, ever.** | $0 |
| **Known reading** | *"add last month's sales"*, *"show me who owes me money"* | Local match over `label`/`short`/`area`/`description` → catalog lookup → patch. Model only on a miss. | $0 – $0.00018 |
| **Ambiguous / compound** | *"make my dashboard better for a wholesale business"* | Model proposes a multi-op patch from the closed vocabulary. Always preview before applying. | ≈ $0.0002 |

*"Arrange them in a proper way"* deserves emphasis: that is a **layout optimiser**, not an AI feature. Group by `area`, order by `shape` (scalars first, then series, then tables), pack with `fitToGrid()`. Deterministic JS. It will look better than a model's guess, run instantly, cost nothing, and it is the command users will reach for most.

Ship this tier first. It works on all 108 readings — it only rearranges what is already there, so it is not gated on Reckoner coverage at all.

## A.7 "A card we don't already have"

This is the boundary, and it must be enforced against VenQore's own core principle — *one central, heavily-tested calculation engine that all modules route through, so no feature can introduce inconsistent numbers.*

**If the requested reading is not in `ReckonerRegistry`, the AI does not invent it.** No generated SQL, no ad-hoc aggregation, no "close enough" derived figure. A wrong number shown confidently on a dashboard is exactly the failure mode the Reckoner exists to prevent, and financial correctness is the product's stated moat.

Correct behaviour on a miss:

1. Offer the nearest existing reading — *"I don't have gross margin by supplier. I can show gross margin overall, or top suppliers by spend. Want either?"*
2. **Log the miss** to an `ai_reading_requests` table: tenant, raw utterance, closest match, timestamp.

That log is the valuable part, and here it has a specific job: **91 of V6's 108 readings are not implemented in the Reckoner yet (A.3).** The miss log tells you which of the 91 to build first, ranked by how many tenants asked and in what words. *"41 tenants asked for margin by supplier this month"* is a prioritised, evidence-backed roadmap generated by users, for free, as a side effect of a feature they enjoy.

Build the reading properly in the Reckoner, and every one of those tenants gets it everywhere — dashboard, reports, exports — because it went through the one engine. That is the moat working as designed.

## A.8 Where it slots

This is the proof that Phase 2 was worth doing. It needs no new AI plumbing:

- `AiRequest::for('layout_command')` — a new profile in `config/ai_models.php`, `context_budget: 900`
- `DeterministicResolver` handles Tier 1 entirely and most of Tier 2 — the §5 backlog item, with a real customer
- `MemoryResolver` learns each tenant's phrasing (*"my money card"* → `finance.receivables`) so it stops calling the model
- `ModelResolver` handles the rest at ~$0.0002
- `AiResult::$confidence` gates auto-apply vs. preview-first — the field Phase 2 already populates

**Sequencing:**

1. **Tier 1 — layout-only, zero API.** Rearrange, resize, density, "arrange these properly". Deterministic JS over `resolveFit()` / `fitToGrid()`. Works on all 108 readings, needs no Reckoner coverage, needs no gateway, needs no AI. Ship it standalone whenever V6 is ready.
2. **Reckoner coverage.** Close the 91-reading gap, ordered by the miss log. This is the long pole and it is ordinary backend work.
3. **Tiers 2–3 — conversational add/remove.** Once the gateway and resolvers exist and enough readings compute.

## A.9 One strategic note

*"Watch me build my dashboard by talking to it"* is a better AppSumo and Product Hunt demo than any feature list, and it directly supports the "Your ERP, built by AI" positioning — the AI Builder configures the ERP at onboarding; this keeps it configurable forever. It costs a fraction of a cent per use, and the part that demos best (Tier 1) contains no AI at all.

Do not build it this week. Tier 1 can follow V6 whenever V6 lands; Tiers 2–3 follow the gateway.

---

# Appendix B — Free-tier API keys: decision

**Question considered:** should non-paying users be served by Google's *free* Gemini quota, so free AI costs VenQore nothing?

**Decision: NO for a VenQore-operated free-tier key. YES for tenant-owned BYOK keys, clearly labelled. The free allowance stays on a paid platform key.**

## B.1 The blocking fact

Google's Gemini API Terms of Service draw a hard line between Unpaid and Paid Services:

> **Unpaid Services** — *"Google uses the content you submit to the Services and any generated responses to provide, improve, and develop Google products and services."*
> *"To help with quality and improve our products, **human reviewers may read, annotate, and process your API input and output**."*
> Google further instructs developers not to submit sensitive or confidential information to the Unpaid Services.

> **Paid Services** — *"Google doesn't use your prompts (including associated system instructions, cached content, and files such as images, videos, or documents) or responses to improve our products."*

Now consider what VenQore's Smart Capture actually transmits: **customer and supplier invoices, party names, prices, purchase bills, expense receipts, product catalogs, handwritten order notes, voice memos.** Other businesses' confidential financial records.

Routing those through the unpaid tier means Google trains on them and human reviewers may read them — and that is *disclosed in the terms*, so "we didn't realise" is not a defence available later. For a product whose stated competitive moat is financial correctness and trustworthiness, and which sells internationally (AppSumo, EU/UK buyers, no DPA on the unpaid tier), this is a liability decision, not a cost decision.

**This is not a cost optimisation. It is trading a few dollars a month for the one thing an accounting product cannot afford to lose.**

## B.2 The second blocker

> *"Rate limits are applied per project, not per API key."*

So a single VenQore-operated free-tier project cannot be shared across a tenant base — 100 free tenants would contend for one project's daily quota and starve each other on day one. The idea does not survive its own mechanics even setting the terms aside.

## B.3 The cost fear is misplaced

The concern was: *"if 100 people use the free quota, it will cost us a lot."* Measured against the actual configuration:

`config('smartcapture.free_scan_allowance')` = **10 scans**. At the §2 per-scan figures:

| | Cost |
|---|---|
| One free user's entire allowance (10 scans, `gemini-2.5-flash`) | **$0.05** |
| 100 free users, all fully consuming it | **$5.05** |
| 1,000 free users, all fully consuming it | **$50** |

Five cents per acquired trial user, on a paid key, with no data-sharing exposure. **That is the cheapest customer-acquisition instrument available to this business** — cheaper than any ad, and it demonstrates the product's single most differentiating feature.

For contrast, the leaks identified in §1 dwarf it:

| Exposure | Monthly cost |
|---|---|
| 100 free users' entire scan allowance | **$5** |
| One tenant on the `gpt-4o` fallback default (F8 / FIX-6) | **$59** |
| `GenerateProductDescriptionsJob`, one 5,000-product sync, unmetered (F4) | **unbounded** |

**The free allowance is not the leak. FIX-3, FIX-4 and FIX-6 are.** Fix those and free AI becomes a rounding error on the hosting bill.

## B.4 The three-lane model

| Lane | Who | Key | Data terms | Cost to VenQore |
|---|---|---|---|---|
| **Free allowance** | Trials, new signups | **Platform key, PAID tier** | Google does not train; no human review | ~$0.05/user, one time |
| **Managed (metered)** | Paying subscription tiers | Platform key, paid tier | Same | ~$3/tenant/month at full quota |
| **BYOK** | Anyone who prefers it; recommended default for **LTD** | Tenant's own key | **Tenant's choice and tenant's terms** | **$0** |

BYOK is the real answer to *"what if they never convert?"* — **a tenant on their own key costs nothing, forever.** The plumbing already exists: `AiExtractionService::resolveConfig()` handles tenant keys, and `AiEntitlementService` already treats `mode = 'byok'` as unlimited.

If a tenant chooses to use a *free* Google key under BYOK, that is their project, their quota and their decision about their own data. VenQore's obligation is disclosure, not prevention: a plain notice at the BYOK settings screen — *"A free Google API key means Google may use your documents to improve its products and human reviewers may read them. For business records, use a billing-enabled key."* Then it is an informed choice. Do not make free-tier BYOK the default or the recommended path.

## B.5 Why this converts rather than leaks

BYOK is a self-selecting filter, and both outcomes are good:

- Users technical and price-sensitive enough to create a Google Cloud key, enable billing and paste it in were **never** going to buy the AI add-on. On BYOK they cost $0 instead of leaking margin.
- Everyone else — the large majority, and the actual buyers — finds a 3-minute Google Cloud setup more expensive than the add-on price, and pays.

The conversion lever is the **allowance being small and the value being obvious**, not the key being cheap. Ten scans is enough to prove AI Scan works on a real invoice and not enough to run a shop on.

## B.6 Actions

- [ ] Free allowance stays on the **paid** platform key. Never point `free_api_key` at an unpaid-tier project.
- [ ] Audit `config('smartcapture.free_api_key')` and confirm the project behind it has billing enabled.
- [ ] Add the disclosure notice to the BYOK settings screen (B.4).
- [ ] Make BYOK the recommended AI path for **LTD** plans specifically — a one-time payment must not carry a recurring per-month AI cost forever. If LTD gets managed AI at all, cap it low (e.g. 50 pages/month) with BYOK beyond.
- [ ] Prioritise FIX-3, FIX-4 and FIX-6 — they are 12–1,000× larger than the free-allowance spend.

**Sources:** [Gemini API Terms of Service](https://ai.google.dev/gemini-api/terms) · [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)

---

# Appendix C — The shared product catalog

**Status: already built and live. Contains a privacy defect that must be fixed before the tenant base grows.**

## C.1 It already exists

The idea of pooling tenants' product names into a shared catalog — never prices — is implemented:

| File | Added |
|---|---|
| `app/Services/SharedCatalogService.php` (69 lines) | 5 Aug 2026 |
| `app/Models/SharedProduct.php`, `SharedProductAlias.php` | — |
| `database/migrations/2026_08_05_000010_create_shared_products_table.php` | — |
| Read path: `FuzzyMatchService.php:90-100` (Strategy 6, tagged T7-1) | — |
| Write path: `LearningService.php:307-317` | — |

The design intent is right and matches the stated goal exactly — the docblock reads *"Never stores prices, costs, stock, margins, or tenant identifiers,"* there is a `shared_catalog_opt_out` flag, and publication is gated on `confirmations >= 3`.

## C.2 What it actually stores (the schema is mislabelled)

`SharedCatalogService::lookup()` and `contribute()` both name their parameter `$barcode`, and the column is `shared_products.barcode`. But at the only two call sites:

- **Write** — `LearningService.php:311` passes `$key`, which is `$this->normalize($sourceText)`: the normalised product name as it appeared on someone's invoice.
- **Read** — `FuzzyMatchService.php:92` passes `$normName`, also a normalised product name.

So the `barcode` column holds **normalised product names**, and `canonical_name` holds **that tenant's own `Product.name`**. No barcode is involved anywhere. The column is `unique()`, so the normalised name is the global primary key.

This works, but the naming will cause a bad surprise the first time someone adds real barcodes — and, more importantly, it means the privacy analysis is not the one the docblock implies. A barcode is a manufacturer-assigned public identifier. A product name off a tenant's invoice is that tenant's commercial data.

## C.3 The defect: the 3-confirmation threshold does not work

```php
$newConfirmations = $product->confirmations + 1;
$isPublished      = $newConfirmations >= 3;
```

`contribute()` increments a bare counter. It records **no indication of which tenant contributed**, so it cannot count *distinct* tenants — and `remember()` fires it on every product-alias confirmation, including repeats by the same user in the same shop.

**Consequence: one shop confirming the same product three times publishes its own product name globally.** Three scans of the same recurring supplier invoice is enough. The threshold was presumably meant to say *"three independent businesses carry this, so it is a common commercial product"* — what it actually says is *"contribute() ran three times."*

For a private-label range, an exclusive distribution line, or an unreleased SKU, that is precisely the leak the threshold exists to prevent.

**Live blast radius today is small**, for two reasons worth keeping: the tenant base is 3, and the read path is conservative — `FuzzyMatchService.php:94-97` uses `canonical_name` only as a `LIKE` search term against *the tenant's own* products, so foreign names are not surfaced directly. That containment disappears the moment the catalog is exposed as a user-facing feature, which is the proposal here.

## C.4 Two smaller findings

- **`shared_product_aliases` is dead.** The table is created, `SharedProductAlias` is modelled, `SharedProduct::aliases()` relates to it — and nothing ever writes a row. Either wire it (it is the natural place for the many-names-to-one-product mapping) or drop it.
- **First writer wins the name, permanently.** `canonical_name` is set on `create()` and never revised. The first contributor's typo — *"Tapal Danedr 500g"* — becomes the published canonical name for everyone. There is no vote.

## C.5 The standard to hold this to

Appendix B declined to let Google train on tenants' invoices, on the grounds that a product built on financial trust cannot route confidential business records through a tier where third parties read them.

**The same standard applies to VenQore itself.** Pooling tenants' product names to benefit other tenants is a smaller version of the same trade, and it is currently **opt-out by default** — `shared_catalog_opt_out` is off unless a tenant finds and sets it, which means every tenant is contributing today without having agreed to anything.

This is fixable and worth fixing, not a reason to abandon the feature. But get it right before there are 100 tenants rather than 3, and before any of them are in the EU/UK via AppSumo.

## C.6 How to fix it

1. **Count distinct tenants, without storing tenant identity.** Add `shared_product_contributions (shared_product_id, tenant_hash, created_at)` with a unique index on the pair, where `tenant_hash = hash_hmac('sha256', tenant_id, config('app.shared_catalog_salt'))`. Publish on `COUNT(DISTINCT tenant_hash) >= 5`. A salted HMAC gives distinct-tenant counting with no reversible identifier — the docblock's promise, actually kept.
2. **Raise the threshold to 5** and require the contributions to span **at least 5 distinct tenants**. A name five unrelated shops carry is by definition a common commercial product, not anyone's secret. This one rule resolves most of C.5.
3. **Vote on the name.** Keep candidate names with counts; promote the modal name at publish time, not the first one seen.
4. **Make contribution opt-in for the pooled name path**, with a plain explanation of the exchange: *"Share the product names you confirm, and get access to names other shops have confirmed. Prices, costs, stock and your business identity are never shared."* Keep `shared_catalog_opt_out` working for existing tenants; default new tenants to asking. Update the Terms of Service to describe the pool.
5. **Separate barcodes from names.** Rename the column, or add a real `gtin` column validated as GTIN-8/12/13/14 with checksum. A GTIN-keyed catalog is publishable with far weaker restrictions than a name-keyed one, because the GTIN is public manufacturer data — that is the version worth growing.
6. **Never pool** anything beyond name, brand, pack size, category, unit and GTIN. No prices, costs, margins, quantities, supplier links, customer names or tenant attribution. The current service is already correct on this; keep it that way.

## C.7 Why this belongs with the AI work

It is the **single highest-value corpus for `MemoryResolver`** (§5 backlog), and it fixes the worst moment in Smart Capture today.

`SmartCaptureController.php:301-312` sends the tenant's own catalog to the model only when they have 1–300 products. **A brand-new tenant has zero products, so nothing is sent** — the model gets no grounding at exactly the moment of first impression, on the feature that sells the product. A shared catalog is the only thing that can ground that first scan.

And it inverts the learning loop the right way (F10): a shared-catalog hit is a **local resolution that skips the model entirely**, rather than another block of few-shot hints inflating the prompt. Every published entry moves traffic from Tier 3 to Tier 2, permanently, for every tenant at once.

## C.8 The product upside, done right

Onboarding: *"We pre-filled 4,200 common products for your shop — check the ones you carry."* For a kiryana owner facing an empty catalog, that removes the single largest barrier to adoption, and it compounds — the catalog gets better with every store that joins, which is a genuine network effect in a category that rarely has one. It also directly serves the international expansion goal, since a Pakistani FMCG catalog is an asset no foreign competitor has.

Just make it a GTIN-keyed, 5-tenant-confirmed, opt-in, name-voted catalog before it is a user-facing feature.

## C.9 Sequencing

Not part of the 3-day scope. Order:

1. **Now, with the Phase 1 bugs** — fix C.3 (distinct-tenant counting). It is one table and one query, and it stops an ongoing leak. Do not wait for Phase 3.
2. **Before tenant #20** — opt-in, ToS wording, name voting, threshold of 5.
3. **Phase 3** — GTIN column, wire it as a `MemoryResolver` source, expose the onboarding pre-fill.
