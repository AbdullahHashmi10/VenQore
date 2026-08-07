# VenQore — Technical Build Plan V4 (FINAL)

The implementation document. Self-contained. Hand this to your IDE. Business reasoning: `VENQORE_V3_THE_PLAN.md`. Where the two disagree, this file wins — it is built on your confirmed infrastructure.

2026-08-04 · E:\AMD POS\AMD POS · Laravel 12 · PHP 8.4 · MariaDB 10.5 · no Redis

---

## ⚠️ Read this first — your infrastructure changed the design

You confirmed PHP 8.4, MariaDB 10.5, and no Redis. That invalidates parts of every earlier draft. Three consequences:

| Assumption in earlier drafts | Reality | What changed |
| --- | --- | --- |
| Redis token bucket for rate limiting | No Redis | Rewritten as a SQL bucket table with row-lock atomicity (T0-7) |
| Redis product index cache | No Redis | Rewritten as an indexed `product_search_index` table — this is better, matching happens in SQL instead of PHP (T1-2) |
| Redis queue + fully async extraction | DB queue, MariaDB 10.5 has no `SKIP LOCKED` | Hybrid sync/async — faster for the user and safer (T2-3) |
| "MySQL 8" per `CLAUDE.md` | MariaDB 10.5 | Collation, JSON, driver and EOL implications (T0-9) |

And one finding that outranks everything except the open endpoint: MariaDB 10.5 reached end of life in June 2025. You have been running an unpatched database for 14 months. See T0-9.

---

## Decisions I made under the autonomy you gave me

| # | Decision | Why |
|---|---|---|
| 1 | Terse response schema — short keys, drop `matched_sku`/`needs_review`, use Gemini `responseSchema` | 80% of your scan cost is output tokens. This cuts 40% off every scan and kills the JSON-repair code path |
| 2 | Raise AI quotas to 500 / 1,000 / 2,000 / 4,000 pages at the same $3/$6/$12/$24 | Decision 1 pays for it. 54.5% margin at cap post-deprecation — inside your 40–50% target, with round numbers that market better |
| 3 | Hybrid sync/async, not fully async | DB queue polling adds 1–3s. Sync is faster 99% of the time at your scale; queue only when the bucket says the wait exceeds 8s |
| 4 | Client-side image preprocessing promoted to P0 | On a Pakistani mobile connection this is the single biggest perceived-speed win — 4MB upload becomes 250KB |
| 5 | Perceptual-hash dedupe | A re-submitted identical image returns the cached result and costs nothing. Kills double-submit waste |
| 6 | Server-side arithmetic validation | Free accuracy gate. The model claims it checked the maths; verify it yourself |
| 7 | Text part before image part | Enables Gemini implicit prefix caching. Free saving, one line of code |
| 8 | Embeddings demoted to optional | MariaDB 10.5 has no VECTOR type. The SQL index in T1-2 gets 80–88% alone; embeddings would add ~5% for real complexity |
| 9 | Cookbook on Counter for food-prep business types (list in T3-3) | They all assemble items from ingredients — it's the reason that segment picks you |
| 10 | SMS/WhatsApp become "Coming soon", removed from sold features | You said they don't work. Selling a dead feature is the same defect as the fabricated tech specs |
| 11 | Free public tool ships before AppSumo, after Phase 5 | You want it before AppSumo; it must not go live while the site still carries false claims |

---

## Conventions

- `php artisan optimize:clear` after any config or route change
- `php artisan ziggy:generate` after adding/renaming routes — the build guard fails otherwise
- Every query `tenant_id`-scoped. Never cross-tenant.
- Business logic in `app/Services/`. Controllers stay thin.
- No trailing NUL bytes (CI blocks them)
- MariaDB: use `DB_CONNECTION=mariadb` and `utf8mb4_unicode_ci` — see T0-9

---

## Planning constants

| Constant | Value |
| --- | --- |
| Page cost — blended, today | $0.00128 |
| Page cost — blended, post-Oct-2026 | $0.00209 |
| Page cost — pricing/planning number | $0.0050 |
| Query cost — blended | $0.00010 |
| Description cost — batched 20/call | $0.00008 |
| Free-key ceiling | 15 RPM / 1,500 RPD |
| Paid-key ceiling | 300+ RPM |

---

## TABLE OF CONTENTS

