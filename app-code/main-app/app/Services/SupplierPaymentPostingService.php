<?php

namespace App\Services;

use App\Engines\AccountingService;
use App\Engines\PaymentService;
use App\Models\Account;
use App\Models\BankAccount;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SupplierPaymentPostingService
{
    public function __construct(
        private AccountingService $accounting,
        private PaymentService $payments
    ) {}

    public function post(Tenant $tenant, array $payload, ?User $user = null): array
    {
        $tenantId = $tenant->id;
        $supplierId = $payload['supplier_id'];
        $amount = (float) $payload['amount'];
        $paymentMethod = $payload['payment_method'] ?? 'cash';
        $paymentDate = $payload['payment_date'] ?? now()->toDateString();
        $reference = $payload['reference'] ?? null;
        $allocations = (array) ($payload['allocations'] ?? []);

        return CanonicalPostingScope::run(function () use ($tenantId, $supplierId, $amount, $paymentMethod, $paymentDate, $reference, $allocations, $payload, $user) {
            return DB::transaction(function () use ($tenantId, $supplierId, $amount, $paymentMethod, $paymentDate, $reference, $allocations, $payload, $user) {
                $paymentAccount = '1000'; // Cash
                if (in_array($paymentMethod, ['bank', 'cheque'], true)) {
                    $paymentAccount = '1010'; // Default Bank
                    if (!empty($payload['bank_account_id'])) {
                        $ba = BankAccount::where('tenant_id', $tenantId)->find($payload['bank_account_id']);
                        $baAttrs = $ba ? $ba->getAttributes() : [];
                        if (!empty($baAttrs['account_id'])) {
                            $acc = Account::where('tenant_id', $tenantId)->find($baAttrs['account_id']);
                            if ($acc) {
                                $paymentAccount = $acc->code;
                            }
                        }
                    }
                }

                $bankAccountId = $payload['bank_account_id'] ?? null;
                if (in_array($paymentMethod, ['bank', 'cheque'], true) && empty($bankAccountId)) {
                    $firstBank = BankAccount::where('tenant_id', $tenantId)
                        ->where('type', 'bank')
                        ->first();
                    $bankAccountId = $firstBank?->id;
                }

                $payment = \App\Models\Payment::create([
                    'tenant_id'       => $tenantId,
                    'date'            => $paymentDate,
                    'type'            => 'out',
                    'party_id'        => $supplierId,
                    'amount'          => $amount,
                    'method'          => $paymentMethod,
                    'bank_account_id' => $bankAccountId,
                    'reference'       => $reference,
                    'notes'           => $payload['notes'] ?? 'Supplier payment',
                    'cheque_date'     => $payload['cheque_date'] ?? null,
                ]);

                // Journal Entry: DR 2000 Accounts Payable, CR 1000/1010 Cash or Bank
                $journalEntry = $this->accounting->createEntry([
                    'tenant_id'      => $tenantId,
                    'date'           => $paymentDate,
                    'reference_type' => 'supplier_payment',
                    'reference'      => $reference ?: Str::uuid()->toString(),
                    'description'    => 'Supplier payment' . ($reference ? ' — ' . $reference : ''),
                    'party_id'       => $supplierId,
                    'user_id'        => $user?->id ?? auth()->id(),
                ], [
                    [
                        'account_code' => '2000',
                        'debit'        => $amount,
                        'credit'       => 0,
                        'party_id'     => $supplierId,
                    ],
                    [
                        'account_code'    => $paymentAccount,
                        'debit'           => 0,
                        'credit'          => $amount,
                        'bank_account_id' => in_array($paymentMethod, ['bank', 'cheque'], true) ? $bankAccountId : null,
                    ],
                ]);

                $formattedAllocations = array_map(fn($a) => [
                    'purchase_id' => $a['purchase_id'],
                    'amount'      => (float) $a['amount'],
                ], $allocations);

                $this->payments->allocate($journalEntry->id, $formattedAllocations);

                return [
                    'journal_entry_id' => $journalEntry->id,
                    'reference'        => $journalEntry->reference,
                    'amount'           => $amount,
                    'supplier_id'      => $supplierId,
                    'allocations'      => $formattedAllocations,
                    'payment_id'       => $payment->id,
                ];
            });
        });
    }
}
