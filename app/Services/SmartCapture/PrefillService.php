<?php

namespace App\Services\SmartCapture;

use App\Models\ExpenseCategory;
use App\Models\Party;
use App\Models\Product;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * PrefillService — carries a reviewed AI Scan into the normal creation screen.
 *
 * Why this exists
 * ───────────────
 * A posted Sale is financially immutable (App\Observers\SaleObserver aborts on
 * any change to a financial column) and can only be corrected with a credit
 * note. So AI Scan must not turn an OCR reading into a posted invoice in one
 * click. Instead, for those document types it hands the reviewed lines to the
 * screen the user already knows — Sales/CreateInvoice, Purchases/Create — where
 * they do the final check and press Save themselves.
 *
 * How it travels
 * ──────────────
 * The payload is stored server-side under a random key and the user is
 * redirected to the creation screen with `?ai_prefill=<key>`. Nothing sensitive
 * rides in the URL, the payload cannot be tampered with, and it is:
 *
 *   - scoped to the tenant AND the user who created it,
 *   - single use (consumed on read, so a refresh cannot duplicate an entry),
 *   - short lived (config smartcapture.prefill_ttl_minutes).
 */
class PrefillService
{
    /**
     * Store a reviewed scan and return the key to put in the redirect URL.
     */
    public function put(array $payload): string
    {
        $key = (string) Str::uuid();

        Cache::put(
            $this->cacheKey($key),
            $payload,
            now()->addMinutes((int) config('smartcapture.prefill_ttl_minutes', 30))
        );

        return $key;
    }

    /**
     * Consume a stored scan. Returns null if the key is unknown, expired, or
     * belongs to another store or another user.
     */
    public function pull(?string $key): ?array
    {
        if (!$key) {
            return null;
        }

        $cacheKey = $this->cacheKey($key);
        $payload  = Cache::get($cacheKey);

        if (!is_array($payload)) {
            return null;
        }

        // Single use: a page refresh must not re-apply the same scan.
        Cache::forget($cacheKey);

        return $payload;
    }

    /**
     * Read without consuming — for tests and diagnostics only.
     */
    public function peek(?string $key): ?array
    {
        return $key ? Cache::get($this->cacheKey($key)) : null;
    }

    private function cacheKey(string $key): string
    {
        $tenantId = app()->bound('current.tenant') ? app('current.tenant')->id : 'no-tenant';
        $userId   = auth()->id() ?? 'guest';

        return "smartcapture:prefill:{$tenantId}:{$userId}:{$key}";
    }

    /**
     * Turn a confirmed AI Scan review into the shape the creation screens expect.
     *
     * Full product and party records are embedded, because those screens render
     * from product objects (price, cost, stock, tax rate) rather than ids.
     */
    public function buildFromConfirmation(array $data, array $resolvedItems): array
    {
        $tenantId = app('current.tenant')->id;
        $action   = $data['action'] ?? 'sale';

        $partyId = $data['party_id'] ?? null;
        $party   = $partyId
            ? Party::where('tenant_id', $tenantId)->whereKey($partyId)->first()
            : null;

        $categoryId = $data['expense_category_id'] ?? null;
        $category   = $categoryId
            ? ExpenseCategory::where('tenant_id', $tenantId)->whereKey($categoryId)->first(['id', 'name'])
            : null;

        // One query for every product on the document.
        $productIds = collect($resolvedItems)->pluck('product_id')->filter()->unique()->values();
        $products   = Product::where('tenant_id', $tenantId)
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        $items = [];

        foreach ($resolvedItems as $item) {
            $product = $products->get($item['product_id'] ?? null);

            if (!$product && $action !== 'expense') {
                continue;
            }

            $qty       = (float) ($item['qty'] ?? 1);
            $unitPrice = (float) ($item['unit_price'] ?? 0);

            $items[] = [
                'product'      => $product,
                'product_id'   => $product?->id,
                'name'         => $product?->name ?? ($item['raw_name'] ?? $item['name'] ?? ''),
                'quantity'     => $qty,
                'price'        => $unitPrice,
                'discount'     => 0,
                'discountType' => 'fixed',
                // Kept so the creation screen can show what the AI originally read.
                'ai_raw_name'  => $item['raw_name'] ?? $item['name'] ?? null,
                // Flags a purchase line whose cost differs from the catalogue,
                // because that silently changes FIFO cost and future COGS.
                'cost_changed' => $this->costChanged($action, $product, $unitPrice),
                'catalog_cost' => $product?->cost_price !== null ? (float) $product->cost_price : null,
            ];
        }

        return [
            'source'            => 'ai_scan',
            'action'            => $action,
            'label'             => config("smartcapture.document_policy.{$action}.label", ucfirst($action)),
            'party'             => $party,
            'party_id'          => $party?->id,
            'expense_category'  => $category,
            'date'              => $data['date'] ?? null,
            'reference'         => $data['reference'] ?? null,
            'notes'             => $data['notes'] ?? null,
            'payment_method'    => $data['payment_method'] ?? 'cash',
            'items'             => $items,
            'created_at'        => now()->toIso8601String(),
        ];
    }

    /**
     * A purchase line priced differently from the catalogue cost will change
     * the FIFO layer and therefore every future COGS calculation. The user
     * should see that before it happens, not discover it in a margin report.
     */
    private function costChanged(string $action, ?Product $product, float $unitPrice): bool
    {
        if (!$product || !in_array($action, ['purchase', 'pre_purchase'], true)) {
            return false;
        }

        $catalogCost = (float) ($product->cost_price ?? 0);

        if ($catalogCost <= 0) {
            return false;
        }

        // Ignore rounding noise; flag a real move.
        return abs($catalogCost - $unitPrice) > max(0.01, $catalogCost * 0.005);
    }
}