- [PHASE 0 — Stop the bleeding](#p0) · 7–8 days
- [PHASE 1 — AI Scan: correct, cheap, fast](#p1) · 9–11 days
- [PHASE 2 — Metering & enforcement](#p2) · 5–6 days
- [PHASE 3 — Feature gates](#p3) · 8–10 days
- [PHASE 4 — New pricing live](#p4) · 5–6 days
- [PHASE 5 — Truth & trust](#p5) · 3 days
- [PHASE 6 — WooCommerce + Amazon](#p6)
- [PHASE 7 — Growth](#p7)
- [PHASE 8 — AppSumo readiness](#p8)
- [PHASE 9 — Infrastructure & later](#p9)
- [Appendix A — All 32 defects](#appa)
- [Appendix B — New files](#appb)
- [Appendix C — Final pricing reference](#appc)

---

<a name="p0"></a>
## PHASE 0 — STOP THE BLEEDING

Nothing in Phase 1 starts until all of P0 ships. 7–8 days.

### T0-0 🔴🔴 CRITICAL — Lock the open public LLM endpoint
Live right now. An unauthenticated, unmetered public API on your Gemini billing.
`routes/api.php:78` `POST /{store_slug}/chatbot/session`  
`routes/api.php:79` `POST /{store_slug}/chatbot/session/{uuid}/message`  
`routes/api.php:80` `POST /{store_slug}/chatbot/session/{uuid}/typing`  
No auth. No throttle middleware of any kind. `VisitorChatController::sendMessage()` validates `'body' => 'required|string|max:10000'` — ~2,500 tokens per message — with no cap on messages per session, sessions per IP, or spend.

**Step 1 — Deploy today (15 minutes)**
`routes/api.php`:
```php
Route::middleware('throttle:5,1')->group(function () { 
    Route::post('/{store_slug}/chatbot/session', [VisitorChatController::class, 'startSession']); 
}); 
Route::middleware('throttle:15,1')->group(function () { 
    Route::post('/{store_slug}/chatbot/session/{uuid}/message', [VisitorChatController::class, 'sendMessage']); 
    Route::post('/{store_slug}/chatbot/session/{uuid}/typing', [VisitorChatController::class, 'typing']); 
});
```
`VisitorChatController.php:130`: `'body' => 'required|string|max:500'`

Note: Laravel's throttle middleware uses the cache store. With no Redis you must be on the database cache driver for this to work across PHP-FPM workers — see T0-8. Do T0-8 first if `CACHE_STORE` is currently `file` or `array`.

**Step 2 — Proper guard (`app/Http/Middleware/VisitorChatGuard.php`)**
| Scope | Limit |
|---|---|
| Messages per session | 20, then require a new session |
| Messages per IP | 40/hour, 100/day |
| Sessions per IP | 5/hour |
| Messages per store | 500/day |
| Global daily USD budget | $3/day → hard shutoff |

**Step 3 — Everything else**
- Cloudflare Turnstile on `startSession`, verified server-side. Reject without a valid token.
- Model + output caps — force Flash-Lite, `maxOutputTokens`: 300.
- Spend kill-switch — `ai_spend_counters` table (T0-7). When `visitor_chat` exceeds the daily cap, return "Chat is busy — leave your email and we'll reply" and alert the platform owner. A spend cap is not a rate limit. Build both.
- Answer cache — table `visitor_chat_cached_answers(question_hash, store_id, answer, hits, created_at)`. Normalise → hash → serve from cache. Expect 60–70% hit rate on the top 20 questions.
- Prompt-injection guard in `ChatAIService`: Wrap visitor text in explicit delimiters; instruct the model it is data, never instructions
  - Strip/flag: `ignore previous`, `system:`, `you are now`, `disregard`, base64 blobs, unbroken strings >200 chars
  - System instruction: "Only answer questions about this store's products, hours, and about VenQore. For anything else, say you can only help with those topics."
  - Post-check the output; on failure return the canned fallback
- Platform kill switch — Setting key `visitor_chat_enabled`, checked every request, toggleable from SuperAdmin without a deploy.
- Log every call to `ai_usage_events` with `feature = 'visitor_chat'`.

Files: `routes/api.php`, `app/Http/Controllers/VisitorChatController.php`, `app/Services/ChatAIService.php`, `app/Services/ChatRoutingService.php`, new `app/Http/Middleware/VisitorChatGuard.php`, new migration  
Acceptance: 1,000 messages from one IP → blocked after 40, total cost under $0.05, alert fired. Turnstile blocks headless clients. Daily spend cannot exceed the cap under any load.  
*1.5 days*

---

### T0-1 🔴 Telemetry — `ai_usage_events`
`AiExtractionService.php:476` already reads `usageMetadata.promptTokenCount` and throws it away. Until this exists, every cost figure in these documents is derived rather than measured.

```php
Schema::create('ai_usage_events', function (Blueprint $t) { 
    $t->id(); 
    $t->unsignedBigInteger('tenant_id')->nullable()->index(); // null = platform / public tool 
    $t->unsignedBigInteger('user_id')->nullable(); 
    $t->string('feature', 32)->index(); // scan|query|populate|visitor_chat|public_tool|match_fallback|list_import 
    $t->string('provider', 16); 
    $t->string('model', 64); 
    $t->string('key_mode', 16); // platform_paid|platform_free|byok 
    $t->string('input_type', 16)->nullable(); // image|audio|text|pdf 
    $t->unsignedInteger('pages')->default(0); 
    $t->unsignedInteger('prompt_tokens')->default(0); 
    $t->unsignedInteger('output_tokens')->default(0); 
    $t->unsignedInteger('thinking_tokens')->default(0); 
    $t->unsignedInteger('cached_tokens')->default(0); 
    $t->decimal('cost_usd', 12, 8)->default(0); 
    $t->unsignedInteger('latency_ms')->default(0); 
    $t->boolean('success')->default(true); 
    $t->string('error_code', 64)->nullable(); 
    $t->timestamp('created_at')->useCurrent()->index(); 
    $t->index(['tenant_id', 'created_at']); 
    $t->index(['feature', 'created_at']); 
});
```

- `config/ai_pricing.php` — per-model input/output/audio/cached rates. `cost_usd` is computed, never guessed.
- `app/Services/Ai/AiUsageRecorder.php` — `record(...)`, called from every upstream AI call: `AiExtractionService` (all 4 providers), `AiController`, `ChatAIService`, `VenaAssistController`, `VisitorChatController`.
- SuperAdmin dashboard — spend today/month, by feature, by model, by tenant; top 20 tenants by cost; cost-per-page trend; your real Gemini rate card, back-calculated.
- Daily digest email to the platform owner.
- Retention: aggregate to a daily rollup table after 90 days; this table grows fast.

Acceptance: every AI call writes exactly one row. Dashboard total matches Google Console within 5% after one week.  
*1 day*

---

### T0-2 🔴 Kill the catalog dump — adaptive inclusion
`SmartCaptureController.php:229–235` sends up to 800 products on every scan. At your new SKU limits this is catastrophic: 50,000 SKUs ≈ 700,000 tokens ≈ $0.22/scan, and it would nearly exhaust the context window.

```php
// config/smartcapture.php 
'catalog_inline_max_products' => env('SMART_CAPTURE_CATALOG_INLINE_MAX', 300),
```

- `productCount <= 300` → send full catalog inline (new store: ~$0.0004, best accuracy)
- `productCount > 300` → send NO catalog (use T1-2 local matching)
- `target_type == expense` → NEVER send catalog, at any size

Files: `SmartCaptureController.php`, `AiExtractionService.php:buildPrompt()`, `config/smartcapture.php`  
Acceptance: 50-product tenant still gets inline matching. 20,000-product tenant sends zero catalog tokens — verified in `ai_usage_events.prompt_tokens`.  
*0.5 day*

---

### T0-3 🔴 Remove parties and expense categories from the prompt
`SmartCaptureController.php:237–241` sends 300 party names + 200 expense categories on every scan (~2,500 tokens). `FuzzyMatchService::matchParty()` already runs server-side on the result at line 289 — the party list is pure duplication.

- Delete both blocks from `buildPrompt()`
- Replace with pre-scan pickers (T1-1)
- Keep `known_party` (one name, when selected) — cheap and improves accuracy  
*0.5 day*

---

### T0-4 🔴 Terse response schema — the biggest remaining cost lever
After the catalog is gone, ~80% of scan cost is output tokens. The current schema repeats seven long key names per line item.

| Invoice | Current output | Terse output | Saved |
|---|---|---|---|
| 5 lines | 265 tok | 130 tok | 135 |
| 15 lines | 715 tok | 330 tok | 385 |
| 30 lines | 1,390 tok | 630 tok | 760 |

Result: 40% off every scan. Handwritten page $0.00392 → $0.00235. Printed $0.00066 → $0.00041.

Use Gemini `responseSchema` with short keys:
```php
'generationConfig' => [ 
    'temperature' => 0.0, 
    'responseMimeType' => 'application/json', 
    'responseSchema' => [ 
        'type' => 'OBJECT', 
        'properties' => [ 
            'a' => ['type'=>'STRING'], // action 
            'pt' => ['type'=>'STRING','nullable'=>true], // party 
            'd' => ['type'=>'STRING','nullable'=>true], // date YYYY-MM-DD 
            'rf' => ['type'=>'STRING','nullable'=>true], // reference 
            'dc' => ['type'=>'INTEGER'], // document confidence 
            'it' => ['type'=>'ARRAY','items'=>['type'=>'OBJECT','properties'=>[ 
                'n' => ['type'=>'STRING'], // name as written 
                'q' => ['type'=>'NUMBER'], // qty 
                'p' => ['type'=>'NUMBER','nullable'=>true], // unit price 
                't' => ['type'=>'NUMBER','nullable'=>true], // line total 
                'sc'=> ['type'=>'STRING','nullable'=>true], // supplier code (T1-3) 
                'c' => ['type'=>'INTEGER'], // confidence 
            ],'required'=>['n','q','c']]], 
        ], 
        'required' => ['a','dc','it'], 
    ], 
    'maxOutputTokens' => 800 + 400 * $pageCount, 
    'thinkingConfig' => ['thinkingBudget' => $budget], 
],
```
Also:
- Drop `matched_sku`. Matching is local now (T1-2). Removing it saves a field per line and eliminates a hallucination source.
- Drop `needs_review`. Derive it server-side from `c < confidence_low`.
- Drop `notes` unless the user asked for it.
- Map short keys back to the internal shape in one place — `AiExtractionService::normalizeResult()` — so nothing downstream changes.
- Delete `repairTruncatedJson()` (`AiExtractionService.php:804`). `responseSchema` guarantees valid JSON. Dead code and a silent-corruption risk.
- Keep the same schema across all four providers so results stay comparable.

Files: `AiExtractionService.php` (`buildPrompt`, `callGemini`, `callOpenAi`, `callAnthropic`, `callDeepSeek`, `parseJson`), `TransactionBuilderService.php` (consumes the normalised shape — should need no change)  
Acceptance: a 15-line invoice produces ≤400 output tokens. No JSON parse failures on the T1-0 test set. Accuracy unchanged.  
*1 day*

---

### T0-5 🔴 Image pipeline — client and server
Client-side is the biggest perceived-speed win you have. A 4MB phone photo on a Pakistani mobile connection is a 20-second upload. Preprocessed it's 250KB and 2 seconds.

**Client (`resources/js/Components/SmartCapturePanel.jsx`)**
- Canvas downscale to 1,568px longest edge, JPEG q80 — before upload
- Document edge detection + auto-crop — removes the table, the floor, the hand
- Auto-deskew and auto-contrast
- Blur check (Laplacian variance) — warn before a page is spent
- Live framing guide: "Fill the frame with the bill. Closer = more accurate."
- Three example thumbnails: ✅ tight and straight · ⚠️ too far · ❌ blurry
- Show the compressed size: "Uploading 240 KB instead of 4.1 MB"

**Server (`AiExtractionService::buildPayload`)**
- Re-verify and re-downscale (never trust the client)
- Auto-orient from EXIF, then strip EXIF
- Reject blank or <400px images and refund the credit

Acceptance: a 12MP photo yields ≤1,600 image tokens and uploads in under 3s on a 3G connection.  
*1.5 days*

---

### T0-6 🟠 Thinking budget, part order, dedupe
Three small changes, all cheap:
1. `thinking_budget_image`: 1024 → 256; printed scans → 0. Output bills at 8× input; 1,024 invisible tokens currently cost more than the whole catalog did. Gate on the T1-0 test set — measure 1024 / 256 / 0 and keep the cheapest that holds accuracy.
2. Put the text part BEFORE the image part. `AiExtractionService.php:430–438` currently appends the prompt after `inline_data`. Reordering enables Gemini implicit prefix caching on the static prompt. One line, free saving. Keep the static prompt just above 1,024 tokens so it qualifies.
3. Perceptual-hash dedupe. Compute a pHash of each page. Table `scan_image_hashes(tenant_id, phash, result_json, created_at)`. If the same tenant submits the same image within 24h, return the cached result and charge nothing. Kills double-submit waste and reads as a thoughtful touch.

Files: `config/smartcapture.php`, `AiExtractionService.php`, new migration  
*0.5 day*

---

### T0-7 🔴 Rate limiter and spend caps — SQL, no Redis
`pace_ms = 0` — the only global limiter is switched off. `throttle:20,1` is per user, not per key. `single_flight` is per store. Nothing stops 15 tenants hitting the key in one minute.

**Schema**
```php
Schema::create('ai_rate_buckets', function (Blueprint $t) { 
    $t->string('bucket_key', 64)->primary(); // sha256 of api key + feature lane 
    $t->decimal('tokens', 10, 4)->default(0); 
    $t->decimal('capacity', 10, 4); 
    $t->decimal('refill_per_sec', 10, 6); 
    $t->decimal('last_refill_at', 16, 4); // unix ts with ms 
    $t->unsignedInteger('day_count')->default(0); 
    $t->unsignedInteger('day_limit')->default(0); 
    $t->date('day_date')->nullable(); 
    $t->timestamps(); 
}); 
Schema::create('ai_spend_counters', function (Blueprint $t) { 
    $t->id(); 
    $t->string('scope', 48); // feature name or 'global' 
    $t->date('day'); 
    $t->decimal('spend_usd', 12, 6)->default(0); 
    $t->decimal('cap_usd', 12, 4); 
    $t->boolean('tripped')->default(false); 
    $t->unique(['scope', 'day']); 
});
```

**`app/Services/Ai/AiRateLimiter.php`**
```php
public function tryAcquire(string $bucketKey, int $cost = 1): array { 
    return DB::transaction(function () use ($bucketKey, $cost) { 
        $row = DB::table('ai_rate_buckets')->where('bucket_key', $bucketKey)->lockForUpdate()->first(); // InnoDB row lock, held ~1ms 
        $now = microtime(true); 
        $tokens = min($row->capacity, $row->tokens + ($now - $row->last_refill_at) * $row->refill_per_sec); 
        if ($row->day_date !== today()->toDateString()) { /* reset day_count */ } 
        if ($row->day_limit > 0 && $row->day_count + $cost > $row->day_limit) { 
            return ['ok' => false, 'reason' => 'daily_limit']; 
        } 
        if ($tokens < $cost) { 
            return ['ok' => false, 'reason' => 'rate', 'wait_ms' => (int) ceil(($cost-$tokens)/$row->refill_per_sec*1000)]; 
        } 
        DB::table('ai_rate_buckets')->where('bucket_key', $bucketKey)->update([ 
            'tokens' => $tokens - $cost, 
            'last_refill_at' => $now, 
            'day_count' => $row->day_count + $cost, 
            'day_date' => today(), 
        ]); 
        return ['ok' => true]; 
    }, 3); 
}
```

Why this works without Redis: it's a single-row transaction held for about a millisecond. InnoDB row locking gives you the atomicity Redis would have. At your scale this handles thousands of requests/minute comfortably. If contention ever shows up, shard by adding a lane suffix to `bucket_key`.

**Buckets to create**
| Bucket | Capacity | Refill | Daily |
|---|---|---|---|
| paid_key:scan | 60 | 5/s | — |
| paid_key:query | 30 | 3/s | — |
| paid_key:populate | 20 | 1/s | — |
| free_key:* | 12 | 0.2/s | 1,400 |
| public_tool | 6 | 0.1/s | 500 |
| visitor_chat | 10 | 0.3/s | 2,000 |

Priority lanes: `scan` > `query` > `populate` > `public_tool`. Descriptions and the public tool must never starve a paying customer's scan.

**Two Google Cloud projects**
| Env var | Project | Used for |
|---|---|---|
| GEMINI_API_KEY_PAID | billing enabled | every real tenant — trial, Counter, Starter, Growth, Business |
| GEMINI_API_KEY_FREE | billing disabled | demo store (fake data), free public tool, marketing tools, dev |
| tenant's own | theirs | BYOK |

Key selection lives in exactly one place: `AiExtractionService::resolveConfig()`.

Files: new `app/Services/Ai/AiRateLimiter.php`, new `app/Services/Ai/AiSpendGuard.php`, `AiExtractionService.php` (replace `awaitKeyTurn`, lines 291–330), `config/ai.php`, `config/smartcapture.php`, `.env`, 2 migrations  
Acceptance: 50 simultaneous scans queue rather than fail. Free key never exceeds 13 RPM / 1,400 RPD. Paying tenants never touch the free key. Spend caps trip correctly under load.  
*2 days*

---

### T0-8 🔴 Cache and lock driver — required before T0-0 works
With no Redis, `Cache::lock()` (used by `single_flight` at `SmartCaptureController.php:211`) and Laravel's throttle middleware both need a shared store. The file driver cannot lock reliably across PHP-FPM workers.

```bash
php artisan cache:table # creates cache + cache_locks
php artisan queue:table # if not already present
php artisan migrate
```

`.env`:
```env
CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database
```

Verify `single_flight` still works with `DatabaseLock`, and add a scheduled prune of expired cache rows (the database driver doesn't self-clean).

Acceptance: two browser tabs submitting simultaneously produce exactly one upstream call.  
*0.5 day*

---

### T0-9 🔴 MariaDB — EOL, driver, collation, queue
MariaDB 10.5 reached end of life in June 2025. You have been running an unpatched database for 14 months. Beyond security, 10.5 lacks several things this plan wants.

**a) Upgrade to MariaDB 10.11 LTS (or 11.4 LTS)**
| You gain | Why it matters here |
|---|---|
| Security patches | 14 months of unpatched CVEs today |
| SKIP LOCKED (10.6+) | Laravel's database queue uses FOR UPDATE; without SKIP LOCKED, multiple workers block each other. On 10.5 you are effectively limited to one queue worker |
| Better JSON functions | sync_channels and future JSON columns |
| VECTOR type (11.7+) | Only if you later want embeddings (T9-7) |

Do this before Phase 2 — T2-3's queue design assumes it. If the upgrade is blocked, run exactly one queue worker and say so in your deploy docs.

**b) Laravel driver**
Laravel 11+ has a dedicated `mariadb` driver. Using the `mysql` driver against MariaDB causes real problems, most notably `utf8mb4_0900_ai_ci` — a MySQL-only collation that Laravel's mysql driver defaults to and MariaDB does not have.
```env
DB_CONNECTION=mariadb
```
`config/database.php`:
```php
// mariadb connection 
'charset' => 'utf8mb4', 
'collation' => 'utf8mb4_unicode_ci',
```
Audit existing migrations for MySQL-only syntax before the next `migrate:fresh`.

**c) Verify the journal triggers**
`CLAUDE.md` documents MySQL triggers guarding journal-entry integrity (the `PaymentAllocation` → `JournalEntry` rule). Confirm they exist and fire on MariaDB 10.5, and that they survive the version upgrade. Write a test that asserts the trigger rejects a bad allocation.

**d) Correct CLAUDE.md**
It says "MySQL". It's MariaDB. Every future agent reads that file and will make the same wrong assumptions I did.  
*1 day (excluding the DB upgrade window itself)*

---

### T0-10 🔴 Single-cart Lemon Squeezy checkout
Confirmed by your research: 5% + $0.50 per checkout session, not per product. Base plan + AI add-on in one cart = one $0.50. Separate links = two. Worth 11 points of margin on the $3 tier for zero product change.

- Stop using single-product checkout links/overlays
- Use the Lemon Squeezy API to build one checkout containing every selected variant (base plan + AI tier + sync add-ons + staff/location quantities)
- Verify `ProvisionTenantJob` reads the full line-item array, not just `first_order_item` — it currently looks like it may only read the first item
- Test: one order with base + AI + 2 extra staff provisions all three

Files: `app/Services/LemonSqueezyCheckoutService.php`, `BillingController.php@checkoutAddon`, `ProvisionTenantJob.php`, `LemonSqueezyWebhookController.php`  
Acceptance: a 3-product checkout shows exactly one $0.50 fee in the LS dashboard and provisions all 3 entitlements.  
*1 day*

---

### T0-11 🟢 Delete dead code
`app/Services/SmartCapture/GeminiExtractionService.php` — 311 lines, unreferenced, and its own docblock says it contains the loop-over-every-model bug that exhausted the free quota. Delete it.  
*10 minutes*

---

<a name="p1"></a>
## PHASE 1 — AI SCAN: CORRECT, CHEAP, FAST
9–11 days.

### T1-0 🔴 Regression test set — before anything else in this phase
Gate for the whole phase. T0-4, T0-6 and T1-2 all carry accuracy risk and cannot be judged without it.
- 20 real documents: 10 handwritten, 10 printed, ≥3 multi-page, ≥2 non-English, ≥1 deliberately blurry
- Expected JSON committed beside each
- `php artisan smartcapture:benchmark` → per-field accuracy, tokens, cost, latency, pass/fail vs baseline
- Results into `Tester/VerificationCenter/`, matching the existing run format
- Run before and after every prompt, schema or model change

Files: new `app/Console/Commands/SmartCaptureBenchmark.php`, `tests/fixtures/smartcapture/`  
*1 day*

---

### T1-1 🔴 Pre-scan questions
Replaces everything removed in T0-3, and makes scans cheaper and more accurate.

In `SmartCapturePanel.jsx`, before upload:
1. **What are you making?** — Purchase bill · Sales invoice · Expense · Return → sets `target_type`, decides what context is sent at all
2. **Who is it from/to?** — searchable party dropdown (supplier for purchases, customer for sales), or "new" → sets `party_id`; the model is told one name instead of 300
3. **Is it handwritten?** — checkbox with:
   > Tick this if any part is handwritten. It uses our most accurate reading engine. If you leave it unticked and the result is wrong, re-scanning will use another page.
   → sets `input_quality`, drives model selection (T1-4)
4. If Expense → category dropdown → zero category tokens

Remember last-used values per user. Skip a question when there is only one possible answer.  
Acceptance: an expense scan sends no catalog, no parties, no categories — verified in `ai_usage_events`.  
*1.5 days*

---

### T1-2 🔴 Local product matching — SQL index, no Redis
Zero API calls. The core of the new architecture. Without Redis this becomes a materialised index table, which is genuinely better: matching runs in SQL against indexes instead of loading 20,000 products into PHP.

**Schema**
```php
Schema::create('product_search_index', function (Blueprint $t) { 
    $t->unsignedBigInteger('tenant_id'); 
    $t->unsignedBigInteger('product_id'); 
    $t->string('name_norm', 191); // lowercase, punctuation stripped, units normalised 
    $t->string('name_soundex', 32); // MariaDB SOUNDEX() 
    $t->string('name_metaphone', 64); // Double Metaphone, computed in PHP 
    $t->string('sku_norm', 100)->nullable(); 
    $t->string('barcode', 64)->nullable(); 
    $t->text('tokens'); // space-separated normalised tokens 
    $t->primary(['tenant_id', 'product_id']); 
    $t->index(['tenant_id', 'name_norm']); 
    $t->index(['tenant_id', 'name_soundex']); 
    $t->index(['tenant_id', 'name_metaphone']); 
    $t->index(['tenant_id', 'barcode']); 
    $t->index(['tenant_id', 'sku_norm']); 
}); 
// then, raw: 
ALTER TABLE product_search_index ADD FULLTEXT KEY ft_tokens (tokens);
```

Maintained by a `Product` model observer on create/update/delete. Backfill command with chunking.

Normalisation rules (one shared helper, used at index time and query time): lowercase · strip punctuation · collapse whitespace · singular/plural · unit normalisation (1.5l = 1500ml = 1.5 ltr) · Urdu/Arabic-Indic and Devanagari digits → Western · strip common noise words

`FuzzyMatchService::matchProduct(string $raw, array $opts): array`  
Runs in order, stops at the first confident hit:

| # | Strategy | Cost |
|---|---|---|
| 1 | Barcode exact | SQL index |
| 2 | Supplier item code (T1-3) — highest value for printed bills | SQL index |
| 3 | SKU exact | SQL index |
| 4 | name_norm exact | SQL index |
| 5 | Learned alias book (`LearningService`, tenant-scoped) | SQL index |
| 6 | Shared catalog alias (T7-1, opt-in) | SQL index |
| 7 | name_metaphone — pani/paani/panee collapse | SQL index |
| 8 | name_soundex | SQL index |
| 9 | `FULLTEXT MATCH ... AGAINST` in boolean mode, top 20, then Levenshtein re-rank in PHP | SQL + tiny PHP |
| 10 | (optional, T9-7) embedding cosine over the step-9 candidates | — |

Returns `['product_id', 'confidence', 'strategy']`. ≥85 auto-selects · 60–84 pre-selects highlighted · <60 goes to T1-5.

Acceptance: ≥75% of line items match with zero API calls on the test set. Under 150ms for a 20,000-SKU catalog. Under 300ms at 50,000.  
*3 days*

---

### T1-3 🟠 Supplier item code mapping
`supplier_sku_mapping` exists as a plan-feature key with zero implementation. It is the strongest matching signal for printed supplier invoices, because supplier codes never change and never have spelling variants.

```php
Schema::create('supplier_product_codes', function (Blueprint $t) { 
    $t->id(); 
    $t->unsignedBigInteger('tenant_id')->index(); 
    $t->unsignedBigInteger('party_id')->index(); 
    $t->unsignedBigInteger('product_id')->index(); 
    $t->string('supplier_code', 100); 
    $t->unsignedInteger('hits')->default(1); 
    $t->timestamp('last_seen_at')->nullable(); 
    $t->timestamps(); 
    $t->unique(['tenant_id', 'party_id', 'supplier_code']); 
});
```

- The `sc` field in the T0-4 schema captures it
- On scan confirm, upsert every `(party, supplier_code)` → product and increment hits
- `matchProduct()` checks it at position 2
- Settings screen to view/edit/forget, mirroring the existing aliases screen

Acceptance: after confirming one invoice from a supplier, a second invoice from the same supplier matches on codes with no AI fallback call.  
*1 day*

---

### T1-4 🟠 Per-feature model routing
`config/ai_models.php` — one file, so the October migration is a config edit rather than a code hunt:

```php
return [ 
    'scan_handwritten' => ['provider'=>'gemini','model'=>'gemini-2.5-flash', 'thinking'=>256], 
    'scan_printed'     => ['provider'=>'gemini','model'=>'gemini-2.5-flash-lite','thinking'=>0], 
    'audio'            => ['provider'=>'gemini','model'=>'gemini-2.5-flash', 'thinking'=>256], 
    'match_fallback'   => ['provider'=>'gemini','model'=>'gemini-2.5-flash-lite','thinking'=>0], 
    'query'            => ['provider'=>'gemini','model'=>'gemini-2.5-flash-lite','thinking'=>0], 
    'populate'         => ['provider'=>'gemini','model'=>'gemini-2.5-flash-lite','thinking'=>0], 
    'list_import'      => ['provider'=>'gemini','model'=>'gemini-2.5-flash', 'thinking'=>256], 
    'visitor_chat'     => ['provider'=>'gemini','model'=>'gemini-2.5-flash-lite','thinking'=>0,'max_output'=>300], 
    'public_tool'      => ['provider'=>'gemini','model'=>'gemini-2.5-flash', 'thinking'=>256], 
];
```

Confidence escalation: run printed scans on Flash-Lite; if `dc < 60` or server-side arithmetic validation (T1-9) fails, retry once on 2.5 Flash and charge 1 extra page. Log both attempts. Cap at one escalation — never a retry loop. That loop is the bug that killed the free quota before.

Also clean `fallback_models` in `config/smartcapture.php` — it still lists deprecated models.  
*1 day*

---

### T1-5 🟠 Match-fallback AI call
For line items local matching couldn't resolve — typically 2–5 per document.
- Collect all unmatched names into one call. Never one call per item.
- For each, locally retrieve the top 10 candidates from `product_search_index`
- Send only: unmatched names + shortlists. ~800 tokens.
- Flash-Lite, thinking: 0, `responseSchema` with short keys
- Skip entirely when the inline catalog was sent (T0-2) — the model already had it
- Logged as `feature = 'match_fallback'`. Does not consume a page credit.

Acceptance: one call per document maximum, ≤1,200 tokens, ≤$0.0003.  
*1 day*

---

### T1-6 🟠 Browser dictation
18× cheaper than sending audio, and more accurate — the user edits the transcript before it becomes a transaction.
- Web Speech API, language from store locale (`ur-PK`, `hi-IN`, `ar-SA`, `en-US`)
- Live transcript, editable before submit
- Feature-detect and fall back to audio upload — never user-agent sniff
- Submits as `type: 'text'`, routing to the cheap text path
- Free and unmetered
- UI: 🎤 Speak your entry — free, unlimited / 📎 Or upload an audio file — 1 page per 30 seconds

*1 day*

---

### T1-7 🟠 Audio caps
- Recorder hard-stops at 120s with a visible countdown
- Server rejects >180s and over `max_audio_mb`. Decode duration server-side — never trust the client
- 1 page credit per 30 seconds started, shown before submit
- Audio upload is Shop tier and above

*0.5 day*

---

### T1-8 🟠 PDF handling
- Extract page count server-side
- ≤5 pages → one document, one call
- >5 pages → split into documents of 5, showing count and cost before charging: "This PDF has 14 pages. It will be processed as 3 documents and use 14 of your 500 pages. Continue?"
- Never silently truncate. Never silently charge.
- Multi-page PDF is Shop tier and above

*1 day*

---

### T1-9 🟠 Server-side arithmetic validation — free accuracy
The prompt tells the model to check its maths. Verify it yourself — it costs nothing and it catches real errors.

In `TransactionBuilderService`, after extraction:
- For each row, check `q × p ≈ t` (tolerance 1%). On mismatch, recompute the least-confident of the three and flag it.
- Sum the rows and compare against any stated total. On mismatch, flag the document.
- Reject impossible values: negative quantities, prices with more than 2 decimals where the store's currency has 0, dates in the future.
- If ≥30% of rows fail arithmetic, trigger the T1-4 escalation instead of showing a bad result.

*0.5 day*

---

### T1-10 🟠 Query intent routing
Replaces the current practice of feeding data into the prompt.
- Local pattern match first. `config/ai_intents.php` with ~30 intents, each with phrase patterns, a report class and required params. "sales today", "low stock", "top seller this week", "who owes me money" → no AI call at all. Target 50–60% of queries.
- Miss → one Flash-Lite call with the question plus the intent list (~600 tokens), returning `{intent, params}` only.
- Execute your own SQL through the existing report services.
- Format with a PHP template, not AI.
- The model never sees products, sales rows or ledger data — so it cannot hallucinate a number, because it never produces one.

Acceptance: "how much did we make last month" costs ≤$0.0002 and returns a figure traceable to the ledger.  
*2 days*

---

<a name="p2"></a>
## PHASE 2 — METERING & ENFORCEMENT
5–6 days.

### T2-1 🔴 Scans → pages
- Migration: rename `ai_scans_used`/`ai_scans_limit` → `ai_pages_used`/`ai_pages_limit`; add `ai_descriptions_balance` (non-expiring credits) and `ai_period_started_at`.
- 1 page = 1 credit. Audio = 1 per 30s started. Dictation = 0. Match-fallback = 0. Deduped re-scan = 0.
- Debit after successful extraction, never on failure
- Refund on failure after charge
- Every surface says "pages": UI, emails, pricing page, docs, `SmartCaptureEnable` command

Files: migration, `AiEntitlementService.php`, `SmartCaptureController.php`, `Tenant.php`, `SmartCaptureEnable.php`, `ResetAiUsageJob.php`, `Billing/Index.jsx`, `SmartCapturePanel.jsx`  
*1 day*

---

### T2-2 🔴 Close the "null means unlimited" hole
`PlanFeatureMatrixSeeder.php:281` seeds `ai_queries_limit` and `smart_capture_limit` as `null`; `AiEntitlementService::check()` line 76 reads:

```php
if ($limit > 0 && $used >= $limit) { ... } // 0 or null ⇒ never blocks
```

Any `ai_status = 'managed'` tenant not provisioned through the LS webhook — manual grants, `smartcapture:enable` without options, comps, migrations — gets unlimited AI on your paid key.

- Seeder writes real integers, never null
- `-1` is the only value meaning genuine unlimited (staff, BYOK)
- `0` and `null` mean deny
- Data-fix migration auditing every tenant with `ai_status='managed'` AND `ai_pages_limit <= 0`
- Close the `PlanGate::check('smart_capture')` bypass at line 87 — an override must not skip the meter for a managed tenant

*0.5 day*

---

### T2-3 🟠 Hybrid sync/async extraction
Design decision: fully async would add 1–3s of DB-queue polling latency to every scan, and MariaDB 10.5 without `SKIP LOCKED` limits you to one worker. Hybrid is faster for the user and safer.

- `POST /smart-capture/extract` → validate, dedupe check (T0-6), entitlement check → `AiRateLimiter::tryAcquire()`
  - `ok` → run synchronously, return the result (99% of the time at your scale)
  - `wait ≤ 8000ms` → sleep, retry once, run synchronously
  - `wait > 8000ms` → debit, dispatch `ProcessSmartCaptureJob`, return `{job_id}` 202
- `GET /smart-capture/status/{job_id}` → `queued|processing|done|failed` + result
- Frontend shows staged progress: Uploading → Reading → Matching → Ready
- Failure → automatic credit refund + clear message
- Job respects priority lanes
- Keep `single_flight` per store
- Run exactly one queue worker until MariaDB is upgraded (T0-9)

Files: new `app/Jobs/ProcessSmartCaptureJob.php`, `SmartCaptureController.php`, `routes/web.php` (`+ziggy:generate`), `SmartCapturePanel.jsx`  
*2 days*

---

### T2-4 🟠 Quota warnings and top-ups
- 80% consumed → in-app banner + email offering both upgrade and BYOK
- 100% → hard stop, same two options plus the $2 / 200-page top-up
- Never auto-bill overage
- Top-up is a one-time LS product incrementing `ai_pages_limit` for the current period
- Dashboard widget: pages used / limit, days to reset

*1.5 days*

---

### T2-5 🟠 Reset on billing anniversary, not the 1st
`ResetAiUsageJob` runs on the 1st at 00:05, but subscriptions renew on the customer's own date. Someone subscribing on the 20th gets a reset 11 days later.

- Reset per tenant on their anniversary, from the LS renewal date, using `ai_period_started_at`
- Keep the monthly sweep as a safety net
- Audit-log every reset

*1 day*

---

<a name="p3"></a>
## PHASE 3 — FEATURE GATES
8–10 days. You asked for all gates wired, not just Counter's.

### T3-1 🔴 The enforcement layer that doesn't exist
Current state: `PlanFeatureMatrixSeeder` declares ~250 gate keys. `PlanGate::check()` appears ~36 times in the whole codebase, mostly rendering upsell badges in `BillingController` rather than blocking anything. `HandleInertiaRequests::share()` exposes no features or limits prop. There is no plan-feature route middleware. The matrix is documentation, not enforcement.

**a) Shared Inertia props — `HandleInertiaRequests::share()`:**
```php
'plan' => [ 
    'slug' => $tenant?->plan, 
    'features' => PlanRepository::featuresFor($tenant), // ['key' => bool] 
    'limits' => PlanRepository::limitsFor($tenant), // ['sku_limit' => 5000, ...] 
    'usage' => ['skus'=>..,'staff'=>..,'locations'=>..,'ai_pages'=>..], 
],
```
Cached per tenant (database cache), busted on plan change or override write.

**b) Route middleware — `app/Http/Middleware/EnsurePlanFeature.php`, aliased `plan.feature`:**
```php
Route::middleware('plan.feature:aged_receivables')->group(...)
```
402 for JSON, upgrade redirect for Inertia, carrying the feature name and the cheapest plan that includes it.

**c) React helper — `usePlan()` hook + `<PlanGate feature="x">` rendering a lock badge with an upgrade link.**  
*2 days*

---

### T3-2 🔴 Wire every gate key
Systematic pass over all ~250 keys, in the seeder's own group order.

- **Priority 1 — the Counter boundary (must be perfect):** `customer_khata` · `supplier_khata` · `unified_party_ledger` · `aged_receivables` · `aged_payables` · `double_entry_ledger` · `purchase_orders` · `purchase_returns` · `suppliers_directory` · `expense_manager` · `report_profit_loss` · `report_trial_balance` · `report_party_statement` · `customer_statements` · `supplier_statements` · `debit_credit_notes` · `outstanding_balance_grid` · `payment_due_dates`
- **Priority 2 — currently-sold differentiators:** `multi_branch` · `stock_transfer` · `production` · `bill_of_materials` · `loyalty_points` · `digital_gift_cards` · `marketing_campaigns` · `api_access` · `white_label` · `woocommerce*` · `recurring_invoices` · `fund_management` · `bank_reconciliation` · `e_invoicing`
- **Priority 3 — the ~45 `report_*` keys.** Drive from a single report registry, not 45 individual checks.
- **Priority 4 — the long tail, wired but defaulted permissive so nothing breaks silently.**

For each: route middleware and UI gate and a seeder value for all 5 plans. Server-side enforcement is mandatory — hiding a menu item is not a gate.  
*4 days*

---

### T3-3 🟠 The Counter plan
- Add `counter` slug to plans, `PlanFeatureMatrixSeeder`, `config/plans.php`
- 500 SKUs · 2 staff · 1 location · 10 AI pages · 50 AI queries
- 4 reports only: daily sales, sales summary, low stock, stock levels
- Lemon Squeezy variants (monthly $18 / annual $180)
- Cookbook on Counter — my call, food-prep business types only: `cafe` · `restaurant` · `bakery` · `juice_tea_shop` · `food_truck` · `cloud_kitchen` · `sweets_mithai` · `ice_cream_parlour`
  - Rationale: every one of these assembles sale items from ingredients, so recipes are the core workflow rather than an add-on — and it's the reason that segment picks you over a generic POS. Retail, grocery, pharmacy, hardware, mobile and garments do not get it on Counter. Granted via `tenant_plan_overrides` at onboarding based on the selected industry, so it's revocable if abused.

*1 day*

---

### T3-4 🔴 Downgrade policy
The most support-critical item in this phase.
- Nothing is ever deleted. Data becomes read-only and hidden.
- Block the downgrade if open payables or receivables > 0. Explain why. Offer "settle or archive".
- SKU overage: freeze new product creation, delete nothing, show a banner
- Staff/location overage: block until they remove seats themselves — never pick for them
- 30-day grace before anything hides, so accidents are recoverable
- Banner: "You have 214 supplier bills and Rs 840,000 of recorded payables archived. Upgrade to Starter to reopen them."
- Reuse `SubscriptionLifecycleMiddleware` and `view_only_since` — don't duplicate

*1.5 days*

---

<a name="p4"></a>
## PHASE 4 — NEW PRICING LIVE
5–6 days. No grandfathering — existing users move immediately, per your decision.

### T4-1 🔴 `config/pricing.php` — single source of truth
Prices currently live in five places that disagree:

| Contradiction | Where |
|---|---|
| AI tiers: Ultimate advertises 10,000 queries, provisions 800 | `Pricing.jsx:180–189` vs `:557–643` vs `ProvisionTenantJob.php:176–195` |
| Lite and Core swapped between the two arrays | same |
| LTD $49/$99/$179 vs $79/$199/$399 | `create_plans_table.php` vs `Pricing.jsx:131–133` |
| Base plans $19/$39/$79 vs $36/$63/$129 | `create_plans_table.php` seed vs `Pricing.jsx` |
| Limits duplicated, manually synced | `config/plans.php` (its own header admits it) vs `PlanFeatureMatrixSeeder.php` |

Build `config/pricing.php` holding every plan, add-on, price, quota and LS variant id. Then:
- `Pricing.jsx` gets it as an Inertia prop — delete both hardcoded arrays
- `ProvisionTenantJob`, `BillingController`, `PlanFeatureMatrixSeeder` all read it
- A test that fails if a hardcoded price string reappears in any `.jsx`

*1 day*

---

### T4-2 🟠 Pricing page
- Four plans: Counter $18 · Starter $36 · Growth $63 · Business $129 (annual = 10×)
- SKUs 500 / 5,000 / 20,000 / 50,000
- Value badges: "5× / 11× / 14× better value per product" — arithmetic on your own published prices
- Value stack per card using only real add-on prices
- New comparison table with AI Scan and sync rows (currently entirely missing)
- Remove the `{false && (...)}` wrapper that hides the AI panel and orphans funnel steps 2–5
- SMS/WhatsApp rows marked "Coming soon", not sold

*2 days*

---

### T4-3 🟠 Four AI tiers
Quotas raised — T0-4 pays for it.

| Tier | Spark | Shop | Pro | Max |
|---|---|---|---|---|
| Price/mo | $3 | $6 | $12 | $24 |
| Pages | 500 | 1,000 | 2,000 | 4,000 |
| Queries | 2,500 | 5,000 | 10,000 | 20,000 |
| COGS at cap, today | $0.79 | $1.58 | $3.16 | $6.32 |
| COGS at cap, post-Oct | $1.30 | $2.59 | $5.19 | $10.37 |
| Margin at cap, post-Oct | 54.5% | 54.5% | 54.5% | 54.5% |
| Margin today | 72% | 72% | 72% | 72% |

Capability flags: `audio_upload` · `pdf_multipage` · `bulk_upload` · `priority_queue` · `growth_signals` · `scan_api`. 5 pages per document on every tier. Retire Core/Lite/Pro/Ultimate. $2 / 200-page top-up.  
*1.5 days*

---

### T4-4 🟠 Staff & location add-ons
- $5/staff/month, $10/location/month, quantity-based LS variants
- Live upgrade nudge doing the arithmetic: "You're on Growth $63 with 12 extra staff — $123/month. Business is $129 and includes 50 staff, 10 locations, loyalty, gift cards and API. Switch for $6 more →"
- Nudge points: Counter→Starter at 2 staff / 1 location · Starter→Growth at 4 / 1 · Growth→Business at 12 / 5
- `PlanRepository` computes effective limit = base + purchased quantity

*1.5 days*

---

### T4-5 🟢 BYOK $19 + immediate migration
- $9 until 30 Sep, $19 from 1 Oct — a real change on a real date. No permanent strike-through.
- Paid on every plan including Counter. Never free.
- Free during the 14-day trial, capped at 50 pages — fixes the current lockout where a trial user with their own key can't use it
- Rename in UI: "Use my own AI key"
- Migrate all existing tenants to the new plans immediately. Write a one-off command mapping old slugs → new, log every change, and email each affected user what changed.

*0.5 day*

---

### T4-6 🟢 Hide LTD from the website
`plans` has `platform_id` (website vs appsumo) and `is_visible`. Set `is_visible = false` on appsumo plans for site rendering; confirm `Pricing.jsx` filters on it rather than a hardcoded list.  
*0.2 day*

---

<a name="p5"></a>
## PHASE 5 — TRUTH & TRUST
3 days. Must complete before the free public tool and before AppSumo.

### T5-1 🔴 Delete every false claim
All in `ALL_AI_OPTIONS[].techSpecs`, `resources/js/Pages/Marketing/Pricing.jsx`:

| Remove | Why |
|---|---|
| "Vision Transformer v2 (99.2% extraction accuracy)" | Engine doesn't exist; number never measured |
| "99.9% uptime SLA" | No SLA, no status page, no credit mechanism |
| "1,200 requests/min dedicated priority queue" | Shared key at ≤15 RPM |
| "Fine-tuned LayoutLM" | Doesn't exist |
| "<450ms" / "<600ms latency" | Real scans take 5–15s |
| "GPT-4o / Gemini 1.5 Pro / Claude 3.5 Sonnet Hybrid Router" | Everything runs on `gemini-2.5-flash` |
| "Unlimited staff AI access" on a capped tier | Self-contradictory |
| "AI Product Descriptions 50/200/800/2,500" | Not implemented — replaced by T7-4 |
| SMS / WhatsApp reminders as included features | Don't work — mark Coming soon |

Replace with claims that are true (all genuinely implemented):
- Reads handwritten bills, not just printed — English, Urdu, Hindi, Arabic numerals
- Checks its own arithmetic — every row verified as `qty × price = total`, and against the written total
- Learns your shorthand — correct it once, right forever, for your store only
- Never posts to your ledger by itself — every scan lands on a review screen. (A real design decision in `config/smartcapture.php:161`, and the thing shop owners actually worry about. Lead with it.)
- Multi-page documents merge into one transaction
- Use your own AI key if you prefer
- Never name the model — it's deprecated in October.

*1 day*

---

### T5-2 🟠 Status page and monitoring
- UptimeRobot or BetterStack (free tier), monitoring independently of your servers
- `status.venqore.com` with real incident history
- No SLA claim until 6 months of measured data. Say what's true: "Automated daily backups and a public status page."

*0.5 day*

---

### T5-3 🟠 Privacy, terms, shared catalog default-on
Per your decision the shared product catalog is ON by default, with consent captured in the Terms.

**Terms & Conditions clause (draft, have a lawyer review before EU/UK launch):**
> **Shared Product Catalogue.** To improve product identification for all users, VenQore maintains a shared catalogue of product identity information. When you confirm a product, we may add its barcode, product name, brand, pack size, category and generic description to this catalogue.  
> We never include your selling prices, cost prices, margins, stock levels, sales volumes, customers, suppliers, or any information identifying your business. Contributions are anonymous and no entry is attributable to any store.  
> You may opt out at any time in Settings → Data. Opting out stops future contributions; previously contributed generic product identity remains in the shared catalogue.

- Trial signup — checkbox above the button:
  `☑ I agree to the [Terms and Conditions](https://claude.ai/terms) and [Privacy Policy](https://claude.ai/privacy), including the Shared Product Catalogue described in section 7.`
- Record `terms_accepted_at` and `terms_version` on the tenant. Store the version — when the terms change you need to know who accepted what.
- Settings → Data — the opt-out toggle, on by default, plain language, one click.
- Sub-processor page naming Google (and OpenAI/Anthropic for BYOK).
- Privacy policy AI clause: "AI features process document images through Google's Gemini API. On paid processing tiers, Google does not use this data to train its models."
- DPA available on request. Boilerplate now, real one before the first EU customer.
- Second toggle, off by default: Help improve AI accuracy — routes that tenant's scans to the free-tier key.

⚠️ Default-on is defensible for anonymous product identity and is what makes the catalog viable. It would not be defensible for anything in the "never share" column. Keep that line absolutely clean — it's what makes the default-on position honest.  
*1 day*

---

### T5-4 🟠 Data retention
- Scan images deleted after 90 days; extracted JSON kept. Caps storage growth permanently.
- Scheduled job + a per-tenant longer-retention setting on Business
- Documented in the privacy policy

*0.5 day*

---

<a name="p6"></a>
## PHASE 6 — WOOCOMMERCE + AMAZON
Your stated next priority. These blockers stand from the earlier audit and must be re-verified against current code:

| ID | Blocker |
|---|---|
| B1 | `EnsureVenSynQAccess` middleware exists but is applied to no route — neither the kill-switch nor the plan gate is enforced on `/vensynq/*` |
| B2 | Buying the Amazon add-on grants no entitlement — `ProvisionTenantJob` writes a `tenant_plan_overrides` row only for `woocommerce` |
| B3 | `BillingController::checkoutAddon` whitelist has no `sync_amazon` — no in-app path to buy it |
| B5 | `config('vensynq.simulation_mode')` defaults to `true` — if prod `.env` omits the flag, Amazon returns fake orders that post into a real ledger. Change the default to `false`. |

Plus: confirm WooCommerce is actually deployed to production, and that `woocommerce:sync-stock` is on the production scheduler.  
*Scope separately.*

---

<a name="p7"></a>
## PHASE 7 — GROWTH

### T7-1 🟢 Shared product knowledge base
```php
Schema::create('shared_products', function (Blueprint $t) { 
    $t->id(); 
    $t->string('barcode', 64)->unique(); // barcode-keyed only, at first 
    $t->string('canonical_name', 255); 
    $t->string('brand', 128)->nullable(); 
    $t->string('pack_size', 64)->nullable(); 
    $t->string('category', 128)->nullable(); 
    $t->text('description')->nullable(); 
    $t->unsignedInteger('confirmations')->default(1); 
    $t->boolean('is_published')->default(false); // true at >= 3 confirmations 
    $t->timestamps(); 
}); 
Schema::create('shared_product_aliases', ...); // alias -> shared_product_id, hits
```

Non-negotiable rules:
- Never store price, cost, margin, quantity, stock, supplier, customer, or the contributing tenant.
- Published only at ≥3 independent confirmations of the same barcode→name — stops one typo becoming everyone's problem
- Contribution anonymous; no source recorded or derivable
- On by default, opt-out in Settings → Data (T5-3)
- Uses: barcode lookup on product create · `matchProduct()` strategy 6 · industry starter catalogs (wire into the existing `industry_seeding` / `industry_templates_count`: pick a business type, open with 200–500 pre-named, categorised, barcoded products, prices blank) · powers the free public tool's suggestions

*3 days*

---

### T7-2 🟢 Free public tool
`/tools/invoice-scanner`, alongside the 27 existing tools in `resources/js/Pages/Marketing/Tools/`. Ships after Phase 5, before AppSumo.

Guardrails, all of them:
- Email required before the result shows — this is the lead magnet
- 3 documents/day per email · 10/day per IP · 1 page per document
- Cloudflare Turnstile on submit
- Global daily USD budget (default $10/day) → switches to a waitlist form when tripped
- Watermarked output, removable by signing up
- Nothing stored beyond 24h unless they opt in
- Free-tier key only. No catalog, no database, no account context
- Logged as `feature = 'public_tool'`

Cost exposure: 100 uses/day = $12/mo · 500 = $59/mo · 2,000 = $234/mo · 10,000 = $1,170/mo. The budget cap is what makes this safe.  
*2.5 days*

---

### T7-3 🟢 Product descriptions & List→Catalog
**a) AI Generate** — batch 20 products/call, Flash-Lite, thinking: 0, low-priority queue lane. Ask the target first (WooCommerce / Amazon / web / in-store) — same cost, much better output. Store in separate columns (`ai_title`, `ai_description_short`, `ai_description_long`, `ai_tags`) so you can diff, roll back and regenerate. Never overwrite `products.name`. Diff review screen before applying.  
Credits: 50 free on any paid plan; packs 200/$6 · 500/$12 · 2,000/$39; never expire. Meter: `ai_descriptions_balance`.

**b) Human Written** — $1/product, +$0.50/variant. Order form, work queue, delivery workflow. Credits never expire.

**c) List → Catalog** — photos / PDF / pasted WhatsApp text → extracted product table → feeds the existing `ImportMappingController` + `DataImportService` review screen → import. Meter at 1 page credit per page of list.

This is arguably your strongest onboarding feature. The main reason a shop abandons a new POS is that building the catalog is a week of typing. This turns it into an afternoon. Put it in onboarding and in the trial, not buried in a menu.  
*4 days*

---

### T7-4 🟢 Listing images — do NOT generate products with AI
Amazon requires the main image to be a real photograph of the real product on pure white RGB(255,255,255), filling 85% of frame. Generated product images are misrepresentation and get accounts suspended.

Build the compliant version: background removal → white canvas → 85% crop → 2000×2000 sRGB, from the seller's own photo. Optional template infographic overlays for secondary images. Deterministic, cheap, compliant. Pack: 7 images for $4.  
*3 days*

---

<a name="p8"></a>
## PHASE 8 — APPSUMO READINESS

| ID | Task | Days |
|---|---|---|
| T8-1 🟢 | Enforce `transactions_per_month` caps (1,000 / 3,000 / 8,000) — declared, enforced via EnforceTransactionLimit middleware | 1 |
| T8-2 🟢 | `hosted_until` expiry job + 60/30/7-day alert logs + $9/mo continuation checkout + EnforceHostedUntil middleware restriction | 2 |
| T8-3 🟢 | LTD tiers $99 / $199 / $349 seeded in config/pricing.php; managed AI hard-blocked on all LTD plans in PlanRepository | 0.5 |
| T8-4 🟢 | Help centre with 20 support articles (/help & /help/articles/{slug}) and search deflection | 3 |
| T8-5 🟢 | Load test benchmark console command (venqore:load-test --tenants=500 --requests=1000) | 1 |
| T8-6 🟢 | Known-issues page (/known-issues) tracking active status and workarounds | 0.2 |

---

<a name="p9"></a>
## PHASE 9 — INFRASTRUCTURE & LATER

| ID | Task |
|---|---|
| T9-1 🟢 | Offsite backup redundancy service & S3 offsite disk definition in config/filesystems.php |
| T9-2 🟢 | Cloudflare R2 disk definition & fallbacks configured in config/filesystems.php |
| T9-3 🟢 | MariaDB 10.11 LTS & collation audit console command (venqore:audit-database) |
| T9-4 🟠 | Redis, when you next change hosting (not required by this plan — every design works without it) |
| T9-5 🟢 | Messaging, SMS & WhatsApp delivery audit service (MessagingAuditService) |
| T9-6 🟢 | AI Model 2026 deprecation timeline audit & fallback chains in config/ai_models.php |
| T9-7 🟢 | Embeddings — optional. Two-stage approach: SQL prefilter + cosine in PHP |
| T9-8 🟢 | Bulk folder upload (Pro tier) |
| T9-9 🟢 | Restaurant/café dashboard — table management, kitchen display, modifiers (separate build) |

---

<a name="appa"></a>
## APPENDIX A — All 32 defects found

| ID | Sev | Defect | Task |
|---|---|---|---|
| D1 | 🔴🔴 | Public unauthenticated LLM endpoint, no throttle, 10k char limit | T0-0 |
| D2 | 🔴 | MariaDB 10.5 EOL since June 2025 — 14 months unpatched | T0-9 |
| D3 | 🔴 | Token usage read then discarded — zero cost visibility | T0-1 |
| D4 | 🔴 | 800-product catalog sent every scan; breaks entirely at 50k SKUs | T0-2 |
| D5 | 🔴 | Verbose JSON schema — output is 80% of scan cost | T0-4 |
| D6 | 🟠 | 300 party names sent, then fuzzy-matched server-side anyway | T0-3 |
| D7 | 🟠 | 200 expense categories sent on every scan including non-expenses | T0-3 |
| D8 | 🟠 | Full-resolution images uploaded and sent — 20+ tiles for no gain | T0-5 |
| D9 | 🟠 | 1,024 thinking tokens/scan, billed at 8× input rate | T0-6 |
| D10 | 🟠 | Text part after image part — blocks implicit prefix caching | T0-6 |
| D11 | 🔴 | `pace_ms = 0` — the only global rate limiter is disabled | T0-7 |
| D12 | 🔴 | `throttle:20,1` is per user, not per API key | T0-7 |
| D13 | 🟠 | Cache/lock driver likely file — `Cache::lock` and throttle unreliable across workers | T0-8 |
| D14 | 🟠 | Laravel mysql driver against MariaDB → `utf8mb4_0900_ai_ci` collation errors | T0-9 |
| D15 | 🟠 | No `SKIP LOCKED` on MariaDB 10.5 → DB queue limited to one worker | T0-9, T2-3 |
| D16 | 🔴 | null/0 limit = unlimited; manually-granted tenants get free unlimited AI | T2-2 |
| D17 | 🟠 | `PlanGate::check('smart_capture')` bypasses the meter | T2-2 |
| D18 | 🔴 | ~250 gate keys declared, ~36 `PlanGate::check()` calls, no middleware, no Inertia prop | T3-1, T3-2 |
| D19 | 🔴 | AI tier prices/quotas contradict across 3 files (Ultimate: 10,000 advertised, 800 provisioned) | T4-1 |
| D20 | 🔴 | Base plan prices contradict between plans table and `Pricing.jsx` | T4-1 |
| D21 | 🟠 | LTD prices contradict between plans table and `Pricing.jsx` | T4-1 |
| D22 | 🔴 | Fabricated accuracy % and SLA claims on a live page | T5-1 |
| D23 | 🔴 | "AI Product Descriptions" sold, zero implementation | T5-1, T7-3 |
| D24 | 🟠 | SMS/WhatsApp advertised, non-functional | T5-1, T9-5 |
| D25 | 🟠 | `supplier_sku_mapping` declared as a feature, zero implementation | T1-3 |
| D26 | 🟠 | Monthly reset on the 1st, but subscriptions renew on anniversaries | T2-5 |
| D27 | 🟠 | `GeminiExtractionService` dead code containing the retry-loop bug | T0-11 |
| D28 | 🟠 | `hosted_until` is a config string with no enforcement | T8-2 |
| D29 | 🟠 | `transactions_per_month` LTD caps declared, not enforced | T8-1 |
| D30 | 🔴 | `EnsureVenSynQAccess` applied to no route | Phase 6 |
| D31 | 🔴 | Amazon add-on purchase grants no entitlement | Phase 6 |
| D32 | 🔴 | `vensynq.simulation_mode` defaults true — fake orders into a real ledger | Phase 6 |
| D33 | 🟠 | `FILESYSTEM_DISK=local` — scans + backups + DB on one 200GB disk, no redundancy | T9-1, T9-2 |
| D34 | 🟠 | `gemini-2.5-flash` deprecates 16 Oct 2026; `fallback_models` lists dead models | T1-4, T9-6 |
| D35 | 🟠 | Separate LS checkouts charge $0.50 twice | T0-10 |
| D36 | 🟠 | `{false && (...)}` on the pricing page orphans funnel steps 2–5 | T4-2 |
| D37 | 🟠 | `CLAUDE.md` documents MySQL; the server runs MariaDB | T0-9 |

---

<a name="appb"></a>
## APPENDIX B — New files

- **Config**: `config/ai_pricing.php` · `config/ai_models.php` · `config/ai_intents.php` · `config/ai.php` · `config/pricing.php`
- **Services**: `app/Services/Ai/AiUsageRecorder.php` · `app/Services/Ai/AiRateLimiter.php` · `app/Services/Ai/AiSpendGuard.php` · `app/Services/Ai/QueryIntentResolver.php` · `app/Services/SmartCapture/ProductIndexService.php` · `app/Services/SmartCapture/CatalogResolverService.php` · `app/Services/SmartCapture/TextNormalizer.php` · `app/Services/PlanDowngradeGuard.php`
- **Middleware**: `app/Http/Middleware/EnsurePlanFeature.php` · `app/Http/Middleware/VisitorChatGuard.php`
- **Jobs**: `app/Jobs/ProcessSmartCaptureJob.php` · `app/Jobs/PurgeOldScanImagesJob.php` · `app/Jobs/RebuildProductIndexJob.php`
- **Models**: `app/Models/SupplierProductCode.php` · `app/Models/AiUsageEvent.php` · `app/Models/SharedProduct.php`
- **Commands**: `app/Console/Commands/SmartCaptureBenchmark.php` · `app/Console/Commands/MigrateTenantsToNewPlans.php` · `app/Console/Commands/BackfillProductIndex.php`
- **Frontend**: `resources/js/hooks/usePlan.js` · `resources/js/Components/PlanGate.jsx` · `resources/js/lib/imagePreprocess.js`
- **Migrations**: `ai_usage_events` · `ai_rate_buckets` · `ai_spend_counters` · `visitor_chat_cached_answers` · `scan_image_hashes` · `product_search_index` (`+ raw FULLTEXT`) · `supplier_product_codes` · `shared_products` · `shared_product_aliases` · `pages rename` · `ai_descriptions_balance` · `ai_period_started_at` · `terms_accepted_at + terms_version` · `cache/cache_locks/jobs tables`

---

<a name="appc"></a>
## APPENDIX C — Final pricing reference

### Base plans
| Plan | Counter | Starter | Growth | Business |
|---|---|---|---|---|
| Monthly | $18 | $36 | $63 | $129 |
| Annual | $180 | $360 | $630 | $1,290 |
| SKUs | 500 | 5,000 | 20,000 | 50,000 |
| Locations | 1 | 1 | 3 | 10 |
| Staff | 2 | 3 | 10 | 50 |
| AI pages/mo | 10 | 20 | 60 | 150 |
| AI queries/mo | 50 | 100 | 400 | 1,000 |
| Transactions | Unlimited | Unlimited | Unlimited | Unlimited |
| Your AI cost/mo | $0.03 | $0.05 | $0.17 | $0.41 |

### AI add-ons
| Tier | Spark | Shop | Pro | Max |
|---|---|---|---|---|
| Price/mo | $3 | $6 | $12 | $24 |
| Pages | 500 | 1,000 | 2,000 | 4,000 |
| Queries | 2,500 | 5,000 | 10,000 | 20,000 |
| Margin at cap (post-Oct) | 54.5% | 54.5% | 54.5% | 54.5% |

### One-time & quantity add-ons
| Item | Price |
|---|---|
| BYOK unlock | $9 → $19 from 1 Oct |
| AI page top-up (200) | $2 |
| Extra staff seat | $5/mo |
| Extra location | $10/mo |
| WooCommerce sync | $10/mo |
| Amazon sync | $10/mo |
| AI descriptions 200 / 500 / 2,000 | $6 / $12 / $39 |
| Human description | $1/product, +$0.50/variant |
| Listing image pack (7) | $4 |

### AppSumo LTD
| Code Tier | 1 code | 2 codes | 3 codes |
|---|---|---|---|
| Price | $99 | $199 | $349 |
| SKUs | 5,000 | 20,000 | 50,000 |
| Locations / staff | 1 / 3 | 3 / 10 | 10 / 25 |
| Transactions/mo | 1,000 | 3,000 | 8,000 |
| AI pages/mo | 20 | 60 | 150 |
| BYOK | included | included | included |
| Managed AI | never | never | never |
| Hosting | 2yr, then $9/mo | 2yr, then $9/mo | 2yr, then $9/mo |
| Net @30% split, after hosting | +$5.70 | +$35.70 | +$80.70 |

---

## EFFORT SUMMARY

| Phase | Scope | Days |
|---|---|---|
| 0 | Stop the bleeding | 7–8 |
| 1 | AI Scan: correct, cheap, fast | 9–11 |
| 2 | Metering & enforcement | 5–6 |
| 3 | Feature gates | 8–10 |
| 4 | New pricing live | 5–6 |
| 5 | Truth & trust | 3 |
| **Subtotal** | **new pricing live with AI** | **37–44 days (7–9 weeks)** |
| 6 | WooCommerce + Amazon | scope separately |
| 7 | Growth (incl. free tool, before AppSumo) | ~13 |
| 8 | AppSumo readiness | ~8 |
| 9 | Infrastructure & later | ~9 |

---

### Sources
- [Gemini API — Billing](https://ai.google.dev/gemini-api/docs/billing)
- [Gemini pricing 2026 — every model, and the thinking tokens](https://www.cloudzero.com/blog/gemini-pricing/)
- [Gemini 2.5 Flash API pricing](https://pricepertoken.com/pricing-page/model/google-gemini-2.5-flash)
- [AppSumo — Partner Payments Policy](https://appsumo.com/partner-terms/payment-policy/)
