<?php

namespace App\Services\Approval\Adapters;

use App\Engines\AccountingService;
use App\Engines\PaymentService;
use App\Models\ApprovalDocument;
use App\Models\BankAccount;
use App\Models\Party;
use App\Models\Purchase;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class SupplierPaymentApprovalAdapter implements ApprovalAdapterInterface
{
    public function __construct(
        private AccountingService $accounting,
        private PaymentService $payments
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
        $tenantId = $tenant->id;

        $paymentAccount = $payload['payment_method'] === 'bank' ? '1010' : '1000';
        $bankAccountId = $payload['bank_account_id'] ?? null;

        if ($payload['payment_method'] === 'bank' && empty($bankAccountId)) {
            $firstBank = BankAccount::where('tenant_id', $tenantId)
                ->where('type', 'bank')
                ->first();
            $bankAccountId = $firstBank?->id;
        }

        // Create General Ledger Journal: DR 2000 Accounts Payable, CR 1000/1010 Cash/Bank
        $journalEntry = $this->accounting->createEntry([
            'date'           => $payload['payment_date'],
            'reference_type' => 'supplier_payment',
            'reference'      => $payload['reference'] ?: ('APP-SUP-' . strtoupper(uniqid())),
            'description'    => 'Supplier payment (Approved) — ' . ($payload['reference'] ?? ''),
            'party_id'       => $payload['supplier_id'],
            'user_id'        => $reviewer->id ?? $doc->maker_id,
            'approved_by'    => $reviewer->id,
        ], [
            [
                'account_code' => '2000',
                'debit'        => $payload['amount'],
                'credit'       => 0,
                'party_id'     => $payload['supplier_id'],
            ],
            [
                'account_code'    => $paymentAccount,
                'debit'           => 0,
                'credit'          => $payload['amount'],
                'bank_account_id' => $payload['payment_method'] === 'bank' ? $bankAccountId : null,
            ],
        ]);

        if (!empty($payload['allocations'])) {
            $allocations = array_map(fn($a) => [
                'purchase_id' => $a['purchase_id'],
                'amount'      => $a['amount'],
            ], $payload['allocations']);

            $this->payments->allocate($journalEntry->id, $allocations);
        }

        return [
            'type'            => 'journal_entry',
            'id'              => $journalEntry->id,
            'reference'       => $journalEntry->reference,
            'journal_entry_id'=> $journalEntry->id,
        ];
    }
}
