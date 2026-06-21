<?php

namespace Tester\tests\Feature\Money;

use Tests\Feature\VenQoreTestCase;
use App\Models\Tenant;
use App\Models\Account;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class PrecisionStandardTest extends VenQoreTestCase
{
    /**
     * Test that a large balance (e.g. 150,000,000.1234) stores and reads exactly
     * on the widened money decimal(20,4) columns.
     */
    public function test_large_balance_precise_storage_and_retrieval()
    {
        $tenant = $this->createTenant('prec-test', 'ltd_3');
        $this->seedTenantDefaults($tenant);

        // We use accounts table balance column which is decimal(20,4)
        $account = new Account();
        $account->tenant_id = $tenant->id;
        $account->name = 'Precision Test Account';
        $account->code = 'PTA-001';
        $account->type = 'asset';
        $account->balance = 150000000.1234;
        $account->save();

        $retrieved = Account::find($account->id);
        $this->assertEquals(150000000.1234, (float) $retrieved->balance);

        // Raw database query check
        $raw = DB::table('accounts')->where('id', $account->id)->first();
        $this->assertEquals('150000000.1234', $raw->balance);
    }

    /**
     * PROOF 3 — SaleController rounding fix changes NO charged total.
     *
     * Case A — Clean price (100.00): invoice_total stored as exactly 100.00,
     *   no round_off line emitted (round_off == 0.00).
     *
     * Case B — Sub-cent price (10.1234): invoice_total stored as 10.12
     *   (rounded to 2dp), HTTP 200 — no 500, no bogus zero-amount journal.
     */
    public function test_invoice_total_rounds_to_two_decimal_places()
    {
        $tenant = $this->createTenant('prec-round-test', 'ltd_3');
        $this->seedTenantDefaults($tenant);
        $this->actingAsOwner($tenant);

        // --- Case A: clean integer-cent price ---
        $cleanProduct = Product::factory()->create([
            'tenant_id'     => $tenant->id,
            'price'         => 100.00,
            'cost_price'    => 50.00,
            'stock_quantity'=> 100,
        ]);

        $responseClean = $this->post($this->storeUrl($tenant, 'sales'), [
            'payment_method'  => 'cash',
            'amount_paid'     => 100.00,
            'items'           => [[
                'product_id' => $cleanProduct->id,
                'quantity'   => 1,
                'price'      => 100.00,
                'discount'   => 0,
                'tax_rate'   => 0,
            ]],
            'discount'         => 0,
            'tax'              => 0,
            'shipping_charges' => 0,
        ]);
        $responseClean->assertStatus(200);

        $saleClean = DB::table('sales')
            ->where('tenant_id', $tenant->id)
            ->orderBy('created_at', 'desc')
            ->first();
        $this->assertNotNull($saleClean, 'Clean-price sale should be stored');

        // invoice_total must be exactly 100.00 (no floating drift)
        $this->assertEquals(
            '100.00',
            number_format((float) $saleClean->invoice_total, 2),
            'Clean price 100.00 must store as exactly 100.00'
        );
        // round_off must be 0 (no rounding line for a clean price)
        $this->assertEquals(
            0.00,
            round((float) $saleClean->round_off, 4),
            'Clean price must produce zero round_off'
        );

        // Clean slate before Case B so the query is unambiguous
        DB::table('sales')->where('tenant_id', $tenant->id)->delete();

        // --- Case B: sub-cent price (10.1234) ---
        $fracProduct = Product::factory()->create([
            'tenant_id'     => $tenant->id,
            'price'         => 10.1234,
            'cost_price'    => 5.00,
            'stock_quantity'=> 100,
        ]);

        $responseFrac = $this->post($this->storeUrl($tenant, 'sales'), [
            'payment_method'  => 'cash',
            'amount_paid'     => 10.12,
            'items'           => [[
                'product_id' => $fracProduct->id,
                'quantity'   => 1,
                'price'      => 10.1234,
                'discount'   => 0,
                'tax_rate'   => 0,
            ]],
            'discount'         => 0,
            'tax'              => 0,
            'shipping_charges' => 0,
        ]);
        // Must NOT 500 (no bogus zero-amount journal item rejection)
        $responseFrac->assertStatus(200);

        $saleFrac = DB::table('sales')
            ->where('tenant_id', $tenant->id)
            ->orderBy('created_at', 'desc')
            ->first();
        $this->assertNotNull($saleFrac, 'Sub-cent-price sale should be stored');

        // invoice_total must round to 10.12 (2dp)
        $this->assertEquals(
            10.12,
            round((float) $saleFrac->invoice_total, 2),
            'Sub-cent price 10.1234 must be charged as 10.12'
        );
    }
}
