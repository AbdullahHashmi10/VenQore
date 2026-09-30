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
 * Capital Injection — owner adds funds to the business from personal funds.
 *
 * GL posting:
 *   DR 1000  Cash / 1010 Bank    (money entering the business)
 *   CR 3000  Owner's Capital     (permanent increase in equity)
 *
 * ref_type: 'capital_injection'
 *
 * R05 FIX: Accept account_type as alias for payment_method (legacy form).
 * R06 FIX: Create FundTransaction record so BankAccount::v3Balance() reflects
 *          the deposit in the bank-specific sub-ledger shown in the Funds page.
 */
class CapitalInjectionApprovalAdapter implements ApprovalAdapterInterface
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    public function documentType(): string
    {
        return ApprovalDocument::TYPE_CAPITAL_INJECTION;
    }

    public function validatePayload(array $payload, Tenant $tenant, User $maker): array
    {
        $amount = (float)($payload['amount'] ?? 0);
        if ($amount <= 0) {
            throw ValidationException::withMessages(['amount' => 'Injection amount must be greater than zero.']);
        }

        // R05 FIX: The legacy FundController::addFunds() form submits account_type
        // ('cash'|'bank'), not payment_method. The adapter previously ignored
        // account_type and defaulted to 'cash', so all legacy injection submissions
        // debited Cash in Hand (1000) even when the user chose Bank (1010).
        // Accept both field names; payment_method takes precedence if both present.
        $paymentMethod = $payload['payment_method'] ?? $payload['account_type'] ?? 'cash';
        if (!in_array($paymentMethod, ['cash', 'bank'], true)) {
            throw ValidationException::withMessages(['payment_method' => 'Payment method must be cash or bank.']);
        }

        return [
            'amount'          => $amount,
            'payment_method'  => $paymentMethod,
            'bank_account_id' => $payload['bank_account_id'] ?? null,
            // Accept both 'date' (V3) and 'injection_date' (legacy) as well as
            // 'transaction_date' used by V3/FundController.
            'date'            => $payload['date'] ?? $payload['injection_date'] ?? $payload['transaction_date'] ?? now()->toDateString(),
            // Accept 'notes', 'reason' (legacy addFunds), and 'description' (V3/FundController).
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
            throw new RuntimeException('Capital injection amount in the revision is invalid.');
        }
    }

    public function post(ApprovalDocument $doc, Tenant $tenant, User $reviewer): array
    {
        $payload       = $doc->currentRevision->payload;
        $amount        = (float)$payload['amount'];
        $paymentMethod = $payload['payment_method'] ?? 'cash';
        $bankAccountId = $payload['bank_account_id'] ?? null;

        $debitCode = '1000';
        if ($paymentMethod === 'bank') {
            $debitCode = '1010';
            if ($bankAccountId) {
                $ba = BankAccount::find($bankAccountId);
                if ($ba && array_key_exists('account_id', $ba->getAttributes()) && $ba->getAttributes()['account_id']) {
                    $acc = \App\Models\Account::find($ba->getAttributes()['account_id']);
                    if ($acc) {
                        $debitCode = $acc->code;
                    }
                }
            }
        }

        app()->instance('current.tenant', $tenant);

        $entry = $this->accounting->createEntry([
            'date'           => $payload['date'] ?? now()->toDateString(),
            'reference_type' => 'capital_injection',
            'reference'      => Str::uuid()->toString(),
            'description'    => 'Capital injection by owner' . ($payload['notes'] ? ' — ' . $payload['notes'] : ''),
            'user_id'        => $reviewer->id,
        ], [
            [
                'account_code'    => $debitCode,
                'debit'           => $amount,
                'credit'          => 0,
                'bank_account_id' => $paymentMethod === 'bank' ? $bankAccountId : null,
            ],
            [
                'account_code' => '3000',
                'debit'        => 0,
                'credit'       => $amount,
            ],
        ]);

        // R06 FIX: Create FundTransaction so BankAccount::v3Balance() reflects
        // this approved capital injection in the bank-specific sub-ledger.
        // The direct posting path (FundController::addFunds) creates this record;
        // the approval path was missing it, causing the Funds dashboard to show
        // a lower balance than the GL for approved bank capital injections.
        if ($paymentMethod === 'bank' && $bankAccountId) {
            $ba     = BankAccount::find($bankAccountId);
            // v3Balance() now includes this journal entry since it was just created;
            // subtract amount to get the pre-credit balance for balance_before.
            $afterBalance  = $ba ? (float)$ba->v3Balance() : $amount;
            $beforeBalance = max(0.0, $afterBalance - $amount);

            FundTransaction::create([
                'type'             => 'add',
                'to_account_id'    => $bankAccountId,
                'amount'           => $amount,
                'balance_before'   => $beforeBalance,
                'balance_after'    => $afterBalance,
                'reason'           => $payload['notes'] ?? 'Capital injection (approved)',
                'reference_number' => 'ADD-' . date('Ymd') . '-' . substr($entry->reference, 0, 8),
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
        return ['finance.capital_add'];
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
