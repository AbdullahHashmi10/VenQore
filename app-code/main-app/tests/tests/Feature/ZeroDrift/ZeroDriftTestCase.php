<?php

namespace Tests\Feature\ZeroDrift;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * Shared set-up for the ZeroDrift Ledger producer suites: a tenant with the
 * standard chart, an owner, a warehouse, a supplier and a customer, plus
 * helpers that read every journal back in integer paisa.
 */
abstract class ZeroDriftTestCase extends VenQoreTestCase
{
    use \Tests\Support\ReconcilesBeforeRollback;

    protected Tenant $tenant;
    protected string $tenantId;
    protected string $warehouseId;
    protected string $supplierId;
    protected string $customerId;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tenant = Tenant::factory()->create();
        $this->tenantId = (string) $this->tenant->id;
        app()->instance('current.tenant', $this->tenant);
        $this->user = User::factory()->create(['last_store_id' => $this->tenant->id, 'email' => 'zd-' . Str::uuid() . '@example.test']);
        TenantUser::create(['tenant_id' => $this->tenant->id, 'user_id' => $this->user->id, 'role' => 'owner', 'status' => 'active', 'display_name' => $this->user->name, 'joined_at' => now()]);
        $this->actingAs($this->user);

        foreach ([['1000', 'Cash in Hand', 'asset', 'debit'], ['1010', 'Bank Account', 'asset', 'debit'], ['1020', 'Cheques in Hand', 'asset', 'debit'],
                  ['1100', 'Inventory Asset', 'asset', 'debit'], ['1200', 'Accounts Receivable', 'asset', 'debit'], ['1300', 'Supplier Advances', 'asset', 'debit'],
                  ['2000', 'Accounts Payable', 'liability', 'credit'], ['2060', 'Customer Advances', 'liability', 'credit'], ['2100', 'Sales Tax Payable', 'liability', 'credit'],
                  ['2300', 'Input Tax Recoverable', 'asset', 'debit'], ['3000', "Owner's Capital", 'equity', 'credit'], ['3100', 'Owner Drawings', 'equity', 'debit'],
                  ['4000', 'Sales Revenue', 'income', 'credit'], ['4100', 'Other Income', 'income', 'credit'], ['4900', 'Round Off Income', 'income', 'credit'],
                  ['5000', 'Cost of Goods Sold', 'expense', 'debit'], ['5900', 'Round Off Expense', 'expense', 'debit'], ['6000', 'Operating Expenses', 'expense', 'debit']] as [$c, $n, $t, $b]) {
            DB::table('accounts')->insert(['id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId, 'code' => $c, 'name' => $n, 'type' => $t, 'normal_balance' => $b, 'created_at' => now(), 'updated_at' => now()]);
        }
        $this->warehouseId = (string) Str::uuid();
        DB::table('warehouses')->insert(['id' => $this->warehouseId, 'tenant_id' => $this->tenantId, 'name' => 'Main', 'is_default' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $this->supplierId = (string) Str::uuid();
        DB::table('parties')->insert(['id' => $this->supplierId, 'tenant_id' => $this->tenantId, 'name' => 'Supplier', 'phone' => '0300-2', 'type' => 'supplier', 'created_at' => now(), 'updated_at' => now()]);
        $this->customerId = (string) Str::uuid();
        DB::table('parties')->insert(['id' => $this->customerId, 'tenant_id' => $this->tenantId, 'name' => 'Customer', 'phone' => '0300-3', 'type' => 'customer', 'created_at' => now(), 'updated_at' => now()]);
    }

    protected function product(float $cost = 50.0, float $price = 100.0): string
    {
        $id = (string) Str::uuid();
        DB::table('products')->insert(['id' => $id, 'tenant_id' => $this->tenantId, 'name' => 'P ' . Str::random(6), 'sku' => 'SKU-' . Str::random(8),
            'price' => $price, 'cost_price' => $cost, 'base_unit' => 'PCS', 'stock_quantity' => 0, 'created_at' => now(), 'updated_at' => now()]);
        return $id;
    }

    protected function cents($v): int
    {
        return (int) round(((float) $v) * 100);
    }

    /** Every journal entry of this tenant must balance to the paisa (read back from the DB). */
    protected function assertEveryEntryBalances(string $where = ''): void
    {
        $rows = DB::table('journal_items')->where('tenant_id', $this->tenantId)
            ->selectRaw('journal_entry_id, ROUND(SUM(debit) * 100) as dr, ROUND(SUM(credit) * 100) as cr')
            ->groupBy('journal_entry_id')->get();
        $this->assertNotEmpty($rows, 'no journal entries were written — the test proves nothing');
        foreach ($rows as $r) {
            $this->assertSame((int) $r->dr, (int) $r->cr, "entry {$r->journal_entry_id} unbalanced {$where}");
        }
    }

    /** Σ debit or credit (paisa) on an account code over entries of the given reference types. */
    protected function sumCode(string $code, string $side, array $types = []): int
    {
        $q = DB::table('journal_items as ji')->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('je.tenant_id', $this->tenantId)->where('a.code', $code);
        if ($types) {
            $q->whereIn('je.reference_type', $types);
        }
        return (int) round(((float) $q->sum("ji.{$side}")) * 100);
    }

    /** A deterministic money amount with up to $dp decimals (needs mt_srand). */
    protected function amt(int $max, int $dp = 2): string
    {
        $unit = 10 ** $dp;
        return number_format(mt_rand(1, $max * $unit) / $unit, $dp, '.', '');
    }
}
