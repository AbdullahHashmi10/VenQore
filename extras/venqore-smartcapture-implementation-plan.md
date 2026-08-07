# VenQore SmartCapture — Implementation Plan
### AI-Powered Invoice Snap & Voice Memo Input Layer

> **Core Principle:** SmartCapture is not a standalone module — it is an upgrade to the existing Search Bar already present in the VenQore Overview dashboard header. The `⌘ / Ctrl F` search trigger becomes the unified entry point for both classic text search and AI-powered multi-modal capture.

---

## 1. What We Are Building

A multi-modal AI input layer that plugs into VenQore's existing top search bar. Users can:

- **📸 Snap** a supplier invoice photo or PDF
- **🎙️ Record** a voice memo describing a transaction
- **📋 Paste** copied text from WhatsApp/email

Gemini Flash extracts structured line items. Laravel fuzzy-matches them against the live store product catalog. The user confirms. A real VenQore transaction fires through the existing double-entry engine.

---

## 2. UI Entry Point — The Existing Search Bar

Looking at the current Overview dashboard, the search bar at the top center already reads **"Search anything…"** with the `⌘ / Ctrl F` shortcut. **This is the only UI element that needs to change** to introduce SmartCapture.

### Current State
```
[ Q  Search anything...          ⌘ / Ctrl F ]
```

### Updated State (two icon buttons appended inside the search bar)
```
[ Q  Search anything...    📷  🎙️   ⌘ / Ctrl F ]
```

- **📷 Camera icon** → opens the Invoice Snap tab of the SmartCapture modal
- **🎙️ Mic icon** → opens the Voice Memo tab of the SmartCapture modal
- **Typing text** → works exactly as before (no regression)
- **`⌘ / Ctrl F`** → opens search as before, with a new SmartCapture option visible at the bottom of the dropdown

No new nav items. No new pages. No new routes. The existing `GlobalSearch` React component is extended, not replaced.

---

## 3. Architecture Overview

```
User (image / audio blob)
        │
        ▼
[React SmartCapture Modal]
  — attaches to existing GlobalSearch component
  — no new Inertia pages or routes needed
        │
        ▼
POST /s/{store_slug}/smart-capture/extract
        │
        ▼
[SmartCaptureController.php]
  — forwards image or audio to Gemini Flash API
  — receives raw JSON extraction (names, qty, prices, intent, party)
        │
        ▼
[FuzzyMatchService.php]
  — runs MySQL FULLTEXT + Levenshtein against store's products table
  — returns top 3 candidates per line item + confidence scores
        │
        ▼
[IntentResolverService.php]
  — maps extracted keywords to VenQore action type
  — returns: purchase | sale | expense | return | transfer
        │
        ▼
Response → React confirmation UI
        │
        ▼  (user confirms)
POST /s/{store_slug}/smart-capture/confirm
        │
        ▼
[TransactionBuilderService.php]
  — calls existing VenQore controller methods
  — createPurchase() / createSale() / createExpense() / createReturn()
  — double-entry journal fires as normal
```

**Key design decision:** Gemini never sees the product database. It only extracts raw text. The DB matching stays internal. This keeps Gemini API calls small, cheap, and fast (~500–800 input tokens per invoice image).

---

## 4. Gemini Integration

### Model
Use `gemini-2.0-flash` — fastest, cheapest, sufficient for extraction tasks. Do not use Pro for this.

### Image Prompt (Invoice Snap)
```
You are a data extraction engine for a retail POS system.
Analyse this invoice image and return ONLY valid JSON. No explanation. No markdown fences.

Return this exact structure:
{
  "action": "purchase" | "sale" | "expense" | "return",
  "party": "supplier or customer name, or null",
  "items": [
    { "name": "product name as written", "qty": number, "unit_price": number or null }
  ]
}

If a field is not visible, return null for that field. Never invent data.
```

### Audio Prompt (Voice Memo)
```
You are a data extraction engine for a retail POS system.
Listen to this audio and return ONLY valid JSON. No explanation. No markdown fences.

Return this exact structure:
{
  "action": "purchase" | "sale" | "expense" | "return",
  "party": "supplier or customer name, or null",
  "items": [
    { "name": "product name as spoken", "qty": number, "unit_price": number or null }
  ]
}

If a field is unclear, return null. Never guess quantities.
```

### API Call (Laravel Service)
```php
// app/Services/SmartCapture/GeminiExtractionService.php

public function extractFromImage(string $base64Image, string $mimeType): array
{
    $response = Http::withHeaders(['Content-Type' => 'application/json'])
        ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$this->apiKey}", [
            'contents' => [[
                'parts' => [
                    ['inline_data' => ['mime_type' => $mimeType, 'data' => $base64Image]],
                    ['text' => $this->imagePrompt()]
                ]
            ]],
            'generationConfig' => ['temperature' => 0, 'maxOutputTokens' => 1024]
        ]);

    return json_decode($response->json('candidates.0.content.parts.0.text'), true);
}

public function extractFromAudio(string $base64Audio, string $mimeType): array
{
    $response = Http::withHeaders(['Content-Type' => 'application/json'])
        ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$this->apiKey}", [
            'contents' => [[
                'parts' => [
                    ['inline_data' => ['mime_type' => $mimeType, 'data' => $base64Audio]],
                    ['text' => $this->audioPrompt()]
                ]
            ]],
            'generationConfig' => ['temperature' => 0, 'maxOutputTokens' => 512]
        ]);

    return json_decode($response->json('candidates.0.content.parts.0.text'), true);
}
```

