<?php

namespace App\Services\Approval\Adapters;

use App\Engines\AccountingService;
use App\Models\ApprovalDocument;
use App\Models\BankAccount;
use App\Models\FundTransaction;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/**
 * Owner Drawings — owner withdraws funds from the business for personal use.
 *
 * GL posting:
 *   DR 3100  Owner's Drawings         (permanent reduction of equity)
 *   CR 1000  Cash / 1010 Bank         (money leaving the business)
 *
 * ref_type: 'owner_drawing'
 */
class OwnerDrawingsApprovalAdapter implements ApprovalAdapterInterface
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    public function documentType(): string
    {
        return ApprovalDocument::TYPE_OWNER_DRAWINGS;
    }

    public function validatePayload(array $payload, Tenant $tenant, User $maker): array
    {
        $amount = (float)($payload['amount'] ?? 0);
        if ($amount <= 0) {
            throw ValidationException::withMessages(['amount' => 'Drawing amount must be greater than zero.']);
        }

        // R05 FIX: The legacy FundController::removeFunds() form submits account_type
        // ('cash'|'bank'), not payment_method. The adapter previously defaulted to
        // 'cash', so all legacy drawing submissions credited Cash (1000) even when
        // the user chose Bank (1010). Accept both; payment_method takes precedence.
        $paymentMethod = $payload['payment_method'] ?? $payload['account_type'] ?? 'cash';
        if (!in_array($paymentMethod, ['cash', 'bank'], true)) {
            throw ValidationException::withMessages(['payment_method' => 'Payment method must be cash or bank.']);
        }

        return [
            'amount'          => $amount,
            'payment_method'  => $paymentMethod,
            'bank_account_id' => $payload['bank_account_id'] ?? null,
            'date'            => $payload['date'] ?? $payload['drawing_date'] ?? $payload['transaction_date'] ?? now()->toDateString(),
            'notes'           => $payload['notes'] ?? $payload['reason'] ?? $payload['description'] ?? null,
        ];
    }

    public function revalidate(ApprovalDocument $doc, Tenant $tenant, User $reviewer): void
    {
        $revision = $doc->currentRevision;
        if (!$revision) {
            throw new RuntimeException("Missing revision for approval document #{$doc->id}.");
        }

        $amount = (float)($revision->payload['amount'] ?? 0);
        if ($amount <= 0) {
            throw new RuntimeException('Owner drawing amount in the revision is invalid.');
        }
    }

    public function post(ApprovalDocument $doc, Tenant $tenant, User $reviewer): array
    {
        $payload       = $doc->currentRevision->payload;
        $amount        = (float)$payload['amount'];
        $paymentMethod = $payload['payment_method'] ?? 'cash';
        $bankAccountId = $payload['bank_account_id'] ?? null;

        $creditCode = '1000';
        if ($paymentMethod === 'bank') {
            $creditCode = '1010';
            if ($bankAccountId) {
                $ba = BankAccount::find($bankAccountId);
                if ($ba && array_key_exists('account_id', $ba->getAttributes()) && $ba->getAttributes()['account_id']) {
                    $acc = \App\Models\Account::find($ba->getAttributes()['account_id']);
                    if ($acc) {
                        $creditCode = $acc->code;
                    }
                }
            }
        }

        app()->instance('current.tenant', $tenant);

        $entry = $this->accounting->createEntry([
            'date'           => $payload['date'] ?? now()->toDateString(),
            'reference_type' => 'owner_drawing',
            'reference'      => Str::uuid()->toString(),
            'description'    => 'Owner drawing' . ($payload['notes'] ? ' — ' . $payload['notes'] : ''),
            'user_id'        => $reviewer->id,
        ], [
            [
                'account_code' => '3100',
                'debit'        => $amount,
                'credit'       => 0,
            ],
            [
                'account_code'    => $creditCode,
                'debit'           => 0,
                'credit'          => $amount,
                'bank_account_id' => $paymentMethod === 'bank' ? $bankAccountId : null,
            ],
        ]);
        // R06 FIX: Create FundTransaction so BankAccount::v3Balance() reflects
        // this approved drawing in the bank-specific sub-ledger (from_account_id).
        // The direct posting path (FundController::removeFunds) creates this record;
        // the approval path was missing it, causing the Funds dashboard to show
        // an inflated balance after approved bank drawings.
        if ($paymentMethod === 'bank' && $bankAccountId) {
            $ba            = BankAccount::find($bankAccountId);
            // v3Balance() already accounts for the credit just posted; add back amount
            // to approximate the pre-debit balance.
            $afterBalance  = $ba ? (float)$ba->v3Balance() : 0.0;
            $beforeBalance = $afterBalance + $amount;

            FundTransaction::create([
                'type'             => 'remove',
                'from_account_id'  => $bankAccountId,
                'amount'           => $amount,
                'balance_before'   => max(0.0, $beforeBalance),
                'balance_after'    => max(0.0, $afterBalance),
                'reason'           => $payload['notes'] ?? 'Owner drawing (approved)',
                'reference_number' => 'RMV-' . date('Ymd') . '-' . substr($entry->reference, 0, 8),
                'performed_by'     => $reviewer->id,
            ]);
        }

        return [
            'type'             => 'journal_entry',
            'id'               => $entry->id,
            'reference'        => $entry->reference,
            'journal_entry_id' => $entry->id,
        ];
    }

    public function reviewerEligibilityPermissions(): array
    {
        return ['finance.owner_drawings'];
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
