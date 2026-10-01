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
 * Internal Fund Transfer — moves money between cash and/or bank accounts.
 *
 * Directions:
 *   cash → bank    DR 1010 (Bank)  CR 1000 (Cash)
 *   bank → cash    DR 1000 (Cash)  CR 1010 (Bank)
 *   bank → bank    DR 1010-dest    CR 1010-src
 *
 * ref_type: 'fund_transfer'
 */
class FundTransferApprovalAdapter implements ApprovalAdapterInterface
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    public function documentType(): string
    {
        return ApprovalDocument::TYPE_FUND_TRANSFER;
    }

    public function validatePayload(array $payload, Tenant $tenant, User $maker): array
    {
        $amount = (float)($payload['amount'] ?? 0);
        if ($amount <= 0) {
            throw ValidationException::withMessages(['amount' => 'Transfer amount must be greater than zero.']);
        }

        $fromType = $payload['from_type'] ?? null;
        $toType   = $payload['to_type']   ?? null;

        if (!$fromType && isset($payload['from_account'])) {
            $fromType = ((string)$payload['from_account'] === '1000') ? 'cash' : 'bank';
        }
        if (!$toType && isset($payload['to_account'])) {
            $toType = ((string)$payload['to_account'] === '1000') ? 'cash' : 'bank';
        }

        $fromType = $fromType ?? 'cash';
        $toType   = $toType   ?? 'bank';

        if (!in_array($fromType, ['cash', 'bank'], true)) {
            throw ValidationException::withMessages(['from_type' => 'Source must be cash or bank.']);
        }
        if (!in_array($toType, ['cash', 'bank'], true)) {
            throw ValidationException::withMessages(['to_type' => 'Destination must be cash or bank.']);
        }

        if ($fromType === 'cash' && $toType === 'cash') {
            throw ValidationException::withMessages(['to_type' => 'Cannot transfer cash to cash.']);
        }

        $fromBankId  = $payload['from_bank_account_id'] ?? $payload['from_bank_id'] ?? null;
        $toBankId    = $payload['to_bank_account_id']   ?? $payload['to_bank_id']   ?? null;
        $fromAccount = $payload['from_account'] ?? null;
        $toAccount   = $payload['to_account']   ?? null;

        if ($fromType === 'bank' && !$fromBankId && !$fromAccount) {
            throw ValidationException::withMessages(['from_bank_account_id' => 'Source bank account is required.']);
        }
        if ($toType === 'bank' && !$toBankId && !$toAccount) {
            throw ValidationException::withMessages(['to_bank_account_id' => 'Destination bank account is required.']);
        }

        if ($fromBankId && !BankAccount::where('id', $fromBankId)->where('tenant_id', $tenant->id)->exists()) {
            throw ValidationException::withMessages(['from_bank_account_id' => 'Source bank account not found or cross-tenant.']);
        }
        if ($toBankId && !BankAccount::where('id', $toBankId)->where('tenant_id', $tenant->id)->exists()) {
            throw ValidationException::withMessages(['to_bank_account_id' => 'Destination bank account not found or cross-tenant.']);
        }

        if ($fromType === 'bank' && $toType === 'bank') {
            if ($fromBankId && $toBankId && $fromBankId === $toBankId) {
                throw ValidationException::withMessages(['to_bank_account_id' => 'Source and destination accounts must be different.']);
            }
            if ($fromAccount && $toAccount && $fromAccount === $toAccount) {
                throw ValidationException::withMessages(['to_account' => 'Source and destination accounts must be different.']);
            }
        }

        return [
            'amount'               => $amount,
            'from_type'            => $fromType,
            'to_type'              => $toType,
            'from_account'         => $fromAccount,
            'to_account'           => $toAccount,
            'from_bank_account_id' => $fromBankId,
            'to_bank_account_id'   => $toBankId,
            'date'                 => $payload['date'] ?? $payload['transfer_date'] ?? now()->toDateString(),
            'notes'                => $payload['notes'] ?? $payload['description'] ?? null,
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
            throw new RuntimeException('Transfer amount in the revision is invalid.');
        }

        $fromBankId = $revision->payload['from_bank_account_id'] ?? null;
        $toBankId   = $revision->payload['to_bank_account_id']   ?? null;

        if ($fromBankId && !BankAccount::where('id', $fromBankId)->where('tenant_id', $tenant->id)->exists()) {
            throw new RuntimeException("Source bank account #{$fromBankId} no longer belongs to this store.");
        }
        if ($toBankId && !BankAccount::where('id', $toBankId)->where('tenant_id', $tenant->id)->exists()) {
            throw new RuntimeException("Destination bank account #{$toBankId} no longer belongs to this store.");
        }
    }

    public function post(ApprovalDocument $doc, Tenant $tenant, User $reviewer): array
    {
        $payload     = $doc->currentRevision->payload;
        $amount      = (float)$payload['amount'];
        $fromType    = $payload['from_type'] ?? 'cash';
        $toType      = $payload['to_type']   ?? 'bank';
        $fromBankId  = $payload['from_bank_account_id'] ?? null;
        $toBankId    = $payload['to_bank_account_id']   ?? null;
        $fromAccount = $payload['from_account'] ?? null;
        $toAccount   = $payload['to_account']   ?? null;

        $creditCode  = $this->resolveAccountCode($fromType, $fromBankId, $fromAccount);
        $debitCode   = $this->resolveAccountCode($toType, $toBankId, $toAccount);

        app()->instance('current.tenant', $tenant);

        foreach ([$creditCode, $debitCode] as $code) {
            $name = $code === '1000' ? 'Cash in Hand' : ($code === '1011' ? 'Bank Account — Other' : 'Bank Account');
            $this->accounting->getAccountByCode($code, $name, 'asset');
        }

        $entry = $this->accounting->createEntry([
            'date'           => $payload['date'] ?? now()->toDateString(),
            'reference_type' => !empty($payload['from_account']) ? 'bank_transfer' : 'fund_transfer',
            'reference'      => Str::uuid()->toString(),
            'description'    => 'Internal fund transfer' . ($payload['notes'] ? ' — ' . $payload['notes'] : ''),
            'user_id'        => $reviewer->id,
        ], [
            [
                'account_code'    => $debitCode,
                'debit'           => $amount,
                'credit'          => 0,
                'bank_account_id' => $toType === 'bank' ? $toBankId : null,
            ],
            [
                'account_code'    => $creditCode,
                'debit'           => 0,
                'credit'          => $amount,
                'bank_account_id' => $fromType === 'bank' ? $fromBankId : null,
            ],
        ]);
        // R06 FIX: Create FundTransaction record so BankAccount::v3Balance() reflects
        // the transfer in the operational sub-ledger (used by the Funds dashboard).
        // The direct posting path (FundController::transfer) creates this record;
        // the approval path was missing it, causing from-bank to show excess balance
        // and to-bank to show insufficient balance after an approved transfer.
        $fromAccountId = $fromType === 'bank' ? $fromBankId : null;
        $toAccountId   = $toType   === 'bank' ? $toBankId   : null;

        if ($fromAccountId || $toAccountId) {
            $fromBa   = $fromAccountId ? BankAccount::find($fromAccountId) : null;
            $toBa     = $toAccountId   ? BankAccount::find($toAccountId)   : null;
            $fromBal  = $fromBa ? (float)$fromBa->v3Balance() + $amount : 0.0; // pre-debit approx

            FundTransaction::create([
                'type'             => 'transfer',
                'from_account_id'  => $fromAccountId,
                'to_account_id'    => $toAccountId,
                'amount'           => $amount,
                'balance_before'   => max(0.0, $fromBal),
                'balance_after'    => max(0.0, $fromBal - $amount),
                'reason'           => $payload['notes'] ?? 'Fund transfer (approved)',
                'reference_number' => 'TRF-' . date('Ymd') . '-' . substr($entry->reference, 0, 8),
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
        return ['finance.internal_transfer'];
    }

    private function resolveAccountCode(string $type, ?string $bankAccountId, ?string $accountCode = null): string
    {
        if ($type === 'cash') {
            return '1000';
        }

        if ($accountCode && in_array($accountCode, ['1010', '1011'], true)) {
            return $accountCode;
        }

        if ($bankAccountId) {
            $ba = BankAccount::find($bankAccountId);
            if ($ba && array_key_exists('account_id', $ba->getAttributes()) && $ba->account_id) {
                $acc = Account::find($ba->account_id);
                if ($acc) {
                    return $acc->code;
                }
            }
        }

        return '1010';
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
