<?php

namespace App\Services\Approval\Adapters;

use App\Engines\SaleReversalService;
use App\Engines\SaleService;
use App\Models\ApprovalDocument;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\User;
use App\Services\LegacySalesReturnService;
use App\Services\PosReturnService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/**
 * Sales Return / Cancellation adapter.
 *
 * Three posting paths, selected by `_path` in the payload:
 *
 *   direct_reversal_full  — SaleController full return (default when no _path)
 *                           delegates to SaleReversalService::reverse()
 *   direct_reversal_partial — SaleController partial return
 *                           delegates to SaleService::reverse() with items[]
 *   legacy_sret           — ReturnController SRET (credit-note-style, item-level)
 *                           delegates to LegacySalesReturnService::process()
 *   pos_return            — PosReturnController anonymous open return
 *                           delegates to PosReturnService::process()
 *
 * A reviewer must hold BOTH sales.edit AND finance.customer_refund.
 */
class SalesReturnApprovalAdapter implements ApprovalAdapterInterface
{
    public function __construct(
        private SaleReversalService $reversalService,
        private SaleService $saleService,
        private LegacySalesReturnService $legacyService,
        private PosReturnService $posReturnService,
    ) {}

    public function documentType(): string
    {
        return ApprovalDocument::TYPE_SALES_RETURN;
    }

    public function validatePayload(array $payload, Tenant $tenant, User $maker): array
    {
        $path = $payload['_path'] ?? 'direct_reversal_full';

        // ── Legacy SRET path ──────────────────────────────────────────────────
        if ($path === 'legacy_sret') {
            return $this->validateLegacySret($payload, $tenant);
        }

        // ── POS open return path ───────────────────────────────────────────────
        if ($path === 'pos_return') {
            return $this->validatePosReturn($payload, $tenant);
        }

        // ── Direct reversal (full or partial) ─────────────────────────────────
        $saleId = $payload['sale_id'] ?? null;
        if (!$saleId) {
            throw ValidationException::withMessages(['sale_id' => 'A sale ID is required for a sales return.']);
        }

        $sale = Sale::where('id', $saleId)->where('tenant_id', $tenant->id)->first();
        if (!$sale) {
            throw ValidationException::withMessages(['sale_id' => 'Sale not found or does not belong to this store.']);
        }

        if (!in_array($sale->status, ['posted', 'partially_returned'], true)) {
            throw ValidationException::withMessages([
                'sale_id' => "Sale #{$sale->reference_number} has status '{$sale->status}' and cannot be reversed.",
            ]);
        }

        $reason = trim($payload['reason'] ?? '');
        if ($reason === '') {
            throw ValidationException::withMessages(['reason' => 'A reason is required for a sales return.']);
        }

        $items = $payload['items'] ?? [];
        $resolvedPath = empty($items) ? 'direct_reversal_full' : 'direct_reversal_partial';

        return [
            '_path'   => $resolvedPath,
            'sale_id' => $saleId,
            'type'    => $payload['type'] ?? 'returned',
            'reason'  => $reason,
            'items'   => $items,
        ];
    }

    public function revalidate(ApprovalDocument $doc, Tenant $tenant, User $reviewer): void
    {
        $revision = $doc->currentRevision;
        if (!$revision) {
            throw new RuntimeException("Missing revision for approval document #{$doc->id}.");
        }

        $payload = $revision->payload;
        $path    = $payload['_path'] ?? 'direct_reversal_full';

        if ($path === 'legacy_sret') {
            // Re-check cap: ensure quantities are still returnable
            app(LegacySalesReturnService::class)->validateCaps($payload, $tenant);
            return;
        }

        if ($path === 'pos_return') {
            // Scope check: products and warehouse still belong to this store
            $productIds   = collect($payload['items'] ?? [])->pluck('product_id')->unique();
            $ownProducts  = DB::table('products')->where('tenant_id', $tenant->id)->whereIn('id', $productIds)->count();
            $ownWarehouse = DB::table('warehouses')->where('tenant_id', $tenant->id)->where('id', $payload['warehouse_id'])->exists();
            if ($ownProducts !== $productIds->count() || !$ownWarehouse) {
                throw new RuntimeException('Product or warehouse no longer belongs to this store.');
            }
            return;
        }

        // Direct reversal: check sale still reversible
        $saleId = $payload['sale_id'] ?? null;
        $sale   = $saleId ? Sale::where('id', $saleId)->where('tenant_id', $tenant->id)->first() : null;

        if (!$sale) {
            throw new RuntimeException("Sale no longer exists or changed tenant.");
        }

        if (!in_array($sale->status, ['posted', 'partially_returned'], true)) {
            throw new RuntimeException(
                "Sale #{$sale->reference_number} is now '{$sale->status}' and can no longer be reversed."
            );
        }
    }

