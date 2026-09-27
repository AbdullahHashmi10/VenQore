<?php

namespace App\Services\Cheque;

use App\Engines\AccountingService;
use App\Engines\PaymentService;
use App\Models\BankAccount;
use App\Models\ChequeDuplicateAuditLog;
use App\Models\Party;
use App\Models\ReceivedCheque;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class ChequeDuplicateService
{
    public function __construct(
        private AccountingService $accounting,
        private PaymentService $paymentService
    ) {}

    /**
     * Check for duplicate incoming cheques within a tenant.
     * Duplicate identity: normalized_drawer_bank + normalized_cheque_number.
     * Detection is permanent across all time by default.
     * 90-day window provides an additional rapid-re-presentation warning.
     */
    public function checkDuplicate(
        Tenant $tenant,
        string $chequeNumber,
        ?string $drawerBank = null,
        float $amount = 0.0,
        ?string $chequeDate = null,
        ?string $excludeId = null
    ): array {
        $normNumber = ChequeNumberNormalizer::normalize($chequeNumber);
        $normBank   = ChequeNumberNormalizer::normalizeBank($drawerBank);

        $query = ReceivedCheque::where('tenant_id', $tenant->id)
            ->where('normalized_cheque_number', $normNumber)
            ->where('status', '!=', ReceivedCheque::STATUS_CANCELLED);

        if (!empty($normBank)) {
            $query->where('normalized_drawer_bank', $normBank);
        } else {
            $query->where(function ($q) {
                $q->whereNull('normalized_drawer_bank')
                  ->orWhere('normalized_drawer_bank', '');
            });
        }

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        $existing = $query->first();

        if ($existing) {
            $existingDate = $existing->received_date ?? $existing->created_at;
            $daysDiff = $existingDate ? abs(now()->diffInDays($existingDate)) : 999;
            $isRecent = $daysDiff <= 90;

            $bankLabel = $existing->drawer_bank ?: ($drawerBank ?: 'the same bank');
            $warningPrefix = $isRecent
                ? "RAPID RE-PRESENTATION WARNING (within 90 days): "
                : "";

            $message = "{$warningPrefix}A cheque with serial #{$existing->cheque_number} from {$bankLabel} (Amount: Rs. {$existing->amount}, Status: {$existing->status}) was already recorded on {$existing->received_date->toDateString()}.";

            return [
                'is_exact_duplicate'     => true,
                'is_potential_duplicate' => true,
                'is_recent_presentation' => $isRecent,
                'existing'               => $existing,
                'message'                => $message,
            ];
        }

        return [
            'is_exact_duplicate'     => false,
            'is_potential_duplicate' => false,
            'is_recent_presentation' => false,
            'existing'               => null,
            'message'                => null,
        ];
    }

    /**
     * Record an incoming cheque. Accepts either an array of data or individual named parameters.
     */
    public function recordReceivedCheque(
        Tenant $tenant,
        array|string $dataOrChequeNumber,
        float|User|null $amountOrUser = null,
        ?string $partyId = null,
        ?string $bankName = null,
        ?string $chequeDate = null,
        ?string $paymentId = null,
        ?string $notes = null,
        ?User $user = null,
        ?string $branch = null,
        bool $allowOverride = false,
        ?string $drawerName = null,
        ?string $overrideReason = null
    ): ReceivedCheque {
        if (is_array($dataOrChequeNumber)) {
            $data = $dataOrChequeNumber;
            $currentUser = ($amountOrUser instanceof User) ? $amountOrUser : null;
            $override = $allowOverride || (!empty($data['allow_override'])) || (!empty($data['is_duplicate_override']));
            $overrideReason = $overrideReason ?? ($data['override_reason'] ?? null);
        } else {
            $data = [
                'cheque_number'   => $dataOrChequeNumber,
                'amount'          => (float) $amountOrUser,
                'party_id'        => $partyId,
                'drawer_bank'     => $bankName,
                'cheque_date'     => $chequeDate,
                'payment_id'      => $paymentId,
                'notes'           => $notes,
                'drawer_branch'   => $branch,
                'drawer_name'     => $drawerName,
                'override_reason' => $overrideReason,
            ];
            $currentUser = $user;
            $override = $allowOverride;
        }

        $chequeNumber = trim($data['cheque_number'] ?? '');
        if (empty($chequeNumber)) {
            throw ValidationException::withMessages(['cheque_number' => 'Cheque number is required.']);
        }

        $amount = (float) ($data['amount'] ?? 0);
        if ($amount <= 0) {
            throw ValidationException::withMessages(['amount' => 'Amount must be greater than zero.']);
        }

        $drawerBank   = $data['drawer_bank'] ?? $data['bank_name'] ?? null;
        $chequeDate   = $data['cheque_date'] ?? now()->toDateString();
        $receivedDate = $data['received_date'] ?? now()->toDateString();
        $normNumber   = ChequeNumberNormalizer::normalize($chequeNumber);
        $normBank     = ChequeNumberNormalizer::normalizeBank($drawerBank);

        $actingUser = $currentUser ?? auth()->user();

        // Duplicate verification
        $dupCheck = $this->checkDuplicate($tenant, $chequeNumber, $drawerBank, $amount, $chequeDate);

        $isOverrideAccepted = false;
        $overrideKey = null;

        if ($dupCheck['is_exact_duplicate']) {
            if (!$override) {
                // Log blocked attempt in audit log
                ChequeDuplicateAuditLog::create([
                    'tenant_id'                => $tenant->id,
                    'cheque_number'            => $chequeNumber,
                    'normalized_cheque_number' => $normNumber,
                    'drawer_bank'              => $drawerBank,
                    'normalized_drawer_bank'   => $normBank,
                    'amount'                   => $amount,
                    'action'                   => 'blocked',
                    'reason'                   => $dupCheck['message'],
                    'existing_cheque_id'       => $dupCheck['existing']?->id,
                    'user_id'                  => $actingUser?->id,
                    'ip_address'               => request()?->ip(),
                ]);

                throw ValidationException::withMessages([
                    'cheque_number' => $dupCheck['message'] . " Authorized duplicate override required to proceed."
                ]);
            }

            // User attempted override: check permission
            if (!$actingUser || !$actingUser->hasPermission('finance.cheques.override_duplicate')) {
                ChequeDuplicateAuditLog::create([
                    'tenant_id'                => $tenant->id,
                    'cheque_number'            => $chequeNumber,
                    'normalized_cheque_number' => $normNumber,
                    'drawer_bank'              => $drawerBank,
                    'normalized_drawer_bank'   => $normBank,
                    'amount'                   => $amount,
                    'action'                   => 'blocked',
                    'reason'                   => 'Unauthorized duplicate override attempt: Missing finance.cheques.override_duplicate permission.',
                    'existing_cheque_id'       => $dupCheck['existing']?->id,
                    'user_id'                  => $actingUser?->id,
                    'ip_address'               => request()?->ip(),
                ]);

                throw ValidationException::withMessages([
                    'cheque_number' => 'You do not have permission to override duplicate cheques (requires finance.cheques.override_duplicate).'
                ]);
            }

            // Reason must be at least 10 characters
            $cleanReason = trim($overrideReason ?? '');
            if (strlen($cleanReason) < 10) {
                ChequeDuplicateAuditLog::create([
                    'tenant_id'                => $tenant->id,
                    'cheque_number'            => $chequeNumber,
                    'normalized_cheque_number' => $normNumber,
                    'drawer_bank'              => $drawerBank,
                    'normalized_drawer_bank'   => $normBank,
                    'amount'                   => $amount,
                    'action'                   => 'blocked',
                    'reason'                   => 'Duplicate override rejected: Override reason must be at least 10 characters.',
                    'existing_cheque_id'       => $dupCheck['existing']?->id,
                    'user_id'                  => $actingUser?->id,
                    'ip_address'               => request()?->ip(),
                ]);

                throw ValidationException::withMessages([
                    'override_reason' => 'An override reason of at least 10 characters is required to override duplicate cheques.'
                ]);
            }

            // Override approved
            $isOverrideAccepted = true;
            $overrideKey = (string) \Illuminate\Support\Str::uuid();

            ChequeDuplicateAuditLog::create([
                'tenant_id'                => $tenant->id,
                'cheque_number'            => $chequeNumber,
                'normalized_cheque_number' => $normNumber,
                'drawer_bank'              => $drawerBank,
                'normalized_drawer_bank'   => $normBank,
                'amount'                   => $amount,
                'action'                   => 'overridden',
                'reason'                   => $cleanReason,
                'existing_cheque_id'       => $dupCheck['existing']?->id,
                'user_id'                  => $actingUser->id,
                'ip_address'               => request()?->ip(),
            ]);
        }

        $fingerprint = ChequeNumberNormalizer::fingerprint(
            $tenant->id,
            $chequeNumber,
            $drawerBank,
            $isOverrideAccepted,
            $overrideKey
        );

        return ReceivedCheque::create([
            'tenant_id'                => $tenant->id,
            'party_id'                 => $data['party_id'] ?? null,
            'payment_id'               => $data['payment_id'] ?? null,
            'sale_id'                  => $data['sale_id'] ?? null,
            'journal_entry_id'         => $data['journal_entry_id'] ?? null,
            'cheque_number'            => $chequeNumber,
            'normalized_cheque_number' => $normNumber,
            'drawer_name'              => $data['drawer_name'] ?? null,
            'drawer_bank'              => $drawerBank,
            'normalized_drawer_bank'   => $normBank,
            'drawer_branch'            => $data['drawer_branch'] ?? null,
            'received_date'            => $receivedDate,
            'cheque_date'              => $chequeDate,
            'amount'                   => $amount,
            'status'                   => ReceivedCheque::STATUS_RECEIVED,
            'duplicate_fingerprint'    => $fingerprint,
            'is_duplicate_override'    => $isOverrideAccepted,
            'override_reason'          => $isOverrideAccepted ? trim($overrideReason) : null,
            'override_by'              => $isOverrideAccepted ? $actingUser?->id : null,
            'override_at'              => $isOverrideAccepted ? now() : null,
            'notes'                    => $data['notes'] ?? null,
            'created_by'               => $actingUser?->id,
            'updated_by'               => $actingUser?->id,
        ]);
    }

    /**
     * Deposit a received cheque into a company bank account.
     * Accounting: DR 1010 Bank Account, CR 1020 Cheques in Hand.
     */
    public function depositCheque(
        Tenant $tenant,
        ReceivedCheque|string $cheque,
        string $depositBankAccountId,
        ?string $depositDate = null,
        ?User $user = null
    ): ReceivedCheque {
        $chequeModel = is_string($cheque)
            ? ReceivedCheque::where('tenant_id', $tenant->id)->where('id', $cheque)->firstOrFail()
            : $cheque;

        if ($chequeModel->tenant_id != $tenant->id) {
            throw new RuntimeException("Cheque does not belong to current tenant.");
        }

        return DB::transaction(function () use ($tenant, $chequeModel, $depositBankAccountId, $depositDate, $user) {
            /** @var ReceivedCheque $locked */
            $locked = ReceivedCheque::where('id', $chequeModel->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== ReceivedCheque::STATUS_RECEIVED) {
                throw new RuntimeException("Only cheques in 'received' status can be deposited (current: {$locked->status}).");
            }

            $bankAccount = BankAccount::where('tenant_id', $tenant->id)->find($depositBankAccountId);
            if (!$bankAccount) {
                throw new RuntimeException("Deposit bank account not found.");
            }

            $date = $depositDate ?? now()->toDateString();

            // Create deposit journal entry: DR Bank (1010), CR Cheques in Hand (1020)
            $bankLedger = $this->accounting->getAccountByCode('1010', 'Bank Account', 'asset');
            $chequeLedger = $this->accounting->getAccountByCode('1020', 'Cheques in Hand', 'asset');

            $journalEntry = $this->accounting->createEntry([
                'tenant_id'      => $tenant->id,
                'date'           => $date,
                'reference_type' => 'cheque_deposit',
                'reference'      => (string) \Illuminate\Support\Str::uuid(),
                'description'    => "Cheque deposit #{$locked->cheque_number} into {$bankAccount->name}",
                'party_id'       => $locked->party_id,
                'user_id'        => $user?->id ?? auth()->id(),
            ], [
                [
                    'account_id'      => $bankLedger->id,
                    'debit'           => $locked->amount,
                    'credit'          => 0,
                    'bank_account_id' => $bankAccount->id,
                    'description'     => "Deposit cheque #{$locked->cheque_number}",
                ],
                [
                    'account_id'  => $chequeLedger->id,
                    'debit'       => 0,
                    'credit'      => $locked->amount,
                    'description' => "Clear cheques in hand #{$locked->cheque_number}",
                ],
            ]);

            $locked->update([
                'status'                    => ReceivedCheque::STATUS_DEPOSITED,
                'deposit_bank_account_id'   => $bankAccount->id,
                'deposit_journal_entry_id'  => $journalEntry->id,
                'deposited_at'              => now(),
                'updated_by'                => $user?->id ?? auth()->id(),
            ]);

            return $locked->fresh(['depositBankAccount', 'party']);
        });
    }

    /**
     * Mark a deposited cheque as cleared.
     */
    public function clearCheque(
        Tenant $tenant,
        ReceivedCheque|string $cheque,
        ?string $clearedAt = null,
        ?User $user = null
    ): ReceivedCheque {
        $chequeModel = is_string($cheque)
            ? ReceivedCheque::where('tenant_id', $tenant->id)->where('id', $cheque)->firstOrFail()
            : $cheque;

        if ($chequeModel->tenant_id != $tenant->id) {
            throw new RuntimeException("Cheque does not belong to current tenant.");
        }

        return DB::transaction(function () use ($chequeModel, $clearedAt, $user) {
            $locked = ReceivedCheque::where('id', $chequeModel->id)->lockForUpdate()->firstOrFail();

            if (!in_array($locked->status, [ReceivedCheque::STATUS_DEPOSITED, ReceivedCheque::STATUS_RECEIVED], true)) {
                throw new RuntimeException("Only deposited or received cheques can be cleared (current: {$locked->status}).");
            }

            $locked->update([
                'status'     => ReceivedCheque::STATUS_CLEARED,
                'cleared_at' => $clearedAt ?? now(),
                'updated_by' => $user?->id ?? auth()->id(),
            ]);

            return $locked->fresh();
        });
    }

    /**
     * Record a bounce on an incoming customer cheque.
     * Reverses the deposit entry (if deposited) and reverses the initial receipt entry,
     * reopening the customer balance/invoice.
     */
    public function bounceCheque(
        Tenant $tenant,
        ReceivedCheque|string $cheque,
        string $reason,
        ?User $user = null,
        ?string $bounceDate = null
    ): ReceivedCheque {
        $chequeModel = is_string($cheque)
            ? ReceivedCheque::where('tenant_id', $tenant->id)->where('id', $cheque)->firstOrFail()
            : $cheque;

        if ($chequeModel->tenant_id != $tenant->id) {
            throw new RuntimeException("Cheque does not belong to current tenant.");
        }

        return DB::transaction(function () use ($tenant, $chequeModel, $reason, $user, $bounceDate) {
            /** @var ReceivedCheque $locked */
            $locked = ReceivedCheque::where('id', $chequeModel->id)->lockForUpdate()->firstOrFail();

            if (in_array($locked->status, [ReceivedCheque::STATUS_BOUNCED, ReceivedCheque::STATUS_CANCELLED], true)) {
                throw new RuntimeException("Cheque is already {$locked->status}.");
            }

            // 1. If deposited, reverse deposit journal entry
            if ($locked->deposit_journal_entry_id) {
                $depEntry = DB::table('journal_entries')
                    ->where('tenant_id', $tenant->id)
                    ->where('id', $locked->deposit_journal_entry_id)
                    ->where('is_reversed', 0)
                    ->first();

                if ($depEntry) {
                    $this->accounting->reverseEntry($depEntry->id, "Bounced customer cheque deposit: {$reason}");
                }
            }

            // 2. Reverse initial receipt journal entry (if linked)
            if ($locked->journal_entry_id) {
                $rcptEntry = DB::table('journal_entries')
                    ->where('tenant_id', $tenant->id)
                    ->where('id', $locked->journal_entry_id)
                    ->where('is_reversed', 0)
                    ->first();

                if ($rcptEntry) {
                    $this->accounting->reverseEntry($rcptEntry->id, "Bounced customer cheque #{$locked->cheque_number}: {$reason}");
                }
            } elseif ($locked->payment_id) {
                // If payment record exists, look for its journal entry
                $payment = \App\Models\Payment::where('tenant_id', $tenant->id)->find($locked->payment_id);
                if ($payment && $payment->reference) {
                    $rcptEntry = DB::table('journal_entries')
                        ->where('tenant_id', $tenant->id)
                        ->where('reference', $payment->reference)
                        ->where('is_reversed', 0)
                        ->first();

                    if ($rcptEntry) {
                        $this->accounting->reverseEntry($rcptEntry->id, "Bounced customer cheque #{$locked->cheque_number}: {$reason}");
                    }
                }
            }

            // 3. If sale_id exists, trigger badge rebuild
            if ($locked->sale_id) {
                $this->paymentService->updatePaymentBadge($locked->sale_id);
            }

            $locked->update([
                'status'        => ReceivedCheque::STATUS_BOUNCED,
                'bounced_at'    => $bounceDate ?? now(),
                'status_reason' => $reason,
                'updated_by'    => $user?->id ?? auth()->id(),
            ]);

            return $locked->fresh();
        });
    }

    /**
     * Return a bounced or uncashed cheque back to the customer.
     */
    public function returnReceivedCheque(
        Tenant $tenant,
        ReceivedCheque|string $cheque,
        string $reason,
        ?User $user = null
    ): ReceivedCheque {
        $locked = is_string($cheque)
            ? ReceivedCheque::where('tenant_id', $tenant->id)->where('id', $cheque)->firstOrFail()
            : $cheque;

        if ($locked->tenant_id != $tenant->id) {
            throw new RuntimeException("Cheque does not belong to current tenant.");
        }

        return DB::transaction(function () use ($locked, $reason, $user) {
            $locked->update([
                'status'        => ReceivedCheque::STATUS_RETURNED,
                'returned_at'   => now(),
                'status_reason' => $reason,
                'updated_by'    => $user?->id ?? auth()->id(),
            ]);

            return $locked->fresh();
        });
    }

    // Aliases for controller compatibility
    public function depositReceivedCheque(Tenant $tenant, ReceivedCheque|string $receivedChequeId, string $bankAccountId, ?string $depositDate = null, ?User $user = null): ReceivedCheque
    {
        return $this->depositCheque($tenant, $receivedChequeId, $bankAccountId, $depositDate, $user);
    }

    public function clearReceivedCheque(Tenant $tenant, ReceivedCheque|string $receivedChequeId, ?string $clearDate = null, ?User $user = null): ReceivedCheque
    {
        return $this->clearCheque($tenant, $receivedChequeId, $clearDate, $user);
    }

    public function bounceReceivedCheque(Tenant $tenant, ReceivedCheque|string $receivedChequeId, string $reason, ?string $bounceDate = null, ?User $user = null): ReceivedCheque
    {
        return $this->bounceCheque($tenant, $receivedChequeId, $reason, $user, $bounceDate);
    }
}
