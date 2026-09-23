<?php

namespace App\Services\Approval\Adapters;

use App\Services\SupplierPaymentPostingService;
use App\Models\ApprovalDocument;
use App\Models\Party;
use App\Models\Purchase;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class SupplierPaymentApprovalAdapter implements ApprovalAdapterInterface
{
    public function __construct(
        private SupplierPaymentPostingService $postingService
    ) {}

    public function documentType(): string
    {
        return ApprovalDocument::TYPE_SUPPLIER_PAYMENT;
    }

    public function validatePayload(array $payload, Tenant $tenant, User $maker): array
    {
        $supplierId = $payload['supplier_id'] ?? null;
        if (!$supplierId || !Party::where('tenant_id', $tenant->id)->where('id', $supplierId)->exists()) {
            throw ValidationException::withMessages(['supplier_id' => 'Invalid or cross-tenant supplier selected.']);
        }

        $amount = (float)($payload['amount'] ?? 0);
        if ($amount <= 0) {
            throw ValidationException::withMessages(['amount' => 'Payment amount must be greater than zero.']);
        }

        $paymentMethod = $payload['payment_method'] ?? 'cash';
        if (!in_array($paymentMethod, ['cash', 'bank'], true)) {
            throw ValidationException::withMessages(['payment_method' => 'Payment method must be cash or bank.']);
        }

        $allocations = (array)($payload['allocations'] ?? []);
        $allocTotal = 0.0;
        foreach ($allocations as $i => $alloc) {
            $purchaseId = $alloc['purchase_id'] ?? null;
            $allocAmount = (float)($alloc['amount'] ?? 0);

            if ($allocAmount <= 0) {
                throw ValidationException::withMessages(["allocations.{$i}.amount" => 'Allocation amount must be positive.']);
            }

            if (class_exists(Purchase::class)) {
                $purchase = Purchase::where('tenant_id', $tenant->id)
                    ->where('id', $purchaseId)
                    ->where('party_id', $supplierId)
                    ->first();

                if (!$purchase) {
                    throw ValidationException::withMessages(["allocations.{$i}.purchase_id" => 'Purchase bill does not belong to the selected supplier or current store.']);
                }
            }

            $allocTotal += $allocAmount;
        }

        if (!empty($allocations) && round($allocTotal, 2) > round($amount, 2)) {
            throw ValidationException::withMessages(['allocations' => "Total allocations ({$allocTotal}) exceed payment amount ({$amount})."]);
        }

        return [
            'supplier_id'     => $supplierId,
            'payment_date'    => $payload['payment_date'] ?? now()->toDateString(),
            'payment_method'  => $paymentMethod,
            'bank_account_id' => $payload['bank_account_id'] ?? null,
            'amount'          => $amount,
            'reference'       => $payload['reference'] ?? null,
            'allocations'     => $allocations,
        ];
    }

    public function revalidate(ApprovalDocument $doc, Tenant $tenant, User $reviewer): void
    {
        $revision = $doc->currentRevision;
        if (!$revision) {
            throw new RuntimeException("Missing revision for approval document #{$doc->id}.");
        }

        $this->validatePayload($revision->payload, $tenant, $reviewer);
    }

    public function post(ApprovalDocument $doc, Tenant $tenant, User $reviewer): array
    {
        $payload = $doc->currentRevision->payload;
        $result = $this->postingService->post($tenant, $payload, $reviewer);

        return [
            'type'             => 'journal_entry',
            'id'               => $result['journal_entry_id'],
            'reference'        => $result['reference'],
            'journal_entry_id' => $result['journal_entry_id'],
        ];
    }
}
