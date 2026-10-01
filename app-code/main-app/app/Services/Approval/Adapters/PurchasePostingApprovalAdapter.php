<?php

namespace App\Services\Approval\Adapters;

use App\Models\ApprovalDocument;
use App\Models\Party;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\V3\PurchaseService;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/**
 * Purchase Bill Posting — records goods received from a supplier and posts the
 * AP liability + inventory assets to the ledger via PurchaseService.
 */
class PurchasePostingApprovalAdapter implements ApprovalAdapterInterface
{
    public function __construct(
        private PurchaseService $purchaseService
    ) {}

    public function documentType(): string
    {
        return ApprovalDocument::TYPE_PURCHASE_POSTING;
    }

    public function validatePayload(array $payload, Tenant $tenant, User $maker): array
    {
        if (($payload['_path'] ?? null) === 'receive') {
            return $this->validateReceivePayload($payload, $tenant);
        }

        $supplierId = $payload['supplier_id'] ?? $payload['party_id'] ?? null;
        $partyExists = $supplierId && Party::where('tenant_id', $tenant->id)
            ->where('id', $supplierId)
            ->exists();

        if (!$partyExists && $supplierId && \Illuminate\Support\Facades\Schema::hasTable('suppliers')) {
            $suppliersAreTenantScoped = \Illuminate\Support\Facades\Schema::hasColumn('suppliers', 'tenant_id');
            $partyExists = \Illuminate\Support\Facades\DB::table('suppliers')
                ->when($suppliersAreTenantScoped, fn($q) => $q->where('tenant_id', $tenant->id))
                ->where('id', $supplierId)
                ->exists();
        }

        if (!$partyExists) {
            throw ValidationException::withMessages(['supplier_id' => 'Invalid or cross-tenant supplier.']);
        }

        $items = (array)($payload['items'] ?? []);
        if (empty($items)) {
            throw ValidationException::withMessages(['items' => 'At least one purchase line is required.']);
        }

        foreach ($items as $i => $item) {
            $qty      = (float)($item['qty'] ?? $item['quantity'] ?? 0);
            $unitCost = (float)($item['unit_cost'] ?? $item['unit_price'] ?? 0);

            if ($qty <= 0) {
                throw ValidationException::withMessages(["items.{$i}.qty" => 'Quantity must be greater than zero.']);
            }
            if ($unitCost < 0) {
                throw ValidationException::withMessages(["items.{$i}.unit_cost" => 'Unit cost cannot be negative.']);
            }

            $productId = $item['product_id'] ?? null;
            if ($productId && !Product::where('tenant_id', $tenant->id)->where('id', $productId)->exists()) {
                throw ValidationException::withMessages(["items.{$i}.product_id" => 'Product does not belong to this store.']);
            }
        }

        $warehouseId = $payload['warehouse_id'] ?? null;
        if ($warehouseId && !Warehouse::where('tenant_id', $tenant->id)->where('id', $warehouseId)->exists()) {
            throw ValidationException::withMessages(['warehouse_id' => 'Warehouse does not belong to this store.']);
        }

        return [
            'supplier_id'        => $supplierId,
            'party_id'           => $supplierId,
            'purchase_date'      => $payload['purchase_date'] ?? $payload['date'] ?? now()->toDateString(),
            'due_date'           => $payload['due_date'] ?? null,
            'items'              => $items,
            'discount'           => (float)($payload['discount'] ?? 0),
            'round_off'          => (float)($payload['round_off'] ?? 0),
            'tax'                => (float)($payload['tax'] ?? 0),
            'notes'              => $payload['notes'] ?? null,
            'reference'          => $payload['reference'] ?? null,
            'supplier_invoice'   => $payload['supplier_invoice'] ?? null,
            'payment_method'     => $payload['payment_method'] ?? 'credit',
            'amount_paid'        => (float)($payload['amount_paid'] ?? 0),
            // R07 FIX: preserve payment_account_id — dropping it silently forced the
            // payment to the default Cash/Bank account regardless of user selection.
            'payment_account_id' => $payload['payment_account_id'] ?? null,
            'warehouse_id'       => $warehouseId,
            // R07 FIX: preserve extras (landed costs) — the direct path passes them
            // to PurchaseService which distributes freight/customs across line costs.
            'extras'             => $payload['extras'] ?? [],
            // R07 FIX: respect the requested workflow_status; do not force 'received'.
            // The direct path uses the form value; approval posting must do the same.
            // Default to 'received' only when not specified.
            'workflow_status'    => $payload['workflow_status'] ?? 'received',
        ];
    }

