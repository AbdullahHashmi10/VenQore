<?php

namespace App\Services\Approval\Adapters;

use App\Engines\PurchaseService as EnginePurchaseService;
use App\Models\ApprovalDocument;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/**
 * Purchase Return — returns goods to a supplier and reverses AP/inventory GL.
 * Delegates entirely to PurchaseService::createReturn().
 */
class PurchaseReturnApprovalAdapter implements ApprovalAdapterInterface
{
    public function __construct(
        private EnginePurchaseService $purchaseService
    ) {}

    public function documentType(): string
    {
        return ApprovalDocument::TYPE_PURCHASE_RETURN;
    }

    public function validatePayload(array $payload, Tenant $tenant, User $maker): array
    {
        $purchaseId = $payload['purchase_id'] ?? null;
        if (!$purchaseId) {
            throw ValidationException::withMessages(['purchase_id' => 'A purchase ID is required for a purchase return.']);
        }

        $purchase = Purchase::where('id', $purchaseId)->where('tenant_id', $tenant->id)->first();

        if (!$purchase) {
            throw ValidationException::withMessages(['purchase_id' => 'Purchase not found or does not belong to this store.']);
        }

        if ($purchase->workflow_status === 'cancelled') {
            throw ValidationException::withMessages(['purchase_id' => 'A cancelled purchase cannot have items returned.']);
        }

        $items = (array)($payload['items'] ?? []);
        if (empty($items)) {
            throw ValidationException::withMessages(['items' => 'At least one return line is required.']);
        }

        foreach ($items as $i => $item) {
            $purchaseItemId = $item['purchase_item_id'] ?? null;
            $qtyReturned    = (float)($item['qty_returned'] ?? $item['return_qty'] ?? 0);

            if (!$purchaseItemId) {
                throw ValidationException::withMessages(["items.{$i}.purchase_item_id" => 'Purchase item ID is required.']);
            }

            if ($qtyReturned <= 0) {
                throw ValidationException::withMessages(["items.{$i}.qty_returned" => 'Return quantity must be greater than zero.']);
            }

            $purchaseItem = PurchaseItem::where('id', $purchaseItemId)->where('purchase_id', $purchaseId)->first();
            if (!$purchaseItem) {
                throw ValidationException::withMessages(["items.{$i}.purchase_item_id" => "Purchase item #{$purchaseItemId} not found on this purchase."]);
            }

            $alreadyReturned = (float)($purchaseItem->returned_qty ?? 0);
            $maxReturnable   = (float)$purchaseItem->qty - $alreadyReturned;

            if ($qtyReturned > $maxReturnable) {
                throw ValidationException::withMessages(["items.{$i}.qty_returned" => "Cannot return more than the unreturned quantity ({$maxReturnable})."]);
            }
        }

        $reason = trim($payload['reason'] ?? '');
        if ($reason === '') {
            throw ValidationException::withMessages(['reason' => 'A reason is required for a purchase return.']);
        }

        // R08 FIX: preserve return_date — PurchaseService::createReturn() reads
        // $data['return_date'] for both the journal entry date and the
        // purchase_returns.return_date column. Dropping it caused null dates.
        return [
            'purchase_id' => $purchaseId,
            'items'       => $items,
            'reason'      => $reason,
            'return_date' => $payload['return_date'] ?? now()->toDateString(),
        ];
    }

    public function revalidate(ApprovalDocument $doc, Tenant $tenant, User $reviewer): void
    {
        $revision = $doc->currentRevision;
        if (!$revision) {
            throw new RuntimeException("Missing revision for approval document #{$doc->id}.");
        }

        $purchaseId = $revision->payload['purchase_id'] ?? null;
        $purchase   = $purchaseId ? Purchase::where('id', $purchaseId)->where('tenant_id', $tenant->id)->first() : null;

        if (!$purchase) {
            throw new RuntimeException('Purchase no longer exists or changed tenant.');
        }

        if ($purchase->workflow_status === 'cancelled') {
            throw new RuntimeException('Purchase was cancelled while this return was pending approval.');
        }
    }

    public function post(ApprovalDocument $doc, Tenant $tenant, User $reviewer): array
    {
        $payload    = $doc->currentRevision->payload;
        $purchaseId = $payload['purchase_id'];

        app()->instance('current.tenant', $tenant);

        $result = $this->purchaseService->createReturn($purchaseId, [
            'items'       => $payload['items'],
            'reason'      => $payload['reason'],
            // R08 FIX: return_date must be passed — PurchaseService::createReturn()
            // uses it for both the journal entry date and purchase_returns.return_date.
            'return_date' => $payload['return_date'] ?? now()->toDateString(),
        ]);

        return [
            'type'        => 'purchase_return',
            'purchase_id' => $purchaseId,
            'id'          => $result->id ?? ($result['id'] ?? null),
            'reference'   => $result->reference ?? ($result['reference'] ?? null),
        ];
    }

    public function reviewerEligibilityPermissions(): array
    {
        return ['purchases.returns'];
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
