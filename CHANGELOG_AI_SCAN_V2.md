# CHANGELOG — AI Scan (SmartCapture) v2

**Date:** 2026-08-01
**Scope:** Request budget, learning memory, handwriting accuracy, UI/UX, multi-tenant concurrency

---

## 1. The bug you hit: why one scan drained your quota

`AiExtractionService::extract()` looped over a chain of four Gemini models and
advanced to the next one on **any** exception:

```php
foreach ($models as $model) {          // gemini-2.5-flash, 2.5-flash-lite, 2.0-flash, 2.0-flash-lite
    try { return $this->parseJson($this->callGemini(...)); }
    catch (\Exception $e) { continue; }   // ← 429 lands here too
}
```

A rate-limit (HTTP 429) is an exception, so a single throttled scan fired **four
requests back-to-back within milliseconds**. On the free tier (~10 requests per
minute, shared across the whole Google project) that consumed 40% of the minute's
budget, and every one of those retries was itself guaranteed to 429 — a self-
reinforcing storm.

Three things fed it:

| Cause | Effect |
|---|---|
| Retry loop over 4 models on *any* failure | 1 scan → up to 4 requests |
| `maxOutputTokens: 3000` | Long handwritten lists truncated → JSON parse failure → treated as failure → retry loop |
| No double-submit guard on the scan buttons | 2 clicks → 2 scans → up to 8 requests |

Nothing prevented two staff (or two browser tabs) scanning at the same instant either.

---

## 2. The contract now: one scan = one request

`AiExtractionService` enforces this explicitly, and the class docblock states it
so it cannot be undone by accident.

- **No retry loop.** 429, 5xx, timeouts and parse failures are surfaced to the
  user, never re-sent.
- **The single exception:** if the provider says *this model does not exist for
  your key* (404 / 400 "not found"), one substitute is tried — because
  substituting is the actual fix, not a retry. The working model is then saved
  to the store's settings so the substitution is never paid for twice.
- **`meta.api_requests`** is returned with every scan and shown in the review
  screen header, so the guarantee is visible rather than assumed.
- **`SMART_CAPTURE_MODEL_SUBSTITUTION=false`** disables even that.

Supporting fixes:

- `maxOutputTokens` 3000 → **8192** (a 60-line document now fits).
- `responseMimeType: application/json` forces syntactically valid JSON from
  Gemini, removing the largest cause of parse failure.
- A truncated response is **repaired** (unclosed braces balanced, partial trailing
  element dropped) rather than re-scanned.
- `MAX_TOKENS` and blocked-prompt responses now produce actionable messages
  ("split the document") instead of a generic failure.
- Safety thresholds relaxed to `BLOCK_ONLY_HIGH` — default thresholds falsely
  flag ordinary receipts containing alcohol, tobacco or certain brand names.
- **Dead code:** `GeminiExtractionService` contained a second copy of the same
  retry loop. It is unreferenced and now marked `@deprecated — safe to delete`.
  Deleting it is recommended.

### Concurrency

| Guard | Where | What it prevents |
|---|---|---|
| Single-flight lock (`Cache::lock`, per store) | `SmartCaptureController::extract` | Double-click / second tab spending a second request on the same document. Returns HTTP 409. |
| `extractInFlight` ref guard | `SmartCapturePanel.jsx` | Two rapid clicks both reading stale `loading` state before React re-renders. |
| Key pacer (`SMART_CAPTURE_PACE_MS`) | `AiExtractionService::awaitKeyTurn` | Several staff sharing one free-tier key bursting past its per-minute allowance. Default **0** (off) — you are moving to a paid key. Set to `6500` if you stay on free. |
| Idempotency key | `confirm` | A retried or double-clicked submit posting the transaction twice. The second call returns the original result with `duplicate: true`. |

---

## 3. Learning memory — it gets smarter per store

New table **`smart_capture_aliases`**, new service **`LearningService`**.

Every correction a user makes on the review screen is remembered against the
**store** (shared by all staff, per your choice), with attribution kept so a bad
lesson can be traced and removed.

