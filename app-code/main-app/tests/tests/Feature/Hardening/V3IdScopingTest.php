<?php

namespace Tests\Feature\Hardening;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

/**
 * V3 id scoping sweep (2026-09-10).
 *
 * Every V3 endpoint that takes an id is called by store A's owner with an id
 * that belongs to store B (everything else in the request is valid for A).
 * Body ids must be refused with a 422 on the offending field, route ids with a
 * 404 — never a 500 — and nothing may be written in either store.
 */
class V3IdScopingTest extends VenQoreTestCase
{
    private const OWNER_PIN = '111111';

    private Tenant $tenant;
    private Tenant $other;
    private User $owner;
    private User $foreignOwner;

    /** Store A ids */
    private array $own = [];
    /** Store B ids */
    private array $foreign = [];

    private static ?array $tenantTables = null;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create(['plan' => 'ltd_3', 'status' => 'active', 'trial_ends_at' => null]);
        $this->other  = Tenant::factory()->create(['plan' => 'ltd_3', 'status' => 'active', 'trial_ends_at' => null]);
        $this->seedTenantDefaults($this->other);
        $this->seedTenantDefaults($this->tenant);

        $this->owner        = $this->member($this->tenant, 'owner', self::OWNER_PIN);
        $this->foreignOwner = $this->member($this->other, 'owner');

        $this->own     = $this->fixtures($this->tenant, $this->owner);
        $this->foreign = $this->fixtures($this->other, $this->foreignOwner);

