<?php

namespace Tests\Feature\Production;

use App\Models\Product;
use App\Models\WooConnection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * WOO-001 — a WooCommerce order must post ONE balanced double-entry journal
 * (revenue, tax, COGS) whichever webhook endpoint receives it.
 *
 * Rewritten 2026-09-10 to be self-contained (it used to depend on a Golden
 * woo_connections fixture that was never seeded, so it could not run). The
 * WooSync receiver (/api/woo/webhook) previously dropped order topics; both
 * receivers now go through App\Services\WooSync\WooOrderPoster.
 */
class WooWebhookJournalPinningTest extends VenQoreTestCase
{
    private function setUpStore(): array
    {
        $tenant = $this->createTenant('woo001-' . Str::lower(Str::random(5)), 'ltd_3', 'active');
        $this->seedTenantDefaults($tenant);
        DB::table('tenant_plan_overrides')->insert([
            'tenant_id' => $tenant->id, 'override_key' => 'woocommerce', 'override_value' => '1',
            'applied_by' => 1, 'created_at' => now(), 'updated_at' => now(),
        ]);
        app()->instance('current.tenant', $tenant);

        $conn = WooConnection::create([
            'tenant_id' => $tenant->id, 'name' => 'Shop', 'site_url' => 'https://example.com',
            'uuid' => (string) Str::uuid(), 'consumer_key' => 'ck', 'consumer_secret' => 'cs',
            'webhook_secret' => 'whsec_test', 'status' => 'active',
        ]);
        $warehouseId = DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');
        $product = Product::factory()->create(['tenant_id' => $tenant->id, 'sku' => 'WOO-SKU-1', 'price' => 999, 'cost_price' => 999]);
        DB::table('inventory_batches')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $tenant->id, 'product_id' => $product->id,
            'warehouse_id' => $warehouseId, 'unit_cost' => 30.00, 'original_qty' => 10,
            'initial_qty' => 10, 'remaining_qty' => 10, 'created_at' => now(), 'updated_at' => now(),
        ]);
        app()->forgetInstance('current.tenant');

        return [$tenant, $conn];
    }

    private function order(int $id): array
    {
        return [
            'id' => $id, 'status' => 'processing',
            'line_items' => [['sku' => 'WOO-SKU-1', 'quantity' => 2, 'total' => '90.00']],
            'shipping_total' => '10.00', 'total_tax' => '15.30', 'total' => '115.30',
        ];
    }

    private function send(string $url, array $payload, array $headers = [])
    {
        $sig = base64_encode(hash_hmac('sha256', json_encode($payload), 'whsec_test', true));
        return $this->postJson($url, $payload, array_merge(['x-wc-webhook-signature' => $sig], $headers));
    }

    private function assertBalancedOrderJournal($tenant, string $ref): void
    {
        $entries = DB::table('journal_entries')->where('tenant_id', $tenant->id)->where('reference', $ref)->get();
        $this->assertCount(1, $entries, "WOO-001: expected exactly one journal for {$ref}.");

        $lines = DB::table('journal_items as ji')->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.journal_entry_id', $entries[0]->id)
            ->selectRaw('a.code, SUM(ji.debit) d, SUM(ji.credit) c')->groupBy('a.code')->get()->keyBy('code');

        $this->assertEqualsWithDelta((float) $lines->sum('d'), (float) $lines->sum('c'), 0.01, 'Journal not balanced.');
        $this->assertEqualsWithDelta(100.00, (float) $lines['4000']->c, 0.01, 'Revenue = line totals 90 + shipping 10 (order money, not list price).');
        $this->assertEqualsWithDelta(15.30, (float) $lines['2100']->c, 0.01, 'Tax must go to 2100 Sales Tax Payable.');
        $this->assertEqualsWithDelta(60.00, (float) $lines['5000']->d, 0.01, 'COGS = 2 × FIFO batch cost 30.');
    }

    public function test_woo001_webhook_sale_posts_balanced_journal(): void
    {
        [$tenant, $conn] = $this->setUpStore();

        $this->send("/api/woo/webhook/{$conn->uuid}", $this->order(987654), ['x-wc-webhook-topic' => 'order.created'])
            ->assertOk();

        $this->assertBalancedOrderJournal($tenant, 'WC-987654');
        $this->assertTrialBalanceZero($tenant);
    }

    public function test_woo001_redelivered_webhook_does_not_double_post(): void
    {
        [$tenant, $conn] = $this->setUpStore();

        $this->send("/woocommerce/webhook/{$conn->uuid}", $this->order(555))->assertOk();
        $this->send("/woocommerce/webhook/{$conn->uuid}", $this->order(555))->assertOk()->assertJsonPath('duplicate', true);
        $this->send("/api/woo/webhook/{$conn->uuid}", $this->order(555), ['x-wc-webhook-topic' => 'order.updated'])->assertOk();

        $this->assertBalancedOrderJournal($tenant, 'WC-555');
        $remaining = (float) DB::table('inventory_batches')->where('tenant_id', $tenant->id)->sum('remaining_qty');
        $this->assertEqualsWithDelta(8.0, $remaining, 0.001, 'Stock must be deducted once, not per delivery.');
    }

    public function test_woo001_unpaid_order_is_not_posted(): void
    {
        [$tenant, $conn] = $this->setUpStore();
        $order = $this->order(777);
        $order['status'] = 'pending';

        $this->send("/woocommerce/webhook/{$conn->uuid}", $order)->assertOk();
        $this->assertSame(0, DB::table('journal_entries')->where('tenant_id', $tenant->id)->where('reference', 'WC-777')->count());
    }
}
