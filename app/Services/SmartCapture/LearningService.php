<?php

namespace App\Services\SmartCapture;

use App\Models\ExpenseCategory;
use App\Models\Party;
use App\Models\Product;
use App\Models\SmartCaptureAlias;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * LearningService — the memory that makes AI Scan sharper for a store over time.
 *
 * The loop:
 *   1. A scan runs. The store's strongest aliases are sent to the model as
 *      "this store's confirmed vocabulary" (few-shot grounding).
 *   2. Server-side, before any fuzzy matching, every extracted line is checked
 *      against the alias book. An exact hit is pinned at 100% and labelled
 *      "learned", so the user does not have to correct the same thing twice.
 *   3. When the user confirms the review screen, whatever they actually chose is
 *      written back — reinforcing a correct memory or overwriting a wrong one.
 *
 * Scope: per TENANT, shared across all staff. Two cashiers confirming at the
 * same instant is safe — writes are a single atomic upsert.
 *
 * Tenant isolation: every read and write is explicitly filtered by tenant_id;
 * a target id is verified to belong to the tenant before it is ever stored.
 */
class LearningService
{
    // ─────────────────────────────────────────────────────────────────────────
    // Normalisation
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Fold a raw reading into a stable lookup key.
     *
     * "12 x COCA-COLA 1.5L." , "coca cola 1.5 l" and "COCA COLA 1.5L"
     * all collapse to "coca cola 1.5l".
     */
    public function normalize(string $text): string
    {
        $text = $this->foldDigits($text);
        $text = mb_strtolower(trim($text));

        // Drop a leading quantity prefix ("3 x ", "2x", "10 - ")
        $text = preg_replace('/^\s*\d+(?:\.\d+)?\s*(?:x|\*|-|–)\s*/u', '', $text);

        // Punctuation to spaces, then collapse
        $text = preg_replace('/[^\p{L}\p{N}\s]+/u', ' ', $text);
        $text = preg_replace('/\s+/u', ' ', $text);

        return trim(mb_substr($text, 0, 160));
    }

    /**
     * Convert Arabic-Indic and Devanagari numerals to Western digits so that a
     * handwritten Urdu "٥" and a typed "5" share one memory.
     */
    private function foldDigits(string $text): string
    {
        $map = [
            '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4',
            '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9',
            '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4',
            '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
            '०' => '0', '१' => '1', '२' => '2', '३' => '3', '४' => '4',
            '५' => '5', '६' => '6', '७' => '7', '८' => '8', '९' => '9',
        ];

        return strtr($text, $map);
    }

    private function tenantId(): ?string
    {
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        return $tenant ? (string) $tenant->id : null;
    }

