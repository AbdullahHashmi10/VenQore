<?php

namespace App\Services;

use App\Engines\AccountingService;
use App\Engines\PaymentService;
use App\Models\BankAccount;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CustomerPaymentPostingService
{
    public function __construct(
        private AccountingService $accounting,
        private PaymentService $payments
    ) {}

    public function post(Tenant $tenant, array $payload, ?User $user = null): array
    {
        $tenantId = $tenant->id;
        $customerId = $payload['customer_id'];
        $amount = (float) $payload['amount'];
        $paymentMethod = $payload['payment_method'] ?? 'cash';
        $paymentDate = $payload['payment_date'] ?? now()->toDateString();
        $reference = $payload['reference'] ?? null;
        $allocations = (array) ($payload['allocations'] ?? []);

        return CanonicalPostingScope::run(function () use ($tenantId, $customerId, $amount, $paymentMethod, $paymentDate, $reference, $allocations, $payload, $user) {
            return DB::transaction(function () use ($tenantId, $customerId, $amount, $paymentMethod, $paymentDate, $reference, $allocations, $payload, $user) {
                $cashAccount = $paymentMethod === 'bank' ? '1010' : '1000';
                $bankAccountId = $payload['bank_account_id'] ?? null;

                if ($paymentMethod === 'bank' && empty($bankAccountId)) {
                    $firstBank = BankAccount::where('tenant_id', $tenantId)
                        ->where('type', 'bank')
                        ->first();
                    $bankAccountId = $firstBank?->id;
                }

                // Journal Entry: DR 1000/1010 Cash or Bank, CR 1200 Accounts Receivable
                $journalEntry = $this->accounting->createEntry([
                    'tenant_id'      => $tenantId,
                    'date'           => $paymentDate,
                    'reference_type' => 'customer_payment',
                    'reference'      => Str::uuid()->toString(),
                    'description'    => 'Customer payment' . ($reference ? ' — ' . $reference : ''),
                    'party_id'       => $customerId,
                    'user_id'        => $user?->id ?? auth()->id(),
                ], [
                    [
                        'account_code'    => $cashAccount,
                        'debit'           => $amount,
                        'credit'          => 0,
                        'bank_account_id' => $paymentMethod === 'bank' ? $bankAccountId : null,
                    ],
                    [
                        'account_code' => '1200',
                        'debit'        => 0,
                        'credit'       => $amount,
                        'party_id'     => $customerId,
                    ],
                ]);

                $formattedAllocations = array_map(fn($a) => [
                    'sale_id' => $a['sale_id'],
                    'amount'  => (float) $a['amount'],
                ], $allocations);

                $this->payments->allocate($journalEntry->id, $formattedAllocations);

                return [
                    'journal_entry_id' => $journalEntry->id,
                    'reference'        => $journalEntry->reference,
                    'amount'           => $amount,
                    'customer_id'      => $customerId,
                    'allocations'      => $formattedAllocations,
                ];
            });
        });
    }
}