The loop:

1. **Before the scan** — the store's strongest aliases are sent to the model as
   *"this store's confirmed vocabulary"*, which outranks the model's own guess.
   So `col 1.5` resolves to *Coca Cola 1.5L* on the **first** pass.
2. **After the scan** — every extracted line is checked against the alias book
   *before* fuzzy matching. An exact hit is pinned at **100%**, badged
   *"Remembered — you chose this for 'col 1.5' 4 times"*, and pre-selected.
3. **On confirm** — whatever the user actually chose is written back, atomically
   (`INSERT … ON DUPLICATE KEY UPDATE hits = hits + 1`), so two cashiers
   confirming simultaneously collapse into one row with a correct count.

Details:

- Normalisation folds case, punctuation, quantity prefixes (`3 x `) and
  Arabic-Indic / Devanagari numerals, so `٥`, `5`, `COL 1.5!` and `col   1.5`
  share one memory.
- Learns **products, parties and expense categories**. Deliberately does *not*
  learn product aliases from expense lines, whose `product_id` is a placeholder.
- A lesson pointing at a since-deleted product is pruned on read, never handed
  back as a dangling id.
- Learning failures are caught and logged — they can never roll back a posted
  transaction.
- `GET /smart-capture/aliases` lists everything learned;
  `POST /smart-capture/aliases/forget` removes one lesson.
- The panel header shows **"N learned"**.

---

## 4. Handwriting and document accuracy

The extraction prompt gained an explicit **handwriting protocol**:

1. Establish the column layout before reading any value.
2. Read a whole column before committing to a digit — a writer's `7` is
   consistent down the page; use their other digits as a key.
3. **Arithmetic as proof-reader**: check `qty × unit_price = line_total` per row
   and re-read the least legible number until the row balances.
4. Cross-check the column sum against any written total.
5. Named confusion pairs to resolve by arithmetic: 1/7, 0/6/8, 3/8, 5/6, 2/7, 4/9,
   trailing `/-` and `=`.
6. Local numeral forms converted to Western digits.
7. Do not merge two short lines, or split one wrapped line.

The model now also returns **per-line `confidence`** and **`needs_review`**, plus a
document-level `document_confidence` — so an honest "I struggled with this line"
surfaces as an amber *"Check this reading"* badge instead of a confident wrong
number. Day-first date convention, no future dates.

`FuzzyMatchService` gained a **size/unit guard**: `Coke 1.5L` and `Coke 500ml`
share almost every letter, so pure string distance rated them near-identical —
the most expensive kind of mismatch on a POS catalogue. Disagreeing measurements
are now penalised (×0.55), with units normalised so `1.5L` and `1500ml` compare equal.
`levenshtein()`'s 255-byte limit is also guarded (it silently errors on long names).

---

## 5. UI/UX

- **Scan button** states the cost: *"Scan 3 pages — 1 AI request"*. Disabled while
  a scan is in flight or rate limited.
- **Rate-limit screen** with a live countdown, explaining that nothing was lost
  and no request was wasted — replacing a silent retry storm.
- **Learned lines** are violet-badged with the reason; learned candidates are
  starred in the product dropdown.
- **Low-legibility banner** when the document scored under 70%.
- **Per-line "Check this reading"** badge driven by the model's own honesty.
- **Meta strip** showing API requests used and the model that answered.
- **Live model discovery** in the settings drawer — "Load available models"
  queries your key and lists what it can actually use, so a newer Flash model can
  be selected without a code change and the list never goes stale.
- **Footer note**: *"Your choices here are remembered for this store."*
- **Bug fixed:** the panel's fallback URL was `/store/{slug}/smart-capture`, but
  the route group prefix is `s/{store_slug}`. The fallback 404'd in exactly the
  situation it existed for (stale Ziggy cache).

---

## 6. Tenant isolation hardening

- API keys are now read with an **explicit tenant-scoped query**, not through
  `SettingsHelper`. That helper falls back to global (`tenant_id = null`) rows,
  which would let a platform-level row masquerade as a store's own BYOK key.