        // Store-B-only reference data
        $this->foreign['account_code'] = '1777';
        $this->foreign['account_id']   = $this->insert('accounts', $this->other, ['name' => 'Foreign Only', 'code' => '1777', 'type' => 'asset']);
        $this->foreign['bank_account'] = $this->insert('bank_accounts', $this->other, ['name' => 'Foreign Bank']);
        $this->foreign['category']     = $this->insert('expense_categories', $this->other, ['name' => 'Foreign Freight']);
        $this->foreign['variant']      = $this->insert('product_variants', $this->other, ['product_id' => $this->foreign['product'], 'variant_name' => 'Red']);
        $this->foreign['channel']      = (int) DB::table('ecommerce_channels')->insertGetId([
            'tenant_id' => $this->other->id, 'name' => 'Foreign Shop', 'platform' => 'woocommerce',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->foreign['employee']     = $this->insert('employees', $this->other, [
            'name' => 'Foreign Worker', 'monthly_salary' => 5000, 'hire_date' => now()->subYear()->toDateString(), 'status' => 'active',
        ]);
        $this->foreign['claim']        = $this->insert('disaster_claims', $this->other, [
            'description' => 'Flood', 'loss_amount' => 100, 'recovery_amount' => 0, 'status' => 'recovery_pending',
        ]);
        $this->foreign['run']          = $this->insert('production_runs', $this->other, [
            'product_id' => $this->foreign['product'], 'quantity' => 1, 'date' => now()->toDateString(), 'status' => 'in_progress',
        ]);
        $this->foreign['payment_je']   = $this->insert('journal_entries', $this->other, [
            'date' => now()->toDateString(), 'user_id' => $this->foreignOwner->id,
            'reference_type' => 'customer_payment', 'reference' => 'PAY-X', 'description' => 'Payment',
        ]);
        $this->foreign['quotation']    = $this->insert('quotations', $this->other, [
            'quotation_number' => 'QUO-' . Str::random(6), 'party_id' => $this->foreign['customer'],
            'quotation_date' => now()->toDateString(), 'created_by' => $this->foreignOwner->id, 'status' => 'draft',
        ]);

        $this->actingAsTenantUserModel($this->owner, $this->tenant);
    }

    public static function foreignIdCases(): array
    {
        $cases = [
            // ── body ids → 422 ───────────────────────────────────────────
            'bom: finished good', 'bom: component',
            'customer advance: customer', 'supplier advance: supplier',
            'disaster claim: product', 'disaster claim: warehouse',
            'donation: product', 'donation: warehouse',
            'production run: bom', 'production run: warehouse',
            'disassembly: product', 'disassembly: warehouse',
            'quotation: customer', 'quotation: product', 'quotation convert: warehouse',
            'stock adjustment: product', 'stock adjustment: warehouse',
            'stock transfer: product', 'stock transfer: from warehouse', 'stock transfer: to warehouse',
            'sale return: foreign line', 'sale return: line of another sale',
            'purchase return: line', 'purchase return: batch',
            'opening balance: account code', 'opening balance: party',
            'opening balance: stock product', 'opening balance: stock warehouse',
            'product: bom component',
            'sale: customer', 'sale: warehouse', 'sale: product', 'sale: channel',
            'purchase: warehouse', 'purchase: product', 'purchase: variant',
            'purchase: payment account', 'purchase: landed-cost category', 'purchase: landed-cost bank account',
            'purchase receive: line',
            'customer payment: customer', 'supplier payment: supplier',
            'sales order: customer', 'payroll: employee', 'employee settlement: employee',
            // ── route ids → 404 ──────────────────────────────────────────
            'product update', 'warehouse update', 'warehouse delete', 'party update', 'party delete',
            'role update', 'quotation convert', 'purchase return', 'production run complete',
            'production run reverse', 'bom update', 'bom delete', 'disaster claim recover',
            'bad debt write-off', 'cheque bounce', 'customer statement', 'supplier statement',
            'invoice pdf', 'party ledger', 'employee update', 'price tier', 'uom conversion',
        ];

        return array_combine($cases, array_map(fn ($c) => [$c], $cases));
    }

    #[Test]
    #[DataProvider('foreignIdCases')]
    public function a_foreign_store_id_is_refused_and_nothing_is_written(string $case): void
    {
        [$method, $path, $payload, $status, $errorKey] = $this->scenario($case);

        $before = $this->tenantRowCounts();
        $foreignRole = DB::table('users')->where('id', $this->foreignOwner->id)->value('role');

        $response = $this->json($method, $this->v3($path), $payload);

        $response->assertStatus($status);
        if ($errorKey !== null) {
            $response->assertJsonValidationErrors($errorKey);
        }

        $this->assertSame($before, $this->tenantRowCounts(), "{$case}: nothing may be written in either store.");
        $this->assertSame($foreignRole, DB::table('users')->where('id', $this->foreignOwner->id)->value('role'));
    }

    #[Test]
    public function the_same_requests_with_this_stores_ids_still_work(): void
    {
        // Controls: the refusals above are about the foreign id, not the payload.
        $this->postJson($this->v3('customer-advances'), [
            'customer_id' => $this->own['customer'], 'amount' => 50, 'receipt_date' => now()->toDateString(), 'payment_method' => 'cash',
        ])->assertRedirect()->assertSessionHasNoErrors();
        $this->postJson($this->v3('supplier-advances'), [
            'supplier_id' => $this->own['supplier'], 'amount' => 40, 'payment_date' => now()->toDateString(), 'payment_method' => 'cash',
        ])->assertRedirect()->assertSessionHasNoErrors();
        $quotationsBefore = DB::table('quotations')->where('tenant_id', $this->tenant->id)->pluck('id')->all();
        $this->postJson($this->v3('quotations'), $this->quotationPayload())->assertRedirect()->assertSessionHasNoErrors();
        $this->postJson($this->v3('stock-adjustments'), [
            'product_id' => $this->own['product'], 'warehouse_id' => $this->own['warehouse'],
            'direction' => 'decrease', 'qty' => 1, 'reason' => 'Breakage',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertSame(1, DB::table('journal_entries')->where('tenant_id', $this->tenant->id)->where('reference_type', 'customer_advance')->count());
        $this->assertSame(1, DB::table('journal_entries')->where('tenant_id', $this->tenant->id)->where('reference_type', 'supplier_advance')->count());
        $newQuotations = DB::table('quotations')->where('tenant_id', $this->tenant->id)->whereNotIn('id', $quotationsBefore)->pluck('id');
        $this->assertCount(1, $newQuotations);
        $this->assertEqualsWithDelta(9.0, (float) DB::table('inventory_batches')->where('id', $this->own['batch'])->value('remaining_qty'), 0.0001);

        // The quotation converts into THIS store's warehouse.
        $quotationId = $newQuotations->first();
        $this->postJson($this->v3("quotations/{$quotationId}/convert-to-order"), ['warehouse_id' => $this->own['warehouse']])
            ->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('accepted', DB::table('quotations')->where('id', $quotationId)->value('status'));
    }

    #[Test]
    public function sku_uniqueness_is_per_store(): void
    {
        DB::table('products')->where('id', $this->foreign['product'])->update(['sku' => 'SHARED-SKU']);

        // Another store's SKU neither blocks nor is revealed ...
        $this->postJson($this->v3('products'), [
            'name' => 'Local Widget', 'sku' => 'SHARED-SKU', 'base_unit' => 'PCS', 'sale_price' => 10,
        ])->assertRedirect()->assertSessionHasNoErrors();
        $mine = DB::table('products')->where('tenant_id', $this->tenant->id)->where('sku', 'SHARED-SKU')->value('id');
        $this->assertNotNull($mine);

        // ... and an update may keep it, too.
        $this->putJson($this->v3("products/{$mine}"), [
            'name' => 'Local Widget 2', 'sku' => 'SHARED-SKU', 'base_unit' => 'PCS', 'sale_price' => 12,
        ])->assertRedirect()->assertSessionHasNoErrors();

        // This store's own SKUs are still unique.
        $ownSku = DB::table('products')->where('id', $this->own['product'])->value('sku');
        $this->postJson($this->v3('products'), [
            'name' => 'Dup', 'sku' => $ownSku, 'base_unit' => 'PCS', 'sale_price' => 10,
        ])->assertStatus(422)->assertJsonValidationErrors('sku');
        $this->putJson($this->v3("products/{$mine}"), [
            'name' => 'Dup', 'sku' => $ownSku, 'base_unit' => 'PCS', 'sale_price' => 10,
        ])->assertStatus(422)->assertJsonValidationErrors('sku');
    }

    // ─── Scenarios ─────────────────────────────────────────────────────────

    /** @return array{0:string,1:string,2:array,3:int,4:?string} */
    private function scenario(string $case): array
    {
        $o = $this->own;
        $f = $this->foreign;
        $today = now()->toDateString();

        $bom       = fn (array $x = []) => array_replace(['product_id' => $o['product2'], 'version' => 1, 'effective_from' => $today,
                        'items' => [['product_id' => $o['product'], 'qty_per_unit' => 1]]], $x);
        $claim     = fn (array $x) => ['description' => 'Flood', 'loss_date' => $today, 'items' => [$x + ['product_id' => $o['product'], 'warehouse_id' => $o['warehouse'], 'qty' => 1]]];
        $donation  = fn (array $x) => $x + ['description' => 'Gift', 'donation_date' => $today, 'type' => 'inventory', 'product_id' => $o['product'], 'warehouse_id' => $o['warehouse'], 'qty' => 1];
        $run       = fn (array $x) => $x + ['bom_id' => $o['bom'], 'warehouse_id' => $o['warehouse'], 'planned_qty' => 1, 'run_date' => $today];
        $disasm    = fn (array $x) => $x + ['product_id' => $o['product'], 'warehouse_id' => $o['warehouse'], 'qty' => 1];
        $adjust    = fn (array $x) => $x + ['product_id' => $o['product'], 'warehouse_id' => $o['warehouse'], 'direction' => 'decrease', 'qty' => 1, 'reason' => 'Breakage'];
        $transfer  = fn (array $x) => $x + ['product_id' => $o['product'], 'from_warehouse_id' => $o['warehouse'], 'to_warehouse_id' => $o['warehouse2'], 'qty' => 1];
        $pReturn   = fn (array $x) => ['return_date' => $today, 'reason' => 'Damaged', 'items' => [$x + ['purchase_item_id' => $o['purchase_item'], 'inventory_batch_id' => $o['batch'], 'return_qty' => 1]]];
        $opening   = fn (array $entry, array $stock = []) => ['entry_date' => $today,
                        'entries' => [$entry + ['account_code' => '1000', 'amount' => 10, 'side' => 'debit']]]
                        + ($stock ? ['stock_entries' => [$stock + ['product_id' => $o['product'], 'warehouse_id' => $o['warehouse'], 'qty' => 1, 'unit_cost' => 5]]] : []);
        $sale      = fn (array $x, array $item = []) => $x + ['customer_id' => $o['customer'], 'warehouse_id' => $o['warehouse'], 'sale_date' => $today, 'payment_method' => 'cash',
                        'items' => [$item + ['product_id' => $o['product'], 'qty' => 1, 'sale_uom' => 'PCS', 'unit_price' => 100]]];
        $purchase  = fn (array $x, array $item = []) => $x + ['supplier_id' => $o['supplier'], 'payment_method' => 'credit', 'purchase_date' => $today,
                        'items' => [$item + ['product_id' => $o['product'], 'qty' => 1, 'unit_cost' => 10]]];
        $quotation = fn (array $x, array $item = []) => $this->quotationPayload($x, $item);
        $product   = ['name' => 'Renamed', 'sku' => 'RN-' . Str::random(6), 'base_unit' => 'PCS', 'sale_price' => 10];

        return match ($case) {
            'bom: finished good'           => ['POST', 'boms', $bom(['product_id' => $f['product']]), 422, 'product_id'],
            'bom: component'               => ['POST', 'boms', $bom(['items' => [['product_id' => $f['product'], 'qty_per_unit' => 1]]]), 422, 'items.0.product_id'],
            'customer advance: customer'   => ['POST', 'customer-advances', ['customer_id' => $f['customer'], 'amount' => 50, 'receipt_date' => $today, 'payment_method' => 'cash'], 422, 'customer_id'],
            'supplier advance: supplier'   => ['POST', 'supplier-advances', ['supplier_id' => $f['supplier'], 'amount' => 50, 'payment_date' => $today, 'payment_method' => 'cash'], 422, 'supplier_id'],
            'disaster claim: product'      => ['POST', 'disaster-claims', $claim(['product_id' => $f['product']]), 422, 'items.0.product_id'],
            'disaster claim: warehouse'    => ['POST', 'disaster-claims', $claim(['warehouse_id' => $f['warehouse']]), 422, 'items.0.warehouse_id'],
            'donation: product'            => ['POST', 'donations', $donation(['product_id' => $f['product']]), 422, 'product_id'],
            'donation: warehouse'          => ['POST', 'donations', $donation(['warehouse_id' => $f['warehouse']]), 422, 'warehouse_id'],
            'production run: bom'          => ['POST', 'production-runs', $run(['bom_id' => $f['bom']]), 422, 'bom_id'],
            'production run: warehouse'    => ['POST', 'production-runs', $run(['warehouse_id' => $f['warehouse']]), 422, 'warehouse_id'],
            'disassembly: product'         => ['POST', 'disassembly', $disasm(['product_id' => $f['product']]), 422, 'product_id'],
            'disassembly: warehouse'       => ['POST', 'disassembly', $disasm(['warehouse_id' => $f['warehouse']]), 422, 'warehouse_id'],
            'quotation: customer'          => ['POST', 'quotations', $quotation(['customer_id' => $f['customer']]), 422, 'customer_id'],
            'quotation: product'           => ['POST', 'quotations', $quotation([], ['product_id' => $f['product']]), 422, 'items.0.product_id'],
            'quotation convert: warehouse' => ['POST', "quotations/{$o['quotation']}/convert-to-order", ['warehouse_id' => $f['warehouse']], 422, 'warehouse_id'],
            'stock adjustment: product'    => ['POST', 'stock-adjustments', $adjust(['product_id' => $f['product']]), 422, 'product_id'],
            'stock adjustment: warehouse'  => ['POST', 'stock-adjustments', $adjust(['warehouse_id' => $f['warehouse']]), 422, 'warehouse_id'],
            'stock transfer: product'      => ['POST', 'stock-transfers', $transfer(['product_id' => $f['product']]), 422, 'product_id'],
            'stock transfer: from warehouse' => ['POST', 'stock-transfers', $transfer(['from_warehouse_id' => $f['warehouse']]), 422, 'from_warehouse_id'],
            'stock transfer: to warehouse' => ['POST', 'stock-transfers', $transfer(['to_warehouse_id' => $f['warehouse']]), 422, 'to_warehouse_id'],
            'sale return: foreign line'    => ['POST', "sales/{$o['sale']}/return", ['return_date' => $today, 'reason' => 'Faulty', 'items' => [['sale_item_id' => $f['sale_item'], 'return_qty' => 1]]], 422, 'items.0.sale_item_id'],
            'sale return: line of another sale' => ['POST', "sales/{$o['sale']}/return", ['return_date' => $today, 'reason' => 'Faulty', 'items' => [['sale_item_id' => $o['sale2_item'], 'return_qty' => 1]]], 422, 'items.0.sale_item_id'],
            'purchase return: line'        => ['POST', "purchases/{$o['purchase']}/return", $pReturn(['purchase_item_id' => $f['purchase_item']]), 422, 'items.0.purchase_item_id'],
            'purchase return: batch'       => ['POST', "purchases/{$o['purchase']}/return", $pReturn(['inventory_batch_id' => $f['batch']]), 422, 'items.0.inventory_batch_id'],
            'opening balance: account code' => ['POST', 'opening-balances', $opening(['account_code' => $f['account_code']]), 422, 'entries.0.account_code'],
            'opening balance: party'       => ['POST', 'opening-balances', $opening(['party_id' => $f['customer']]), 422, 'entries.0.party_id'],
            'opening balance: stock product' => ['POST', 'opening-balances', $opening([], ['product_id' => $f['product']]), 422, 'stock_entries.0.product_id'],
            'opening balance: stock warehouse' => ['POST', 'opening-balances', $opening([], ['warehouse_id' => $f['warehouse']]), 422, 'stock_entries.0.warehouse_id'],
            'product: bom component'       => ['POST', 'products', $product + ['bom_items' => [['product_id' => $f['product'], 'qty_per_unit' => 1]]], 422, 'bom_items.0.product_id'],
            'sale: customer'               => ['POST', 'sales', $sale(['customer_id' => $f['customer']]), 422, 'customer_id'],
            'sale: warehouse'              => ['POST', 'sales', $sale(['warehouse_id' => $f['warehouse']]), 422, 'warehouse_id'],
            'sale: product'                => ['POST', 'sales', $sale([], ['product_id' => $f['product']]), 422, 'items.0.product_id'],
            'sale: channel'                => ['POST', 'sales', $sale(['ecommerce_channel_id' => $f['channel']]), 422, 'ecommerce_channel_id'],
            'purchase: warehouse'          => ['POST', 'purchases', $purchase(['warehouse_id' => $f['warehouse']]), 422, 'warehouse_id'],
            'purchase: product'            => ['POST', 'purchases', $purchase([], ['product_id' => $f['product']]), 422, 'items.0.product_id'],
            'purchase: variant'            => ['POST', 'purchases', $purchase([], ['variant_id' => $f['variant']]), 422, 'items.0.variant_id'],
            'purchase: payment account'    => ['POST', 'purchases', $purchase(['amount_paid' => 10, 'payment_account_id' => $f['account_id']]), 422, 'payment_account_id'],
            'purchase: landed-cost category' => ['POST', 'purchases', $purchase(['extras' => [['amount' => 5, 'category_id' => $f['category']]]]), 422, 'extras.0.category_id'],
            'purchase: landed-cost bank account' => ['POST', 'purchases', $purchase(['extras' => [['amount' => 5, 'bank_account_id' => $f['bank_account']]]]), 422, 'extras.0.bank_account_id'],
            'purchase receive: line'       => ['POST', "purchases/{$o['purchase']}/receive", ['items' => [['purchase_item_id' => $f['purchase_item'], 'receiving_qty' => 1]]], 422, 'items.0.purchase_item_id'],
            'customer payment: customer'   => ['POST', 'customer-payments', ['customer_id' => $f['customer'], 'payment_date' => $today, 'payment_method' => 'cash', 'amount' => 10,
                                                'allocations' => [['sale_id' => $o['sale'], 'amount' => 10]]], 422, 'customer_id'],
            'supplier payment: supplier'   => ['POST', 'supplier-payments', ['supplier_id' => $f['supplier'], 'payment_date' => $today, 'payment_method' => 'cash', 'amount' => 10,
                                                'allocations' => [['purchase_id' => $o['purchase'], 'amount' => 10]]], 422, 'supplier_id'],
            'sales order: customer'        => ['POST', 'sales-orders', ['customer_id' => $f['customer'], 'warehouse_id' => $o['warehouse'], 'order_date' => $today,
                                                'items' => [['product_id' => $o['product'], 'qty' => 1, 'sale_uom' => 'PCS', 'unit_price' => 100]]], 422, 'customer_id'],
            'payroll: employee'            => ['POST', 'payroll/pay', ['employee_id' => $f['employee'], 'payment_date' => $today, 'gross_salary' => 1000, 'payment_method' => 'cash'], 422, 'employee_id'],
            'employee settlement: employee' => ['POST', 'employee-settlements', ['employee_id' => $f['employee'], 'settlement_date' => $today, 'payment_method' => 'cash', 'partial_month_salary' => 100], 422, 'employee_id'],

            'product update'               => ['PUT', "products/{$f['product']}", $product, 404, null],
            'warehouse update'             => ['PUT', "warehouses/{$f['warehouse']}", ['name' => 'Hijacked', 'is_default' => true], 404, null],
            'warehouse delete'             => ['DELETE', "warehouses/{$f['warehouse2']}", [], 404, null],
            'party update'                 => ['PUT', "parties/{$f['customer']}", ['name' => 'Hijacked'], 404, null],
            'party delete'                 => ['DELETE', "parties/{$f['customer']}", [], 404, null],
            'role update'                  => ['PUT', "users/{$this->foreignOwner->id}/role", ['role' => 'cashier'], 404, null],
            'quotation convert'            => ['POST', "quotations/{$f['quotation']}/convert-to-order", ['warehouse_id' => $o['warehouse']], 404, null],
            'purchase return'              => ['POST', "purchases/{$f['purchase']}/return", ['return_date' => $today, 'reason' => 'Damaged',
                                                'items' => [['purchase_item_id' => $f['purchase_item'], 'inventory_batch_id' => $f['batch'], 'return_qty' => 1]]], 404, null],
            'production run complete'      => ['POST', "production-runs/{$f['run']}/complete", ['actual_qty' => 1], 404, null],
            'production run reverse'       => ['POST', "production-runs/{$f['run']}/reverse", ['reverse_qty' => 1], 404, null],
            'bom update'                   => ['PUT', "boms/{$f['bom']}", $bom(), 404, null],
            'bom delete'                   => ['DELETE', "boms/{$f['bom']}", [], 404, null],
            'disaster claim recover'       => ['POST', "disaster-claims/{$f['claim']}/recover", ['recovery_amount' => 10, 'recovery_date' => $today, 'payment_method' => 'cash'], 404, null],
            'bad debt write-off'           => ['POST', "sales/{$f['sale']}/write-off", ['approved_by' => (string) $this->owner->id, 'reason' => 'Gone'], 404, null],
            'cheque bounce'                => ['POST', "customer-payments/{$f['payment_je']}/bounce", ['reason' => 'Bounced'], 404, null],
            'customer statement'           => ['GET', "customers/{$f['customer']}/statement", [], 404, null],
            'supplier statement'           => ['GET', "suppliers/{$f['supplier']}/statement", [], 404, null],
            'invoice pdf'                  => ['GET', "sales/{$f['sale']}/pdf", [], 404, null],
            'party ledger'                 => ['GET', "reports/party-ledger/{$f['customer']}", [], 404, null],
            'employee update'              => ['PUT', "employees/{$f['employee']}", ['name' => 'Hijacked', 'monthly_salary' => 1], 404, null],
            'price tier'                   => ['POST', "products/{$f['product']}/tiers", ['min_qty' => 1, 'unit_price' => 1], 404, null],
            'uom conversion'               => ['POST', "products/{$f['product']}/uom", ['sale_uom' => 'BOX', 'conversion_factor' => 12], 404, null],
        };
    }

    private function quotationPayload(array $x = [], array $item = []): array
    {
        return $x + [
            'customer_id' => $this->own['customer'], 'quotation_date' => now()->toDateString(),
            'items' => [$item + ['product_id' => $this->own['product'], 'qty' => 1, 'sale_uom' => 'PCS', 'unit_price' => 100]],
        ];
    }

    // ─── Fixtures ──────────────────────────────────────────────────────────

    private function fixtures(Tenant $tenant, User $user): array
    {
        $ids = [];
        $ids['warehouse']  = (string) (DB::table('warehouses')->where('tenant_id', $tenant->id)->where('is_default', 1)->value('id')
            ?: $this->insert('warehouses', $tenant, ['name' => 'Main', 'is_default' => 1]));
        $ids['warehouse2'] = $this->insert('warehouses', $tenant, ['name' => 'Annex ' . Str::random(4), 'is_default' => 0]);
        $ids['customer']   = $this->insert('parties', $tenant, ['name' => 'Customer ' . Str::random(4), 'type' => 'customer']);
        $ids['supplier']   = $this->insert('parties', $tenant, ['name' => 'Supplier ' . Str::random(4), 'type' => 'supplier']);
        $ids['product']    = $this->product($tenant);
        $ids['product2']   = $this->product($tenant);

        $ids['bom'] = $this->insert('bill_of_materials', $tenant, [
            'product_id' => $ids['product2'], 'version' => 1, 'effective_from' => now()->toDateString(), 'is_active' => 1,
        ]);
        DB::table('bom_items')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $tenant->id, 'bom_id' => $ids['bom'],
            'product_id' => $ids['product'], 'qty_per_unit' => 1, 'created_at' => now(),
        ]);

        foreach (['sale', 'sale2'] as $key) {
            $ids[$key] = $this->insert('sales', $tenant, [
                'reference_number' => 'SAL-' . Str::random(8), 'party_id' => $ids['customer'], 'warehouse_id' => $ids['warehouse'],
                'subtotal' => 100, 'total' => 100, 'invoice_total' => 100, 'status' => 'posted', 'payment_status' => 'unpaid',
                'user_id' => $user->id,
            ]);
            $ids["{$key}_item"] = $this->insert('sale_items', $tenant, [
                'sale_id' => $ids[$key], 'product_id' => $ids['product'], 'quantity' => 1, 'unit_price' => 100, 'subtotal' => 100,
            ]);
        }

        $ids['purchase'] = $this->insert('purchases', $tenant, [
            'party_id' => $ids['supplier'], 'warehouse_id' => $ids['warehouse'], 'invoice_number' => 'PUR-' . Str::random(8),
            'purchase_date' => now()->toDateString(), 'subtotal' => 100, 'total' => 100, 'payment_status' => 'unpaid',
            'payment_method' => 'credit', 'user_id' => $user->id,
        ]);
        $ids['batch'] = $this->insert('inventory_batches', $tenant, [
            'product_id' => $ids['product'], 'warehouse_id' => $ids['warehouse'], 'batch_type' => 'purchase',
            'original_qty' => 10, 'initial_qty' => 10, 'remaining_qty' => 10, 'unit_cost' => 10,
        ]);
        $ids['purchase_item'] = $this->insert('purchase_items', $tenant, [
            'purchase_id' => $ids['purchase'], 'product_id' => $ids['product'], 'qty' => 10, 'unit_cost' => 10,
            'line_total' => 100, 'inventory_batch_id' => $ids['batch'],
        ]);

        $ids['quotation'] = $this->insert('quotations', $tenant, [
            'quotation_number' => 'QUO-' . Str::random(6), 'party_id' => $ids['customer'],
            'quotation_date' => now()->toDateString(), 'created_by' => $user->id, 'status' => 'draft', 'total_amount' => 100,
        ]);

        return $ids;
    }

    private function insert(string $table, Tenant $tenant, array $row): string
    {
        $id = (string) Str::uuid();
        $row = ['id' => $id, 'tenant_id' => $tenant->id] + $row;
        if (\Illuminate\Support\Facades\Schema::hasColumn($table, 'created_at')) {
            $row += ['created_at' => now()];
        }
        if (\Illuminate\Support\Facades\Schema::hasColumn($table, 'updated_at')) {
            $row += ['updated_at' => now()];
        }
        DB::table($table)->insert($row);
        return $id;
    }

    private function product(Tenant $tenant): string
    {
        return $this->insert('products', $tenant, [
            'name' => 'Widget ' . Str::random(4), 'sku' => 'W-' . Str::random(8), 'price' => 100, 'cost_price' => 10,
            'base_unit' => 'PCS', 'stock_quantity' => 10,
        ]);
    }

    private function member(Tenant $tenant, string $role, ?string $pin = null): User
    {
        $user = User::factory()->create(['last_store_id' => $tenant->id]);
        TenantUser::create([
            'tenant_id' => $tenant->id, 'user_id' => $user->id, 'role' => $role, 'status' => 'active',
            'display_name' => $user->name, 'joined_at' => now(),
            'security_pin' => $pin ? Hash::make($pin) : null,
        ]);
        return $user;
    }

    /** Row counts, per table with a tenant_id column, for the two stores of this test only. */
    private function tenantRowCounts(): array
    {
        if (self::$tenantTables === null) {
            self::$tenantTables = collect(DB::select(
                "SELECT c.TABLE_NAME AS t FROM information_schema.COLUMNS c
                   JOIN information_schema.TABLES tb ON tb.TABLE_SCHEMA = c.TABLE_SCHEMA AND tb.TABLE_NAME = c.TABLE_NAME
                  WHERE c.TABLE_SCHEMA = ? AND c.COLUMN_NAME = 'tenant_id' AND tb.TABLE_TYPE = 'BASE TABLE'",
                [DB::getDatabaseName()]
            ))->pluck('t')
                ->map(fn ($t) => (string) $t)
                ->reject(fn ($t) => preg_match('/(^|_)(logs?|activity|activities|audit\w*|sessions?|cache\w*|jobs?|notifications?|error_logs)$/', $t)
                    || in_array($t, ['store_activity_logs', 'activity_log', 'terminal_activities'], true))
                ->values()
                ->all();
        }

        $counts = [];
        foreach (self::$tenantTables as $table) {
            $counts[$table] = DB::table($table)->whereIn('tenant_id', [$this->tenant->id, $this->other->id])->count();
        }
        return $counts;
    }

    private function v3(string $path): string
    {
        return "/s/{$this->tenant->slug}/v3/{$path}";
    }
}
