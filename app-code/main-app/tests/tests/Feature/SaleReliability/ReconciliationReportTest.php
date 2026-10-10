<?php

namespace Tests\Feature\SaleReliability;

use App\Models\Category;
use App\Models\Product;
use App\Models\Register;
use App\Models\RegisterShift;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Reconciliation\SaleReconciliation;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * The read-only reconciliation report: clean books report nothing; each
 * deliberately corrupted amount is caught by the check meant for it; the
 * report never writes. Plus the till's reconnect telemetry endpoint.
 */
class ReconciliationReportTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User $cashier;
    private Register $register;
    private array $sales = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->tenant = $this->createTenant('rec-' . Str::lower(Str::random(6)), 'ltd_3');
        $this->cashier = $this->createTenantUser($this->tenant, 'cashier');
        $this->actingAsTenantUserModel($this->cashier, $this->tenant);
        $this->register = Register::create(['tenant_id' => $this->tenant->id, 'name' => 'Till 1', 'status' => 'active']);
        RegisterShift::create(['tenant_id' => $this->tenant->id, 'register_id' => $this->register->id, 'opened_by' => $this->cashier->id,
            'opening_balance' => 0, 'status' => 'open', 'opened_at' => now()]);

        $this->sales['cash'] = $this->ring([['100', null, 2]], [['method' => 'cash', 'amount' => 200]], 200);
        $this->sales['split'] = $this->ring([['100', null, 1]], [['method' => 'card', 'amount' => 60], ['method' => 'cash', 'amount' => 40]], 100);
        $this->sales['taxed'] = $this->ring([['0.05', '10', 1], ['0.05', '10', 1]], [['method' => 'cash', 'amount' => 0.12]], 0.12, ['tax_exempt' => false]);
        $this->sales['delivery'] = $this->ring([['450', null, 2]], [['method' => 'cash', 'amount' => 1020]], 1020, ['delivery_charge' => 120]);
    }

    private function ring(array $lines, array $payments, $expected, array $over = []): string
    {
        $cat = Category::firstOrCreate(['tenant_id' => $this->tenant->id, 'name' => 'General']);
        $items = [];
        foreach ($lines as [$price, $tax, $qty]) {
            $p = Product::create(['tenant_id' => $this->tenant->id, 'name' => 'Item ' . uniqid(), 'sku' => 'SKU-' . uniqid(), 'unit' => 'pcs', 'base_unit' => 'pcs',
                'price' => $price, 'category_id' => $cat->id, 'type' => 'service', 'tax_rate' => $tax, 'cost_price' => 0]);
            $items[] = ['product_id' => $p->id, 'quantity' => $qty, 'price' => (float) $price, 'discount' => 0];
        }
        $res = $this->postJson($this->storeUrl($this->tenant, '/pos/sales'), array_merge([
            'register_id' => $this->register->id, 'items' => $items, 'payment_method' => 'split', 'payments' => $payments, 'expected_total' => $expected,
            'discount' => 0, 'tax_rate' => 0, 'tax_inclusive' => false, 'tax_exempt' => true, 'delivery_charge' => 0, 'extra_charge_value' => 0,
            'bill_rounding' => false, 'calculation_version' => 2, 'source' => 'pos', 'idempotency_key' => (string) Str::uuid(),
        ], $over));
        $res->assertCreated();
        return $res->json('sale_id');
    }

    private function checks(): array
    {
        $out = [];
        foreach (app(SaleReconciliation::class)->run($this->tenant->id, now()->subDay()->toDateString(), now()->toDateString()) as $f) {
            $out[$f['check']] = $f['count'];
        }
        ksort($out);
        return $out;
    }

    private function entryOf(string $saleId): string
    {
        return DB::table('journal_entries')->where('reference_type', 'sale')->where('reference', $saleId)->value('id');
    }

    private function line(string $saleId, string $code): object
    {
        return DB::table('journal_items as ji')->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.journal_entry_id', $this->entryOf($saleId))->where('a.code', $code)->select('ji.*')->first();
    }

    public function test_clean_books_report_nothing_and_the_report_never_writes(): void
    {
        $tables = ['sales', 'sale_items', 'payments', 'journal_entries', 'journal_items', 'accounts'];
        $before = array_map(fn ($t) => DB::table($t)->count() . ':' . DB::table($t)->max('updated_at'), array_combine($tables, $tables));

        $this->assertSame([], $this->checks());
        $code = Artisan::call('sales:reconcile', ['--tenant' => $this->tenant->id]);
        $output = Artisan::output();
        $this->assertSame(0, $code, $output);
        $this->assertStringContainsString('0 blocker(s)', $output);

        $after = array_map(fn ($t) => DB::table($t)->count() . ':' . DB::table($t)->max('updated_at'), array_combine($tables, $tables));
        $this->assertSame($before, $after);
    }

    public function test_a_paisa_moved_on_the_revenue_line_is_caught(): void
    {
        $l = $this->line($this->sales['cash'], '4000');
        DB::table('journal_items')->where('id', $l->id)->update(['credit' => DB::raw('credit + 0.01')]);
        $this->assertSame(['ledger.trial_balance' => 1, 'ledger.unbalanced_entry' => 1, 'sale.journal_revenue' => 1], $this->checks());
        $this->assertSame(1, Artisan::call('sales:reconcile', ['--tenant' => $this->tenant->id]));
    }

    public function test_an_invoice_total_a_paisa_off_its_parts_is_caught(): void
    {
        DB::table('sales')->where('id', $this->sales['delivery'])->update(['invoice_total' => DB::raw('invoice_total + 0.01')]);
        $this->assertSame(['sale.components' => 1, 'sale.journal_total' => 1], $this->checks());
    }

    public function test_line_revenue_that_does_not_add_up_is_caught(): void
    {
        DB::table('sale_items')->where('sale_id', $this->sales['taxed'])->limit(1)->update(['revenue_amount' => DB::raw('revenue_amount + 0.01')]);
        $this->assertSame(['sale.revenue_lines' => 1], $this->checks());
    }

    public function test_a_missing_payment_row_is_caught(): void
    {
        DB::table('payments')->where('sale_id', $this->sales['split'])->where('method', 'card')->delete();
        $this->assertSame(['sale.payments' => 1], $this->checks());
    }

    public function test_a_sale_missing_or_double_posted_or_cancelled_but_live_is_caught(): void
    {
        DB::table('journal_items')->where('journal_entry_id', $this->entryOf($this->sales['cash']))->delete();
        DB::table('journal_entries')->where('id', $this->entryOf($this->sales['cash']))->delete();
        DB::table('sales')->where('id', $this->sales['split'])->update(['status' => 'cancelled']);
        $this->assertSame(['sale.cancelled_not_reversed' => 1, 'sale.no_journal' => 1], $this->checks());
    }

    public function test_more_returned_than_sold_is_caught(): void
    {
        DB::table('sale_items')->where('sale_id', $this->sales['cash'])->update(['returned_quantity' => 3]);
        $this->assertSame(['sale.returned_over' => 1], $this->checks());
    }

    public function test_fbr_reports_needing_a_person_are_listed(): void
    {
        DB::table('fbr_outbox')->insert(['id' => (string) Str::uuid(), 'tenant_id' => $this->tenant->id, 'sale_id' => $this->sales['cash'],
            'status' => 'rejected', 'attempts' => 1, 'last_error' => 'Invalid PCT code', 'created_at' => now(), 'updated_at' => now()]);
        $this->assertSame(['fbr.needs_person' => 1], $this->checks());
        // A warning alone does not fail the release gate.
        $this->assertSame(0, Artisan::call('sales:reconcile', ['--tenant' => $this->tenant->id]));
        $this->assertSame(1, Artisan::call('sales:reconcile', ['--tenant' => $this->tenant->id, '--fail-on' => 'warning']));
    }

    public function test_a_till_reports_its_queue_and_a_stuck_one_is_listed(): void
    {
        $url = $this->storeUrl($this->tenant, '/pos/queue-status');
        $this->postJson($url, ['device_id' => 'dev_abcdefgh', 'counts' => ['needs_attention' => 2, 'pending' => 1], 'oldest_age_seconds' => 7200, 'storage_persisted' => true])
            ->assertOk()->assertJson(['unresolved' => 3]);
        $row = DB::table('pos_queue_telemetry')->where('tenant_id', $this->tenant->id)->where('device_id', 'dev_abcdefgh')->first();
        $this->assertSame(3, (int) $row->unresolved);
        $this->assertSame(['pending' => 1, 'uncertain' => 0, 'awaiting_auth' => 0, 'needs_attention' => 2, 'conflict' => 0, 'quarantined' => 0], json_decode($row->counts, true));
        $this->assertSame(['till.queue_stuck' => 1], $this->checks());

        // The same device later reports an empty queue: one row, overwritten.
        $this->postJson($url, ['device_id' => 'dev_abcdefgh', 'counts' => []])->assertOk()->assertJson(['unresolved' => 0]);
        $this->assertSame(1, DB::table('pos_queue_telemetry')->where('tenant_id', $this->tenant->id)->count());
        $this->assertSame([], $this->checks());

        // Bad input is refused, not stored.
        $this->postJson($url, ['device_id' => 'x', 'counts' => ['pending' => -1]])->assertStatus(422);
    }

    public function test_an_entry_linked_by_the_reference_number_counts_as_the_sales_entry(): void
    {
        $ref = DB::table('sales')->where('id', $this->sales['cash'])->value('reference_number');
        DB::table('journal_entries')->where('id', $this->entryOf($this->sales['cash']))->update(['reference' => $ref]);
        $this->assertSame([], $this->checks());
    }
}