---

## 5. Intent Detection — Keyword Mapping

`IntentResolverService.php` reads the extracted `action` field from Gemini and maps it to the correct VenQore workflow:

| Gemini Returns | VenQore Action | Auto-Selected Module |
|---|---|---|
| `purchase` | Purchase Order | `PurchaseController@store` |
| `sale` | Sales Invoice | `SaleController@store` |
| `expense` | Expense Entry | `ExpenseController@store` |
| `return` | Return Voucher | `ReturnController@store` |

Voice keyword hints baked into the audio prompt help Gemini choose correctly:
- "received from", "bought", "purchased" → `purchase`
- "sold to", "customer wants", "checkout" → `sale`
- "paid for", "electricity", "rent", "fee" → `expense`
- "returned", "came back", "defective" → `return`

---

## 6. Fuzzy Matching — Product Resolution

`FuzzyMatchService.php` takes each extracted item name and queries the store's product catalog:

```php
// Step 1: MySQL FULLTEXT search
$candidates = DB::select("
    SELECT id, name, sku, sale_price,
           MATCH(name, sku) AGAINST(? IN BOOLEAN MODE) as score
    FROM products
    WHERE store_id = ? AND deleted_at IS NULL
    ORDER BY score DESC
    LIMIT 5
", [$itemName, $storeId]);

// Step 2: Levenshtein re-ranking on top 5 results
$ranked = collect($candidates)->sortBy(fn($p) =>
    levenshtein(strtolower($itemName), strtolower($p->name))
)->take(3)->values();

// Step 3: Confidence scoring
$topMatch = $ranked->first();
$distance = levenshtein(strtolower($itemName), strtolower($topMatch->name));
$maxLen   = max(strlen($itemName), strlen($topMatch->name));
$confidence = round((1 - $distance / $maxLen) * 100);
```

### Confidence Tiers

