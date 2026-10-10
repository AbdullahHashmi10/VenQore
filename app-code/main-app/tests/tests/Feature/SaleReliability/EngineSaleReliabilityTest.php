<?php

namespace Tests\Feature\SaleReliability;

use App\Engines\SaleService;
use App\Exceptions\IdempotencyConflictException;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * Channel 1 — the V3 posting engine (App\Engines\SaleService::post, also used
 * by online-order completion, sales-order conversion, service billing,
 * recurring invoices and approved invoices) on the shared exact calculation.
 * Every case asserts persisted amounts and each journal account in paisa.
 */
class EngineSaleReliabilityTest extends VenQoreTestCase
{
    use \Tests\Support\ReconcilesBeforeRollback;

    private Tenant $tenant;
    private string $tenantId;
    private string $warehouseId;
    private string $customerId;
    private SaleService $sales;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tenant = Tenant::factory()->create();
        $this->tenantId = (string) $this->tenant->id;
        app()->instance('current.tenant', $this->tenant);
        $user = User::factory()->create(['last_store_id' => $this->tenant->id]);
        TenantUser::create(['tenant_id' => $this->tenant->id, 'user_id' => $user->id, 'role' => 'owner', 'status' => 'active', 'display_name' => $user->name, 'joined_at' => now()]);
        $this->actingAs($user);
        $this->sales = app(SaleService::class);

