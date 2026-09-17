<?php

namespace Tests\Feature\Reckoner;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\Fixtures\ReckonerGoldenStoreFixture;
use Tests\TestCase;

/**
 * Gate 9: Data Capture Migrations & Subsystem Readiness Tests (§5.4, Phase 9).
 */
class DataCaptureMigrationsGateTest extends TestCase
{
    protected ?Tenant $tenant = null;
    protected ?User $user = null;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::where('slug', 'golden-store')->first();
        if (!$this->tenant) {
            $built = ReckonerGoldenStoreFixture::build(http: $this);
            $this->tenant = $built['tenant'];
            $this->user   = $built['user'];
        } else {
            $this->user = User::where('email', 'golden-owner@venqore.com')->first();
        }

        app()->instance('current.tenant', $this->tenant);
    }

    /**
     * 1. Verify all §5.4 tables exist in database schema.
     */
    public function test_phase9_tables_exist(): void
    {
        $expectedTables = [
            'register_shifts',
            'bank_statement_lines',
            'fixed_assets',
            'loans',
            'loan_installments',
            'report_definitions',
            'report_runs',
            'label_print_jobs',
            'parked_sales',
        ];

        foreach ($expectedTables as $table) {
            $this->assertTrue(Schema::hasTable($table), "Table '{$table}' must exist in schema.");
        }
    }

    /**
     * 2. Verify all §5.4 tracking columns exist across existing domain tables.
     */
    public function test_phase9_columns_exist(): void
    {
        $expectedColumns = [
            'sales'                => ['register_shift_id'],
            'sale_items'           => ['entry_method', 'sale_uom', 'sale_uom_qty'],
            'product_serials'      => ['sold_at', 'warranty_until', 'status_changed_at'],
            'payments'             => ['status', 'bounced_at'],
            'expenses'             => ['recurring_expense_id'],
            'purchase_orders'      => ['received_at', 'closed_at'],
            'stock_transfer_items' => ['received_quantity'],
            'sales_orders'         => ['fulfilled_at'],
            'proposals'            => ['decided_at'],
            'recurring_invoices'   => ['cancelled_at'],
            'parties'              => ['city'],
        ];

        foreach ($expectedColumns as $table => $cols) {
            foreach ($cols as $col) {
                $this->assertTrue(
                    Schema::hasColumn($table, $col),
                    "Column '{$table}.{$col}' must exist in schema."
                );
            }
        }
    }

    /**
     * 3. Verify Cash Register Shift data write and linkage to sales.
     */
    public function test_register_shift_write_and_linkage(): void
    {
        $tenantId = $this->tenant->id;

        $shiftId = DB::table('register_shifts')->insertGetId([
            'tenant_id'     => $tenantId,
            'register_id'   => 'REG-01',
            'opened_by'     => $this->user->id,
            'opened_at'     => '2026-08-05 09:00:00',
            'opening_float' => 5000.00,
            'closed_by'     => $this->user->id,
            'closed_at'     => '2026-08-05 18:00:00',
            'expected_cash' => 7700.00,
            'counted_cash'  => 7700.00,
            'variance'      => 0.00,
            'status'        => 'closed',
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        $this->assertGreaterThan(0, $shiftId);

        // Link existing sale to shift
        $sale = DB::table('sales')->where('tenant_id', $tenantId)->first();
        if ($sale) {
            DB::table('sales')->where('id', $sale->id)->update(['register_shift_id' => $shiftId]);
            $updatedSale = DB::table('sales')->where('id', $sale->id)->first();
            $this->assertEquals($shiftId, $updatedSale->register_shift_id);
        }
    }

    /**
     * 4. Verify Bank Statement Line data write.
     */
    public function test_bank_statement_line_write(): void
    {
        $tenantId = $this->tenant->id;

        $lineId = DB::table('bank_statement_lines')->insertGetId([
            'tenant_id'       => $tenantId,
            'bank_account_id' => 'BANK-01',
            'statement_date'  => '2026-08-10',
            'reference'       => 'CHK-9921',
            'amount'          => 5000.00,
            'type'            => 'debit',
            'status'          => 'reconciled',
            'matched_at'      => '2026-08-10 12:00:00',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        $this->assertGreaterThan(0, $lineId);
        $record = DB::table('bank_statement_lines')->where('id', $lineId)->first();
        $this->assertSame('reconciled', $record->status);
        $this->assertEquals(5000.00, (float) $record->amount);
    }

    /**
     * 5. Verify Fixed Asset, Loan, and Report Definition write paths.
     */
    public function test_assets_loans_reports_write(): void
    {
        $tenantId = $this->tenant->id;

        // Fixed Asset
        $assetId = DB::table('fixed_assets')->insertGetId([
            'tenant_id'                => $tenantId,
            'asset_number'             => 'AST-2026-001',
            'name'                     => 'Espresso Machine Pro',
            'category'                 => 'Machinery',
            'purchase_date'            => '2026-01-15',
            'purchase_cost'            => 120000.00,
            'salvage_value'            => 20000.00,
            'useful_life_months'       => 60,
            'depreciation_method'      => 'straight_line',
            'accumulated_depreciation' => 14000.00,
            'net_book_value'           => 106000.00,
            'warranty_until'           => '2028-01-15',
            'status'                   => 'active',
            'created_at'               => now(),
            'updated_at'               => now(),
        ]);
        $this->assertGreaterThan(0, $assetId);

        // Loan
        $loanId = DB::table('loans')->insertGetId([
            'tenant_id'           => $tenantId,
            'lender_name'         => 'National SME Bank',
            'loan_number'         => 'LN-88129',
            'principal_amount'    => 500000.00,
            'interest_rate'       => 11.5000,
            'term_months'         => 36,
            'start_date'          => '2026-01-01',
            'emi_amount'          => 16480.00,
            'outstanding_balance' => 420000.00,
            'status'              => 'active',
            'created_at'          => now(),
            'updated_at'          => now(),
        ]);
        $this->assertGreaterThan(0, $loanId);

        // Report Definition
        $repId = DB::table('report_definitions')->insertGetId([
            'tenant_id'    => $tenantId,
            'name'         => 'Monthly Cash Reconciled Summary',
            'type'         => 'financial',
            'query_params' => json_encode(['period' => 'monthly', 'currency' => 'PKR']),
            'is_scheduled' => true,
            'run_count'    => 12,
            'last_run_at'  => now(),
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);
        $this->assertGreaterThan(0, $repId);
    }
}
