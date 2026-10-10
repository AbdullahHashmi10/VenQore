<?php

namespace Tests\Feature\ZeroDrift;

use App\Helpers\SettingsHelper;
use App\Models\SalesOrder;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * ZeroDrift Ledger — expenses, debit notes, payroll, loans, final
 * settlements and pre-sale conversion, through their REAL routes/services
 * on MariaDB with a real store chart. Inputs deliberately carry a third
 * decimal (half-paisa) so any part rounded separately from its total is
 * caught: the ledger refuses an entry a paisa out, which fails the test.
 */
class MoneyInOutZeroDriftTest extends VenQoreTestCase
{
    use \Tests\Support\ReconcilesBeforeRollback;

    private Tenant $tenant;
    private string $tenantId;
    private User $owner;
    private string $warehouseId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tenant = $this->createTenant('zd-' . Str::lower(Str::random(6)), 'ltd_3', 'active');
        $this->tenantId = (string) $this->tenant->id;
        $this->seedTenantDefaults($this->tenant);
        $this->owner = $this->createTenantUser($this->tenant, 'owner');
        $this->actingAsTenantUserModel($this->owner, $this->tenant);
        SettingsHelper::clearCache();
        $this->warehouseId = (string) DB::table('warehouses')->where('tenant_id', $this->tenantId)->value('id');
    }

    private function cents($v): int
    {
        return (int) round(((float) $v) * 100);
    }

    /** code => [debit, credit] paisa of one entry */
    private function lines(string $entryId): array
    {
        $out = [];
        foreach (DB::table('journal_items as ji')->join('accounts as a', 'a.id', '=', 'ji.account_id')->where('ji.journal_entry_id', $entryId)->get(['a.code', 'ji.debit', 'ji.credit']) as $r) {
            $out[$r->code][0] = ($out[$r->code][0] ?? 0) + $this->cents($r->debit);
            $out[$r->code][1] = ($out[$r->code][1] ?? 0) + $this->cents($r->credit);
        }
        ksort($out);
        return $out;
    }

    private function entryOf(string $type): string
    {
        $id = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->where('reference_type', $type)->latest('created_at')->value('id');
        $this->assertNotNull($id, "no {$type} entry");
        return $id;
    }

    private function assertAllBalanced(): void
    {
        $rows = DB::table('journal_items')->where('tenant_id', $this->tenantId)
            ->selectRaw('journal_entry_id, ROUND(SUM(debit) * 100) as dr, ROUND(SUM(credit) * 100) as cr')->groupBy('journal_entry_id')->get();
        $this->assertNotEmpty($rows);
        foreach ($rows as $r) {
            $this->assertSame((int) $r->dr, (int) $r->cr, "entry {$r->journal_entry_id}");
        }
    }

    private function employee(): string
    {
        $this->post("/s/{$this->tenant->slug}/v3/employees", ['name' => 'Emp ' . Str::random(5), 'monthly_salary' => 30000, 'hire_date' => now()->subYear()->toDateString()])
            ->assertSessionHasNoErrors();
        return (string) DB::table('employees')->where('tenant_id', $this->tenantId)->latest('created_at')->value('id');
    }

    public function test_seeded_expenses_with_half_paisa_inputs_post_exactly(): void
    {
        mt_srand(910202611);
        $svc = app(\App\Services\ExpensePostingService::class);
        for ($n = 0; $n < 40; $n++) {
            $amount = number_format(mt_rand(1, 999999) / 1000, 3, '.', '');
            $tax = mt_rand(0, 1) ? number_format(mt_rand(0, 99999) / 1000, 3, '.', '') : '0';
            $paid = [null, number_format(mt_rand(0, 1200000) / 1000, 3, '.', '')][mt_rand(0, 1)];
            $r = $svc->post($this->tenant, ['amount' => $amount, 'input_tax' => $tax, 'amount_paid' => $paid, 'payment_method' => 'cash', 'description' => "e{$n}"], $this->owner);
            $l = $this->lines($r['journal_entry_id']);
            $dr = ($l['6000'][0] ?? 0) + ($l['2300'][0] ?? 0);
            $cr = ($l['1000'][1] ?? 0) + ($l['2000'][1] ?? 0);
            $this->assertSame($dr, $cr, "expense {$n}: {$amount} + {$tax}, paid " . var_export($paid, true));
            $this->assertSame($this->cents($r['amount']) + $this->cents($r['tax_amount']), $dr, "expense {$n}");
        }
        $this->assertAllBalanced();
    }

    public function test_itemised_expense_voucher_is_the_exact_sum_of_its_lines(): void
    {
        $cat = DB::table('expense_categories')->where('tenant_id', $this->tenantId)->value('id');
        $this->post("/s/{$this->tenant->slug}/expenses", [
            'date' => now()->toDateString(), 'expense_category_id' => $cat, 'amount' => '999', 'payment_method' => 'cash',
            'items' => [
                ['expense_category_id' => $cat, 'amount' => '0.005'],
                ['expense_category_id' => $cat, 'amount' => '0.005'],
                ['expense_category_id' => $cat, 'amount' => '10.004'],
            ],
        ])->assertSessionHasNoErrors();
        $e = DB::table('expenses')->where('tenant_id', $this->tenantId)->latest('created_at')->first();
        $this->assertSame(1002, $this->cents($e->amount), 'header = 0.01 + 0.01 + 10.00');
        $this->assertSame(1002, array_sum(array_map(fn ($i) => $this->cents($i->amount), DB::table('expense_items')->where('expense_id', $e->id)->get()->all())));
        $this->assertSame([1002, 0], $this->lines($this->entryOf('expense'))['6000']);
        $this->assertAllBalanced();
    }

    public function test_price_adjustment_debit_note_is_exact(): void
    {
        $supplier = (string) Str::uuid();
        DB::table('parties')->insert(['id' => $supplier, 'tenant_id' => $this->tenantId, 'name' => 'Supp', 'type' => 'supplier', 'created_at' => now(), 'updated_at' => now()]);
        $product = (string) Str::uuid();
        DB::table('products')->insert(['id' => $product, 'tenant_id' => $this->tenantId, 'name' => 'DN item', 'sku' => 'DN-' . Str::random(5), 'price' => 10, 'cost_price' => 5, 'base_unit' => 'PCS', 'stock_quantity' => 0, 'created_at' => now(), 'updated_at' => now()]);
        $this->from('/x')->post("/s/{$this->tenant->slug}/debit-notes", [
            'supplier_id' => $supplier, 'date' => now()->toDateString(), 'status' => 'approved', 'reason' => 'Price fix',
            'returns_stock' => false, 'discount' => '0.01', 'tax' => '1.235',
            'items' => [['product_id' => $product, 'quantity' => 3, 'unit_price' => '33.3333'], ['product_id' => $product, 'quantity' => 1, 'unit_price' => '0.005']],
        ])->assertSessionHasNoErrors();
        $note = DB::table('debit_notes')->where('tenant_id', $this->tenantId)->latest('created_at')->first();
        // goods 100.00 + 0.01; less 0.01 discount; plus tax 1.24
        $this->assertSame(10124, $this->cents($note->amount));
        $this->assertSame(['2000' => [10124, 0], '2300' => [0, 124], '5000' => [0, 10000]], $this->lines($this->entryOf('debit_note')));
    }

    public function test_payroll_payment_and_loan_repayment_are_exact(): void
    {
        $emp = $this->employee();
        $this->post("/s/{$this->tenant->slug}/v3/payroll/pay", ['employee_id' => $emp, 'payment_date' => now()->toDateString(), 'gross_salary' => '12345.675', 'payment_method' => 'cash'])
            ->assertSessionHasNoErrors();
        $pay = $this->lines(DB::table('journal_entries')->where('tenant_id', $this->tenantId)->orderByDesc('created_at')->value('id'));
        $this->assertSame(1234568, $pay['1000'][1] ?? null, 'gross 12345.675 is paid as 12345.68');

        $this->post("/s/{$this->tenant->slug}/v3/loans/drawdown", ['description' => 'Loan', 'drawdown_date' => now()->toDateString(), 'principal' => '1000', 'payment_method' => 'cash'])->assertSessionHasNoErrors();
        $this->post("/s/{$this->tenant->slug}/v3/loans/repay", ['description' => 'Repay', 'repayment_date' => now()->toDateString(), 'principal' => '100.005', 'interest' => '0.005', 'payment_method' => 'cash'])
            ->assertSessionHasNoErrors();
        $l = $this->lines(DB::table('journal_entries')->where('tenant_id', $this->tenantId)->orderByDesc('created_at')->value('id'));
        $this->assertSame(10002, $l['1000'][1] ?? null, 'cash out = 100.01 + 0.01');
        $this->assertAllBalanced();
    }

    public function test_final_settlement_parts_and_totals_agree_to_the_paisa(): void
    {
        $emp = $this->employee();
        $this->post("/s/{$this->tenant->slug}/v3/employee-settlements", [
            'employee_id' => $emp, 'settlement_date' => now()->toDateString(), 'payment_method' => 'cash',
            'partial_month_salary' => '1000.005', 'gratuity' => '0.005', 'notice_pay' => '0.005', 'leave_encashment' => '0.005',
        ])->assertSessionHasNoErrors();
        // 1000.01 + (0.01 × 3) = 1000.04 accrued and paid — not 1000.02 (the sum rounded once).
        $acc = $this->lines($this->entryOf('settlement_accrual'));
        $this->assertSame([[100001, 0], [3, 0], [0, 100004]], [$acc['6100'], $acc['6800'], $acc['2400']]);
        $pay = $this->lines($this->entryOf('settlement_payment'));
        $this->assertSame([[100004, 0], [0, 100004]], [$pay['2400'], $pay['1000']]);
        $this->assertAllBalanced();
    }

    public function test_pre_sale_conversion_uses_the_shared_exact_calculation(): void
    {
        $customer = (string) Str::uuid();
        DB::table('parties')->insert(['id' => $customer, 'tenant_id' => $this->tenantId, 'name' => 'Cust', 'type' => 'customer', 'created_at' => now(), 'updated_at' => now()]);
        $product = (string) Str::uuid();
        DB::table('products')->insert(['id' => $product, 'tenant_id' => $this->tenantId, 'name' => 'Conv item', 'sku' => 'CV-' . Str::random(5), 'price' => 33.333, 'cost_price' => 1, 'tax_rate' => 17, 'base_unit' => 'PCS', 'stock_quantity' => 50, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('inventory_batches')->insert(['id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId, 'product_id' => $product, 'warehouse_id' => $this->warehouseId,
            'batch_type' => 'purchase', 'original_qty' => 50, 'initial_qty' => 50, 'remaining_qty' => 50, 'unit_cost' => 1.0005, 'created_at' => now()->subDay(), 'updated_at' => now()->subDay()]);
        DB::table('stocks')->insert(['id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId, 'product_id' => $product, 'warehouse_id' => $this->warehouseId, 'quantity' => 50, 'created_at' => now(), 'updated_at' => now()]);

        $this->postJson("/s/{$this->tenant->slug}/sales/pre-sales", [
            'customer_id' => $customer, 'order_date' => now()->toDateString(),
            'items' => [
                ['product_id' => $product, 'quantity' => 3, 'unit_price' => 33.333, 'discount' => 0.005],
                // Two tiny taxed lines: tax 0.005 each → 0.01 per line (0.02), never 0.01 for both together.
                ['product_id' => $product, 'quantity' => 1, 'unit_price' => 0.05, 'discount' => 0],
                ['product_id' => $product, 'quantity' => 1, 'unit_price' => 0.05, 'discount' => 0],
            ],
        ])->assertOk();
        $order = SalesOrder::where('tenant_id', $this->tenantId)->latest()->firstOrFail();
        $this->postJson("/s/{$this->tenant->slug}/sales/pre-sales/{$order->id}/convert")->assertOk();

        $sale = DB::table('sales')->where('tenant_id', $this->tenantId)->latest('created_at')->first();
        // line 1: gross q(3 × 33.333) = 100.00; discount 0.01; net 99.99; tax 17% = 16.9983 → 17.00
        // lines 2–3: 0.05 each, tax 17% = 0.0085 → 0.01 each (per line, half-up)
        // net 100.09; tax 17.02; invoice 117.11
        $this->assertSame([10010, 10009, 1702, 11711], [$this->cents($sale->subtotal_gross), $this->cents($sale->net_sales), $this->cents($sale->total_tax), $this->cents($sale->invoice_total)]);
        $this->assertSame([1700, 1, 1], DB::table('sale_items')->where('sale_id', $sale->id)->orderBy('created_at')->orderByDesc('tax_amount')->pluck('tax_amount')->map(fn ($t) => $this->cents($t))->all());
        // What is STORED must already be exact paisa — not 17.0153 tax that only
        // the ledger's own quantizing happens to round to the same figure.
        foreach (['subtotal_gross', 'net_sales', 'total_tax', 'tax', 'invoice_total', 'total'] as $col) {
            $this->assertSame(0, ((int) round(((float) $sale->{$col}) * 10000)) % 100, "sales.{$col} = {$sale->{$col}} is not whole paisa");
        }
        foreach (DB::table('sale_items')->where('sale_id', $sale->id)->get() as $it) {
            foreach (['gross_amount', 'net_amount', 'tax_amount', 'line_total'] as $col) {
                $this->assertSame(0, ((int) round(((float) $it->{$col}) * 10000)) % 100, "sale_items.{$col} = {$it->{$col}} is not whole paisa");
            }
        }
        $l = $this->lines(DB::table('journal_entries')->where('reference', $sale->id)->where('reference_type', 'sale')->value('id'));
        $this->assertSame([11711, 0], $l['1200']);
        $this->assertSame([0, 10009], $l['4000']);
        $this->assertSame([0, 1702], $l['2100']);
        $this->assertAllBalanced();
    }
}
