<?php

namespace App\Services\Approval\Adapters;

use App\Engines\AccountingService;
use App\Models\Account;
use App\Models\ApprovalDocument;
use App\Models\BankAccount;
use App\Models\FundTransaction;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/**
 * Balance Adjustment — corrects the physical cash or bank balance to a stated
 * figure, absorbing the discrepancy in the Suspense / Adjustment account (9000).
 *
 * This is a privileged operation: it directly overrides the accounting ledger.
 * Only owner / admin users are permitted to approve or review.
 *
 * GL posting:
 *   If difference > 0 (balance increasing):
 *     DR 1000 / 1010  (Cash or Bank)    CR 9000 Suspense
 *   If difference < 0 (balance decreasing):
 *     DR 9000 Suspense                  CR 1000 / 1010
 *
 * ref_type: 'fund_adjust'
 *
 * The FundController::adjust() route middleware already gates on
 * finance.balance_adjustment, so non-owners cannot even submit a request.
 * ReviewerEligibilityPermissions reinforces the constraint at the engine layer.
 */
class BalanceAdjustmentApprovalAdapter implements ApprovalAdapterInterface
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    public function documentType(): string
    {
        return ApprovalDocument::TYPE_BALANCE_ADJUSTMENT;
    }

    public function validatePayload(array $payload, Tenant $tenant, User $maker): array
    {
        $accountType = $payload['account_type'] ?? 'cash';
        if (!in_array($accountType, ['cash', 'bank'], true)) {
            throw ValidationException::withMessages(['account_type' => 'Account type must be cash or bank.']);
        }

        $newBalance = $payload['new_balance'] ?? null;
        if ($newBalance === null || !is_numeric($newBalance) || (float)$newBalance < 0) {
            throw ValidationException::withMessages(['new_balance' => 'New balance must be a non-negative number.']);
        }

        $reason = trim($payload['reason'] ?? '');
        if ($reason === '') {
            throw ValidationException::withMessages(['reason' => 'A reason is required for a balance adjustment.']);
        }

        $bankAccountId = $payload['bank_account_id'] ?? null;
        if ($accountType === 'bank') {
            if (!$bankAccountId) {
                throw ValidationException::withMessages(['bank_account_id' => 'Bank account is required.']);
            }
            $exists = BankAccount::where('id', $bankAccountId)->where('tenant_id', $tenant->id)->exists();
            if (!$exists) {
                throw ValidationException::withMessages(['bank_account_id' => 'Bank account not found or does not belong to this store.']);
            }
        }

        return [
            'account_type'    => $accountType,
            'bank_account_id' => $bankAccountId,
            'new_balance'     => (float)$newBalance,
            'reason'          => $reason,
            'notes'           => $payload['notes'] ?? null,
        ];
    }

    public function revalidate(ApprovalDocument $doc, Tenant $tenant, User $reviewer): void
    {
        $revision = $doc->currentRevision;
        if (!$revision) {
            throw new RuntimeException("Missing revision for approval document #{$doc->id}.");
        }

        $newBalance = (float)($revision->payload['new_balance'] ?? -1);
        if ($newBalance < 0) {
            throw new RuntimeException('New balance in the revision is invalid.');
        }

        $bankAccountId = $revision->payload['bank_account_id'] ?? null;
        if ($bankAccountId && !BankAccount::where('id', $bankAccountId)->where('tenant_id', $tenant->id)->exists()) {
            throw new RuntimeException("Bank account #{$bankAccountId} no longer belongs to this store.");
        }
    }

    public function post(ApprovalDocument $doc, Tenant $tenant, User $reviewer): array
    {
        $payload       = $doc->currentRevision->payload;
        $accountType   = $payload['account_type'] ?? 'cash';
        $bankAccountId = $payload['bank_account_id'] ?? null;
        $newBalance    = (float)$payload['new_balance'];
        $reason        = $payload['reason'];

        app()->instance('current.tenant', $tenant);

        // Compute current ledger balance
        if ($accountType === 'cash') {
            try {
                $balanceBefore = (float)$this->accounting->getBalance('1000');
            } catch (\Exception $e) {
                $balanceBefore = 0.0;
            }
            $adjCode   = '1000';
            $accountId = BankAccount::where('tenant_id', $tenant->id)->where('account_type', 'cash')->value('id');
        } else {
            $bankAccount   = BankAccount::where('id', $bankAccountId)->where('tenant_id', $tenant->id)->firstOrFail();
            $balanceBefore = (float)$bankAccount->v3Balance();
            $adjCode       = '1010';
            $accountId     = $bankAccountId;
        }

        $difference = $newBalance - $balanceBefore;

        $fundTx = FundTransaction::create([
            'tenant_id'         => $tenant->id,
            'type'              => 'adjust',
            'from_account_id'   => $difference < 0 ? $accountId : null,
            'to_account_id'     => $difference > 0 ? $accountId : null,
            'amount'            => abs($difference),
            'balance_before'    => $balanceBefore,
            'balance_after'     => $newBalance,
            'reason'            => $reason,
            'notes'             => $payload['notes'] ?? null,
            'reference_number'  => 'ADJ-' . date('Ymd') . '-' . rand(1000, 9999),
            'performed_by'      => $reviewer->id,
        ]);

        $result = ['type' => 'no_change', 'difference' => 0, 'fund_transaction_id' => $fundTx->id];

        if (abs($difference) > 0.001) {
            $adjAcct      = Account::where('code', $adjCode)->firstOrFail();
            $suspenseAcct = Account::where('code', '9000')->firstOrCreate(
                ['code' => '9000'],
                ['name' => 'Suspense / Adjustment', 'type' => 'equity', 'is_active' => true]
            );

            // Use bank_account_id as journal reference so v3Balance() can find it.
            $journalRef = $accountId ?? $fundTx->id;

            $entry = $this->accounting->createEntry([
                'date'           => now()->toDateString(),
                'reference_type' => 'fund_adjust',
                'reference'      => $journalRef,
                'description'    => 'Balance Adjustment — ' . $reason,
                'party_id'       => null,
            ], $difference > 0 ? [
                ['account_id' => $adjAcct->id,      'debit' => $difference,       'credit' => 0,
                 'bank_account_id' => $accountType === 'bank' ? $bankAccountId : null],
                ['account_id' => $suspenseAcct->id, 'debit' => 0,                 'credit' => $difference],
            ] : [
                ['account_id' => $suspenseAcct->id, 'debit' => abs($difference),  'credit' => 0],
                ['account_id' => $adjAcct->id,      'debit' => 0,                 'credit' => abs($difference),
                 'bank_account_id' => $accountType === 'bank' ? $bankAccountId : null],
            ]);

            $result = [
                'type'               => 'journal_entry',
                'id'                 => $entry->id,
                'reference'          => $entry->reference,
                'journal_entry_id'   => $entry->id,
                'difference'         => $difference,
                'fund_transaction_id' => $fundTx->id,
            ];
        }

        return $result;
    }

    public function reviewerEligibilityPermissions(): array
    {
        return ['finance.balance_adjustment'];
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
