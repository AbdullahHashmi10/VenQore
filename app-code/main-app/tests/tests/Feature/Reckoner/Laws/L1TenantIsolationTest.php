<?php

namespace Tests\Feature\Reckoner\Laws;

use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use App\Models\Party;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRegistry;
use App\Reckoner\ReckonerRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * L1 — Tenant Isolation Law
 *
 * Every reading returns an identical result whether or not another tenant's
 * data exists in the same database. Cross-tenant bleed is the worst failure
 * class in a multi-tenant SaaS.
 *
 * Strategy:
 * 1. Seed Tenant A with a rich, realistic footprint (sales, ledger entries,
 *    expenses, purchases, stock, reminders, batches).
 * 2. Record Tenant A baseline readings and verify key metrics are genuinely non-zero.
 * 3. Seed Tenant B with large, distinct data in the same database.
 * 4. Re-read all Tenant A readings and prove they are 100% identical before and after.
 * 5. Verify Tenant B readings are non-zero and differ from Tenant A readings.
 */
class L1TenantIsolationTest extends VenQoreTestCase
{
    public function test_all_tenant_readings_are_isolated_from_other_tenant_data(): void
    {
        // ── Tenant A — the tenant under test ───────────────────────────────
        $tenantA = $this->createTenant();
        $userA   = $this->createTenantUser($tenantA, 'owner');
        $this->bindTenantContext($tenantA, $userA);

        $this->seedTenantFootprint($tenantA, $userA, [
            'category_name'   => 'Tenant A Goods',
            'product_name'    => 'Tenant A Product',
            'sku'             => 'SKU-TENANT-A',
            'barcode'         => 'BAR-TENANT-A',
            'price'           => 100.0,
            'cost'            => 60.0,
            'stock_qty'       => 50,
            'sale_revenue'    => 1000.0,
            'sale_cogs'       => 600.0,
            'sale_ref'        => 'SALE-A-001',
            'expense_amount'  => 200.0,
            'purchase_amount' => 500.0,
            'batch_qty'       => 25.0,
        ]);

        Cache::flush();
        Reckoner::forgetCapabilities($tenantA->id);

        $reckoner = new Reckoner();
        $all      = ReckonerRegistry::all();

        // ── Baseline: read all tenant-scoped readings with only Tenant A data ──
        $baseline = $this->resolveAll($reckoner, $all, $userA, $tenantA);

        // Verify baseline is genuinely non-zero on core metrics (proving test is non-vacuous)
        $this->assertTrue($baseline['sales.revenue']['ok'] ?? false, 'sales.revenue must resolve for Tenant A');
        $this->assertEqualsWithDelta(2000.0, (float) ($baseline['sales.revenue']['value'] ?? 0), 0.01, 'Tenant A baseline revenue should be 2000');
        $this->assertTrue($baseline['finance.net_profit']['ok'] ?? false, 'finance.net_profit must resolve for Tenant A');
        $this->assertEqualsWithDelta(1200.0, (float) ($baseline['finance.net_profit']['value'] ?? 0), 0.01, 'Tenant A net profit (2000 rev - 600 cogs - 200 exp) should be 1200');

        // ── Pollute: add substantial, different data for Tenant B ───────────
        $tenantB = $this->createTenant();
        $userB   = $this->createTenantUser($tenantB, 'owner');
        $this->bindTenantContext($tenantB, $userB);

        $this->seedTenantFootprint($tenantB, $userB, [
            'category_name'   => 'Tenant B Supplies',
            'product_name'    => 'Tenant B Giant Product',
            'sku'             => 'SKU-TENANT-B',
            'barcode'         => 'BAR-TENANT-B',
            'price'           => 500.0,
            'cost'            => 300.0,
            'stock_qty'       => 500,
            'sale_revenue'    => 15000.0,
            'sale_cogs'       => 9000.0,
            'sale_ref'        => 'SALE-B-999',
            'expense_amount'  => 3000.0,
            'purchase_amount' => 8000.0,
            'batch_qty'       => 350.0,
        ]);

        Cache::flush();
        Reckoner::forgetCapabilities($tenantB->id);

        // Verify Tenant B has non-zero, distinct readings
        $tenantBReadings = $this->resolveAll($reckoner, $all, $userB, $tenantB);
        $this->assertEqualsWithDelta(30000.0, (float) ($tenantBReadings['sales.revenue']['value'] ?? 0), 0.01, 'Tenant B revenue must be 30000');
        $this->assertEqualsWithDelta(18000.0, (float) ($tenantBReadings['finance.net_profit']['value'] ?? 0), 0.01, 'Tenant B net profit must be 18000');

        // ── Switch back to Tenant A context ─────────────────────────────────
        $this->bindTenantContext($tenantA, $userA);
        Cache::flush();
        Reckoner::forgetCapabilities($tenantA->id);

        // ── After pollution: re-read all readings for Tenant A ───────────────
        $afterPollution = $this->resolveAll($reckoner, $all, $userA, $tenantA);

        // ── Assert isolation ─────────────────────────────────────────────────
        $failures = [];
        foreach ($baseline as $key => $before) {
            $after = $afterPollution[$key] ?? null;
            if ($after === null) {
                $failures[] = "Reading '{$key}' missing after Tenant B data added.";
                continue;
            }

            if (! $before['ok'] && in_array($before['errorCode'], ['forbidden', 'plan_locked', 'not_found'], true)) {
                continue;
            }

            if ($before['ok'] !== $after['ok']) {
                $failures[] = "Reading '{$key}': ok changed from ".($before['ok'] ? 'true' : 'false')
                    ." to ".($after['ok'] ? 'true' : 'false')." after Tenant B data added.";
                continue;
            }

            if ($before['ok'] && $after['ok']) {
                $valBefore = $before['value'];
                $valAfter  = $after['value'];
                if ($valBefore !== $valAfter) {
                    $failures[] = "Reading '{$key}': value changed from ".json_encode($valBefore)
                        ." to ".json_encode($valAfter)." after Tenant B data added — CROSS-TENANT BLEED.";
                }
            }
        }

        $this->assertEmpty(
            $failures,
            "L1 Tenant Isolation failures:\n" . implode("\n", $failures)
        );
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function seedTenantFootprint($tenant, $user, array $vals): void
    {
        $tenantId = $tenant->id;

        // Accounts
        $cashAcc = Account::firstOrCreate(
            ['tenant_id' => $tenantId, 'code' => '1000'],
            ['name' => 'Cash', 'type' => 'asset', 'is_active' => true]
        );
        $arAcc = Account::firstOrCreate(
            ['tenant_id' => $tenantId, 'code' => '1200'],
            ['name' => 'Accounts Receivable', 'type' => 'asset', 'is_active' => true]
        );
        $invAcc = Account::firstOrCreate(
            ['tenant_id' => $tenantId, 'code' => '1300'],
            ['name' => 'Inventory Asset', 'type' => 'asset', 'is_active' => true]
        );
        $apAcc = Account::firstOrCreate(
            ['tenant_id' => $tenantId, 'code' => '2000'],
            ['name' => 'Accounts Payable', 'type' => 'liability', 'is_active' => true]
        );
        $revAcc = Account::firstOrCreate(
            ['tenant_id' => $tenantId, 'code' => '4000'],
            ['name' => 'Sales Revenue', 'type' => 'income', 'is_active' => true]
        );
        $cogsAcc = Account::firstOrCreate(
            ['tenant_id' => $tenantId, 'code' => '5000'],
            ['name' => 'Cost of Goods Sold', 'type' => 'expense', 'is_active' => true]
        );
        $expAcc = Account::firstOrCreate(
            ['tenant_id' => $tenantId, 'code' => '6000'],
            ['name' => 'Operating Expense', 'type' => 'expense', 'is_active' => true]
        );

        // Category & Product & Stock
        $cat = \App\Models\Category::firstOrCreate(
            ['tenant_id' => $tenantId, 'name' => $vals['category_name'] ?? 'Cat A'],
            ['code' => $vals['category_code'] ?? 'CAT-A']
        );
        $prod = \App\Models\Product::create([
            'tenant_id'   => $tenantId,
            'category_id' => $cat->id,
            'name'        => $vals['product_name'] ?? 'Prod A',
            'sku'         => $vals['sku'] ?? 'SKU-A',
            'barcode'     => $vals['barcode'] ?? 'BAR-A',
            'price'       => $vals['price'] ?? 100.0,
            'cost'        => $vals['cost'] ?? 60.0,
            'is_active'   => true,
        ]);
        \App\Models\Stock::create([
            'tenant_id'  => $tenantId,
            'product_id' => $prod->id,
            'quantity'   => $vals['stock_qty'] ?? 100,
        ]);

        // Parties
        $customer = Party::create([
            'tenant_id' => $tenantId,
            'name'      => $vals['customer_name'] ?? 'Customer A',
            'type'      => 'customer',
            'phone'     => '1234567890',
        ]);
        $supplier = Party::create([
            'tenant_id' => $tenantId,
            'name'      => $vals['supplier_name'] ?? 'Supplier A',
            'type'      => 'supplier',
            'phone'     => '0987654321',
        ]);

        // Sale with items & Journal Entry
        $revenue = $vals['sale_revenue'] ?? 1000.00;
        $cogs    = $vals['sale_cogs'] ?? 600.00;
        $sale = Sale::create([
            'tenant_id'        => $tenantId,
            'user_id'          => $user->id,
            'party_id'         => $customer->id,
            'reference_number' => $vals['sale_ref'] ?? 'SALE-001',
            'status'           => 'posted',
            'posted_at'        => now(),
            'total'            => $revenue,
            'subtotal'         => $revenue,
            'net_sales'        => $revenue,
            'payment_method'   => 'cash',
        ]);
        SaleItem::create([
            'tenant_id'   => $tenantId,
            'sale_id'     => $sale->id,
            'product_id'  => $prod->id,
            'quantity'    => 10,
            'unit_price'  => $vals['price'] ?? 100.0,
            'total_price' => $revenue,
        ]);

        // Journal Entry for sale
        $je = JournalEntry::create([
            'id'          => (string) Str::uuid(),
            'tenant_id'   => $tenantId,
            'date'        => now()->toDateString(),
            'reference'   => $vals['sale_ref'] ?? 'SALE-001',
            'description' => 'Sale transaction',
            'user_id'     => $user->id,
            'is_reversed' => false,
        ]);
        JournalItem::create([
            'id'               => (string) Str::uuid(),
            'tenant_id'        => $tenantId,
            'journal_entry_id' => $je->id,
            'account_id'       => $cashAcc->id,
            'debit'            => $revenue,
            'credit'           => 0,
        ]);
        JournalItem::create([
            'id'               => (string) Str::uuid(),
            'tenant_id'        => $tenantId,
            'journal_entry_id' => $je->id,
            'account_id'       => $revAcc->id,
            'debit'            => 0,
            'credit'           => $revenue,
        ]);
        JournalItem::create([
            'id'               => (string) Str::uuid(),
            'tenant_id'        => $tenantId,
            'journal_entry_id' => $je->id,
            'account_id'       => $cogsAcc->id,
            'debit'            => $cogs,
            'credit'           => 0,
        ]);
        JournalItem::create([
            'id'               => (string) Str::uuid(),
            'tenant_id'        => $tenantId,
            'journal_entry_id' => $je->id,
            'account_id'       => $invAcc->id,
            'debit'            => 0,
            'credit'           => $cogs,
        ]);

        // Expense
        $expenseAmount = $vals['expense_amount'] ?? 200.0;
        \App\Models\Expense::create([
            'tenant_id'      => $tenantId,
            'user_id'        => $user->id,
            'account_id'     => $expAcc->id,
            'category'       => 'Rent',
            'amount'         => $expenseAmount,
            'date'           => now()->toDateString(),
            'payment_method' => 'cash',
        ]);

        // Journal entry for expense
        $jeExp = JournalEntry::create([
            'id'          => (string) Str::uuid(),
            'tenant_id'   => $tenantId,
            'date'        => now()->toDateString(),
            'reference'   => 'EXP-' . $tenantId,
            'description' => 'Operating Expense',
            'user_id'     => $user->id,
            'is_reversed' => false,
        ]);
        JournalItem::create([
            'id'               => (string) Str::uuid(),
            'tenant_id'        => $tenantId,
            'journal_entry_id' => $jeExp->id,
            'account_id'       => $expAcc->id,
            'debit'            => $expenseAmount,
            'credit'           => 0,
        ]);
        JournalItem::create([
            'id'               => (string) Str::uuid(),
            'tenant_id'        => $tenantId,
            'journal_entry_id' => $jeExp->id,
            'account_id'       => $cashAcc->id,
            'debit'            => 0,
            'credit'           => $expenseAmount,
        ]);

        // Purchase
        $purchaseAmount = $vals['purchase_amount'] ?? 500.0;
        if (\Illuminate\Support\Facades\Schema::hasTable('purchases')) {
            \App\Models\Purchase::create([
                'tenant_id'        => $tenantId,
                'party_id'         => $supplier->id,
                'invoice_number'   => $vals['po_ref'] ?? 'PO-' . $tenantId,
                'workflow_status'  => 'received',
                'payment_status'   => 'paid',
                'total'            => $purchaseAmount,
                'subtotal'         => $purchaseAmount,
                'purchase_date'    => now()->toDateString(),
                'created_at'       => now(),
            ]);
        }

        // Return sale
        if (\Illuminate\Support\Facades\Schema::hasTable('sales')) {
            Sale::create([
                'tenant_id'        => $tenantId,
                'user_id'          => $user->id,
                'party_id'         => $customer->id,
                'reference_number' => $vals['ret_ref'] ?? 'RET-' . $tenantId,
                'status'           => 'returned',
                'posted_at'        => now(),
                'total'            => 50.0,
                'subtotal'         => 50.0,
                'net_sales'        => 50.0,
                'payment_method'   => 'cash',
            ]);
        }

        // Reminders, Recurring Invoices, Batches
        if (\Illuminate\Support\Facades\Schema::hasTable('invoice_reminders')) {
            \Illuminate\Support\Facades\DB::table('invoice_reminders')->insert([
                'id'           => (string) Str::uuid(),
                'tenant_id'    => $tenantId,
                'invoice_id'   => $sale->id,
                'customer_id'  => $customer->id,
                'scheduled_at' => now()->addDays(3),
                'type'         => 'sms',
                'status'       => 'pending',
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        }
        if (\Illuminate\Support\Facades\Schema::hasTable('recurring_invoices')) {
            \Illuminate\Support\Facades\DB::table('recurring_invoices')->insert([
                'id'          => (string) Str::uuid(),
                'tenant_id'   => $tenantId,
                'customer_id' => $customer->id,
                'name'        => 'Recurring Monthly Contract',
                'frequency'   => 'monthly',
                'status'      => 'active',
                'items'       => json_encode([['price' => 100, 'quantity' => 2]]),
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }
        if (\Illuminate\Support\Facades\Schema::hasTable('inventory_batches')) {
            \Illuminate\Support\Facades\DB::table('inventory_batches')->insert([
                'id'            => (string) Str::uuid(),
                'tenant_id'     => $tenantId,
                'product_id'    => $prod->id,
                'remaining_qty' => $vals['batch_qty'] ?? 25.0,
                'initial_qty'   => $vals['batch_qty'] ?? 25.0,
                'expiry_date'   => now()->addDays(15),
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
        }
        if (\Illuminate\Support\Facades\Schema::hasTable('proposals')) {
            \Illuminate\Support\Facades\DB::table('proposals')->insert([
                'id'               => (string) Str::uuid(),
                'tenant_id'        => $tenantId,
                'user_id'          => $user->id,
                'customer_id'      => $customer->id,
                'reference_number' => 'PROP-' . $tenantId,
                'status'           => 'accepted',
                'total_amount'     => 1500.0,
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);
        }
    }

    private function resolveAll(Reckoner $reckoner, array $all, $user, $tenant): array
    {
        $results = [];
        foreach ($all as $key => $def) {
            if (($def['scope'] ?? 'tenant') !== 'tenant') {
                continue; // skip platform metrics
            }
            if (($def['implemented'] ?? true) === false) {
                continue; // skip explicitly unimplemented stubs
            }

            $periodKey = $def['default_period'] ?? 'today';
            $request   = new ReckonerRequest($key, $periodKey);
            $result    = $reckoner->read($request, $user, $tenant);

            $payload = $result->data;
            $results[$key] = [
                'ok'        => $result->ok,
                'errorCode' => $result->errorCode,
                'value'     => is_array($payload) ? ($payload['value'] ?? null) : null,
            ];
        }
        return $results;
    }
}
