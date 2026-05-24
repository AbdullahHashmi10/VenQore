<?php

namespace Tests\Feature\V3\Scenarios;

use Tests\TestCase;
use App\Services\V3\InventoryService;
use App\Services\V3\PartyService;
use App\Services\V3\AccountingService;
use App\Services\V3\FifoService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class InventoryAndPartyServiceTest extends TestCase
{
    use DatabaseTransactions;

    private InventoryService  $inventory;
    private PartyService      $parties;
    private AccountingService $accounting;
    private FifoService       $fifo;

    private string $productId;
    private string $warehouseId;
    private string $supplierId;
    private string $customerId;

    protected function setUp(): void
    {
        parent::setUp();
        
        $user = \App\Models\User::factory()->create();
        $this->actingAs($user);

        $this->inventory  = app(InventoryService::class);
        $this->parties    = app(PartyService::class);
        $this->accounting = app(AccountingService::class);
        $this->fifo       = app(FifoService::class);

        $this->seedAccounts();

        $this->productId   = $this->seedProduct();
        $this->warehouseId = $this->seedWarehouse();
        $this->supplierId  = $this->seedParty('supplier');
        $this->customerId  = $this->seedParty('customer');
    }

    // ═══════════════════════════════════════════════════════════════════
    // INVENTORY SERVICE TESTS
    // ═══════════════════════════════════════════════════════════════════

    // ─── TEST 1: receivePurchase creates inventory batch ──────────────
    /** @test */
    public function receive_purchase_creates_inventory_batch()
    {
        $purchaseId = $this->seedPurchase(5, 100.00);

        $this->inventory->receivePurchase($purchaseId);

        $this->assertDatabaseHas('inventory_batches', [
            'product_id'    => $this->productId,
            'warehouse_id'  => $this->warehouseId,
            'purchase_invoice_id'   => $purchaseId,
            'unit_cost'     => 100.00,
            'initial_qty'   => 5,
            'remaining_qty' => 5,
            'batch_type'    => 'purchase',
        ]);
    }

    // ─── TEST 2: receivePurchase creates one batch per line item ──────
    /** @test */
    public function receive_purchase_creates_one_batch_per_line_item()
    {
        $product2   = $this->seedProduct('PROD-B');
        $purchaseId = $this->seedPurchaseMultiLine([
            ['product_id' => $this->productId, 'qty' => 10, 'unit_cost' => 50.00],
            ['product_id' => $product2,         'qty' => 20, 'unit_cost' => 25.00],
        ]);

        $this->inventory->receivePurchase($purchaseId);

        $batches = DB::table('inventory_batches')
            ->where('purchase_invoice_id', $purchaseId)
            ->get();

        $this->assertCount(2, $batches);

        $this->assertDatabaseHas('inventory_batches', [
            'purchase_invoice_id'   => $purchaseId,
            'product_id'    => $this->productId,
            'unit_cost'     => 50.00,
            'initial_qty'   => 10,
        ]);

        $this->assertDatabaseHas('inventory_batches', [
            'purchase_invoice_id'   => $purchaseId,
            'product_id'    => $product2,
            'unit_cost'     => 25.00,
            'initial_qty'   => 20,
        ]);
    }

    // ─── TEST 3: adjustStock decrease posts B10 — FIFO oldest-first ───
    /** @test */
    public function adjust_stock_decrease_deducts_fifo_oldest_first()
    {
        // Two batches — older at Rs.10, newer at Rs.30
        $this->fifo->receiveBatch($this->productId, $this->warehouseId, 5, 10.00, 'purchase');
        sleep(1); // ensure created_at differs
        $this->fifo->receiveBatch($this->productId, $this->warehouseId, 5, 30.00, 'purchase');

        $entry = $this->inventory->adjustStock(
            productId:   $this->productId,
            warehouseId: $this->warehouseId,
            qty:         3,
            direction:   'decrease',
            reason:      'damaged'
        );

        // Should have deducted from the Rs.10 batch (oldest)
        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $entry->id,
            'debit'            => 30.00, // 3 × Rs.10
        ]);

        // Account 6300 should be debited
        $account6300 = DB::table('accounts')->where('code', '6300')->first();
        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $entry->id,
            'account_id'       => $account6300->id,
            'debit'            => 30.00,
        ]);
    }

    // ─── TEST 4: adjustStock increase posts B11 ───────────────────────
    /** @test */
    public function adjust_stock_increase_creates_batch_and_posts_b11()
    {
        $entry = $this->inventory->adjustStock(
            productId:   $this->productId,
            warehouseId: $this->warehouseId,
            qty:         10,
            direction:   'increase',
            unitCost:    45.00,
            reason:      'stock count correction'
        );

        // New batch must be created
        $this->assertDatabaseHas('inventory_batches', [
            'product_id'    => $this->productId,
            'warehouse_id'  => $this->warehouseId,
            'unit_cost'     => 45.00,
            'initial_qty'   => 10,
            'batch_type'    => 'adjustment',
        ]);

        // Account 4200 (Stock Adjustment Gain) credited
        $account4200 = DB::table('accounts')->where('code', '4200')->first();
        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $entry->id,
            'account_id'       => $account4200->id,
            'credit'           => 450.00, // 10 × 45
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PARTY SERVICE TESTS
    // ═══════════════════════════════════════════════════════════════════

    // ─── TEST 5: snapshot is built after journal entry with party ─────
    /** @test */
    public function snapshot_is_built_when_journal_entry_has_party_id()
    {
        $account1200 = DB::table('accounts')->where('code', '1200')->first();

        // Post a credit sale journal entry with party_id
        $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'sale',
            'reference_id'   => Str::uuid()->toString(),
            'description'    => 'Test credit sale',
            'party_id'       => $this->customerId,
        ], [
            ['account_code' => '1200', 'debit'  => 5000.00, 'credit' => 0,       'party_id' => $this->customerId],
            ['account_code' => '4000', 'debit'  => 0,       'credit' => 5000.00],
        ]);

        // Snapshot must exist for this customer
        $snapshot = DB::table('party_snapshots')
            ->where('party_id', $this->customerId)
            ->where('account_id', $account1200->id)
            ->first();

        $this->assertNotNull($snapshot);
        $this->assertEquals(5000.00, (float) $snapshot->cached_balance);
    }

    // ─── TEST 6: snapshot updates correctly after second entry ────────
    /** @test */
    public function snapshot_accumulates_across_multiple_journal_entries()
    {
        $account1200 = DB::table('accounts')->where('code', '1200')->first();

        // First sale — Rs.3000
        $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'sale',
            'reference_id'   => Str::uuid()->toString(),
            'description'    => 'First sale',
            'party_id'       => $this->customerId,
        ], [
            ['account_code' => '1200', 'debit' => 3000.00, 'credit' => 0,       'party_id' => $this->customerId],
            ['account_code' => '4000', 'debit' => 0,       'credit' => 3000.00],
        ]);

        // Second sale — Rs.2000
        $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'sale',
            'reference_id'   => Str::uuid()->toString(),
            'description'    => 'Second sale',
            'party_id'       => $this->customerId,
        ], [
            ['account_code' => '1200', 'debit' => 2000.00, 'credit' => 0,       'party_id' => $this->customerId],
            ['account_code' => '4000', 'debit' => 0,       'credit' => 2000.00],
        ]);

        $snapshot = DB::table('party_snapshots')
            ->where('party_id', $this->customerId)
            ->where('account_id', $account1200->id)
            ->first();

        // Snapshot must show cumulative Rs.5000
        $this->assertEquals(5000.00, (float) $snapshot->cached_balance);
    }

    // ─── TEST 7: getBalance returns snapshot value ────────────────────
    /** @test */
    public function get_balance_returns_snapshot_value()
    {
        $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'sale',
            'reference_id'   => Str::uuid()->toString(),
            'description'    => 'Balance check sale',
            'party_id'       => $this->customerId,
        ], [
            ['account_code' => '1200', 'debit' => 7500.00, 'credit' => 0,       'party_id' => $this->customerId],
            ['account_code' => '4000', 'debit' => 0,       'credit' => 7500.00],
        ]);

        $balance = $this->parties->getBalance($this->customerId, '1200');

        $this->assertEquals(7500.00, $balance);
    }

    // ─── TEST 8: snapshot reduces correctly after payment ─────────────
    /** @test */
    public function snapshot_reduces_after_payment_is_posted()
    {
        $account1200 = DB::table('accounts')->where('code', '1200')->first();

        // Post the sale
        $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'sale',
            'reference_id'   => Str::uuid()->toString(),
            'description'    => 'Sale for snapshot reduction test',
            'party_id'       => $this->customerId,
        ], [
            ['account_code' => '1200', 'debit' => 10000.00, 'credit' => 0,        'party_id' => $this->customerId],
            ['account_code' => '4000', 'debit' => 0,        'credit' => 10000.00],
        ]);

        // Post the payment (B4)
        $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'payment',
            'reference_id'   => Str::uuid()->toString(),
            'description'    => 'Payment received',
            'party_id'       => $this->customerId,
        ], [
            ['account_code' => '1000', 'debit' => 10000.00, 'credit' => 0],
            ['account_code' => '1200', 'debit' => 0,        'credit' => 10000.00, 'party_id' => $this->customerId],
        ]);

        $snapshot = DB::table('party_snapshots')
            ->where('party_id', $this->customerId)
            ->where('account_id', $account1200->id)
            ->first();

        // Fully paid — snapshot must be 0
        $this->assertEquals(0.00, (float) $snapshot->cached_balance);
    }

    // ─── TEST 9: rebuildSnapshot falls back to live ledger correctly ──
    /** @test */
    public function rebuild_snapshot_result_matches_live_ledger_query()
    {
        $account1200 = DB::table('accounts')->where('code', '1200')->first();

        // Post two sales
        $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'sale',
            'reference_id'   => Str::uuid()->toString(),
            'description'    => 'Sale A',
            'party_id'       => $this->customerId,
        ], [
            ['account_code' => '1200', 'debit' => 4000.00, 'credit' => 0,       'party_id' => $this->customerId],
            ['account_code' => '4000', 'debit' => 0,       'credit' => 4000.00],
        ]);

        $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'sale',
            'reference_id'   => Str::uuid()->toString(),
            'description'    => 'Sale B',
            'party_id'       => $this->customerId,
        ], [
            ['account_code' => '1200', 'debit' => 2500.00, 'credit' => 0,       'party_id' => $this->customerId],
            ['account_code' => '4000', 'debit' => 0,       'credit' => 2500.00],
        ]);

        // Manually corrupt the snapshot to simulate staleness
        DB::table('party_snapshots')
            ->where('party_id', $this->customerId)
            ->where('account_id', $account1200->id)
            ->update(['cached_balance' => 0.00]);

        // Rebuild
        $this->parties->rebuildSnapshot($this->customerId, '1200');

        // Must equal the real ledger sum
        $snapshot = DB::table('party_snapshots')
            ->where('party_id', $this->customerId)
            ->where('account_id', $account1200->id)
            ->first();

        $this->assertEquals(6500.00, (float) $snapshot->cached_balance);
    }

    // ═══════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════

    private function seedAccounts(): void
    {
        $accounts = [
            ['1000', 'Cash in Hand',           'asset',     'debit'],
            ['1100', 'Inventory Asset',         'asset',     'debit'],
            ['1200', 'Accounts Receivable',     'asset',     'debit'],
            ['2000', 'Accounts Payable',        'liability', 'credit'],
            ['4000', 'Sales Revenue',           'income',    'credit'],
            ['4200', 'Stock Adjustment Gain',   'income',    'credit'],
            ['5000', 'Cost of Goods Sold',      'expense',   'debit'],
            ['6300', 'Stock Adjustment Loss',   'expense',   'debit'],
        ];

        foreach ($accounts as [$code, $name, $type, $balance]) {
            if (!DB::table('accounts')->where('code', $code)->exists()) {
                DB::table('accounts')->insert([
                    'id'             => Str::uuid()->toString(),
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

    private function seedProduct(string $sku = 'PROD-A'): string
    {
        $id = Str::uuid()->toString();
        DB::table('products')->insertOrIgnore([
            'id'         => $id,
            'name'       => 'Test Product ' . $sku,
            'sku'        => $sku . '-' . Str::random(4),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return $id;
    }

    private function seedWarehouse(): string
    {
        $id = Str::uuid()->toString();
        DB::table('warehouses')->insert([
            'id'         => $id,
            'name'       => 'Main Warehouse',
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
            'name'       => ucfirst($type) . ' ' . Str::random(4),
            'type'       => $type,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return $id;
    }

    private function seedPurchase(float $qty, float $unitCost): string
    {
        $purchaseId = Str::uuid()->toString();
        $jeId       = Str::uuid()->toString();

        DB::table('journal_entries')->insert([
            'id'             => $jeId,
            'date'           => now()->toDateString(),
            'reference_type' => 'purchase',
            'reference'      => $purchaseId,
            'description'    => 'Seed purchase JE',
            'is_reversed'    => 0,
            'user_id'        => auth()->id(),
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        DB::table('purchases')->insert([
            'id'               => $purchaseId,
            'party_id'         => $this->supplierId,
            'warehouse_id'     => $this->warehouseId,
            'purchase_date'    => now()->toDateString(),
            'subtotal'         => $qty * $unitCost,
            'total'            => $qty * $unitCost,
            'payment_status'   => 'unpaid',
            'journal_entry_id' => $jeId,
            'user_id'          => auth()->id(),
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        DB::table('purchase_items')->insert([
            'id'          => Str::uuid()->toString(),
            'purchase_id' => $purchaseId,
            'product_id'  => $this->productId,
            'qty'         => $qty,
            'unit_cost'   => $unitCost,
            'line_total'  => $qty * $unitCost,
            'created_at'  => now(),
        ]);

        return $purchaseId;
    }

    private function seedPurchaseMultiLine(array $lines): string
    {
        $purchaseId = Str::uuid()->toString();
        $jeId       = Str::uuid()->toString();
        $subtotal   = array_sum(array_column($lines, 'qty') + array_column($lines, 'unit_cost'));

        DB::table('journal_entries')->insert([
            'id'             => $jeId,
            'date'           => now()->toDateString(),
            'reference_type' => 'purchase',
            'reference'      => $purchaseId,
            'description'    => 'Multi-line purchase JE',
            'is_reversed'    => 0,
            'user_id'        => auth()->id(),
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        $total = 0;
        foreach ($lines as $line) {
            $total += $line['qty'] * $line['unit_cost'];
        }

        DB::table('purchases')->insert([
            'id'               => $purchaseId,
            'party_id'         => $this->supplierId,
            'warehouse_id'     => $this->warehouseId,
            'purchase_date'    => now()->toDateString(),
            'subtotal'         => $total,
            'total'            => $total,
            'payment_status'   => 'unpaid',
            'journal_entry_id' => $jeId,
            'user_id'          => auth()->id(),
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        foreach ($lines as $line) {
            DB::table('purchase_items')->insert([
                'id'          => Str::uuid()->toString(),
                'purchase_id' => $purchaseId,
                'product_id'  => $line['product_id'],
                'qty'         => $line['qty'],
                'unit_cost'   => $line['unit_cost'],
                'line_total'  => $line['qty'] * $line['unit_cost'],
                'created_at'  => now(),
            ]);
        }

        return $purchaseId;
    }
}
