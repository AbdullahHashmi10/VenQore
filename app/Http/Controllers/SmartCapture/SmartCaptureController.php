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
        private LearningService           $learning
    ) {}

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
        $config = $this->extractionService->resolveConfig();

        return response()->json([
            'success' => true,
            'entitlement' => [
                'allowed'     => $check['allowed'],
                'reason'      => $check['reason'],
                'mode'        => $check['mode'],
                'scans_used'  => $check['scans_used'],
                'scans_limit' => $check['scans_limit'],
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
            'custom_command'  => 'nullable|string|max:1000',
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

            // ── Tenant-scoped catalog context (explicit scoping + hard cap) ──
            $catalogLimit = (int) config('smartcapture.catalog_limit', 800);
            $existingProducts = Product::where('tenant_id', $tenant->id)
                ->orderByDesc('updated_at')
                ->take($catalogLimit)
                ->get(['name', 'sku'])
                ->map(fn ($p) => ['name' => $p->name, 'sku' => $p->sku])
                ->toArray();

            $knownParties = Party::where('tenant_id', $tenant->id)
                ->orderBy('name')->take(300)->pluck('name')->toArray();

            $expenseCategories = ExpenseCategory::where('tenant_id', $tenant->id)
                ->orderBy('name')->take(200)->pluck('name')->toArray();

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
                ]
            );

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
            if (!empty($partyCandidates)) {
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

                // Derive unit price from a line total when the model only read one.
                if ($unitPrice === null && !empty($item['line_total']) && $qty > 0) {
                    $unitPrice = round(((float) $item['line_total']) / $qty, 4);
                }

                $matches = $this->fuzzyMatchService->matchProduct($itemName, $item['matched_sku'] ?? null);

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
                    'needs_review' => (bool) ($item['needs_review'] ?? false),
                    'learned'      => $isLearned,
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

            if (empty($matchedItems)) {
                return response()->json([
                    'success' => false,
                    'message' => 'The AI could not find any line items in your input. Try clearer photos, or add a text command describing what to look for.',
                ], 422);
            }

            // ── Meter managed/free usage (BYOK is never metered) ─────────────
            $this->entitlement->recordScan($check['mode']);

            return response()->json([
                'success'               => true,
                'action'                => $resolvedAction,
                'party'                 => $partyName,
                'party_type'            => $partyType,
                'party_candidates'      => $partyCandidates,
                'suggested_party_id'    => $suggestedPartyId,
                'party_learned'         => $partyLearned,
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
            ]);
        } catch (AiRateLimitException $e) {
            // Never retried server-side — the user gets a countdown instead.
            return response()->json([
                'success'     => false,
                'code'        => 'rate_limited',
                'retry_after' => $e->retryAfterSeconds,
                'daily'       => $e->dailyQuotaExhausted,
                'message'     => $e->getMessage(),
            ], 429);
        } catch (\Exception $e) {
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
     * Process confirmed line items and write (or append to) a transaction,
     * then teach the store's learning memory what the user chose.
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
                'data'    => $result,
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
}