    public function post(ApprovalDocument $doc, Tenant $tenant, User $reviewer): array
    {
        $payload = $doc->currentRevision->payload;
        $path    = $payload['_path'] ?? 'direct_reversal_full';

        app()->instance('current.tenant', $tenant);

        // ── Legacy SRET path ──────────────────────────────────────────────────
        if ($path === 'legacy_sret') {
            // Re-check caps one final time inside the engine's transaction wrapper
            $this->legacyService->validateCaps($payload, $tenant);

            $result = DB::transaction(fn () =>
                $this->legacyService->process($payload, $tenant, $reviewer)
            );

            return [
                'type'             => 'legacy_sret',
                'sale_id'          => $result['return_id'],
                'reference'        => $result['reference_number'],
                'refunded'         => $result['refunded'],
                'credited'         => $result['credited'],
                'return_value'     => $result['return_value'],
            ];
        }

        // ── POS open return path ───────────────────────────────────────────────
        if ($path === 'pos_return') {
            $result = $this->posReturnService->process($payload, $tenant, $reviewer);

            return [
                'type'      => 'pos_return',
                'reference' => $result['reference'],
                'total'     => $result['total'],
            ];
        }

        // ── Direct partial return ──────────────────────────────────────────────
        if ($path === 'direct_reversal_partial') {
            $sale = Sale::where('id', $payload['sale_id'])->where('tenant_id', $tenant->id)->firstOrFail();

            $engineItems = array_map(fn ($item) => [
                'sale_item_id' => (string) $item['sale_item_id'],
                'return_qty'   => (float) ($item['return_qty'] ?? $item['qty_returned'] ?? $item['quantity'] ?? 0),
            ], $payload['items']);

            DB::transaction(fn () =>
                $this->saleService->reverse(
                    saleId: (string) $sale->id,
                    reason: $payload['reason'],
                    items:  $engineItems,
                )
            );

            return [
                'type'      => 'sale_partial_reversal',
                'sale_id'   => $sale->id,
                'reference' => $sale->reference_number,
            ];
        }

        // ── Direct full return (default) ───────────────────────────────────────
        $sale = Sale::where('id', $payload['sale_id'])->where('tenant_id', $tenant->id)->firstOrFail();

        $summary = $this->reversalService->reverse(
            $sale,
            $payload['type'] ?? 'returned',
            $payload['reason'],
            (string) $reviewer->id
        );

        return [
            'type'             => 'sale_reversal',
            'sale_id'          => $sale->id,
            'reference'        => $sale->reference_number,
            'reversal_type'    => $payload['type'] ?? 'returned',
            'items_restored'   => $summary['items_restored'] ?? 0,
            'journal_reversed' => $summary['journal_reversed'] ?? false,
        ];
    }

    public function reviewerEligibilityPermissions(): array
    {
        // A sales return always involves returning money to the customer.
        // The reviewer must hold BOTH the sales-edit permission AND the
        // customer-refund finance permission — either alone is not enough.
        return ['sales.edit', 'finance.customer_refund'];
    }

    // ── Private validators ─────────────────────────────────────────────────────

    private function validateLegacySret(array $payload, Tenant $tenant): array
    {
        if (empty($payload['customer_id'])) {
            throw ValidationException::withMessages(['customer_id' => 'Customer is required.']);
        }
        if (empty($payload['original_sale_id'])) {
            throw ValidationException::withMessages(['original_sale_id' => 'Original sale ID is required.']);
        }

        // Scope check
        $exists = DB::table('sales')
            ->where('id', $payload['original_sale_id'])
            ->where('tenant_id', $tenant->id)
            ->whereNull('deleted_at')
            ->exists();
        if (!$exists) {
            throw ValidationException::withMessages(['original_sale_id' => 'Original sale not found or cross-tenant.']);
        }

        if (empty($payload['items'])) {
            throw ValidationException::withMessages(['items' => 'At least one return line is required.']);
        }

        if ((float) ($payload['amount_refunded'] ?? 0) < 0) {
            throw ValidationException::withMessages(['amount_refunded' => 'Refund amount cannot be negative.']);
        }

        // Cap check (at submission time — re-checked at posting time)
        app(LegacySalesReturnService::class)->validateCaps($payload, $tenant);

        return array_merge($payload, ['_path' => 'legacy_sret']);
    }

    private function validatePosReturn(array $payload, Tenant $tenant): array
    {
        if (empty($payload['items'])) {
            throw ValidationException::withMessages(['items' => 'At least one item is required for a POS return.']);
        }

        if (empty($payload['warehouse_id'])) {
            throw ValidationException::withMessages(['warehouse_id' => 'Warehouse is required.']);
        }

        // Scope check
        $productIds  = collect($payload['items'])->pluck('product_id')->unique();
        $ownProducts = DB::table('products')->where('tenant_id', $tenant->id)->whereIn('id', $productIds)->count();
        $ownWarehouse = DB::table('warehouses')->where('tenant_id', $tenant->id)->where('id', $payload['warehouse_id'])->exists();
        if ($ownProducts !== $productIds->count() || !$ownWarehouse) {
            throw ValidationException::withMessages(['warehouse_id' => 'Product or warehouse not found for this store.']);
        }

        foreach ($payload['items'] as $i => $item) {
            if (empty($item['product_id'])) {
                throw ValidationException::withMessages(["items.{$i}.product_id" => 'Product ID is required.']);
            }
            if ((float) ($item['quantity'] ?? 0) <= 0) {
                throw ValidationException::withMessages(["items.{$i}.quantity" => 'Quantity must be greater than zero.']);
            }
            if ((float) ($item['price'] ?? 0) < 0) {
                throw ValidationException::withMessages(["items.{$i}.price" => 'Price cannot be negative.']);
            }
        }

        return array_merge($payload, ['_path' => 'pos_return']);
    }

    /**
     * R10 FIX: SalesReturn requires BOTH permissions, not just one.
     * A reviewer must hold sales.edit AND finance.customer_refund —
     * having only one is not enough business authority for this operation.
     */
    public function reviewerEligibilityPermissionsAll(): array
    {
        return ['sales.edit', 'finance.customer_refund'];
    }
}