- `saveSettings` no longer clears the global settings cache — only this tenant's.
- Learned aliases are tenant-filtered on every read and write, and a target id is
  verified to belong to the tenant before it is ever stored.
- Covered by tests: one store cannot read another's aliases, and cannot use
  another's key.

---

## 7. Enable it locally (BYOK)

```bash
php artisan migrate                 # creates smart_capture_aliases
php artisan ziggy:generate          # new routes (required by the build guard)
php artisan optimize:clear
npm run build                       # or: npm run dev

php artisan smartcapture:enable --list          # see your stores
php artisan smartcapture:enable "Your Test Store"
```

Then in the app: open the store → **AI Scan** → gear icon → paste your Gemini key
→ **Load available models** → **Test Connection** → **Save**.

Free key: <https://aistudio.google.com/apikey>

Useful variants:

```bash
php artisan smartcapture:enable "Your Test Store" --status
php artisan smartcapture:enable "Your Test Store" --key=AIza... --model=gemini-2.5-flash
php artisan smartcapture:enable "Your Test Store" --mode=managed --scans=500   # uses GEMINI_API_KEY from .env
```

### What to test

1. **Request budget** — scan a photo, confirm the review header reads
   **"1 API request"**. Click the scan button twice quickly: the second click does nothing.
2. **Handwriting** — photograph a handwritten bill. Check that rows where
   `qty × price` balances came out right, and that unclear rows are amber-badged.
3. **Learning** — scan a bill with local shorthand, correct one line, post it.
   Scan the same wording again: it should arrive violet-badged, pre-selected,
   at 100%, and the header count should have gone up.
4. **Rate limit** — scan rapidly on a free key until it throttles. You should get
   the countdown screen, **not** a retry storm. Check `storage/logs/laravel.log`
   for exactly one failed call.
5. **Two users** — log in as two staff in two browsers and scan simultaneously.
   One proceeds; the other gets "a scan is already running", and neither sees the
   other's data.

---

## 8. Files

**New**

- `app/Services/SmartCapture/LearningService.php`
- `app/Models/SmartCaptureAlias.php`
- `app/Exceptions/SmartCapture/AiRateLimitException.php`
- `app/Exceptions/SmartCapture/AiModelUnavailableException.php`
- `app/Console/Commands/SmartCaptureEnable.php`
- `database/migrations/2026_08_01_100000_create_smart_capture_aliases_table.php`
- `tests/Feature/Chat/SmartCaptureHardeningTest.php`

**Rewritten**

- `app/Services/SmartCapture/AiExtractionService.php`
- `app/Services/SmartCapture/FuzzyMatchService.php`
- `app/Http/Controllers/SmartCapture/SmartCaptureController.php`
- `config/smartcapture.php`

**Modified**

- `app/Services/SmartCapture/TransactionBuilderService.php` (exposes resolved lines for learning)
- `resources/js/Components/SmartCapturePanel.jsx`
- `routes/web.php` (3 new endpoints)
- `.env.example`

**Deprecated** — `app/Services/SmartCapture/GeminiExtractionService.php` (unreferenced, safe to delete)

---

## 9. v2.1 — AI Scan can no longer create anything you cannot undo

### The problem

`confirm` posted immediately. `buildSale()` called `SaleService::post()` directly:
FIFO stock deducted, journals fired, `status = posted`. `SaleObserver` then aborts
with **HTTP 403** on any change to a financial column — the only correction is a
Return / Credit Note. So one misread digit on a handwritten bill became a
permanently locked financial document, in one click.

There is **no draft state for a `Sale`**. It is posted or it does not exist.

| AI Scan created | State | Fixable afterwards? |
|---|---|---|
| Sale | posted, stock out, journals | **No** — 403 lock, credit note only |
| Return / Purchase Return | posted, journals | **No** |
| Expense | posted, journals | **No** |
| Purchase | posted, stock in at scanned cost | Editable, but rewrites stock + ledger |
| Sales Order, Purchase Order, Proposal, Recurring | draft / pending | **Yes** |

