<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\Tenant;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalItem;

class ScaleStoreLedgerSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::where('slug', 'scale-store')->first();
        if (!$tenant) {
            echo "Tenant 'scale-store' not found.\n";
            return;
        }

        $tenantId = $tenant->id;
        echo "Seeding General Ledger for Tenant: {$tenant->name} (ID: {$tenantId}, Slug: {$tenant->slug})\n";

        // Clean up previous journal entries for scale-store if any
        $oldEntries = JournalEntry::withoutGlobalScopes()->where('tenant_id', $tenantId)->pluck('id');
        if ($oldEntries->isNotEmpty()) {
            JournalItem::withoutGlobalScopes()->whereIn('journal_entry_id', $oldEntries)->delete();
            JournalEntry::withoutGlobalScopes()->where('tenant_id', $tenantId)->delete();
            echo "Cleaned up " . $oldEntries->count() . " old entries.\n";
        }

        // Get accounts map by code
        $accounts = Account::withoutGlobalScopes()->where('tenant_id', $tenantId)->get()->keyBy('code');

        $acct = function($code) use ($accounts) {
            if (!isset($accounts[$code])) {
                throw new \RuntimeException("Account code {$code} not found.");
            }
            return $accounts[$code]->id;
        };

        $totalDebitsAll = 0.0;
        $totalCreditsAll = 0.0;
        $entriesCount = 0;

        $postEntry = function($date, $ref, $refType, $desc, array $lines) use ($tenantId, &$totalDebitsAll, &$totalCreditsAll, &$entriesCount) {
            $sumDebit = round(array_sum(array_column($lines, 'debit')), 2);
            $sumCredit = round(array_sum(array_column($lines, 'credit')), 2);

            if (abs($sumDebit - $sumCredit) > 0.01) {
                throw new \RuntimeException("UNBALANCED ENTRY: {$ref} - Debit: {$sumDebit}, Credit: {$sumCredit}");
            }

            $entryId = (string) Str::uuid();
            $dt = Carbon::parse($date)->setTime(rand(9, 21), rand(0, 59), rand(0, 59));

            DB::table('journal_entries')->insert([
                'id' => $entryId,
                'tenant_id' => $tenantId,
                'date' => Carbon::parse($date)->toDateString(),
                'reference' => $ref,
                'reference_type' => $refType,
                'description' => $desc,
                'narration' => $desc,
                'is_reversed' => 0,
                'user_id' => 1,
                'created_at' => $dt,
                'updated_at' => $dt,
            ]);

            foreach ($lines as $line) {
                $deb = round((float) ($line['debit'] ?? 0), 2);
                $crd = round((float) ($line['credit'] ?? 0), 2);
                if ($deb == 0 && $crd == 0) continue;

                DB::table('journal_items')->insert([
                    'id' => (string) Str::uuid(),
                    'tenant_id' => $tenantId,
                    'journal_entry_id' => $entryId,
                    'account_id' => $line['account_id'],
                    'debit' => $deb,
                    'credit' => $crd,
                    'description' => $line['desc'] ?? $desc,
                    'created_at' => $dt,
                    'updated_at' => $dt,
                ]);

                $totalDebitsAll += $deb;
                $totalCreditsAll += $crd;
            }

            $entriesCount++;
        };

        // ══════════════════════════════════════════════════════════════════════════
        // 1. OPENING BALANCE (July 1, 2026)
        // ══════════════════════════════════════════════════════════════════════════
        $postEntry('2026-07-01', 'OB-2026-001', 'opening_balance', 'Opening Capital & Balances', [
            ['account_id' => $acct('1010'), 'debit' => 550000.00, 'credit' => 0.00, 'desc' => 'Bank Opening Balance'],
            ['account_id' => $acct('1000'), 'debit' => 120000.00, 'credit' => 0.00, 'desc' => 'Cash in Hand Opening'],
            ['account_id' => $acct('1100'), 'debit' => 650000.00, 'credit' => 0.00, 'desc' => 'Opening Inventory Asset'],
            ['account_id' => $acct('3000'), 'debit' => 0.00,      'credit' => 1320000.00, 'desc' => "Owner's Capital Contribution"],
        ]);

        // ══════════════════════════════════════════════════════════════════════════
        // 2. FIXED MONTHLY & RECURRING OPERATING EXPENSES (July, August, September)
        // ══════════════════════════════════════════════════════════════════════════
        // July Expenses
        $postEntry('2026-07-01', 'EXP-2026-0701', 'expense', 'Monthly Shop Rent - July 2026', [
            ['account_id' => $acct('5200'), 'debit' => 25000.00, 'credit' => 0.00, 'desc' => 'Shop Lease Payment July'],
            ['account_id' => $acct('1010'), 'debit' => 0.00,     'credit' => 25000.00, 'desc' => 'Bank Transfer - Landlord'],
        ]);

        $postEntry('2026-07-15', 'EXP-2026-0715', 'expense', 'Utility Bills - Electricity & Fiber July', [
            ['account_id' => $acct('5300'), 'debit' => 7850.00,  'credit' => 0.00, 'desc' => 'Electricity & High-speed Internet'],
            ['account_id' => $acct('1010'), 'debit' => 0.00,     'credit' => 7850.00, 'desc' => 'Bank Auto-Debit'],
        ]);

        $postEntry('2026-07-20', 'EXP-2026-0720', 'expense', 'Packaging & Consumables Purchase', [
            ['account_id' => $acct('6000'), 'debit' => 4500.00,  'credit' => 0.00, 'desc' => 'Bags, receipts and thermal paper'],
            ['account_id' => $acct('1000'), 'debit' => 0.00,     'credit' => 4500.00, 'desc' => 'Paid from Cash in Hand'],
        ]);

        $postEntry('2026-07-31', 'EXP-2026-0731', 'expense', 'Monthly Staff Payroll - July 2026', [
            ['account_id' => $acct('5100'), 'debit' => 42000.00, 'credit' => 0.00, 'desc' => 'Staff Salaries for July'],
            ['account_id' => $acct('1010'), 'debit' => 0.00,     'credit' => 42000.00, 'desc' => 'Direct Bank Deposit'],
        ]);

        // August Expenses
        $postEntry('2026-08-01', 'EXP-2026-0801', 'expense', 'Monthly Shop Rent - August 2026', [
            ['account_id' => $acct('5200'), 'debit' => 25000.00, 'credit' => 0.00, 'desc' => 'Shop Lease Payment August'],
            ['account_id' => $acct('1010'), 'debit' => 0.00,     'credit' => 25000.00, 'desc' => 'Bank Transfer - Landlord'],
        ]);

        $postEntry('2026-08-14', 'EXP-2026-0814', 'expense', 'Utility Bills - Electricity & Fiber August', [
            ['account_id' => $acct('5300'), 'debit' => 8420.00,  'credit' => 0.00, 'desc' => 'Commercial Power & Internet'],
            ['account_id' => $acct('1010'), 'debit' => 0.00,     'credit' => 8420.00, 'desc' => 'Bank Auto-Debit'],
        ]);

        $postEntry('2026-08-22', 'EXP-2026-0822', 'expense', 'Store Maintenance & Cleanliness', [
            ['account_id' => $acct('6000'), 'debit' => 5200.00,  'credit' => 0.00, 'desc' => 'Equipment servicing and supplies'],
            ['account_id' => $acct('1000'), 'debit' => 0.00,     'credit' => 5200.00, 'desc' => 'Paid from Cash in Hand'],
        ]);

        $postEntry('2026-08-31', 'EXP-2026-0831', 'expense', 'Monthly Staff Payroll - August 2026', [
            ['account_id' => $acct('5100'), 'debit' => 45000.00, 'credit' => 0.00, 'desc' => 'Staff Salaries for August'],
            ['account_id' => $acct('1010'), 'debit' => 0.00,     'credit' => 45000.00, 'desc' => 'Direct Bank Deposit'],
        ]);

        // September Expenses (to date)
        $postEntry('2026-09-01', 'EXP-2026-0901', 'expense', 'Monthly Shop Rent - September 2026', [
            ['account_id' => $acct('5200'), 'debit' => 25000.00, 'credit' => 0.00, 'desc' => 'Shop Lease Payment September'],
            ['account_id' => $acct('1010'), 'debit' => 0.00,     'credit' => 25000.00, 'desc' => 'Bank Transfer - Landlord'],
        ]);

        $postEntry('2026-09-10', 'EXP-2026-0910', 'expense', 'Utility Bills - Electricity September Part', [
            ['account_id' => $acct('5300'), 'debit' => 4600.00,  'credit' => 0.00, 'desc' => 'Utility Advance / Meter Settlement'],
            ['account_id' => $acct('1010'), 'debit' => 0.00,     'credit' => 4600.00, 'desc' => 'Bank Transfer'],
        ]);

        $postEntry('2026-09-13', 'EXP-2026-0913', 'expense', 'Marketing & Promotion Flyers', [
            ['account_id' => $acct('6000'), 'debit' => 3800.00,  'credit' => 0.00, 'desc' => 'Digital ad campaign & printed banners'],
            ['account_id' => $acct('1000'), 'debit' => 0.00,     'credit' => 3800.00, 'desc' => 'Cash Payment'],
        ]);

        // ══════════════════════════════════════════════════════════════════════════
        // 3. INVENTORY PURCHASES (Restocking throughout July, August, September)
        // ══════════════════════════════════════════════════════════════════════════
        $purchaseDates = [
            '2026-07-04' => 45000,
            '2026-07-12' => 48500,
            '2026-07-19' => 52000,
            '2026-07-27' => 46000,
            '2026-08-04' => 55000,
            '2026-08-11' => 58000,
            '2026-08-18' => 50000,
            '2026-08-26' => 60000,
            '2026-09-03' => 52000,
            '2026-09-09' => 56000,
        ];

        $pIdx = 1;
        foreach ($purchaseDates as $pDate => $amount) {
            $ref = sprintf('PUR-2026-%03d', $pIdx++);
            $postEntry($pDate, $ref, 'purchase', "Wholesale Inventory Restock ({$pDate})", [
                ['account_id' => $acct('1100'), 'debit' => (float)$amount, 'credit' => 0.00, 'desc' => 'Inventory Received into Stock'],
                ['account_id' => $acct('1010'), 'debit' => 0.00, 'credit' => (float)$amount, 'desc' => 'Vendor Payment via Bank'],
            ]);
        }

        // ══════════════════════════════════════════════════════════════════════════
        // 4. DAILY SALES & COGS TRANSACTIONS (July 1, 2026 to September 15, 2026)
        // ══════════════════════════════════════════════════════════════════════════
        $startDate = Carbon::create(2026, 7, 1);
        $endDate   = Carbon::create(2026, 9, 15);

        $cur = $startDate->copy();
        $saleIdx = 1;

        while ($cur->lte($endDate)) {
            $dayOfWeek = $cur->dayOfWeek; // 0=Sunday, 6=Saturday
            $isWeekend = ($dayOfWeek === Carbon::SATURDAY || $dayOfWeek === Carbon::SUNDAY);

            // Realistic baseline revenue with weekend surge and gradual month-over-month growth
            $monthGrowth = match($cur->month) {
                7 => 1.00,
                8 => 1.15,
                9 => 1.25,
            };

            $baseRevenue = ($isWeekend ? rand(15000, 24000) : rand(9000, 16000)) * $monthGrowth;
            $baseRevenue = round($baseRevenue, -2); // round to nearest 100

            // Sales Tax: 5%
            $taxAmount = round($baseRevenue * 0.05, 2);
            $totalCollected = $baseRevenue + $taxAmount;

            // Split collection: ~55% Cash, ~45% Bank (Card/Online)
            $cashAmount = round($totalCollected * 0.55, 2);
            $bankAmount = round($totalCollected - $cashAmount, 2);

            // COGS: 58% of revenue
            $cogsAmount = round($baseRevenue * 0.58, 2);

            $dateStr = $cur->toDateString();
            $ref = sprintf('POS-2026-%04d', $saleIdx++);

            // Post Daily POS Sales Entry
            $postEntry($dateStr, $ref, 'sale', "POS Daily Register Close ({$dateStr})", [
                ['account_id' => $acct('1000'), 'debit' => $cashAmount,  'credit' => 0.00,        'desc' => 'Cash Register Collections'],
                ['account_id' => $acct('1010'), 'debit' => $bankAmount,  'credit' => 0.00,        'desc' => 'Card / Digital POS Receipts'],
                ['account_id' => $acct('4000'), 'debit' => 0.00,        'credit' => $baseRevenue, 'desc' => 'Sales Revenue'],
                ['account_id' => $acct('2100'), 'debit' => 0.00,        'credit' => $taxAmount,   'desc' => 'Sales Tax (5%) Collected'],
                ['account_id' => $acct('5000'), 'debit' => $cogsAmount,  'credit' => 0.00,        'desc' => 'Cost of Goods Sold'],
                ['account_id' => $acct('1100'), 'debit' => 0.00,        'credit' => $cogsAmount,  'desc' => 'Inventory Depletion'],
            ]);

            // Every ~6 days, record a B2B credit sale on account
            if ($cur->day % 6 === 0) {
                $b2bRevenue = round(rand(18000, 32000) * $monthGrowth, -2);
                $b2bCogs = round($b2bRevenue * 0.56, 2);
                $b2bRef = sprintf('INV-B2B-%03d', (int)($cur->dayOfYear));

                $postEntry($dateStr, $b2bRef, 'sale', "B2B Commercial Order on Account ({$dateStr})", [
                    ['account_id' => $acct('1200'), 'debit' => $b2bRevenue, 'credit' => 0.00,        'desc' => 'Accounts Receivable - Corporate Client'],
                    ['account_id' => $acct('4000'), 'debit' => 0.00,        'credit' => $b2bRevenue, 'desc' => 'Wholesale Sales Revenue'],
                    ['account_id' => $acct('5000'), 'debit' => $b2bCogs,    'credit' => 0.00,        'desc' => 'Cost of Goods Sold (B2B)'],
                    ['account_id' => $acct('1100'), 'debit' => 0.00,        'credit' => $b2bCogs,    'desc' => 'Bulk Inventory Reduction'],
                ]);
            }

            // Every ~8 days, record client payment clearing Accounts Receivable
            if ($cur->day % 8 === 0 && $cur->gt($startDate->copy()->addDays(5))) {
                $receiptAmt = round(rand(16000, 28000), -2);
                $recRef = sprintf('RCT-2026-%03d', (int)($cur->dayOfYear));

                $postEntry($dateStr, $recRef, 'payment', "Client Invoice Settlement Received ({$dateStr})", [
                    ['account_id' => $acct('1010'), 'debit' => $receiptAmt, 'credit' => 0.00,        'desc' => 'Bank Receipt from Customer'],
                    ['account_id' => $acct('1200'), 'debit' => 0.00,        'credit' => $receiptAmt, 'desc' => 'Clear Accounts Receivable'],
                ]);
            }

            $cur->addDay();
        }

        // ══════════════════════════════════════════════════════════════════════════
        // 5. UPDATE DENORMALIZED ACCOUNTS.BALANCE (Ensuring UI Consistency)
        // ══════════════════════════════════════════════════════════════════════════
        $sums = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entries.tenant_id', $tenantId)
            ->where('journal_entries.is_reversed', 0)
            ->selectRaw('journal_items.account_id, SUM(journal_items.debit) as total_debit, SUM(journal_items.credit) as total_credit')
            ->groupBy('journal_items.account_id')
            ->get();

        foreach ($sums as $s) {
            $account = Account::withoutGlobalScopes()->where('id', $s->account_id)->first();
            if ($account) {
                $normal = $account->normal_balance ?: (in_array($account->type, ['asset', 'expense']) ? 'debit' : 'credit');
                $bal = $normal === 'debit'
                    ? ((float)$s->total_debit - (float)$s->total_credit)
                    : ((float)$s->total_credit - (float)$s->total_debit);
                $account->update(['balance' => round($bal, 2)]);
            }
        }

        // Also update BankAccount current_balance
        $bankAccount = \App\Models\BankAccount::withoutGlobalScopes()->where('tenant_id', $tenantId)->first();
        if ($bankAccount) {
            $bankLedger = $sums->firstWhere('account_id', $acct('1010'));
            if ($bankLedger) {
                $netBank = (float)$bankLedger->total_debit - (float)$bankLedger->total_credit;
                $bankAccount->update(['current_balance' => round($netBank, 2)]);
            }
        }

        echo "\n" . str_repeat('─', 60) . "\n";
        echo "GENERAL LEDGER SEEDING COMPLETE FOR SCALE-STORE:\n";
        echo " - Total Journal Entries Posted: {$entriesCount}\n";
        echo " - Total Debits Across Ledger:  Rs " . number_format($totalDebitsAll, 2) . "\n";
        echo " - Total Credits Across Ledger: Rs " . number_format($totalCreditsAll, 2) . "\n";
        $diff = abs($totalDebitsAll - $totalCreditsAll);
        echo " - Trial Balance Variance:      Rs " . number_format($diff, 4) . " (" . ($diff < 0.001 ? "PERFECTLY BALANCED ✓" : "UNBALANCED ✗") . ")\n";
        echo str_repeat('─', 60) . "\n";
    }
}
