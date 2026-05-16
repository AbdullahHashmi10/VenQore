<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Sale;
use App\Models\Payment;
use App\Models\BankAccount;
use App\Models\FundTransaction;
use App\Models\Expense;
use App\Models\Account;
use App\Models\Invoice;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AuditFinancialIntegrity extends Command
{
    protected $signature = 'finance:audit {--tenant= : Run for a specific tenant ID only}';
    protected $description = 'Audits all financial records, finds missing payments, and recalculates cash in hand precisely (per tenant).';

    public function handle()
    {
        $this->info('Starting financial audit...');

        $tenantQuery = Tenant::whereIn('status', ['active', 'trial']);
        if ($this->option('tenant')) {
            $tenantQuery->where('id', (int) $this->option('tenant'));
        }

        $tenants = $tenantQuery->get();

        foreach ($tenants as $tenant) {
            $this->info("\n🏪 Tenant [{$tenant->id}] {$tenant->name}");
            $this->auditForTenant($tenant->id);
        }

        $this->info('Audit completed successfully.');
        return 0;
    }

    private function auditForTenant(int $tenantId): void
    {
        DB::transaction(function () use ($tenantId) {

            // ── STEP 1: Fix missing payment records for paid sales ─────────────
            $this->info('   Checking missing sale payments...');
            $sales = Sale::where('tenant_id', $tenantId)
                ->whereIn('payment_status', ['paid', 'partial'])
                ->get();
            $paymentsAdded = 0;

            foreach ($sales as $sale) {
                $actualPaymentsIn  = (float) Payment::where('tenant_id', $tenantId)
                    ->where('sale_id', $sale->id)
                    ->where('type', 'in')
                    ->sum(DB::raw('ABS(amount)'));
                $actualPaymentsOut = (float) Payment::where('tenant_id', $tenantId)
                    ->where('sale_id', $sale->id)
                    ->where('type', 'out')
                    ->sum(DB::raw('ABS(amount)'));

                $actualPaymentsNet = $actualPaymentsIn - $actualPaymentsOut;
                $expectedAmount    = $sale->tendered_amount > 0
                    ? min($sale->tendered_amount, $sale->total)
                    : $sale->total;

                if ($sale->payment_status === 'paid' && $actualPaymentsNet < ($sale->total - 0.01)) {
                    $missingAmount = $sale->total - $actualPaymentsNet;
                    if ($missingAmount > 0) {
                        Payment::create([
                            'tenant_id' => $tenantId,
                            'sale_id'   => $sale->id,
                            'amount'    => $missingAmount,
                            'method'    => $sale->payment_method ?: 'cash',
                            'type'      => 'in',
                            'date'      => $sale->created_at->toDateString(),
                            'reference' => 'SYSTEM-AUDIT-FIX',
                        ]);
                        $paymentsAdded++;
                    }
                } elseif ($sale->payment_status === 'partial' && $sale->tendered_amount > 0
                    && $actualPaymentsNet < ($sale->tendered_amount - 0.01)) {
                    $missingAmount = $sale->tendered_amount - $actualPaymentsNet;
                    if ($missingAmount > 0) {
                        Payment::create([
                            'tenant_id' => $tenantId,
                            'sale_id'   => $sale->id,
                            'amount'    => $missingAmount,
                            'method'    => $sale->payment_method ?: 'cash',
                            'type'      => 'in',
                            'date'      => $sale->created_at->toDateString(),
                            'reference' => 'SYSTEM-AUDIT-FIX',
                        ]);
                        $paymentsAdded++;
                    }
                }
            }

            if ($paymentsAdded > 0) {
                $this->info("   Added {$paymentsAdded} missing sale payment records.");
                Log::info("Finance Audit [{$tenantId}]: Added {$paymentsAdded} missing sale payment records.");
            }

            // ── STEP 2: Fix missing payment records for purchases ──────────────
            $this->info('   Checking missing purchase payments...');
            $purchases = Invoice::where('tenant_id', $tenantId)
                ->where('type', 'purchase')
                ->where('paid_amount', '>', 0)
                ->get();
            $purchasePaymentsAdded = 0;

            foreach ($purchases as $purchase) {
                $actualPaymentsOut = (float) Payment::where('tenant_id', $tenantId)
                    ->where('type', 'out')
                    ->where('reference', $purchase->invoice_number)
                    ->sum(DB::raw('ABS(amount)'));
                $actualPaymentsIn  = (float) Payment::where('tenant_id', $tenantId)
                    ->where('type', 'in')
                    ->where('reference', $purchase->invoice_number)
                    ->sum(DB::raw('ABS(amount)'));

                $actualPaymentsNet = $actualPaymentsOut - $actualPaymentsIn;

                if ($actualPaymentsNet < ($purchase->paid_amount - 0.01)) {
                    $missingAmount = $purchase->paid_amount - $actualPaymentsNet;
                    if ($missingAmount > 0) {
                        Payment::create([
                            'tenant_id' => $tenantId,
                            'party_id'  => $purchase->party_id,
                            'amount'    => $missingAmount,
                            'method'    => 'cash',
                            'type'      => 'out',
                            'date'      => $purchase->created_at->toDateString(),
                            'reference' => $purchase->invoice_number,
                            'notes'     => 'SYSTEM-AUDIT-FIX missing purchase payment',
                        ]);
                        $purchasePaymentsAdded++;
                    }
                }
            }

            if ($purchasePaymentsAdded > 0) {
                $this->info("   Added {$purchasePaymentsAdded} missing purchase payment records.");
            }

            // ── STEP 3: Re-link orphan fund transactions ───────────────────────
            $this->info('   Linking orphan fund transactions...');
            $cashBank = BankAccount::where('tenant_id', $tenantId)
                ->firstOrCreate(
                    ['account_type' => 'cash', 'tenant_id' => $tenantId],
                    ['name' => 'Cash in Hand', 'type' => 'cash', 'opening_balance' => 0, 'current_balance' => 0]
                );

            FundTransaction::where('tenant_id', $tenantId)
                ->where('type', 'add')
                ->whereNull('to_account_id')
                ->update(['to_account_id' => $cashBank->id]);

            FundTransaction::where('tenant_id', $tenantId)
                ->where('type', 'remove')
                ->whereNull('from_account_id')
                ->update(['from_account_id' => $cashBank->id]);

            // ── STEP 4: Recalculate cash in hand for this tenant ───────────────
            $this->info('   Recalculating cash in hand...');
            $legacyCash = (float) BankAccount::where('tenant_id', $tenantId)
                ->where('account_type', 'cash')
                ->sum('opening_balance');

            $inPayments = Payment::where('tenant_id', $tenantId)
                ->whereIn('method', ['cash', 'cash,bank', 'split', 'cash,split'])
                ->where('type', 'in')
                ->sum(DB::raw('ABS(amount)'));

            $outPayments = Payment::where('tenant_id', $tenantId)
                ->whereIn('method', ['cash', 'cash,bank', 'split', 'cash,split'])
                ->where('type', 'out')
                ->sum(DB::raw('ABS(amount)'));

            $fundIn = (float) FundTransaction::where('tenant_id', $tenantId)
                ->where('to_account_id', $cashBank->id)
                ->whereIn('type', ['add', 'transfer', 'adjust'])
                ->sum(DB::raw('ABS(amount)'));

            $fundOut = (float) FundTransaction::where('tenant_id', $tenantId)
                ->where('from_account_id', $cashBank->id)
                ->whereIn('type', ['remove', 'transfer', 'adjust'])
                ->sum(DB::raw('ABS(amount)'));

            $cashExpenses = (float) Expense::where('tenant_id', $tenantId)
                ->where('payment_method', 'cash')
                ->sum(DB::raw('ABS(amount)'));

            $cashBalance = $legacyCash + $inPayments - $outPayments + $fundIn - $fundOut - $cashExpenses;

            $cashBank->current_balance = $cashBalance;
            $cashBank->save();
            $this->info("   Cash balance for tenant {$tenantId}: Rs {$cashBalance}");

            // ── STEP 5: Sync GL account 1000 for this tenant ──────────────────
            $glCashAccount = Account::where('tenant_id', $tenantId)->where('code', '1000')->first();
            if ($glCashAccount) {
                $totalDebit = DB::table('journal_items')
                    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                    ->where('journal_items.account_id', $glCashAccount->id)
                    ->where('journal_entries.tenant_id', $tenantId)
                    ->where('journal_entries.is_reversed', 0)
                    ->sum('journal_items.debit');

                $totalCredit = DB::table('journal_items')
                    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                    ->where('journal_items.account_id', $glCashAccount->id)
                    ->where('journal_entries.tenant_id', $tenantId)
                    ->where('journal_entries.is_reversed', 0)
                    ->sum('journal_items.credit');

                $glCalculatedBalance = $totalDebit - $totalCredit;

                if (abs((float)$glCashAccount->balance - (float)$glCalculatedBalance) > 0.001) {
                    $glCashAccount->balance = $glCalculatedBalance;
                    $glCashAccount->save();
                    $this->info("   Updated GL Account 1000 to {$glCalculatedBalance}");
                }
            }
        });
    }
}
