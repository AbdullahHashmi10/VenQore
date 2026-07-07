<?php

namespace App\Http\Controllers\SmartCapture;

use App\Helpers\SettingsHelper;
use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use App\Models\Party;
use App\Models\Product;
use App\Models\Setting;
use App\Services\SmartCapture\AiEntitlementService;
use App\Services\SmartCapture\AiExtractionService;
use App\Services\SmartCapture\FuzzyMatchService;
use App\Services\SmartCapture\IntentResolverService;
use App\Services\SmartCapture\TransactionBuilderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SmartCaptureController extends Controller
{
    public function __construct(
        private AiExtractionService       $extractionService,
        private AiEntitlementService      $entitlement,
        private FuzzyMatchService         $fuzzyMatchService,
        private IntentResolverService     $intentResolverService,
        private TransactionBuilderService $transactionBuilderService
    ) {}

    /**
     * Context payload for the AI Scan panel: entitlement state, parties,
     * expense categories, open documents (for append mode) and settings.
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

            // ── AI extraction ────────────────────────────────────────────────
            $rawResult = $this->extractionService->extract(
                inputType: $type,
                payload: $payload,
                targetType: $request->input('target_type'),
                customCommand: $request->input('custom_command'),
                context: [
                    'existing_products'  => $existingProducts,
                    'parties'            => $knownParties,
                    'expense_categories' => $expenseCategories,
                ]
            );

            // ── Resolve action intent ────────────────────────────────────────
            $resolvedAction = $this->intentResolverService->resolve($rawResult['action'] ?? 'sale');
            $partyType = in_array($resolvedAction, ['purchase', 'pre_purchase', 'purchase_return']) ? 'supplier' : 'customer';

            // ── Party candidates (user must confirm — no silent auto-pick) ──
            $partyName = $rawResult['party'] ?? null;
            $partyCandidates = $partyName
                ? $this->fuzzyMatchService->matchParty($partyName, $partyType)
                : [];
            $suggestedPartyId = (!empty($partyCandidates) && $partyCandidates[0]['confidence'] >= 60)
                ? $partyCandidates[0]['id']
                : null;

            // ── Expense category suggestion ─────────────────────────────────
            $suggestedCategoryId = null;
            if ($resolvedAction === 'expense' && !empty($rawResult['expense_category'])) {
                $suggestedCategoryId = ExpenseCategory::where('tenant_id', $tenant->id)
                    ->whereRaw('LOWER(name) = ?', [mb_strtolower(trim($rawResult['expense_category']))])
                    ->value('id');
            }

            // ── Fuzzy match line items ───────────────────────────────────────
            $matchedItems = [];
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

                $matches = $this->fuzzyMatchService->matchProduct($itemName, $item['matched_sku'] ?? null);

                $bestMatch = $matches[0] ?? null;
                $confidence = $bestMatch['confidence'] ?? 0;
                // Preselect the closest match; the user always reviews & can change it,
                // pick another candidate, or choose "create as new product".
                $productId = $confidence >= 40 ? ($bestMatch['product']->id ?? null) : null;

                $matchedItems[] = [
                    'raw_name'   => $itemName,
                    'qty'        => $qty,
                    'unit_price' => $unitPrice ?? ($bestMatch['product']->price ?? null),
                    'confidence' => $confidence,
                    'product_id' => $productId,
                    'candidates' => array_map(fn ($m) => [
                        'id'         => $m['product']->id,
                        'name'       => $m['product']->name,
                        'sku'        => $m['product']->sku,
                        'sale_price' => $m['product']->price,
                        'cost_price' => $m['product']->cost_price,
                        'confidence' => $m['confidence'],
                    ], $matches),
                ];
            }

            if (empty($matchedItems)) {
                return response()->json([
                    'success' => false,
                    'message' => 'The AI could not find any line items in your input. Try clearer photos, or add a text command describing what to look for.',
                ], 422);
            }

            // ── Meter managed usage (BYOK is never metered) ──────────────────
            $this->entitlement->recordScan($check['mode']);

            return response()->json([
                'success'               => true,
                'action'                => $resolvedAction,
                'party'                 => $partyName,
                'party_type'            => $partyType,
                'party_candidates'      => $partyCandidates,
                'suggested_party_id'    => $suggestedPartyId,
                'expense_category'      => $rawResult['expense_category'] ?? null,
                'suggested_category_id' => $suggestedCategoryId,
                'date'                  => $rawResult['date'] ?? null,
                'reference'             => $rawResult['reference'] ?? null,
                'notes'                 => $rawResult['notes'] ?? null,
                'items'                 => $matchedItems,
            ]);
        } catch (\Exception $e) {
            Log::error('SmartCapture extraction failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to parse request: ' . $e->getMessage(),
            ], 422);
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
     * Process confirmed line items and write (or append to) a transaction.
     * Everything here is user-confirmed on the review screen.
     */
    public function confirm(Request $request)
    {
        // ── Entitlement gate (was previously missing on confirm) ─────────────
        $check = $this->entitlement->checkScan();
        if (!$check['allowed'] && $check['reason'] !== 'limit_reached') {
            // limit_reached still allows posting a review that was already extracted
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
            'expense_category_id' => 'nullable|string',
            'date'                => 'nullable|date',
            'reference'           => 'nullable|string|max:100',
            'append_to'           => 'nullable|array',
            'append_to.type'      => 'required_with:append_to|in:proposal,pre_invoice,pre_purchase,recurring_invoice',
            'append_to.id'        => 'required_with:append_to|string',
            'items'               => 'required|array|min:1',
            'items.*.product_id'  => 'nullable|string',
            'items.*.qty'         => 'required|numeric|min:0.0001',
            'items.*.unit_price'  => 'required|numeric|min:0',
            'items.*.name'        => 'nullable|string|max:190',
            'items.*.create_new'  => 'nullable|array',
            'items.*.create_new.name'       => 'required_with:items.*.create_new|string|max:190',
            'items.*.create_new.price'      => 'nullable|numeric|min:0',
            'items.*.create_new.cost_price' => 'nullable|numeric|min:0',
            'items.*.create_new.sku'        => 'nullable|string|max:100',
        ]);

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

        try {
            $result = $this->transactionBuilderService->confirm($request->all());

            return response()->json([
                'success' => true,
                'message' => !empty($request->input('append_to'))
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
        }
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

        SettingsHelper::clearCache();
        SettingsHelper::clearCacheForTenant((string) $tenant->id);

        return response()->json(['success' => true, 'message' => 'AI settings saved.']);
    }

    /**
     * Test an AI provider key without saving it. Owner/admin only.
     */
    public function testSettings(Request $request)
    {
        $this->assertAdmin();

        $request->validate([
            'provider' => 'required|in:gemini,openai,anthropic,deepseek',
            'api_key'  => 'nullable|string|max:300',
            'model'    => 'nullable|string|max:100',
        ]);

        $apiKey = $request->input('api_key');

        // "Test saved key" mode — masked or empty means use the stored key
        if (!$apiKey || str_contains($apiKey, '•')) {
            $apiKey = SettingsHelper::get('smartcapture_api_key');
        }

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
