<?php

namespace Tests\Feature\V3\Scenarios;

use Tests\TestCase;
use App\Services\V3\TaxService;
use App\Services\V3\UomService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TaxAndUomServiceTest extends TestCase
{
    use RefreshDatabase;

    private TaxService $tax;
    private UomService $uom;
    private string     $productId;

    protected function setUp(): void
    {
        parent::setUp();
        
        $user = \App\Models\User::factory()->create();
        $this->actingAs($user);

        $this->tax = app(TaxService::class);
        $this->uom = app(UomService::class);

        $this->seedAccounts();
        $this->productId = $this->seedProduct();
    }

    // ═══════════════════════════════════════════════════════════════════
    // TAX SERVICE TESTS
    // ═══════════════════════════════════════════════════════════════════

    // ─── TEST 1: Tax-exclusive — price does not include tax ───────────
    /** @test */
    public function it_calculates_tax_exclusive_correctly()
    {
        // Price is Rs.1000, tax rate 17% — tax is ON TOP of price
        $result = $this->tax->calculateLineTax(
            amount:          1000.00,
            taxRate:         17.00,
            priceIncludesTax: false
        );

        $this->assertEquals(1000.00, $result['net']);
        $this->assertEquals(170.00, $result['tax']);
        $this->assertEquals(1170.00, $result['gross']);
    }

    // ─── TEST 2: Tax-inclusive — price already includes tax ──────────
    /** @test */
    public function it_calculates_tax_inclusive_correctly()
    {
        // Price is Rs.1170 inclusive of 17% tax
        // Net = 1170 / 1.17 = 1000, Tax = 170
        $result = $this->tax->calculateLineTax(
            amount:          1170.00,
            taxRate:         17.00,
            priceIncludesTax: true
        );

        $this->assertEquals(1000.00, round($result['net'],  2));
        $this->assertEquals(170.00,  round($result['tax'],  2));
        $this->assertEquals(1170.00, round($result['gross'], 2));
    }

    // ─── TEST 3: Zero tax rate returns correct structure ─────────────
    /** @test */
    public function it_handles_zero_tax_rate()
    {
        $result = $this->tax->calculateLineTax(
            amount:          500.00,
            taxRate:         0.00,
            priceIncludesTax: false
        );

        $this->assertEquals(500.00, $result['net']);
        $this->assertEquals(0.00,   $result['tax']);
        $this->assertEquals(500.00, $result['gross']);
    }

    // ─── TEST 4: Tax report returns account 2200 vs 2300 breakdown ───
    /** @test */
    public function it_returns_tax_report_with_2200_and_2300_breakdown()
    {
        // Seed accounts 2200 and 2300
        $this->seedAccount('2200', 'Sales Tax Payable',      'liability', 'credit');
        $this->seedAccount('2300', 'Input Tax Recoverable',  'asset',     'debit');

        // Post a fake sales tax entry
        DB::table('journal_entries')->insert([
            'id'             => Str::uuid()->toString(),
            'date'           => now()->toDateString(),
            'reference_type' => 'sale',
            'reference'      => Str::uuid()->toString(),
            'description'    => 'Tax test entry',
            'is_reversed'    => 0,
            'user_id'        => auth()->id(),
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        $je2 = Str::uuid()->toString();
        DB::table('journal_entries')->insert([
            'id'             => $je2,
            'date'           => now()->toDateString(),
            'reference_type' => 'sale',
            'reference'      => Str::uuid()->toString(),
            'description'    => 'Tax test JE',
            'is_reversed'    => 0,
            'user_id'        => auth()->id(),
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        $account2200 = DB::table('accounts')->where('code', '2200')->first();
        $account2300 = DB::table('accounts')->where('code', '2300')->first();

        DB::table('journal_items')->insert([
            [
                'id'               => Str::uuid()->toString(),
                'journal_entry_id' => $je2,
                'account_id'       => $account2200->id,
                'debit'            => 0,
                'credit'           => 500.00,
                'created_at'       => now(),
            ],
            [
                'id'               => Str::uuid()->toString(),
                'journal_entry_id' => $je2,
                'account_id'       => $account2300->id,
                'debit'            => 200.00,
                'credit'           => 0,
                'created_at'       => now(),
            ],
        ]);

        $report = $this->tax->taxReport(
            now()->startOfMonth(),
            now()->endOfMonth()
        );

        $this->assertArrayHasKey('sales_tax_collected',   $report); // 2200
        $this->assertArrayHasKey('input_tax_recoverable', $report); // 2300
        $this->assertArrayHasKey('net_tax_payable',        $report);

        $this->assertEquals(500.00, $report['sales_tax_collected']);
        $this->assertEquals(200.00, $report['input_tax_recoverable']);
        $this->assertEquals(300.00, $report['net_tax_payable']); // 500 - 200
    }

    // ─── TEST 5: Advance receipts carry zero tax (S-048) ─────────────
    /** @test */
    public function advance_receipt_produces_zero_tax()
    {
        // S-048: Tax on advance is Rs.0 — only posted at delivery
        $result = $this->tax->calculateLineTax(
            amount:          5000.00,
            taxRate:         17.00,
            priceIncludesTax: false,
            isAdvanceReceipt: true   // flag that suppresses tax
        );

        $this->assertEquals(5000.00, $result['net']);
        $this->assertEquals(0.00,    $result['tax']);   // zero — S-048
        $this->assertEquals(5000.00, $result['gross']);
    }

    // ═══════════════════════════════════════════════════════════════════
    // UOM SERVICE TESTS
    // ═══════════════════════════════════════════════════════════════════

    // ─── TEST 6: Converts grams to KG correctly (S-012) ──────────────
    /** @test */
    public function it_converts_grams_to_kg_correctly()
    {
        // 1 KG = 1000 GRAMS — conversion_factor = 1000
        // base_qty = sale_qty / conversion_factor = 500 / 1000 = 0.5
        $this->seedConversion($this->productId, 'GRAMS', 1000.0);

        $baseQty = $this->uom->toBaseQty($this->productId, 500.0, 'GRAMS');

        $this->assertEquals(0.5, $baseQty);
    }

    // ─── TEST 7: Returns 1.0 when sale UOM equals base UOM ───────────
    /** @test */
    public function it_returns_same_qty_when_uom_matches_base()
    {
        // No conversion needed — sale UOM is the base UOM
        $baseQty = $this->uom->toBaseQty($this->productId, 10.0, 'KG');

        // Product base_unit is 'KG' — no conversion row exists — returns qty as-is
        $this->assertEquals(10.0, $baseQty);
    }

    // ─── TEST 8: Throws when unknown UOM requested ───────────────────
    /** @test */
    public function it_throws_for_unknown_uom()
    {
        $this->expectException(\App\Exceptions\UomConversionException::class);

        // 'BOXES' has no conversion defined for this product
        $this->uom->toBaseQty($this->productId, 5.0, 'BOXES');
    }

    // ─── TEST 9: getConversionFactor returns correct factor ──────────
    /** @test */
    public function it_returns_the_correct_conversion_factor()
    {
        $this->seedConversion($this->productId, 'ML', 1000.0);

        $factor = $this->uom->getConversionFactor($this->productId, 'ML');

        $this->assertEquals(1000.0, $factor);
    }

    // ─── TEST 10: Fractional conversion rounds to 4 decimal places ───
    /** @test */
    public function it_handles_fractional_conversions_correctly()
    {
        // 1 TOLA = 11.6638 grams — factor = 11.6638
        $this->seedConversion($this->productId, 'TOLA', 11.6638);

        // Sell 3 TOLA → base_qty = 3 / 11.6638 = 0.2572 KG
        $baseQty = $this->uom->toBaseQty($this->productId, 3.0, 'TOLA');

        $this->assertEquals(0.2572, round($baseQty, 4));
    }

    // ═══════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════

    private function seedAccounts(): void
    {
        $accounts = [
            ['1000', 'Cash in Hand',          'asset',     'debit'],
            ['1100', 'Inventory Asset',        'asset',     'debit'],
            ['4000', 'Sales Revenue',          'income',    'credit'],
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

    private function seedAccount(
        string $code, string $name, string $type, string $normalBalance
    ): void {
        if (!DB::table('accounts')->where('code', $code)->exists()) {
            DB::table('accounts')->insert([
                'id'             => Str::uuid()->toString(),
                'code'           => $code,
                'name'           => $name,
                'type'           => $type,
                'normal_balance' => $normalBalance,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        }
    }

    private function seedProduct(): string
    {
        $id = Str::uuid()->toString();
        DB::table('products')->insert([
            'id'         => $id,
            'name'       => 'Rice',
            'sku'        => 'RICE-' . Str::random(5),
            'base_unit'  => 'KG',
            'price'      => 100,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return $id;
    }

    private function seedConversion(
        string $productId, string $saleUom, float $factor
    ): void {
        DB::table('product_uom_conversions')->insertOrIgnore([
            'id'                => Str::uuid()->toString(),
            'product_id'        => $productId,
            'sale_uom'          => $saleUom,
            'conversion_factor' => $factor,
            'created_at'        => now(),
            'updated_at'        => now(),
        ]);
    }
}