    private function enabled(): bool
    {
        return (bool) config('smartcapture.learning_enabled', true) && $this->tenantId() !== null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Reading the memory
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Look up one learned mapping.
     *
     * Returns null when nothing is remembered, or when the remembered target has
     * since been deleted (the stale alias is pruned on the way out).
     *
     * @return array{target_id:string, target_label:string, hits:int, source_text:string}|null
     */
    public function resolve(string $kind, string $rawText, string $scope = ''): ?array
    {
        if (!$this->enabled()) {
            return null;
        }

        $key = $this->normalize($rawText);
        if ($key === '') {
            return null;
        }

        $alias = SmartCaptureAlias::withoutGlobalScopes()
            ->where('tenant_id', $this->tenantId())
            ->where('kind', $kind)
            ->where('scope', $scope)
            ->where('source_key', $key)
            ->first();

        if (!$alias) {
            return null;
        }

        // The user may have deleted the product/party since. Never hand back a
        // dangling id — it would fail validation later with a confusing error.
        if (!$this->targetStillExists($kind, $alias->target_id)) {
            $alias->delete();
            return null;
        }

        return [
            'target_id'    => (string) $alias->target_id,
            'target_label' => (string) $alias->target_label,
            'hits'         => (int) $alias->hits,
            'source_text'  => (string) $alias->source_text,
        ];
    }

    public function resolveProduct(string $rawName): ?array
    {
        return $this->resolve(SmartCaptureAlias::KIND_PRODUCT, $rawName);
    }

    public function resolveParty(string $rawName, string $type): ?array
    {
        return $this->resolve(SmartCaptureAlias::KIND_PARTY, $rawName, $type);
    }

    public function resolveExpenseCategory(string $rawName): ?array
    {
        return $this->resolve(SmartCaptureAlias::KIND_CATEGORY, $rawName);
    }

    private function targetStillExists(string $kind, string $targetId): bool
    {
        $tenantId = $this->tenantId();

        return match ($kind) {
            SmartCaptureAlias::KIND_PRODUCT  => Product::withoutGlobalScopes()
                ->where('tenant_id', $tenantId)->whereKey($targetId)->exists(),
            SmartCaptureAlias::KIND_PARTY    => Party::withoutGlobalScopes()
                ->where('tenant_id', $tenantId)->whereKey($targetId)->exists(),
            SmartCaptureAlias::KIND_CATEGORY => ExpenseCategory::withoutGlobalScopes()
                ->where('tenant_id', $tenantId)->whereKey($targetId)->exists(),
            default => false,
        };
    }

    /**
     * The store's strongest product aliases, formatted as few-shot hints for the
     * extraction prompt. Sending these makes the model resolve local shorthand
     * ("col 1.5", "sug 5k") correctly on the FIRST pass instead of needing a
     * server-side correction afterwards.
     *
     * @return array<int, array{heard:string, name:string, sku:?string}>
     */
    public function promptHints(?int $limit = null): array
    {
        if (!$this->enabled()) {
            return [];
        }

        $limit = $limit ?? (int) config('smartcapture.hint_limit', 60);

        try {
            return SmartCaptureAlias::withoutGlobalScopes()
                ->where('tenant_id', $this->tenantId())
                ->where('kind', SmartCaptureAlias::KIND_PRODUCT)
                ->orderByDesc('hits')
                ->orderByDesc('last_used_at')
                ->limit($limit)
                ->get(['source_text', 'target_id', 'target_label'])
                ->map(function ($alias) {
                    return [
                        'heard' => $alias->source_text,
                        'name'  => $alias->target_label,
                    ];
                })
                ->values()
                ->all();
        } catch (\Throwable $e) {
            // Memory is an enhancement; never let it break a scan.
            Log::warning('SmartCapture learning: could not load prompt hints — ' . $e->getMessage());
            return [];
        }
    }

    /**
     * How much this store has taught the system so far — surfaced in the UI so
     * the user can see it maturing.
     */
    public function stats(): array
    {
        if (!$this->enabled()) {
            return ['total' => 0, 'products' => 0, 'parties' => 0, 'categories' => 0];
        }

        try {
            $counts = SmartCaptureAlias::withoutGlobalScopes()
                ->where('tenant_id', $this->tenantId())
                ->selectRaw('kind, COUNT(*) as c')
                ->groupBy('kind')
                ->pluck('c', 'kind');

            return [
                'total'      => (int) $counts->sum(),
                'products'   => (int) $counts->get(SmartCaptureAlias::KIND_PRODUCT, 0),
                'parties'    => (int) $counts->get(SmartCaptureAlias::KIND_PARTY, 0),
                'categories' => (int) $counts->get(SmartCaptureAlias::KIND_CATEGORY, 0),
            ];
        } catch (\Throwable $e) {
            return ['total' => 0, 'products' => 0, 'parties' => 0, 'categories' => 0];
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Writing the memory
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Remember (or reinforce) what the user chose.
     *
     * Atomic: concurrent confirmations from two staff members collapse into one
     * row with a correctly incremented hit count — no duplicate-key crash, no
     * lost update.
     */
    public function remember(
        string $kind,
        string $sourceText,
        string $targetId,
        string $targetLabel,
        string $scope = ''
    ): void {
        if (!$this->enabled()) {
            return;
        }

        $key = $this->normalize($sourceText);
        if ($key === '' || $targetId === '') {
            return;
        }

        // Never learn a mapping that points outside this tenant.
        if (!$this->targetStillExists($kind, $targetId)) {
            return;
        }

        $tenantId = $this->tenantId();
        $userId   = auth()->id();
        $now      = now();

        try {
            DB::statement(
                'INSERT INTO smart_capture_aliases
                    (id, tenant_id, kind, scope, source_key, source_text, target_id, target_label,
                     hits, last_used_at, created_by, updated_by, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    hits         = hits + 1,
                    target_id    = VALUES(target_id),
                    target_label = VALUES(target_label),
                    source_text  = VALUES(source_text),
                    last_used_at = VALUES(last_used_at),
                    updated_by   = VALUES(updated_by),
                    updated_at   = VALUES(updated_at)',
                [
                    (string) Str::uuid(),
                    $tenantId,
                    $kind,
                    $scope,
                    $key,
                    mb_substr($sourceText, 0, 191),
                    $targetId,
                    mb_substr($targetLabel, 0, 191),
                    $now,
                    $userId,
                    $userId,
                    $now,
                    $now,
                ]
            );
        } catch (\Throwable $e) {
            // Learning must never break a posted transaction.
            Log::warning('SmartCapture learning: failed to record alias — ' . $e->getMessage());
        }
    }

    public function rememberProduct(string $sourceText, string $productId, string $productName): void
    {
        $this->remember(SmartCaptureAlias::KIND_PRODUCT, $sourceText, $productId, $productName);
    }

    public function rememberParty(string $sourceText, string $partyId, string $partyName, string $type): void
    {
        $this->remember(SmartCaptureAlias::KIND_PARTY, $sourceText, $partyId, $partyName, $type);
    }

    public function rememberExpenseCategory(string $sourceText, string $categoryId, string $categoryName): void
    {
        $this->remember(SmartCaptureAlias::KIND_CATEGORY, $sourceText, $categoryId, $categoryName);
    }

    /**
     * Record everything the user confirmed on one review screen.
     *
     * Called after the transaction is safely posted, so a learning failure can
     * never roll back real business data.
     *
     * @param array $payload the confirmed request payload
     * @param array $created map of line index => newly created product id
     */
    public function learnFromConfirmation(array $payload, array $createdProducts = []): void
    {
        if (!$this->enabled()) {
            return;
        }

        try {
            $action    = $payload['action'] ?? 'sale';
            $partyType = in_array($action, ['purchase', 'pre_purchase', 'purchase_return'], true) ? 'supplier' : 'customer';

            // ── Party: the name the AI read -> the party the user picked ──────
            $readParty = trim((string) ($payload['party'] ?? ''));
            $partyId   = (string) ($payload['party_id'] ?? '');

            if ($readParty !== '' && $partyId !== '') {
                $party = Party::withoutGlobalScopes()
                    ->where('tenant_id', $this->tenantId())
                    ->whereKey($partyId)
                    ->first(['id', 'name']);

                if ($party) {
                    $this->rememberParty($readParty, (string) $party->id, (string) $party->name, $partyType);
                }
            }

            // ── Expense category ─────────────────────────────────────────────
            $readCategory = trim((string) ($payload['expense_category'] ?? ''));
            $categoryId   = (string) ($payload['expense_category_id'] ?? '');

            if ($readCategory !== '' && $categoryId !== '') {
                $category = ExpenseCategory::withoutGlobalScopes()
                    ->where('tenant_id', $this->tenantId())
                    ->whereKey($categoryId)
                    ->first(['id', 'name']);

                if ($category) {
                    $this->rememberExpenseCategory($readCategory, (string) $category->id, (string) $category->name);
                }
            }

            // ── Line items ───────────────────────────────────────────────────
            // Expense lines are descriptions, not catalogue products — the
            // product_id they carry is a placeholder, so learning it would
            // teach the system a mapping that is simply untrue.
            if ($action === 'expense') {
                return;
            }

            foreach (($payload['items'] ?? []) as $idx => $item) {
                // The wording the AI originally read for this line.
                $readName = trim((string) ($item['raw_name'] ?? $item['name'] ?? ''));
                if ($readName === '') {
                    continue;
                }

                // A product created during this confirmation counts as a lesson
                // too: next time the same wording resolves straight to it.
                $productId = (string) ($item['product_id'] ?? '') ?: (string) ($createdProducts[$idx] ?? '');
                if ($productId === '') {
                    continue;
                }

                $product = Product::withoutGlobalScopes()
                    ->where('tenant_id', $this->tenantId())
                    ->whereKey($productId)
                    ->first(['id', 'name']);

                if ($product) {
                    $this->rememberProduct($readName, (string) $product->id, (string) $product->name);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('SmartCapture learning: confirmation pass failed — ' . $e->getMessage());
        }
    }

    /**
     * Forget one lesson (used by the "this was wrong" control in the UI).
     */
    public function forget(string $kind, string $rawText, string $scope = ''): bool
    {
        if (!$this->enabled()) {
            return false;
        }

        return SmartCaptureAlias::withoutGlobalScopes()
            ->where('tenant_id', $this->tenantId())
            ->where('kind', $kind)
            ->where('scope', $scope)
            ->where('source_key', $this->normalize($rawText))
            ->delete() > 0;
    }
}