| Confidence | UI State | Required Action |
|---|---|---|
| ≥ 90% | Green — auto-matched | None. Ready to confirm. |
| 60–89% | Amber — review needed | User taps to confirm the suggested match |
| < 60% | Red — manual pick | Top 3 candidates shown; user selects one |
| No match | Red — not found | "Quick create" inline modal (uses existing Feature #29) |

---

## 7. Backend File Structure

```
app/
└── Http/
    └── Controllers/
        └── SmartCapture/
            └── SmartCaptureController.php    # Routes image/audio, returns matched items
app/
└── Services/
    └── SmartCapture/
        ├── GeminiExtractionService.php       # Gemini API calls (image + audio)
        ├── FuzzyMatchService.php             # MySQL FULLTEXT + Levenshtein scoring
        ├── IntentResolverService.php         # Maps action type to VenQore module
        └── TransactionBuilderService.php     # Delegates to existing transaction controllers
```

### Routes (add to existing store-scoped route group)
```php
// routes/web.php — inside the /s/{store_slug}/ group

Route::prefix('smart-capture')->middleware(['auth', 'store.context'])->group(function () {
    Route::post('/extract', [SmartCaptureController::class, 'extract']);
    Route::post('/confirm', [SmartCaptureController::class, 'confirm']);
});
```

No new middleware needed — piggybacks on existing `store.context` middleware that VenQore already uses for tenant isolation.

---

## 8. Frontend — Extending GlobalSearch

The existing `GlobalSearch` React component (triggered by `⌘ / Ctrl F`) is extended with a `SmartCapture` panel. No new pages or Inertia routes.

### Component Structure
```
GlobalSearch.jsx  (existing)
└── SmartCapturePanel.jsx  (new — conditionally rendered inside GlobalSearch)
    ├── InvoiceSnapTab.jsx     # File upload + drag/drop
    ├── VoiceMemoTab.jsx       # MediaRecorder API + timer
    ├── ProcessingState.jsx    # Loading spinner while Gemini responds
    ├── ConfirmationList.jsx   # Line items with confidence badges
    │   ├── MatchedItem.jsx    # Green — auto-confirmed
    │   ├── ReviewItem.jsx     # Amber — tap to confirm
    │   └── AmbiguousItem.jsx  # Red — candidate picker
    └── SuccessState.jsx       # Transaction created confirmation
```

### Voice Recording (browser-native, no library needed)
```javascript
// VoiceMemoTab.jsx

const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    const chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        // Convert to base64 and POST to /smart-capture/extract
        const reader = new FileReader();
        reader.onloadend = () => sendToBackend(reader.result.split(',')[1], 'audio/webm');
        reader.readAsDataURL(blob);
    };

    recorder.start();
    setRecorderRef(recorder);
    setRecording(true);
};

const stopRecording = () => {
    recorderRef.stop();
    setRecording(false);
};
```

---

## 9. Implementation Phases

### Phase 1 — Backend Core (2–3 days)
- [ ] Create `GeminiExtractionService` with image and audio methods
- [ ] Create `FuzzyMatchService` with FULLTEXT + Levenshtein scoring
- [ ] Create `IntentResolverService` with keyword-to-action mapping
- [ ] Create `SmartCaptureController` with `extract` and `confirm` endpoints
- [ ] Create `TransactionBuilderService` delegating to existing controllers
- [ ] Add routes to existing store-scoped route group
- [ ] Store Gemini API key in `.env` as `GEMINI_API_KEY`

### Phase 2 — Frontend Panel (2 days)
- [ ] Extend `GlobalSearch.jsx` with SmartCapture trigger icons (camera + mic)
- [ ] Build `SmartCapturePanel.jsx` with tab switcher
- [ ] Build `InvoiceSnapTab.jsx` with file upload and drag/drop
- [ ] Build `VoiceMemoTab.jsx` with `MediaRecorder` and timer display
- [ ] Build `ConfirmationList.jsx` with three confidence tier components
- [ ] Build `SuccessState.jsx` with transaction ID and "New capture" link
- [ ] Wire all tabs to backend via `axios` POST calls

### Phase 3 — Polish & Edge Cases (1 day)
- [ ] Handle Gemini API timeout (30s limit) with user-facing error state
- [ ] Handle malformed JSON from Gemini (retry once, then surface raw text)
- [ ] Handle zero-match products with inline quick-create modal (Feature #29)
- [ ] Add file size validation (max 10MB for images, max 25MB for audio)
- [ ] Add accepted file type validation (jpg, png, pdf, webm, mp4, m4a)
- [ ] Test with AMD Outlets real invoices

### Phase 4 — Multi-Tenant Hardening (0.5 day)
- [ ] Confirm `store_id` is always injected from `store.context` middleware — never from request body
- [ ] Rate-limit `/smart-capture/extract` to 20 requests/minute per store (use existing Redis limiter)
- [ ] Log each SmartCapture call to `security_activity_log` (uses existing Feature #20)

---

## 10. Environment & Config

```env
# .env additions
GEMINI_API_KEY=your_key_here
SMART_CAPTURE_MAX_IMAGE_MB=10
SMART_CAPTURE_MAX_AUDIO_MB=25
SMART_CAPTURE_RATE_LIMIT=20          # requests per minute per store
SMART_CAPTURE_CONFIDENCE_HIGH=90     # auto-match threshold
SMART_CAPTURE_CONFIDENCE_LOW=60      # manual-pick threshold
```

```php
// config/smartcapture.php
return [
    'gemini_key'       => env('GEMINI_API_KEY'),
    'model'            => 'gemini-2.0-flash',
    'max_image_mb'     => env('SMART_CAPTURE_MAX_IMAGE_MB', 10),
    'max_audio_mb'     => env('SMART_CAPTURE_MAX_AUDIO_MB', 25),
    'rate_limit'       => env('SMART_CAPTURE_RATE_LIMIT', 20),
    'confidence_high'  => env('SMART_CAPTURE_CONFIDENCE_HIGH', 90),
    'confidence_low'   => env('SMART_CAPTURE_CONFIDENCE_LOW', 60),
];
```

---

## 11. What Does NOT Change

| VenQore System | Status |
|---|---|
| Double-entry journal engine | Unchanged — SmartCapture calls existing transaction methods |
| Store tenant isolation | Unchanged — same `store.context` middleware |
| Role/permission system | Unchanged — `confirm` endpoint checks existing permissions |
| Existing search text functionality | Unchanged — no regression |
| All 39+ reports | Unchanged — SmartCapture-created transactions appear in reports automatically |
| Existing POS checkout flow | Unchanged — SmartCapture is an alternative input, not a replacement |

---

## 12. Why This Is a VenQore Differentiator

Most POS platforms have no AI. The ones that do use it for chatbots. VenQore uses it to eliminate the single most painful part of running a store: manual data entry from paper invoices and verbal instructions.

A shopkeeper receiving a supplier bill can snap it and have a purchase order with ledger entries ready in under 10 seconds. A cashier at a food stall can speak "30 Coke, 20 Pepsi, sold to walk-in" and have a sales invoice drafted before the customer reaches for their wallet.

Because every SmartCapture transaction flows through the existing double-entry engine, there is zero compromise on VenQore's core promise of **absolute financial truth**.

---

*VenQore SmartCapture Implementation Plan — Internal Engineering Document*
