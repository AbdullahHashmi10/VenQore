<?php

namespace Tests\Feature\SaleReliability;

use App\Helpers\SettingsHelper;
use App\Models\Category;
use App\Models\Product;
use App\Models\Register;
use App\Models\RegisterShift;
use App\Models\Sale;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * FBR outbox: the report is queued inside the sale's transaction, sent only
 * after it commits, and retried until FBR has it — through the REAL
 * POST /s/{store}/pos/sales on MariaDB.
 */
class FbrOutboxTest extends VenQoreTestCase
{
    use \Tests\Support\ReconcilesBeforeRollback;

    private Tenant $tenant;
    private User $cashier;
    private Register $register;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tenant = $this->createTenant('fbr-' . Str::lower(Str::random(6)), 'ltd_3');
        $this->cashier = $this->createTenantUser($this->tenant, 'cashier');
        $this->actingAsTenantUserModel($this->cashier, $this->tenant);
        $this->register = Register::create(['tenant_id' => $this->tenant->id, 'name' => 'Till 1', 'status' => 'active']);
        RegisterShift::create(['tenant_id' => $this->tenant->id, 'register_id' => $this->register->id, 'opened_by' => $this->cashier->id,
            'opening_balance' => 0, 'status' => 'open', 'opened_at' => now()]);
        foreach (['fbr_integration' => '1', 'fbr_pos_id' => '123456', 'fbr_usin' => 'USIN0', 'fbr_auth_token' => 'token', 'fbr_environment' => 'sandbox',
                  'fbr_api_url' => 'https://fbr.example.test/PostData'] as $k => $v) {
            Setting::create(['tenant_id' => $this->tenant->id, 'key' => $k, 'value' => $v]);
        }
        SettingsHelper::clearCache();
    }

    private function ring(): \Illuminate\Testing\TestResponse
    {
        $cat = Category::firstOrCreate(['tenant_id' => $this->tenant->id, 'name' => 'General']);
        $p = Product::create(['tenant_id' => $this->tenant->id, 'name' => 'Item ' . uniqid(), 'sku' => 'SKU-' . uniqid(), 'unit' => 'pcs', 'base_unit' => 'pcs',
            'price' => '250', 'category_id' => $cat->id, 'type' => 'service', 'cost_price' => 0]);
        return $this->postJson($this->storeUrl($this->tenant, '/pos/sales'), [
            'register_id' => $this->register->id, 'items' => [['product_id' => $p->id, 'quantity' => 2, 'price' => 250, 'discount' => 0]],
            'payment_method' => 'split', 'payments' => [['method' => 'cash', 'amount' => 500]], 'expected_total' => 500,
            'discount' => 0, 'tax_rate' => 0, 'tax_inclusive' => false, 'tax_exempt' => true, 'delivery_charge' => 0, 'extra_charge_value' => 0,
            'bill_rounding' => false, 'calculation_version' => 2, 'source' => 'pos', 'idempotency_key' => (string) Str::uuid(),
        ]);
    }

    private function outbox(string $saleId): object
    {
        return DB::table('fbr_outbox')->where('sale_id', $saleId)->first();
    }

    public function test_the_report_is_sent_after_commit_never_inside_the_sale_transaction(): void
    {
        $outside = DB::transactionLevel();
        $levels = [];
        Http::fake(function () use (&$levels) {
            $levels[] = DB::transactionLevel();
            return Http::response(['Code' => 100, 'InvoiceNumber' => 'FBR-1', 'QRData' => 'qr', 'Response' => 'ok']);
        });

        $res = $this->ring()->assertCreated();
        $saleId = $res->json('sale_id');

        $this->assertSame([$outside], $levels, 'FBR was called while the sale transaction was still open');
        $sale = Sale::find($saleId);
        $this->assertSame('FBR-1', $sale->fbr_invoice_number);
        $this->assertTrue((bool) $sale->is_fbr_reported);
        $this->assertSame('sent', $this->outbox($saleId)->status);
    }

    public function test_fbr_down_keeps_the_sale_and_the_report_is_retried_until_sent_once(): void
    {
        // One fake for the whole test (Http::fake stubs stack; the first wins).
        $up = false;
        $sent = 0;
        Http::fake(function () use (&$up, &$sent) {
            if (! $up) {
                throw new ConnectionException('FBR is down');
            }
            $sent++;
            return Http::response(['Code' => 100, 'InvoiceNumber' => 'FBR-2', 'QRData' => 'qr2']);
        });
        $res = $this->ring()->assertCreated();
        $saleId = $res->json('sale_id');

        $row = $this->outbox($saleId);
        $this->assertSame('failed', $row->status);
        $this->assertSame(1, (int) $row->attempts);
        $this->assertNotNull(Sale::find($saleId), 'the sale is committed whatever FBR does');
        $this->assertFalse((bool) Sale::find($saleId)->is_fbr_reported);

        // Not due yet: the scheduler leaves it alone.
        Artisan::call('fbr:flush-outbox');
        $this->assertSame(1, (int) $this->outbox($saleId)->attempts);

        // FBR is back; a minute later the scheduler sends it.
        $up = true;
        $this->travel(2)->minutes();
        Artisan::call('fbr:flush-outbox');
        $this->assertStringContainsString('Sent: 1', Artisan::output());
        $this->assertSame('sent', $this->outbox($saleId)->status);
        $this->assertSame('FBR-2', Sale::find($saleId)->fbr_invoice_number);

        // And never again.
        $this->travel(1)->hours();
        Artisan::call('fbr:flush-outbox');
        $this->assertSame(1, $sent);
    }

    public function test_a_rejected_invoice_waits_for_a_person_and_is_not_resent(): void
    {
        $calls = 0;
        Http::fake(function () use (&$calls) {
            $calls++;
            return Http::response(['Code' => 400, 'Response' => 'Invalid PCT code'], 200);
        });
        $saleId = $this->ring()->assertCreated()->json('sale_id');
        $row = $this->outbox($saleId);
        $this->assertSame('rejected', $row->status);
        $this->assertStringContainsString('Invalid PCT code', $row->last_error);

        $this->travel(1)->days();
        Artisan::call('fbr:flush-outbox');
        $this->assertSame(1, $calls);
    }

    public function test_two_workers_cannot_send_the_same_report(): void
    {
        $up = false;
        Http::fake(function () use (&$up) {
            if (! $up) {
                throw new ConnectionException('down');
            }
            return Http::response(['Code' => 100, 'InvoiceNumber' => 'FBR-3']);
        });
        $saleId = $this->ring()->assertCreated()->json('sale_id');
        $id = $this->outbox($saleId)->id;
        $this->travel(2)->minutes();

        // The first worker has claimed it (status sending); a second one gets nothing.
        DB::table('fbr_outbox')->where('id', $id)->update(['status' => 'sending', 'claimed_at' => now()]);
        $this->assertNull(\App\Services\Fbr\FbrOutbox::deliver($id));

        // A claim left behind by a crashed worker is picked up after a while.
        $up = true;
        $this->travel(\App\Services\Fbr\FbrOutbox::STALE_MINUTES + 1)->minutes();
        $this->assertSame('sent', \App\Services\Fbr\FbrOutbox::deliver($id));
    }

    public function test_gives_up_after_the_last_attempt(): void
    {
        Http::fake(fn () => throw new ConnectionException('down'));
        $saleId = $this->ring()->assertCreated()->json('sale_id');
        for ($i = 0; $i < \App\Services\Fbr\FbrOutbox::MAX_ATTEMPTS + 2; $i++) {
            $this->travel(9)->hours();
            Artisan::call('fbr:flush-outbox');
        }
        $row = $this->outbox($saleId);
        $this->assertSame('dead', $row->status);
        $this->assertSame(\App\Services\Fbr\FbrOutbox::MAX_ATTEMPTS, (int) $row->attempts);
    }

    public function test_no_report_is_queued_when_fbr_is_off(): void
    {
        Setting::where('key', 'fbr_integration')->update(['value' => '0']);
        SettingsHelper::clearCache();
        Http::fake();
        $saleId = $this->ring()->assertCreated()->json('sale_id');
        $this->assertNull(DB::table('fbr_outbox')->where('sale_id', $saleId)->first());
        Http::assertNothingSent();
    }
}
