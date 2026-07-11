<?php

namespace Tests\Feature\V3\Scenarios;

use Tests\TestCase;
use App\Services\V3\SaleService;
use App\Services\V3\AccountingService;
use App\Services\V3\FifoService;
use App\Models\Tenant;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PartialReturnTest extends TestCase
{
    use RefreshDatabase;

    private SaleService       $sales;
    private AccountingService $accounting;
    private FifoService       $fifo;

    private string $tenantId;
    private string $productId;
    private string $warehouseId;
    private string $customerId;

    protected function setUp(): void
    {
        parent::setUp();

        $tenant = Tenant::factory()->create();
        $this->tenantId = $tenant->id;
        app()->instance('current.tenant', $tenant);

        $user = \App\Models\User::factory()->create([
            'last_store_id' => $tenant->id,
        ]);
        $this->actingAs($user);

        $this->sales      = app(SaleService::class);
        $this->accounting = app(AccountingService::class);
        $this->fifo       = app(FifoService::class);

        $this->seedAccounts();

        $this->productId   = $this->seedProduct();
        $this->warehouseId = $this->seedWarehouse();
        $this->customerId  = $this->seedParty('customer');
    }

    private function seedAccounts(): void
    {
        $accounts = [
            ['1000', 'Cash in Hand',            'asset',     'debit'],
            ['1010', 'Cash at Bank',            'asset',     'debit'],
            ['1100', 'Inventory Asset',         'asset',     'debit'],
            ['1200', 'Accounts Receivable',     'asset',     'debit'],
            ['2000', 'Accounts Payable',        'liability', 'credit'],
            ['4000', 'Sales Revenue',           'income',    'credit'],
            ['5000', 'Cost of Goods Sold',      'expense',   'debit'],
        ];

        foreach ($accounts as [$code, $name, $type, $balance]) {
            if (!DB::table('accounts')->where('code', $code)->where('tenant_id', $this->tenantId)->exists()) {
                DB::table('accounts')->insert([
                    'id'             => Str::uuid()->toString(),
                    'tenant_id'      => $this->tenantId,
                    'code'           => $code,
                    'name'           => $name,
                    'type'           => $type,
                    'normal_balance' => $balance,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);
            }
        }
    }

    private function seedProduct(): string
    {
        $id = Str::uuid()->toString();
        DB::table('products')->insert([
            'id'          => $id,
            'tenant_id'   => $this->tenantId,
            'name'        => 'Test Item',
            'sku'         => 'TEST-ITEM-' . Str::random(4),
            'base_unit'   => 'PCS',
            'price'       => 100.00,
            'cost_price'  => 50.00,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);
        return $id;
    }

    private function seedWarehouse(): string
    {
        $id = Str::uuid()->toString();
        DB::table('warehouses')->insert([
            'id'         => $id,
            'tenant_id'  => $this->tenantId,
            'name'       => 'Test Warehouse',
            'is_default' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return $id;
    }

    private function seedParty(string $type): string
    {
        $id = Str::uuid()->toString();
        DB::table('parties')->insert([
            'id'         => $id,
            'tenant_id'  => $this->tenantId,
            'name'       => 'Test Customer',
            'type'       => $type,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return $id;
    }

    private function seedFifoBatch(int $qty, float $cost): string
    {
        $id = Str::uuid()->toString();
        DB::table('inventory_batches')->insert([
            'id'            => $id,
            'tenant_id'     => $this->tenantId,
            'product_id'    => $this->productId,
            'warehouse_id'  => $this->warehouseId,
            'unit_cost'     => $cost,
            'initial_qty'   => $qty,
            'remaining_qty' => $qty,
            'batch_type'    => 'opening',
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);
        return $id;
    }

    private function createSale(int $qty, float $price, float $discount = 0.0, string $paymentMethod = 'cash'): array
    {
        $saleId = Str::uuid()->toString();
        $saleItemId = Str::uuid()->toString();
        $jeId = Str::uuid()->toString();

        $grossTotal = $qty * $price;
        $netTotal = $grossTotal - $discount;

        DB::table('journal_entries')->insert([
            'id'             => $jeId,
            'tenant_id'      => $this->tenantId,
            'date'           => now()->toDateString(),
            'reference_type' => 'sale',
            'reference'      => $saleId,
            'description'    => 'Sale Journal',
            'user_id'        => auth()->id(),
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        DB::table('sales')->insert([
            'id'               => $saleId,
            'tenant_id'        => $this->tenantId,
            'party_id'         => $this->customerId,
            'warehouse_id'     => $this->warehouseId,
            'payment_method'   => $paymentMethod,
            'reference_number' => 'SAL-' . Str::random(4),
            'status'           => 'posted',
            'user_id'          => auth()->id(),
            'subtotal'         => $grossTotal,
            'total'            => $netTotal,
            'net_sales'        => $netTotal,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        DB::table('sale_items')->insert([
            'id'          => $saleItemId,
            'tenant_id'   => $this->tenantId,
            'sale_id'     => $saleId,
            'product_id'  => $this->productId,
            'quantity'    => $qty,
            'unit_price'  => $price,
            'discount_amount'  => $discount,
            'net_amount'  => $netTotal,
            'returned_quantity' => 0,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        // Deduct FIFO stock to simulate a sale
        $deductions = $this->fifo->deductStock($this->productId, $this->warehouseId, $qty);
        foreach ($deductions as $d) {
            DB::table('sale_item_batches')->insert([
                'id'                 => Str::uuid()->toString(),
                'tenant_id'          => $this->tenantId,
                'sale_item_id'       => $saleItemId,
                'inventory_batch_id' => $d['batch_id'],
                'qty_deducted'       => $d['qty'],
                'unit_cost'          => $d['unit_cost'],
                'total_cogs'         => $d['total_cost'],
                'created_at'         => now(),
            ]);
        }

        return [$saleId, $saleItemId];
    }

    /** @test */
    public function partial_qty_restores_only_that_qty()
    {
        $this->seedFifoBatch(10, 50.00);
        [$saleId, $saleItemId] = $this->createSale(5, 100.00);

        $returnedSale = $this->sales->reverse($saleId, 'Partial return', null, [
            [
                'sale_item_id' => $saleItemId,
                'return_qty'   => 2.0
            ]
        ]);

        $this->assertEquals('partially_returned', $returnedSale->status);

        // Assert 2 units returned in DB
        $this->assertDatabaseHas('sale_items', [
            'id'                => $saleItemId,
            'returned_quantity' => 2.0
        ]);

        // Check stock batch remaining qty restored (10 initial - 5 sold + 2 returned = 7)
        $batch = DB::table('inventory_batches')->where('tenant_id', $this->tenantId)->first();
        $this->assertEquals(7.0, (float)$batch->remaining_qty);
    }

    /** @test */
    public function partial_return_calculates_proportional_cogs()
    {
        $this->seedFifoBatch(10, 50.00);
        [$saleId, $saleItemId] = $this->createSale(5, 100.00);

        // COGS for 5 units is 250. Proportional return of 2 units should reverse 100 of COGS.
        $this->sales->reverse($saleId, 'Return 2 units', null, [
            [
                'sale_item_id' => $saleItemId,
                'return_qty'   => 2.0
            ]
        ]);

        // Verifying journal entries are balanced and reversed COGS is 100
        $refNum = DB::table('sales')->where('id', $saleId)->value('reference_number');
        $entry = DB::table('journal_entries')
            ->where('tenant_id', $this->tenantId)
            ->where('reference', 'PRET-' . $refNum)
            ->first();

        $this->assertNotNull($entry);

        $cogsAccount = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '5000')->first();
        $invAccount  = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '1100')->first();

        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $entry->id,
            'account_id'       => $invAccount->id,
            'debit'            => 100.00,
            'credit'           => 0.00
        ]);

        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $entry->id,
            'account_id'       => $cogsAccount->id,
            'debit'            => 0.00,
            'credit'           => 100.00
        ]);
    }

    /** @test */
    public function proportional_net_revenue_on_discounted_sale()
    {
        $this->seedFifoBatch(10, 50.00);
        // Original sale: 5 units @ 100 each = 500 gross. 50 discount. Net total = 450.
        // Returning 2 units: net amount returned should be (450 / 5) * 2 = 180.
        [$saleId, $saleItemId] = $this->createSale(5, 100.00, 50.00);

        $this->sales->reverse($saleId, 'Return 2 units', null, [
            [
                'sale_item_id' => $saleItemId,
                'return_qty'   => 2.0
            ]
        ]);

        $entry = DB::table('journal_entries')
            ->where('tenant_id', $this->tenantId)
            ->where('reference', 'PRET-' . DB::table('sales')->where('id', $saleId)->value('reference_number'))
            ->first();

        $this->assertNotNull($entry);

        $revenueAccount = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '4000')->first();
        $cashAccount    = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '1000')->first();

        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $entry->id,
            'account_id'       => $revenueAccount->id,
            'debit'            => 180.00,
            'credit'           => 0.00
        ]);

        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $entry->id,
            'account_id'       => $cashAccount->id,
            'debit'            => 0.00,
            'credit'           => 180.00
        ]);
    }

    /** @test */
    public function refund_account_follows_payment_method()
    {
        $this->seedFifoBatch(10, 50.00);
        // Credit/Khata sale should refund to 1200 (Accounts Receivable)
        [$saleId, $saleItemId] = $this->createSale(5, 100.00, 0.00, 'credit');

        $this->sales->reverse($saleId, 'Return 2 units', null, [
            [
                'sale_item_id' => $saleItemId,
                'return_qty'   => 2.0
            ]
        ]);

        $entry = DB::table('journal_entries')
            ->where('tenant_id', $this->tenantId)
            ->where('reference', 'PRET-' . DB::table('sales')->where('id', $saleId)->value('reference_number'))
            ->first();

        $arAccount = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '1200')->first();

        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $entry->id,
            'account_id'       => $arAccount->id,
            'debit'            => 0.00,
            'credit'           => 200.00
        ]);
    }

    /** @test */
    public function over_return_blocked_by_clamping()
    {
        $this->seedFifoBatch(10, 50.00);
        [$saleId, $saleItemId] = $this->createSale(5, 100.00);

        // First return: 3 units
        $this->sales->reverse($saleId, 'Return 3', null, [
            [
                'sale_item_id' => $saleItemId,
                'return_qty'   => 3.0
            ]
        ]);

        // Second return: request 4 units, but only 2 are remaining. Should clamp to 2 units.
        $this->sales->reverse($saleId, 'Return 4', null, [
            [
                'sale_item_id' => $saleItemId,
                'return_qty'   => 4.0
            ]
        ]);

        $this->assertDatabaseHas('sale_items', [
            'id'                => $saleItemId,
            'returned_quantity' => 5.0
        ]);

        $sale = DB::table('sales')->where('id', $saleId)->first();
        $this->assertEquals('returned', $sale->status);
    }
}