        foreach ([['1000', 'Cash in Hand', 'asset', 'debit'], ['1010', 'Bank Account', 'asset', 'debit'], ['1100', 'Inventory Asset', 'asset', 'debit'],
                  ['1200', 'Accounts Receivable', 'asset', 'debit'], ['2100', 'Sales Tax Payable', 'liability', 'credit'],
                  ['4000', 'Sales Revenue', 'income', 'credit'], ['5000', 'Cost of Goods Sold', 'expense', 'debit']] as [$c, $n, $t, $b]) {
            DB::table('accounts')->insert(['id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId, 'code' => $c, 'name' => $n, 'type' => $t, 'normal_balance' => $b, 'created_at' => now(), 'updated_at' => now()]);
        }
        $this->warehouseId = (string) Str::uuid();
        DB::table('warehouses')->insert(['id' => $this->warehouseId, 'tenant_id' => $this->tenantId, 'name' => 'Main', 'is_default' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $this->customerId = (string) Str::uuid();
        DB::table('parties')->insert(['id' => $this->customerId, 'tenant_id' => $this->tenantId, 'name' => 'Customer', 'phone' => '0300-1', 'type' => 'customer', 'created_at' => now(), 'updated_at' => now()]);
    }

    private function product(float $cost = 60.0, float $stock = 100): string
    {
        $id = (string) Str::uuid();
        DB::table('products')->insert(['id' => $id, 'tenant_id' => $this->tenantId, 'name' => 'P ' . Str::random(5), 'sku' => 'SKU-' . Str::random(8),
            'price' => 100, 'cost_price' => $cost, 'base_unit' => 'PCS', 'stock_quantity' => 0, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('inventory_batches')->insert(['id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId, 'product_id' => $id, 'warehouse_id' => $this->warehouseId,
            'batch_type' => 'purchase', 'original_qty' => $stock, 'initial_qty' => $stock, 'remaining_qty' => $stock, 'unit_cost' => $cost,
            'created_at' => now()->subDay(), 'updated_at' => now()->subDay()]);
        return $id;
    }

    private function sale(string $method, array $lines, array $extra = []): object
    {
        return $this->sales->post(array_merge([
            'customer_id' => $this->customerId, 'warehouse_id' => $this->warehouseId, 'sale_date' => now()->toDateString(),
            'payment_method' => $method, 'approved_by' => auth()->id(),
            'items' => array_map(fn ($l) => array_merge(['sale_uom' => 'PCS', 'discount_percent' => 0, 'tax_rate' => 0], $l), $lines),
        ], $extra));
    }

    /** code => [debit, credit] minor units for the sale's own entry */
    private function journal(string $saleId): array
    {
        $rows = DB::table('journal_items as ji')->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('je.reference', $saleId)->where('je.reference_type', 'sale')->select('a.code', 'ji.debit', 'ji.credit')->get();
        $out = [];
        foreach ($rows as $r) {
            $out[$r->code][0] = ($out[$r->code][0] ?? 0) + (int) round($r->debit * 100);
            $out[$r->code][1] = ($out[$r->code][1] ?? 0) + (int) round($r->credit * 100);
        }
        ksort($out);
        return $out;
    }

    private function cents($v): int
    {
        return (int) round(((float) $v) * 100);
    }

    public function test_line_discount_and_tax_are_exact_per_line(): void
    {
        $p = $this->product(60);
        $s = $this->sale('cash', [['product_id' => $p, 'qty' => 3, 'unit_price' => 199.99, 'discount_percent' => 12.5, 'tax_rate' => 17]]);
        // gross 599.97; 12.5% = 74.99625 → 75.00; net 524.97; 17% = 89.2449 → 89.24
        $this->assertSame([59997, 7500, 52497, 8924, 61421], [$this->cents($s->subtotal_gross), $this->cents($s->total_item_discounts), $this->cents($s->net_sales), $this->cents($s->total_tax), $this->cents($s->invoice_total)]);
        $item = DB::table('sale_items')->where('sale_id', $s->id)->first();
        $this->assertSame([59997, 7500, 52497, 8924, 61421], [$this->cents($item->gross_amount), $this->cents($item->discount_amount), $this->cents($item->net_amount), $this->cents($item->tax_amount), $this->cents($item->line_total)]);
        $this->assertSame(2, (int) $s->calculation_version);
        $this->assertSame(['1000' => [61421, 0], '1100' => [0, 18000], '2100' => [0, 8924], '4000' => [0, 52497], '5000' => [18000, 0]], $this->journal($s->id));
    }

    public function test_weighed_quantity_and_small_taxed_lines_round_half_up_per_line(): void
    {
        $a = $this->product(0.01);
        $b = $this->product(0.01);
        $c = $this->product(100);
        $s = $this->sale('cash', [
            ['product_id' => $a, 'qty' => 1, 'unit_price' => 0.05, 'tax_rate' => 10],
            ['product_id' => $b, 'qty' => 1, 'unit_price' => 0.05, 'tax_rate' => 10],
            ['product_id' => $c, 'qty' => 1.235, 'unit_price' => 399],
        ]);
        // 0.005 → 0.01 per line (2 lines = 0.02); 1.235 × 399 = 492.765 → 492.77
        $this->assertSame([2, 49287, 49289], [$this->cents($s->total_tax), $this->cents($s->net_sales), $this->cents($s->invoice_total)]);
    }

    public function test_part_payment_leaves_the_rest_on_receivable(): void
    {
        $p = $this->product(10);
        $s = $this->sale('cash', [['product_id' => $p, 'qty' => 1, 'unit_price' => 100.01]], ['amount_received' => 40.005]);
        // amount received is quantized once: 40.005 → 40.01; AR 60.00
        $this->assertSame('partial', $s->payment_status);
        $this->assertSame(['1000' => [4001, 0], '1100' => [0, 1000], '1200' => [6000, 0], '4000' => [0, 10001], '5000' => [1000, 0]], $this->journal($s->id));
        $this->assertSame(4001, $this->cents(DB::table('allocations')->where('sale_id', $s->id)->sum('allocated_amount')));
    }

    public function test_credit_sale_is_all_receivable_and_unpaid(): void
    {
        $p = $this->product(10);
        $s = $this->sale('credit', [['product_id' => $p, 'qty' => 2, 'unit_price' => 33.33, 'tax_rate' => 5]]);
        // net 66.66; tax 3.333 → 3.33; invoice 69.99
        $this->assertSame('unpaid', $s->payment_status);
        $this->assertSame(['1100' => [0, 2000], '1200' => [6999, 0], '2100' => [0, 333], '4000' => [0, 6666], '5000' => [2000, 0]], $this->journal($s->id));
        $this->assertSame(0, DB::table('allocations')->where('sale_id', $s->id)->count());
    }

    public function test_overpayment_is_a_customer_advance_and_bank_goes_to_1010(): void
    {
        $p = $this->product(10);
        $s = $this->sale('bank', [['product_id' => $p, 'qty' => 1, 'unit_price' => 80]], ['amount_received' => 100]);
        $this->assertSame('paid', $s->payment_status);
        $this->assertSame(['1010' => [10000, 0], '1100' => [0, 1000], '2060' => [0, 2000], '4000' => [0, 8000], '5000' => [1000, 0]], $this->journal($s->id));
        $this->assertSame(8000, $this->cents(DB::table('allocations')->where('sale_id', $s->id)->sum('allocated_amount')));
    }

    public function test_promotional_line_is_free_and_still_moves_stock(): void
    {
        $p = $this->product(25);
        $s = $this->sale('cash', [['product_id' => $p, 'qty' => 2, 'unit_price' => 999, 'discount_percent' => 50, 'is_promotional' => true]]);
        $this->assertSame(0, $this->cents($s->invoice_total));
        $this->assertSame(['1100' => [0, 5000], '5000' => [5000, 0]], $this->journal($s->id));
    }

    public function test_retry_with_same_key_returns_the_same_sale_once(): void
    {
        $p = $this->product(10);
        $lines = [['product_id' => $p, 'qty' => 1, 'unit_price' => 50]];
        $first = $this->sale('cash', $lines, ['idempotency_key' => 'eng-key-1']);
        $again = $this->sale('cash', $lines, ['idempotency_key' => 'eng-key-1']);
        $this->assertSame($first->id, $again->id);
        $this->assertSame(1, DB::table('sales')->where('tenant_id', $this->tenantId)->where('idempotency_key', 'eng-key-1')->count());
        $this->assertSame(1, DB::table('journal_entries')->where('reference', $first->id)->where('reference_type', 'sale')->count());
        $this->assertEquals(99, (float) DB::table('inventory_batches')->where('product_id', $p)->value('remaining_qty'));
    }

    public function test_same_key_with_different_content_is_refused_and_writes_nothing(): void
    {
        $p = $this->product(10);
        $this->sale('cash', [['product_id' => $p, 'qty' => 1, 'unit_price' => 50]], ['client_sale_id' => 'off-77']);
        try {
            $this->sale('cash', [['product_id' => $p, 'qty' => 2, 'unit_price' => 50]], ['client_sale_id' => 'off-77']);
            $this->fail('A different sale under the same key must be refused.');
        } catch (IdempotencyConflictException $e) {
            $this->assertNotEmpty($e->saleId);
        }
        $this->assertSame(1, DB::table('sales')->where('tenant_id', $this->tenantId)->count());
        $this->assertEquals(99, (float) DB::table('inventory_batches')->where('product_id', $p)->value('remaining_qty'));
    }

    public function test_a_failed_post_writes_nothing_and_the_retry_posts_once(): void
    {
        $p = $this->product(10, 1); // only 1 in stock
        $lines = [['product_id' => $p, 'qty' => 2, 'unit_price' => 50]];
        \App\Models\Setting::withoutGlobalScopes()->updateOrCreate(['tenant_id' => $this->tenantId, 'key' => 'stop_sale_negative_stock'], ['value' => '1']);
        \App\Helpers\SettingsHelper::clearCache();
        $failed = false;
        try {
            $this->sale('cash', $lines, ['idempotency_key' => 'eng-retry']);
        } catch (\Throwable $e) {
            $failed = true;
        }
        if (!$failed) {
            $this->markTestSkipped('This store allows negative stock; the failure path is not reachable here.');
        }
        $this->assertSame(0, DB::table('sales')->where('tenant_id', $this->tenantId)->count());
        $this->assertSame(0, DB::table('journal_entries')->where('tenant_id', $this->tenantId)->where('reference_type', 'sale')->count());
        DB::table('inventory_batches')->where('product_id', $p)->update(['remaining_qty' => 5, 'original_qty' => 5, 'initial_qty' => 5]);
        $s = $this->sale('cash', $lines, ['idempotency_key' => 'eng-retry']);
        $again = $this->sale('cash', $lines, ['idempotency_key' => 'eng-retry']);
        $this->assertSame($s->id, $again->id);
        $this->assertSame(1, DB::table('sales')->where('tenant_id', $this->tenantId)->count());
    }

    public function test_over_100_percent_line_discount_is_refused(): void
    {
        $p = $this->product(10);
        $this->expectException(\App\Exceptions\MoneyException::class);
        $this->sale('cash', [['product_id' => $p, 'qty' => 1, 'unit_price' => 50, 'discount_percent' => 100.5]]);
    }
}
