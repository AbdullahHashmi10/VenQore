<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * T1.2 Data Fix — Align existing tenant Chart of Accounts with SaleController codes.
 *
 * Problem: TenantDefaultSeeder seeded code 1100 as "Bank Account" but SaleController's
 * postSaleJournal() uses code 1100 for "Inventory Asset" (COGS journal entries).
 * This caused COGS to debit the wrong account on every sale.
 *
 * This migration fixes ALL existing tenants by:
 * 1. Renaming code 1100 from "Bank Account" to "Inventory Asset"
 * 2. Adding code 1010 "Bank Account" if missing
 * 3. Adding codes 2050, 4900, 5900 that postSaleJournal references
 * 4. Fixing type 'revenue' → 'income' for consistency with legacy logic
 */
return new class extends Migration
{
    public function up(): void
    {
        // Get all tenant IDs
        $tenantIds = DB::table('tenants')->pluck('id');

        foreach ($tenantIds as $tenantId) {
            // Fix 1: If code 1100 = "Bank Account", rename it to "Inventory Asset"
            DB::table('accounts')
                ->where('tenant_id', $tenantId)
                ->where('code', '1100')
                ->where('name', 'Bank Account')
                ->update(['name' => 'Inventory Asset']);

            // Fix 2: Add code 1010 "Bank Account" if missing
            if (!DB::table('accounts')->where('tenant_id', $tenantId)->where('code', '1010')->exists()) {
                DB::table('accounts')->insert([
                    'id'         => (string) Str::uuid(),
                    'tenant_id'  => $tenantId,
                    'code'       => '1010',
                    'name'       => 'Bank Account',
                    'type'       => 'asset',
                    'balance'    => 0,
                    'is_active'  => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Fix 3: Add code 2050 "Customer Credit Balances" if missing
            if (!DB::table('accounts')->where('tenant_id', $tenantId)->where('code', '2050')->exists()) {
                DB::table('accounts')->insert([
                    'id'         => (string) Str::uuid(),
                    'tenant_id'  => $tenantId,
                    'code'       => '2050',
                    'name'       => 'Customer Credit Balances',
                    'type'       => 'liability',
                    'balance'    => 0,
                    'is_active'  => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Fix 4: Add code 4900 "Round Off Income" if missing
            if (!DB::table('accounts')->where('tenant_id', $tenantId)->where('code', '4900')->exists()) {
                DB::table('accounts')->insert([
                    'id'         => (string) Str::uuid(),
                    'tenant_id'  => $tenantId,
                    'code'       => '4900',
                    'name'       => 'Round Off Income',
                    'type'       => 'income',
                    'balance'    => 0,
                    'is_active'  => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Fix 5: Add code 5900 "Round Off Expense" if missing (may exist as "Other Expenses")
            if (!DB::table('accounts')->where('tenant_id', $tenantId)->where('code', '5900')->exists()) {
                DB::table('accounts')->insert([
                    'id'         => (string) Str::uuid(),
                    'tenant_id'  => $tenantId,
                    'code'       => '5900',
                    'name'       => 'Round Off Expense',
                    'type'       => 'expense',
                    'balance'    => 0,
                    'is_active'  => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Fix 6: Correct type 'revenue' → 'income' for consistency
            DB::table('accounts')
                ->where('tenant_id', $tenantId)
                ->where('type', 'revenue')
                ->update(['type' => 'income']);
        }
    }

    public function down(): void
    {
        // Reverse: rename Inventory Asset back to Bank Account on 1100
        // This is a data fix — reversal is best-effort
        $tenantIds = DB::table('tenants')->pluck('id');
        foreach ($tenantIds as $tenantId) {
            DB::table('accounts')
                ->where('tenant_id', $tenantId)
                ->where('code', '1100')
                ->where('name', 'Inventory Asset')
                ->update(['name' => 'Bank Account']);

            DB::table('accounts')
                ->where('tenant_id', $tenantId)
                ->where('type', 'income')
                ->update(['type' => 'revenue']);
        }
    }
};
