<?php

namespace App\Services\Approval\Adapters;

use App\Services\CustomerPaymentPostingService;
use App\Models\ApprovalDocument;
use App\Models\Party;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class CustomerReceiptApprovalAdapter implements ApprovalAdapterInterface
{
    public function __construct(
        private CustomerPaymentPostingService $postingService
    ) {}

    public function documentType(): string
    {
        return ApprovalDocument::TYPE_CUSTOMER_RECEIPT;
    }

    public function validatePayload(array $payload, Tenant $tenant, User $maker): array
    {
        $customerId = $payload['customer_id'] ?? null;
        if (!$customerId || !Party::where('tenant_id', $tenant->id)->where('id', $customerId)->exists()) {
            throw ValidationException::withMessages(['customer_id' => 'Invalid or cross-tenant customer selected.']);
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
        if (empty($allocations)) {
            throw ValidationException::withMessages(['allocations' => 'At least one invoice allocation is required.']);
        }

        $allocTotal = 0.0;
        foreach ($allocations as $i => $alloc) {
            $saleId = $alloc['sale_id'] ?? null;
            $allocAmount = (float)($alloc['amount'] ?? 0);

            if ($allocAmount <= 0) {
                throw ValidationException::withMessages(["allocations.{$i}.amount" => 'Allocation amount must be positive.']);
            }

            $sale = Sale::where('tenant_id', $tenant->id)
                ->where('id', $saleId)
                ->where('party_id', $customerId)
                ->first();

            if (!$sale) {
                throw ValidationException::withMessages(["allocations.{$i}.sale_id" => 'Invoice does not belong to the selected customer or current store.']);
            }

            $allocTotal += $allocAmount;
        }

        if (round($allocTotal, 2) > round($amount, 2)) {
            throw ValidationException::withMessages(['allocations' => "Total allocations ({$allocTotal}) exceed payment amount ({$amount})."]);
        }

        return [
            'customer_id'     => $customerId,
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