### The rule now

Driven by `config('smartcapture.document_policy')`, so it is auditable and
adjustable per deployment rather than buried in code.

- **A locking document is never written from a scan.** Pressing the button opens
  a dialog naming the consequence, with two ways forward:
  - **Continue** — go to the normal creation screen (`Sales/CreateInvoice`,
    `Purchases/Create`, `Returns/Create`) with every line, the party, the date and
    the reference already filled in. Nothing is saved until the user presses Save
    there.
  - **Make a Pre-Sale / Purchase Order instead** — creates the editable draft,
    which already has a one-click Convert.
- **Expense and Purchase Return** have neither a draft form nor a creation
  screen, so they may still post — but only with an explicit checkbox
  acknowledging that the entry is permanent.
- **Editable documents** (proposal, sales order, purchase order, recurring
  invoice) are created directly, with no extra friction.
- Setting a document's `handoff_route` to `null` restores direct posting behind
  the acknowledgement, which is how the accounting tests still exercise the
  builders.

**Hand-off mechanics.** `PrefillService` stores the reviewed payload server-side
and puts only a random key in the URL. It is tenant **and** user scoped,
single-use (a refresh cannot duplicate an entry) and expires after 30 minutes.
Learning is recorded at hand-off time, since the user has already made every
product and party decision and `confirm` will not run again.

### Party is asked before scanning, not after

A party selector now sits on the capture screen. It is optional, but when set it
is passed to the model as context, which stops it inventing a party from a
letterhead, and it pre-fills the review screen. If the scan turns out to be the
other side of the ledger — a customer was chosen but it is a supplier bill — the
review screen says so instead of quietly using it.

The document-type dropdown is now grouped into **"Editable afterwards — safest"**
and **"Final — cannot be edited once posted"**, so the choice is informed.

### Silent party fallbacks removed

Eight places resolved a missing party as *"whichever one is first in the table"*:

```php
$customerId = $customer?->id ?? Party::where('type','customer')->value('id');
```

That booked money against someone who never traded with the store — on a document
that then could not be edited. The previous changelog claimed this was fixed, but
only `resolveParty` had been done; `buildSale`, `buildPurchase`, `buildReturn`,
`buildProposal`, `buildPreInvoice`, `buildRecurringInvoice` and
`buildPurchaseReturn` all still had it. All now fail loudly and ask.

`resolveParty` also never checked the party **type**, so a customer id passed on a
purchase was accepted and booked as a supplier. It now refuses with a message
naming both sides.

### New products and cost changes are surfaced

- Products created by a scan are tagged `products.created_via = 'ai_scan'` (new
  column) and **listed back to the user** on the success screen with a note that a
  misread name creates a near-duplicate that splits reporting.
- On the purchase screen, any line whose scanned cost differs from the catalogue
  cost is called out by name — *"Basmati Rice 5kg: 1,500 → 1,650"* — with an
  explanation that saving sets the FIFO layer used for COGS. A misread cost
  otherwise distorts margin silently for months.

### Known limitation

Products confirmed as new are created at hand-off time, so abandoning the
creation screen leaves them in the catalogue. They are tagged `ai_scan` and
therefore easy to find and merge, but they are not auto-removed.

### New tests

`tests/Feature/Chat/SmartCaptureSafetyTest.php` — 13 tests asserting that a scan
cannot post a sale or purchase, that the ledger is untouched after a hand-off,
that a prefill is single-use and not readable by another user, that a customer
cannot be booked as a supplier, and that no document is ever booked against a
guessed party.

Existing tests were updated: they encoded the old behaviour, and now use either
`mode: 'handoff'` or an explicit `acknowledge_locked` with the hand-off route
nulled.

---

## 10. Rollback

`git revert` the commit, then:

```bash
php artisan migrate:rollback --step=1   # drops smart_capture_aliases
php artisan optimize:clear && php artisan ziggy:generate && npm run build
```

No other data migrations to undo. `tenants.ai_*` columns are unchanged.
