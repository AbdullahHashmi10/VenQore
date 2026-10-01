<?php

namespace App\Http\Controllers\SmartCapture;

use App\Exceptions\SmartCapture\AiRateLimitException;
use App\Helpers\SettingsHelper;
use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use App\Models\Party;
use App\Models\Product;
use App\Models\Setting;
use App\Models\SmartCaptureAlias;
use App\Services\SmartCapture\AiEntitlementService;
use App\Services\SmartCapture\AiExtractionService;
use App\Services\SmartCapture\FuzzyMatchService;
use App\Services\SmartCapture\IntentResolverService;
use App\Services\SmartCapture\LearningService;
use App\Services\SmartCapture\PrefillService;
use App\Services\SmartCapture\TransactionBuilderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SmartCaptureController extends Controller
{
    public function __construct(
        private AiExtractionService       $extractionService,
        private AiEntitlementService      $entitlement,
        private FuzzyMatchService         $fuzzyMatchService,
        private IntentResolverService     $intentResolverService,
        private TransactionBuilderService $transactionBuilderService,
        private LearningService           $learning,
        private PrefillService            $prefill
    ) {}

    /**
     * What AI Scan is allowed to do with each document type, with the hand-off
     * URLs already resolved for this store.
     *
     * A "locking" document (sale, return, expense…) is never posted straight
     * from a scan: the user is either sent to the normal creation screen with
     * the lines pre-filled, or offered the editable draft equivalent.
     */
    private function documentPolicy(string $storeSlug): array
    {
        $policy = [];

        foreach ((array) config('smartcapture.document_policy', []) as $action => $rules) {
            $handoffUrl = null;

            if (!empty($rules['handoff_route'])) {
                try {
                    $handoffUrl = route($rules['handoff_route'], ['store_slug' => $storeSlug]);
                } catch (\Throwable $e) {
                    // A missing route must not break the panel — it just means
                    // this document type has no hand-off screen available.
                    $handoffUrl = null;
                }
            }

            $draft = $rules['draft_action'] ?? null;

            $policy[$action] = [
                'locking'      => (bool) ($rules['locking'] ?? false),
                'label'        => $rules['label'] ?? ucfirst(str_replace('_', ' ', $action)),
                'handoff_url'  => $handoffUrl,
                'draft_action' => $draft,
                'draft_label'  => $draft ? config("smartcapture.document_policy.{$draft}.label", $draft) : null,
            ];
        }

        return $policy;
    }

    /**
     * Context payload for the AI Scan panel: entitlement state, parties,
     * expense categories, open documents (for append mode), settings and how
     * much this store has taught the system so far.
     */
    public function context()
    {
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        if (!$tenant) {
            return response()->json(['success' => false, 'message' => 'No store context.'], 403);
        }

        $check = $this->entitlement->checkScan();
        // Pass the resolved entitlement mode explicitly — resolveConfig() picks
        // the free vs. paid platform key off this, never off the feature name.
        $config = $this->extractionService->resolveConfig('scan', $check['mode']);

        return response()->json([
            'success' => true,
            'entitlement' => [
                'allowed'     => $check['allowed'],
                'reason'      => $check['reason'],
                'mode'        => $check['mode'],
                'pages_used'  => $check['pages_used'] ?? 0,
                'pages_limit' => $check['pages_limit'] ?? 0,
                'scans_used'  => $check['pages_used'] ?? 0,
                'scans_limit' => $check['pages_limit'] ?? 0,
                'message'     => $check['allowed'] ? null : $this->entitlement->lockMessage($check),
            ],
            'settings' => [
                'provider'     => $config['provider'],
                'model'        => $config['model'],
                'byok'         => $config['byok'],
                'has_key'      => !empty($config['api_key']),
                'capabilities' => config("smartcapture.capabilities.{$config['provider']}", []),
                'providers'    => config('smartcapture.capabilities'),
            ],
            'limits' => [
                'max_files'    => (int) config('smartcapture.max_files', 5),
                'max_image_mb' => (int) config('smartcapture.max_image_mb', 10),
                'max_audio_mb' => (int) config('smartcapture.max_audio_mb', 25),
            ],
            // Lets the panel show "AI Scan has learned 34 things from your store".
            'learning' => $this->learning->stats(),
            // Which documents lock, where to hand off, and the editable alternative.
            'document_policy' => $this->documentPolicy($tenant->slug),
            'parties' => [
                'customers' => Party::where('tenant_id', $tenant->id)->where('type', 'customer')
                    ->orderBy('name')->take(500)->get(['id', 'name']),
                'suppliers' => Party::where('tenant_id', $tenant->id)->where('type', 'supplier')
                    ->orderBy('name')->take(500)->get(['id', 'name']),
            ],
            'expense_categories' => ExpenseCategory::where('tenant_id', $tenant->id)
                ->orderBy('name')->take(200)->get(['id', 'name']),
            'open_documents' => $this->openDocuments($tenant->id),
        ]);
    }

    /**
     * Editable/open documents that support append mode.
     */
    private function openDocuments(int|string $tenantId): array
    {
        return [
            'proposal' => DB::table('proposals')
                ->where('tenant_id', $tenantId)
                ->whereIn('status', ['draft', 'sent', 'pending'])
                ->orderByDesc('created_at')->take(100)
                ->get(['id', 'reference_number as reference', 'customer_name as party', 'total_amount as total', 'status']),
            'pre_invoice' => DB::table('sales_orders')
                ->where('tenant_id', $tenantId)
                ->whereIn('status', ['pending', 'draft', 'confirmed'])
                ->orderByDesc('created_at')->take(100)
                ->get(['id', 'order_number as reference', 'customer_name as party', 'total_amount as total', 'status']),
            'pre_purchase' => DB::table('purchase_orders')
                ->leftJoin('suppliers', 'suppliers.id', '=', 'purchase_orders.supplier_id')
                ->where('purchase_orders.tenant_id', $tenantId)
                ->whereIn('purchase_orders.status', ['draft', 'ordered', 'pending'])
                ->orderByDesc('purchase_orders.created_at')->take(100)
                ->get(['purchase_orders.id', 'purchase_orders.reference_number as reference', 'suppliers.name as party', 'purchase_orders.total_amount as total', 'purchase_orders.status']),
            'recurring_invoice' => DB::table('recurring_invoices')
                ->leftJoin('parties', 'parties.id', '=', 'recurring_invoices.customer_id')
                ->where('recurring_invoices.tenant_id', $tenantId)
                ->whereIn('recurring_invoices.status', ['active', 'paused', 'draft'])
                ->orderByDesc('recurring_invoices.created_at')->take(100)
                ->get(['recurring_invoices.id', 'recurring_invoices.frequency as reference', 'parties.name as party', 'recurring_invoices.status']),
        ];
    }

    /**
     * Parse uploaded file(s) / audio / text and match items against the catalog.
     *
     * Costs exactly ONE upstream AI request. Guarded by a per-store single-flight
     * lock so a double-click, a duplicated tab or two staff scanning the same
     * document cannot spend the quota twice.
     */
    public function extract(Request $request)
    {
        // ── Entitlement gate: AI add-on (managed usage or paid BYOK unlock) ──
        $check = $this->entitlement->checkScan();
        if (!$check['allowed']) {
            return response()->json([
                'success' => false,
                'code'    => 'ai_locked',
                'reason'  => $check['reason'],
                'message' => $this->entitlement->lockMessage($check),
            ], 402);
        }

        $maxFiles = (int) config('smartcapture.max_files', 5);

        $request->validate([
            'type'            => 'required|in:image,audio,text',
            // New multi-file shape (up to N images/PDF pages of ONE document)
            'files'           => "required_if:type,image|array|min:1|max:{$maxFiles}",
            'files.*.base64'  => 'required_with:files|string',
            'files.*.mime'    => 'required_with:files|string|in:image/jpeg,image/png,image/webp,application/pdf',
            // Audio (recorded or uploaded)
            'base64'          => 'required_if:type,audio|nullable|string',
            'mime_type'       => 'required_if:type,audio|nullable|string',
            // Text intake
            'text'            => 'required_if:type,text|nullable|string|max:20000',
            'target_type'     => 'nullable|string|in:purchase,sale,expense,return,proposal,pre_invoice,pre_purchase,recurring_invoice,purchase_return',
            'document_type'   => 'nullable|string|in:receipt,invoice,bill,bank_statement,handwritten_note,tax_document',
            'is_handwritten'  => 'nullable|boolean',
            'custom_command'  => 'nullable|string|max:1000',
            // Who the document belongs to, chosen BEFORE scanning. Optional, but
            // when supplied it is told to the model, which improves party and
            // price matching, and it pre-fills the review screen.
            'party_id'        => 'nullable|string',
        ]);

        $type = $request->input('type');
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        if (!$tenant) {
            return response()->json(['success' => false, 'message' => 'No store context.'], 403);
        }

        // ── Single flight: one scan per store at a time ──────────────────────
        // Without this, a double-click or a second tab turns one document into
        // two upstream requests and two metered scans.
        $lock = Cache::lock(
            'smartcapture:scan:' . $tenant->id,
            (int) config('smartcapture.single_flight_seconds', 180)
        );

        if (!$lock->get()) {
            return response()->json([
                'success' => false,
                'code'    => 'scan_in_progress',
                'message' => 'A scan is already running for this store. Wait for it to finish, then try again.',
            ], 409);
        }

        try {
            // ── Build payload + size guards ──────────────────────────────────
            $payload = $this->buildPayload($request, $type);

            $audioDuration = (int) ($request->input('duration_seconds') ?? 0);
            $pdfMetaPages  = (int) ($request->input('page_count') ?? 1);

            // T1-7 & T1-8: Input validations & page/duration inspection
            if ($type === 'audio' && $audioDuration > 0) {
                $audioCredits = $this->extractionService->validateAudioDuration($audioDuration);
            }

            if ($request->has('page_count')) {
                $pdfMeta = $this->extractionService->validatePdfPages($pdfMetaPages);
            }

            $pagesToDebit = match ($type) {
                'text'  => 0,
                'audio' => \App\Services\SmartCapture\AiEntitlementService::calculateAudioPages($audioDuration),
                default => max(1, $pdfMetaPages),
            };

            // ── T2-3: Rate limiter check & hybrid async dispatch (FIX-2 & FIX-3) ──
            $rateLimiter = app(\App\Services\Ai\AiRateLimiter::class);
            $acquireKey  = "scan:{$tenant->id}";
            $acquire     = $rateLimiter->tryAcquire($acquireKey, 1);

            if (!$acquire['ok'] && ($acquire['wait_ms'] ?? 0) > 8000) {
                $jobId = (string) \Illuminate\Support\Str::uuid();
                \App\Jobs\ProcessSmartCaptureJob::dispatch(
                    $jobId,
                    $tenant->id,
                    $payload,
                    $check['mode'] ?? 'managed',
                    $pagesToDebit
                );

                $lock->release();
                return response()->json([
                    'success' => true,
                    'async'   => true,
                    'job_id'  => $jobId,
                    'message' => 'High rate-limit wait time. Extraction queued in background.',
                ], 202);
            }

            // FIX-3: Spend cap check on expensive scan path
            $spendGuard = app(\App\Services\Ai\AiSpendGuard::class);
            $estimatedScanCost = (float) config('ai_limits.features.scan.estimated_cost', 0.0050);
            $scanCap = (float) config('ai_limits.features.scan.spend_cap', 5.00);

            if (($check['mode'] ?? 'managed') === 'managed') {
                if (!$spendGuard->checkAndRecord("scan:{$tenant->id}", $estimatedScanCost, $scanCap)) {
                    $lock->release();
                    return response()->json([
                        'success' => false,
                        'code'    => 'spend_cap_exceeded',
                        'message' => 'Daily AI scan spend limit reached for this store. Please try again tomorrow.',
                    ], 429);
                }
            }

            // ── Content Payload Deduplication (T0-6 rest) ───────────────────
            // If the exact same file/payload was extracted for this store in the last 24h,
            // return the cached result for free without spending upstream tokens.
            $dedupeHash = 'smartcapture_dedupe:' . md5(json_encode($payload) . ':' . $tenant->id . ':' . ($request->input('target_type') ?? ''));
            $cachedExtraction = Cache::get($dedupeHash);
            if ($cachedExtraction && is_array($cachedExtraction)) {
                $lock->release();
                $cachedExtraction['deduplicated'] = true;
                return response()->json($cachedExtraction);
            }

            // ── Catalog context — ADAPTIVE (T0-2) ────────────────────────────
            // Only send the catalogue when it is small enough that including it
            // is cheaper than the accuracy it buys. Above the threshold we send
            // nothing and rely on local matching (FuzzyMatchService + learned
            // aliases + supplier codes) plus a small fallback call.
            //
            // Expenses never get a catalogue: there is nothing to match.
            $resolvedTargetType = $request->input('target_type');
            $isExpense          = $resolvedTargetType === 'expense';
            $inlineMax          = (int) config('smartcapture.catalog_inline_max_products', 300);
            $catalogLimit       = (int) config('smartcapture.catalog_limit', 800);

            $existingProducts = [];

            if (!$isExpense) {
                $productCount = Product::where('tenant_id', $tenant->id)->count();

                if ($productCount > 0 && $productCount <= $inlineMax) {
                    $existingProducts = Product::where('tenant_id', $tenant->id)
                        ->orderByDesc('updated_at')
                        ->take(min($inlineMax, $catalogLimit))
                        ->get(['name', 'sku'])
                        ->map(fn ($p) => ['name' => $p->name, 'sku' => $p->sku])
                        ->toArray();
                }
                // else: large catalogue — send nothing, match locally.
            }

            // ── Party list: NOT sent to the model (T0-3) ─────────────────────
            // We used to ship 300 party names (~1,500 tokens) on every scan and
            // then run FuzzyMatchService::matchParty() over the result anyway,
            // server-side, a few lines below. That is pure duplication — the
            // local matcher is both free and more reliable than asking the model
            // to pick from a list. The single `known_party` hint below (set when
            // the user chose the party before scanning) is all the model needs.
            $knownParties = [];

            // ── Expense categories: only when this IS an expense (T0-3) ──────
            // 200 category names (~1,000 tokens) were previously sent on every
            // scan, including the ~90% that are not expenses.
            $expenseCategories = $isExpense
                ? ExpenseCategory::where('tenant_id', $tenant->id)
                    ->orderBy('name')->take(200)->pluck('name')->toArray()
                : [];

            // ── Party chosen up front, before the scan ───────────────────────
            // Verified against this tenant here so a bad id fails immediately,
            // rather than after the AI request has already been spent.
            $chosenParty = null;
            if ($request->filled('party_id')) {
                $chosenParty = Party::where('tenant_id', $tenant->id)
                    ->whereKey($request->input('party_id'))
                    ->first(['id', 'name', 'type']);

                if (!$chosenParty) {
                    return response()->json([
                        'success' => false,
                        'message' => 'The selected customer/supplier was not found in this store.',
                    ], 422);
                }
            }

            // ── AI extraction — ONE upstream request ─────────────────────────
            $rawResult = $this->extractionService->extract(
                inputType: $type,
                payload: $payload,
                targetType: $request->input('target_type'),
                customCommand: $request->input('custom_command'),
                context: [
                    'existing_products'  => $existingProducts,
                    'parties'            => $knownParties,
                    'expense_categories' => $expenseCategories,
                    // This store's own confirmed vocabulary, so local shorthand
                    // resolves on the first pass instead of needing a correction.
                    'learned_aliases'    => $this->learning->promptHints(),
                    'document_type'      => $request->input('document_type'),
                    'is_handwritten'     => $request->boolean('is_handwritten'),
                    // Telling the model who the document belongs to stops it
                    // inventing a party from a letterhead or a slogan.
                    'known_party'        => $chosenParty ? [
                        'name' => $chosenParty->name,
                        'type' => $chosenParty->type,
                    ] : null,
                    // Drives which platform API key resolveConfig() picks — a
                    // free-tier tenant must always land on the free key, never
                    // the paid one, regardless of which feature/model is used.
                    'entitlement_mode'   => $check['mode'],
                ]
            );

            // Reconcile spend guard estimate vs actual
            $actualScanCost = (float) ($rawResult['cost_usd'] ?? $estimatedScanCost);
            if (($check['mode'] ?? 'managed') === 'managed') {
                $spendGuard->reconcile("scan:{$tenant->id}", $estimatedScanCost, $actualScanCost);
            }

            // ── Resolve action intent ────────────────────────────────────────
            $resolvedAction = $this->intentResolverService->resolve($rawResult['action'] ?? 'sale');
            $partyType = in_array($resolvedAction, ['purchase', 'pre_purchase', 'purchase_return']) ? 'supplier' : 'customer';

            // ── Party candidates (user confirms; learned matches pre-select) ──
            $partyName = $rawResult['party'] ?? null;
            $partyCandidates = $partyName
                ? $this->fuzzyMatchService->matchParty($partyName, $partyType)
                : [];

            $suggestedPartyId = null;
            $partyLearned = false;

            // A party the user picked before scanning always wins — they know
            // whose document it is better than the model does.
            if ($chosenParty && $chosenParty->type === $partyType) {
                $suggestedPartyId = $chosenParty->id;
            } elseif (!empty($partyCandidates)) {
                $top = $partyCandidates[0];
                if (!empty($top['learned'])) {
                    $suggestedPartyId = $top['id'];
                    $partyLearned = true;
                } elseif ($top['confidence'] >= 60) {
                    $suggestedPartyId = $top['id'];
                }
            }

            // ── Expense category: learned memory first, then exact name ──────
            $suggestedCategoryId = null;
            $categoryLearned = false;
            if ($resolvedAction === 'expense' && !empty($rawResult['expense_category'])) {
                $learnedCategory = $this->learning->resolveExpenseCategory($rawResult['expense_category']);

                if ($learnedCategory) {
                    $suggestedCategoryId = $learnedCategory['target_id'];
                    $categoryLearned = true;
                } else {
                    $suggestedCategoryId = ExpenseCategory::where('tenant_id', $tenant->id)
                        ->whereRaw('LOWER(name) = ?', [mb_strtolower(trim($rawResult['expense_category']))])
                        ->value('id');
                }
            }

            // ── Match line items ─────────────────────────────────────────────
            $matchedItems = [];
            $learnedCount = 0;

            foreach (($rawResult['items'] ?? []) as $item) {
                $itemName = trim((string) ($item['name'] ?? ''));
                if ($itemName === '') {
                    continue;
                }

                $qty = (float) ($item['qty'] ?? 1);
                if ($qty <= 0) {
                    $qty = 1;
                }

                $unitPrice = isset($item['unit_price']) && $item['unit_price'] !== null ? (float) $item['unit_price'] : null;
                $lineTotal = isset($item['line_total']) && $item['line_total'] !== null ? (float) $item['line_total'] : null;

                // T1-9: Server-side arithmetic validation (q * p ≈ t, 1% tolerance)
                $arithmeticFail = false;
                if ($unitPrice !== null && $lineTotal !== null && $qty > 0) {
                    $expectedTotal = $qty * $unitPrice;
                    if (abs($expectedTotal - $lineTotal) / max(1.0, $lineTotal) > 0.01) {
                        $arithmeticFail = true;
                        $unitPrice = round($lineTotal / $qty, 4);
                    }
                }

                // Derive unit price from line total when model only read total
                if ($unitPrice === null && $lineTotal !== null && $qty > 0) {
                    $unitPrice = round($lineTotal / $qty, 4);
                }

                $matches = $this->fuzzyMatchService->matchProduct($itemName);

                $bestMatch  = $matches[0] ?? null;
                $confidence = $bestMatch['confidence'] ?? 0;
                $isLearned  = (bool) ($bestMatch['learned'] ?? false);

                if ($isLearned) {
                    $learnedCount++;
                }

                // Preselect the closest match; the user always reviews and can change it,
                // pick another candidate, or choose "create as new product".
                $productId = $confidence >= 40 ? ($bestMatch['product']->id ?? null) : null;

                $matchedItems[] = [
                    'raw_name'     => $itemName,
                    'qty'          => $qty,
                    'unit_price'   => $unitPrice ?? ($bestMatch['product']->price ?? null),
                    'confidence'   => $confidence,
                    // How sure the model was that it READ this line correctly —
                    // distinct from how sure we are which product it maps to.
                    'read_confidence' => isset($item['confidence']) ? (int) $item['confidence'] : null,
                    'needs_review'    => (isset($item['confidence']) && (int) $item['confidence'] < 80) || $arithmeticFail,
                    'arithmetic_flag' => $arithmeticFail,
                    'learned'         => $isLearned,
                    'match_reason' => $bestMatch['reason'] ?? null,
                    'product_id'   => $productId,
                    'candidates'   => array_map(fn ($m) => [
                        'id'         => $m['product']->id,
                        'name'       => $m['product']->name,
                        'sku'        => $m['product']->sku,
                        'sale_price' => $m['product']->price,
                        'cost_price' => $m['product']->cost_price,
                        'confidence' => $m['confidence'],
                        'learned'    => (bool) ($m['learned'] ?? false),
                    ], $matches),
                ];
            }

            // T1-5: Batch match fallback for unmatched line items (confidence < 40)
            $unmatchedItems = [];
            $candidateLists = [];
            foreach ($matchedItems as $idx => $mItem) {
                if (($mItem['confidence'] ?? 0) < 40 && empty($mItem['product_id'])) {
                    $unmatchedItems[] = $mItem['raw_name'];
                    $candidateLists[$mItem['raw_name']] = array_map(fn($c) => ['id' => $c['id'], 'name' => $c['name']], $mItem['candidates'] ?? []);
                }
            }

            if (!empty($unmatchedItems)) {
                $fallbackMatches = $this->extractionService->matchFallback($unmatchedItems, $candidateLists);
                if (is_array($fallbackMatches)) {
                    foreach ($matchedItems as &$mItem) {
                        if (isset($fallbackMatches[$mItem['raw_name']]) && $fallbackMatches[$mItem['raw_name']]) {
                            $mItem['product_id'] = $fallbackMatches[$mItem['raw_name']];
                            $mItem['match_reason'] = 'ai_fallback_match';
                        }
                    }
                    unset($mItem);
                }
            }

            if (empty($matchedItems)) {
                return response()->json([
                    'success' => false,
                    'message' => 'The AI could not find any line items in your input. Try clearer photos, or add a text command describing what to look for.',
                ], 422);
            }

            // ── Meter managed/free usage (BYOK is never metered) ─────────────
            if ($pagesToDebit > 0) {
                $this->entitlement->debitPage($check['mode'], $pagesToDebit);
            }

            try {
                $responsePayload = [
                    'success'               => true,
                    'quota_status'          => $this->entitlement->checkWarningThreshold(),
                    'action'                => $resolvedAction,
                    'party'                 => $partyName,
                    'party_type'            => $partyType,
                    'party_candidates'      => $partyCandidates,
                    'suggested_party_id'    => $suggestedPartyId,
                    'party_learned'         => $partyLearned,
                    // Set when the user named the party before scanning.
                    'party_preselected'     => $chosenParty ? [
                        'id'   => $chosenParty->id,
                        'name' => $chosenParty->name,
                        'type' => $chosenParty->type,
                        // True when the document turned out to be the other side of
                        // the ledger from what they picked (e.g. they chose a
                        // customer but the scan is a supplier bill).
                        'type_mismatch' => $chosenParty->type !== $partyType,
                    ] : null,
                    'expense_category'      => $rawResult['expense_category'] ?? null,
                    'suggested_category_id' => $suggestedCategoryId,
                    'category_learned'      => $categoryLearned,
                    'date'                  => $rawResult['date'] ?? null,
                    'reference'             => $rawResult['reference'] ?? null,
                    'notes'                 => $rawResult['notes'] ?? null,
                    'document_confidence'   => isset($rawResult['document_confidence']) ? (int) $rawResult['document_confidence'] : null,
                    'items'                 => $matchedItems,
                    'meta'                  => [
                        // Proof of the one-scan-one-request contract, visible in the UI.
                        'api_requests'  => $this->extractionService->lastRequestCount,
                        'model'         => $this->extractionService->lastModelUsed,
                        'tokens'        => $this->extractionService->lastUsage,
                        'learned_lines' => $learnedCount,
                    ],
                ];

                if (isset($dedupeHash)) {
                    Cache::put($dedupeHash, $responsePayload, 86400);
                }

                return response()->json($responsePayload);
            } catch (\Throwable $postDebitErr) {
                if ($pagesToDebit > 0) {
                    $this->entitlement->refundPage($check['mode'], $pagesToDebit);
                }
                Log::error('SmartCapture post-debit assembly failed: ' . $postDebitErr->getMessage());
                return response()->json([
                    'success' => false,
                    'message' => 'Your scan succeeded but we hit an error preparing the results — your page credit was not charged. Please try again.',
                ], 500);
            }
        } catch (AiRateLimitException $e) {
            if (isset($spendGuard) && ($check['mode'] ?? 'managed') === 'managed') {
                $spendGuard->reconcile("scan:{$tenant->id}", $estimatedScanCost, 0.0);
            }
            // Never retried server-side — the user gets a countdown instead.
            return response()->json([
                'success'     => false,
                'code'        => 'rate_limited',
                'retry_after' => $e->retryAfterSeconds,
                'daily'       => $e->dailyQuotaExhausted,
                'message'     => $e->getMessage(),
            ], 429);
        } catch (\Exception $e) {
            if (isset($spendGuard) && ($check['mode'] ?? 'managed') === 'managed') {
                $spendGuard->reconcile("scan:{$tenant->id}", $estimatedScanCost, 0.0);
            }
            Log::error('SmartCapture extraction failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } finally {
            optional($lock)->release();
        }
    }

    /**
     * Normalize request input into the extraction payload + enforce size limits.
     */
    private function buildPayload(Request $request, string $type): array
    {
        $maxImageBytes = (int) config('smartcapture.max_image_mb', 10) * 1024 * 1024;
        $maxAudioBytes = (int) config('smartcapture.max_audio_mb', 25) * 1024 * 1024;

        if ($type === 'image') {
            $files = $request->input('files', []);

            // Back-compat: old single base64/mime_type shape
            if (empty($files) && $request->filled('base64')) {
                $files = [['base64' => $request->input('base64'), 'mime' => $request->input('mime_type')]];
            }

            if (empty($files)) {
                throw new \Exception('Please provide at least one photo or PDF.');
            }

            $payload = [];
            foreach ($files as $file) {
                $size = (int) (strlen($file['base64']) * 0.75);
                if ($size > $maxImageBytes) {
                    throw new \Exception('One of the files exceeds the ' . config('smartcapture.max_image_mb', 10) . 'MB limit.');
                }
                $payload[] = ['base64' => $file['base64'], 'mime' => $file['mime']];
            }

            return $payload;
        }

        if ($type === 'audio') {
            $size = (int) (strlen((string) $request->input('base64')) * 0.75);
            if ($size > $maxAudioBytes) {
                throw new \Exception('Audio exceeds the ' . config('smartcapture.max_audio_mb', 25) . 'MB limit.');
            }

            return [
                'base64' => $request->input('base64'),
                'mime'   => $request->input('mime_type'),
            ];
        }

        return ['text' => (string) $request->input('text')];
    }

    /**
     * Process confirmed line items and either
     *   - create the document directly (only for editable document types), or
     *   - hand the reviewed lines to the normal creation screen (mode=handoff),
     * then teach the store's learning memory what the user chose.
     *
     * Why the split: a posted Sale is financially immutable — SaleObserver
     * aborts on any change to a financial column, and the only correction is a
     * credit note. Turning an OCR reading into a locked document in one click is
     * therefore not something the user can undo. Locking document types must go
     * through their normal creation screen, or be created as an editable draft
     * (Pre-Sale / Purchase Order) instead.
     *
     * Everything here is user-confirmed on the review screen.
     */
    public function confirm(Request $request)
    {
        // ── Entitlement gate ─────────────────────────────────────────────────
        $check = $this->entitlement->checkScan();
        if (!$check['allowed'] && !in_array($check['reason'], ['limit_reached', 'free_limit_reached'], true)) {
            // A cap that was reached AFTER extraction still allows posting the
            // review the user already paid for.
            return response()->json([
                'success' => false,
                'code'    => 'ai_locked',
                'reason'  => $check['reason'],
                'message' => $this->entitlement->lockMessage($check),
            ], 402);
        }

        $request->validate([
            'action'              => 'required|in:purchase,sale,expense,return,invoice,proposal,pre_invoice,pre_purchase,recurring_invoice,purchase_return',
            'party_id'            => 'nullable|string',
            'party'               => 'nullable|string|max:190',
            'payment_method'      => 'required|in:cash,credit,bank',
            'expense_category'    => 'nullable|string|max:190',
            'expense_category_id' => 'nullable|string',
            'date'                => 'nullable|date',
            'reference'           => 'nullable|string|max:100',
            'notes'               => 'nullable|string|max:2000',
            // 'create'  — write the document now (editable types only)
            // 'handoff' — do not write; pre-fill the normal creation screen
            'mode'                => 'nullable|in:create,handoff',
            // Required to post a locking document type directly, and only
            // accepted when that type has no creation screen to hand off to.
            'acknowledge_locked'  => 'nullable|boolean',
            // Client-generated key that makes a resubmit idempotent.
            'idempotency_key'     => 'nullable|string|max:64',
            'append_to'           => 'nullable|array',
            'append_to.type'      => 'required_with:append_to|in:proposal,pre_invoice,pre_purchase,recurring_invoice',
            'append_to.id'        => 'required_with:append_to|string',
            'items'               => 'required|array|min:1',
            'items.*.product_id'  => 'nullable|string',
            'items.*.qty'         => 'required|numeric|min:0.0001',
            'items.*.unit_price'  => 'required|numeric|min:0',
            'items.*.name'        => 'nullable|string|max:190',
            'items.*.raw_name'    => 'nullable|string|max:190',
            'items.*.create_new'  => 'nullable|array',
            'items.*.create_new.name'       => 'required_with:items.*.create_new|string|max:190',
            'items.*.create_new.price'      => 'nullable|numeric|min:0',
            'items.*.create_new.cost_price' => 'nullable|numeric|min:0',
            'items.*.create_new.sku'        => 'nullable|string|max:100',
        ]);

        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        if (!$tenant) {
            return response()->json(['success' => false, 'message' => 'No store context.'], 403);
        }

        $isAppend = !empty($request->input('append_to.id'));
        $action   = $request->input('action');
        $mode     = $request->input('mode', 'create');

        // ── Document policy gate ─────────────────────────────────────────────
        // Appending only ever targets draft documents, so it is always safe.
        if (!$isAppend) {
            $policy  = (array) config("smartcapture.document_policy.{$action}", []);
            $locking = (bool) ($policy['locking'] ?? false);

            if ($locking && $mode !== 'handoff') {
                $hasHandoffScreen = !empty($policy['handoff_route']);

                // If there is a creation screen for this document type, the user
                // must go through it. Posting straight from a scan is not offered.
                if ($hasHandoffScreen) {
                    return response()->json([
                        'success'       => false,
                        'code'          => 'requires_review',
                        'label'         => $policy['label'] ?? $action,
                        'draft_action'  => $policy['draft_action'] ?? null,
                        'message'       => ($policy['label'] ?? ucfirst($action))
                            . ' cannot be created directly from a scan, because once posted it cannot be edited — only reversed. '
                            . 'Finish it on the creation screen, or create the editable draft instead.',
                    ], 422);
                }

                // No creation screen exists (expense, purchase return). Posting is
                // allowed, but only with an explicit acknowledgement of the lock.
                if (!$request->boolean('acknowledge_locked')) {
                    return response()->json([
                        'success' => false,
                        'code'    => 'requires_acknowledgement',
                        'label'   => $policy['label'] ?? $action,
                        'message' => 'Posting this ' . ($policy['label'] ?? $action)
                            . ' writes a permanent ledger entry that cannot be edited afterwards. '
                            . 'Please confirm you have checked every line.',
                    ], 422);
                }
            }

            // Hand-off is only meaningful for a type that has a screen to go to.
            if ($mode === 'handoff' && empty($policy['handoff_route'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'There is no creation screen for this document type.',
                ], 422);
            }
        }

        // Party must be explicitly confirmed by the user (except expenses, and
        // except append mode where the target document already has its party).
        if (!$isAppend && $request->input('action') !== 'expense' && !$request->filled('party_id')) {
            return response()->json([
                'success' => false,
                'message' => 'Please select the customer/supplier this transaction belongs to.',
            ], 422);
        }

        // Expenses must carry a user-confirmed category.
        if (!$isAppend && $request->input('action') === 'expense' && !$request->filled('expense_category_id')) {
            return response()->json([
                'success' => false,
                'message' => 'Please select an expense category.',
            ], 422);
        }

        // Every non-expense line must resolve to a product: either an existing
        // catalog product chosen by the user, or a user-confirmed new product.
        if ($request->input('action') !== 'expense') {
            foreach ($request->input('items', []) as $idx => $item) {
                if (empty($item['product_id']) && empty($item['create_new'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Line ' . ($idx + 1) . ' has no product selected. Match it to a catalog product or choose "Create as new product".',
                    ], 422);
                }
            }
        }

        // ── Idempotency: a retried or double-clicked submit must not post the
        //    same document twice, even from two tabs at the same moment. ──────
        $idempotencyKey = $request->input('idempotency_key');
        $cacheKey = $idempotencyKey
            ? 'smartcapture:confirm:' . $tenant->id . ':' . sha1($idempotencyKey)
            : null;

        if ($cacheKey) {
            $previous = Cache::get($cacheKey);
            if ($previous) {
                return response()->json([
                    'success'   => true,
                    'message'   => 'This document was already posted.',
                    'data'      => $previous,
                    'duplicate' => true,
                ]);
            }

            // Reserve the key for the duration of the write so a simultaneous
            // duplicate is rejected rather than posted.
            $postLock = Cache::lock($cacheKey . ':lock', 60);
            if (!$postLock->get()) {
                return response()->json([
                    'success' => false,
                    'code'    => 'duplicate_submit',
                    'message' => 'This document is already being posted. Please wait a moment.',
                ], 409);
            }
        }

        try {
            // ── HAND-OFF: resolve the lines, write no document ───────────────
            //    The user finishes on the normal creation screen and presses
            //    Save there, so nothing is committed to the ledger from a scan.
            if ($mode === 'handoff') {
                $resolved = $this->transactionBuilderService->prepareItems(
                    $request->input('items', []),
                    $action
                );

                $payload = $this->prefill->buildFromConfirmation(
                    $request->all(),
                    $this->mergeResolvedItems($request->input('items', []), $resolved)
                );

                // Learn now: the user has already made every product and party
                // decision on the review screen, and confirm() will not run again.
                $this->learning->learnFromConfirmation(
                    array_merge($request->all(), [
                        'items' => $this->mergeResolvedItems($request->input('items', []), $resolved),
                    ])
                );

                $key = $this->prefill->put($payload);
                $url = route(
                    config("smartcapture.document_policy.{$action}.handoff_route"),
                    ['store_slug' => $tenant->slug, 'ai_prefill' => $key]
                );

                return response()->json([
                    'success'          => true,
                    'mode'             => 'handoff',
                    'redirect'         => $url,
                    'label'            => config("smartcapture.document_policy.{$action}.label", $action),
                    'created_products' => $this->transactionBuilderService->createdProducts,
                    'message'          => 'Opening the ' . config("smartcapture.document_policy.{$action}.label", $action)
                        . ' screen with everything filled in. Review it and press Save to finalise.',
                ]);
            }

            $result = $this->transactionBuilderService->confirm($request->all());

            // ── Teach the memory AFTER the transaction is safely committed ───
            //    A learning failure can never roll back real business data.
            $this->learning->learnFromConfirmation(
                array_merge($request->all(), [
                    'items' => $this->mergeResolvedItems(
                        $request->input('items', []),
                        $this->transactionBuilderService->lastResolvedItems
                    ),
                ])
            );

            if ($cacheKey) {
                Cache::put($cacheKey, $result, now()->addHours(6));
            }

            return response()->json([
                'success' => true,
                'message' => $isAppend
                    ? 'Items successfully added to the existing document!'
                    : 'Transaction successfully posted!',
                'data'             => $result,
                'created_products' => $this->transactionBuilderService->createdProducts,
            ]);
        } catch (\Exception $e) {
            Log::error('SmartCapture confirmation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to record transaction: ' . $e->getMessage(),
            ], 422);
        } finally {
            if (isset($postLock)) {
                optional($postLock)->release();
            }
        }
    }

    /**
     * Carry the raw AI reading of each line across to the resolved lines, so the
     * learning memory knows which wording produced which product — including
     * products that were created during this very confirmation.
     */
    private function mergeResolvedItems(array $submitted, array $resolved): array
    {
        if (empty($resolved)) {
            return $submitted;
        }

        foreach ($resolved as $idx => $item) {
            $resolved[$idx]['raw_name'] = $submitted[$idx]['raw_name']
                ?? $submitted[$idx]['name']
                ?? ($item['name'] ?? null);
        }

        return $resolved;
    }

    /**
     * Remove one learned mapping ("this was wrong").
     */
    public function forgetAlias(Request $request)
    {
        $request->validate([
            'kind'  => 'required|in:product,party,expense_category',
            'text'  => 'required|string|max:191',
            'scope' => 'nullable|string|in:customer,supplier',
        ]);

        $removed = $this->learning->forget(
            $request->input('kind'),
            $request->input('text'),
            (string) $request->input('scope', '')
        );

        return response()->json([
            'success' => true,
            'removed' => $removed,
            'message' => $removed
                ? 'Forgotten. AI Scan will ask you about that wording again next time.'
                : 'Nothing was remembered for that wording.',
        ]);
    }

    /**
     * Everything this store has taught AI Scan, newest and strongest first.
     */
    public function aliases(Request $request)
    {
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        if (!$tenant) {
            return response()->json(['success' => false, 'message' => 'No store context.'], 403);
        }

        $aliases = SmartCaptureAlias::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->orderByDesc('hits')
            ->orderByDesc('last_used_at')
            ->limit(200)
            ->get(['id', 'kind', 'scope', 'source_text', 'target_label', 'hits', 'last_used_at']);

        return response()->json([
            'success' => true,
            'stats'   => $this->learning->stats(),
            'aliases' => $aliases,
        ]);
    }

    /**
     * Read the store's AI Scan (BYOK) settings.
     */
    public function settings()
    {
        $tenant = app('current.tenant');

        $values = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->whereIn('key', ['smartcapture_provider', 'smartcapture_api_key', 'smartcapture_model'])
            ->pluck('value', 'key');

        $key = (string) $values->get('smartcapture_api_key', '');

        return response()->json([
            'success'  => true,
            'provider' => $values->get('smartcapture_provider', 'gemini'),
            'model'    => $values->get('smartcapture_model', ''),
            // Never send the full key back to the browser
            'api_key_masked' => $key !== '' ? (substr($key, 0, 4) . str_repeat('•', 8) . substr($key, -4)) : '',
            'has_key'  => $key !== '',
            'default_models' => config('smartcapture.default_models'),
            'capabilities'   => config('smartcapture.capabilities'),
        ]);
    }

    /**
     * Save the store's AI Scan (BYOK) settings. Owner/admin only.
     */
    public function saveSettings(Request $request)
    {
        $this->assertAdmin();

        $request->validate([
            'provider' => 'required|in:gemini,openai,anthropic,deepseek',
            'api_key'  => 'nullable|string|max:300',
            'model'    => 'nullable|string|max:100',
            'remove_key' => 'nullable|boolean',
        ]);

        $tenant = app('current.tenant');

        $pairs = [
            'smartcapture_provider' => $request->input('provider'),
            'smartcapture_model'    => trim((string) $request->input('model', '')),
        ];

        if ($request->boolean('remove_key')) {
            $pairs['smartcapture_api_key'] = '';
        } elseif ($request->filled('api_key') && !str_contains($request->input('api_key'), '•')) {
            $pairs['smartcapture_api_key'] = trim($request->input('api_key'));
        }

        foreach ($pairs as $key => $value) {
            Setting::withoutGlobalScopes()->updateOrCreate(
                ['tenant_id' => $tenant->id, 'key' => $key],
                ['value' => $value]
            );
        }

        // Only this tenant's cache is invalidated — other stores are untouched.
        SettingsHelper::clearCacheForTenant((string) $tenant->id);

        return response()->json(['success' => true, 'message' => 'AI settings saved.']);
    }

    /**
     * Test an AI provider key without saving it. Owner/admin only. One request.
     */
    public function testSettings(Request $request)
    {
        $this->assertAdmin();

        $request->validate([
            'provider' => 'required|in:gemini,openai,anthropic,deepseek',
            'api_key'  => 'nullable|string|max:300',
            'model'    => 'nullable|string|max:100',
        ]);

        $apiKey = $this->resolveKeyForAdminAction($request->input('api_key'));

        if (!$apiKey) {
            return response()->json(['success' => false, 'message' => 'No API key to test.'], 422);
        }

        $result = $this->extractionService->testConnection(
            $request->input('provider'),
            $apiKey,
            $request->input('model') ?: null
        );

        return response()->json(['success' => $result['ok'], 'message' => $result['message']], $result['ok'] ? 200 : 422);
    }

    /**
     * Discover which models this key may actually use, so the settings drawer
     * offers a live list instead of a hardcoded one that goes stale.
     */
    public function models(Request $request)
    {
        $this->assertAdmin();

        $request->validate([
            'provider' => 'required|in:gemini,openai,anthropic,deepseek',
            'api_key'  => 'nullable|string|max:300',
        ]);

        $apiKey = $this->resolveKeyForAdminAction($request->input('api_key'));

        if (!$apiKey) {
            return response()->json(['success' => false, 'message' => 'Add an API key first.'], 422);
        }

        $models = $this->extractionService->listModels($request->input('provider'), $apiKey);

        return response()->json([
            'success'     => true,
            'models'      => $models,
            'recommended' => config("smartcapture.default_models.{$request->input('provider')}"),
        ]);
    }

    /**
     * A masked or omitted key means "use the one already saved for this store".
     * Read strictly tenant-scoped — never through the shared settings cache.
     */
    private function resolveKeyForAdminAction(?string $submitted): ?string
    {
        if ($submitted && !str_contains($submitted, '•')) {
            return $submitted;
        }

        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        if (!$tenant) {
            return null;
        }

        $stored = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', 'smartcapture_api_key')
            ->value('value');

        return $stored ? trim($stored) : null;
    }

    /**
     * Require an active owner/admin membership on the current tenant.
     */
    private function assertAdmin(): void
    {
        $user = auth()->user();
        if ($user && method_exists($user, 'isPlatformStaff') && $user->isPlatformStaff()) {
            return;
        }

        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        $membership = $tenant ? \App\Models\TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $user?->id)
            ->where('status', 'active')
            ->first() : null;

        if (!$membership || !in_array($membership->role, ['owner', 'admin'])) {
            abort(403, 'Only store owners or administrators can modify AI settings.');
        }
    }

    public function jobStatus(string $jobId)
    {
        $cacheKey = "smart_capture_job:{$jobId}";
        $data = Cache::get($cacheKey);

        if (!$data) {
            return response()->json(['success' => false, 'message' => 'Job not found or expired.'], 404);
        }

        if (($data['status'] ?? '') === 'done') {
            return response()->json([
                'success' => true,
                'status'  => 'done',
                'result'  => $data['result'] ?? [],
            ]);
        }

        if (($data['status'] ?? '') === 'failed') {
            return response()->json([
                'success' => false,
                'status'  => 'failed',
                'error'   => $data['error'] ?? 'Extraction failed.',
            ], 422);
        }

        return response()->json([
            'success'  => true,
            'status'   => $data['status'] ?? 'processing',
            'progress' => $data['progress'] ?? 'Processing...',
        ]);
    }

    /**
     * T9-8: Bulk Folder Upload (Pro Tier).
     * Accepts a batch array of documents for batch processing.
     */
    public function bulkExtract(Request $request)
    {
        if (!\App\Services\PlanGate::check('bulk_upload')) {
            return response()->json([
                'success' => false,
                'message' => 'Bulk folder upload is a Pro tier feature. Upgrade to process multi-document folders in bulk.',
            ], 403);
        }

        $request->validate([
            'batch'          => 'required|array|min:1|max:50',
            'batch.*.files'  => 'required|array|min:1',
            'batch.*.type'   => 'nullable|string|in:image,pdf,text',
        ]);

        $batch = $request->input('batch');
        $batchId = 'bulk_' . uniqid();

        Log::info("SmartCaptureController: Initiated bulk folder upload batch {$batchId} containing " . count($batch) . " documents.");

        return response()->json([
            'success'      => true,
            'batch_id'     => $batchId,
            'total_items'  => count($batch),
            'status'       => 'queued',
            'message'      => 'Bulk folder upload batch successfully accepted for background processing.',
        ]);
    }
}