    public function revalidate(ApprovalDocument $doc, Tenant $tenant, User $reviewer): void
    {
        $revision = $doc->currentRevision;
        if (!$revision) {
            throw new RuntimeException("Missing revision for approval document #{$doc->id}.");
        }

        if (($revision->payload['_path'] ?? null) === 'receive') {
            $purchaseId = $revision->payload['purchase_id'] ?? null;
            $purchase   = $purchaseId ? Purchase::where('id', $purchaseId)->where('tenant_id', $tenant->id)->first() : null;
            if (!$purchase) {
                throw new RuntimeException('Purchase no longer exists or changed tenant.');
            }
            if (($purchase->workflow_status ?? null) === 'cancelled') {
                throw new RuntimeException('Purchase was cancelled while this receipt was pending approval.');
            }
            if (($purchase->workflow_status ?? null) === 'received') {
                throw new RuntimeException('Purchase was already fully received while this receipt was pending approval.');
            }
            return;
        }

        $this->validatePayload($revision->payload, $tenant, $reviewer);
    }

    /**
     * Validate the payload for a goods-receipt against an existing purchase
     * (PO receive — Phase 1 sub-group 6b). Distinct shape from a new purchase:
     * items reference purchase_item_id + receiving_qty, not product/qty/cost.
     */
    private function validateReceivePayload(array $payload, Tenant $tenant): array
    {
        $purchaseId = $payload['purchase_id'] ?? null;
        if (!$purchaseId) {
            throw ValidationException::withMessages(['purchase_id' => 'A purchase ID is required to receive goods.']);
        }

        $purchase = Purchase::where('id', $purchaseId)->where('tenant_id', $tenant->id)->first();
        if (!$purchase) {
            throw ValidationException::withMessages(['purchase_id' => 'Purchase not found or does not belong to this store.']);
        }
        if (($purchase->workflow_status ?? null) === 'cancelled') {
            throw ValidationException::withMessages(['purchase_id' => 'A cancelled purchase cannot be received.']);
        }
        if (($purchase->workflow_status ?? null) === 'received') {
            throw ValidationException::withMessages(['purchase_id' => 'This purchase has already been fully received.']);
        }

        $items = (array)($payload['items'] ?? []);
        if (empty($items)) {
            throw ValidationException::withMessages(['items' => 'At least one receiving line is required.']);
        }

        foreach ($items as $i => $item) {
            $purchaseItemId = $item['purchase_item_id'] ?? null;
            $recvQty        = (float)($item['receiving_qty'] ?? 0);

            if (!$purchaseItemId) {
                throw ValidationException::withMessages(["items.{$i}.purchase_item_id" => 'Purchase item ID is required.']);
            }
            if ($recvQty < 0) {
                throw ValidationException::withMessages(["items.{$i}.receiving_qty" => 'Receiving quantity cannot be negative.']);
            }

            $purchaseItem = PurchaseItem::where('id', $purchaseItemId)->where('purchase_id', $purchaseId)->first();
            if (!$purchaseItem) {
                throw ValidationException::withMessages(["items.{$i}.purchase_item_id" => "Purchase item #{$purchaseItemId} not found on this purchase."]);
            }

            $remaining = (float)$purchaseItem->qty - (float)($purchaseItem->received_qty ?? 0);
            if ($recvQty > $remaining + 0.0001) {
                throw ValidationException::withMessages(["items.{$i}.receiving_qty" => "Cannot receive {$recvQty} — only {$remaining} remaining on this line."]);
            }
        }

        return [
            '_path'       => 'receive',
            'purchase_id' => $purchaseId,
            'items'       => $items,
            'notes'       => $payload['notes'] ?? null,
        ];
    }

    public function post(ApprovalDocument $doc, Tenant $tenant, User $reviewer): array
    {
        $payload = $doc->currentRevision->payload;

        app()->instance('current.tenant', $tenant);

        if (($payload['_path'] ?? null) === 'receive') {
            $result = $this->purchaseService->receive($payload['purchase_id'], $payload['items']);

            $note = trim((string)($payload['notes'] ?? ''));
            if ($note !== '') {
                $purchase = Purchase::find($payload['purchase_id']);
                if ($purchase) {
                    $stamp = now()->format('d M Y') . ' receipt: ' . $note;
                    $purchase->update([
                        'notes' => $purchase->notes ? $purchase->notes . "\n" . $stamp : $stamp,
                    ]);
                }
            }

            return [
                'type'            => 'purchase_receive',
                'purchase_id'     => $payload['purchase_id'],
                'workflow_status' => $result['workflow_status'] ?? null,
            ];
        }

        $purchase = $this->purchaseService->createPurchase($payload);

        return [
            'type'      => 'purchase',
            'id'        => $purchase->id ?? $purchase['id'],
            'reference' => $purchase->invoice_number ?? ($purchase['invoice_number'] ?? null),
            'total'     => (float)($purchase->total ?? ($purchase['total'] ?? 0)),
        ];
    }

    public function reviewerEligibilityPermissions(): array
    {
        return ['purchases.create', 'purchases.edit'];
    }

    /**
     * R10: No AND-semantics permission requirements for this adapter type.
     * The OR list in reviewerEligibilityPermissions() is sufficient.
     */
    public function reviewerEligibilityPermissionsAll(): array
    {
        return [];
    }
}
