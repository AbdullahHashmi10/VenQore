<?php

namespace Tests\Feature\Golden;

use Tests\Feature\VenQoreTestCase;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Tenant;
use App\Services\V3\AccountingService;

/**
 * ============================================================
 * InputVerificationTestCase — Base for Phase 3 tests
 * ============================================================
 *
 * DOCTRINE (Phase 3):
 *  Every business event is executed through the REAL HTTP endpoint
 *  (real V3 route, real middleware stack including TenantMiddleware)
 *  then the resulting journal entries are asserted for exact accuracy.
 *
 *  ARCHITECTURE:
 *   - Extends VenQoreTestCase which uses RefreshDatabase (MySQL).
 *   - Uses VenQoreTestCase::createTenant() + seedTenantDefaults() for a
 *     clean per-test tenant with full COA, warehouse, etc.
 *   - Uses VenQoreTestCase::actingAsTenantUser() for HTTP auth.
 *   - Uses VenQoreTestCase::storeUrl() to build V3 endpoint URLs.
 *   - Provides assertJournalLine(), assertJournalBalanced(), glBalance(),
 *     fifoInventoryValue() helpers specific to Phase 3 scenarios.
 *
 *  WHY NOT GOLDEN COMPANY:
 *   Golden Company is read-only reference data. Phase 3 WRITES events
 *   and needs zero-state before/after comparison.
 * ============================================================
 */
abstract class InputVerificationTestCase extends VenQoreTestCase
{
    protected Tenant $tenant;
    protected string $warehouseId;
    protected string $defaultCashAccountCode  = '1000';
    protected string $defaultBankAccountCode  = '1010';
    protected float  $TOLERANCE = 0.02;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2025-06-15 12:00:00');

        // Create default system user with ID 1 for foreign key constraint safety
        if (!\App\Models\User::where('id', 1)->exists()) {
            \App\Models\User::factory()->create(['id' => 1]);
        }

        $this->tenant = $this->createTenant(plan: 'growth', status: 'active');
        $this->seedTenantDefaults($this->tenant);

        // Ensure Opening Balance Equity account
        $this->upsertAccount('7000', 'Opening Balance Equity', 'equity', 'credit');

        $this->warehouseId = $this->ensureDefaultWarehouse();

        // Bind tenant context for service-layer calls (supplements HTTP middleware binding)
        app()->instance('current.tenant', $this->tenant);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow(null);
        parent::tearDown(); // VenQoreTestCase::tearDown forgets current.tenant
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SETUP UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    private function ensureDefaultWarehouse(): string
    {
        $existing = DB::table('warehouses')
            ->where('tenant_id', $this->tenant->id)
            ->where('is_default', true)
            ->value('id');

        if ($existing) return $existing;

        $id = Str::uuid()->toString();
        DB::table('warehouses')->insert([
            'id'         => $id,
            'tenant_id'  => $this->tenant->id,
            'name'       => 'Main Warehouse',
            'is_default' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return $id;
    }

    private function upsertAccount(string $code, string $name, string $type, string $normal): string
    {
        $id = DB::table('accounts')
            ->where('tenant_id', $this->tenant->id)
            ->where('code', $code)
            ->value('id');
        if ($id) return $id;

        $id = Str::uuid()->toString();
        DB::table('accounts')->insert([
            'id'             => $id,
            'tenant_id'      => $this->tenant->id,
            'code'           => $code,
            'name'           => $name,
            'type'           => $type,
            'normal_balance' => $normal,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);
        return $id;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PARTY & PRODUCT FACTORIES
    // ─────────────────────────────────────────────────────────────────────────

    protected function createCustomer(string $name = 'Test Customer', float $creditLimit = 500000): string
    {
        $id = Str::uuid()->toString();
        DB::table('parties')->insert([
            'id'           => $id,
            'tenant_id'    => $this->tenant->id,
            'name'         => $name,
            'type'         => 'customer',
            'credit_limit' => $creditLimit,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);
        return $id;
    }

    protected function createVendor(string $name = 'Test Vendor'): string
    {
        $id = Str::uuid()->toString();
        DB::table('parties')->insert([
            'id'         => $id,
            'tenant_id'  => $this->tenant->id,
            'name'       => $name,
            'type'       => 'vendor',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return $id;
    }

    /**
     * Creates a product with a pre-existing FIFO inventory batch (opening stock).
     * Returns [$productId, $batchId].
     */
    protected function createProductWithStock(
        string  $name       = 'Test Product',
        float   $qty        = 10,
        float   $unitCost   = 1000.00,
        float   $sellPrice  = 1500.00,
        float   $taxRate    = 17,
        ?string $warehouseId = null
    ): array {
        $wh        = $warehouseId ?? $this->warehouseId;
        $productId = Str::uuid()->toString();
        $batchId   = Str::uuid()->toString();

        DB::table('products')->insert(['base_unit' => 'pcs', 
            'id'              => $productId,
            'tenant_id'       => $this->tenant->id,
            'name'            => $name,
            'sku'             => 'TST-' . substr($productId, 0, 8),
            'price'   => $sellPrice,
            'cost_price'      => $unitCost,
            'tax_rate'        => $taxRate,
            'created_at'      => now()->subDay(),
            'updated_at'      => now()->subDay(),
        ]);

        DB::table('inventory_batches')->insert([
            'id'                  => $batchId,
            'tenant_id'           => $this->tenant->id,
            'product_id'          => $productId,
            'warehouse_id'        => $wh,
            'batch_type'          => 'opening',
            'original_qty'        => $qty,
            'initial_qty'         => $qty,
            'remaining_qty'       => $qty,
            'unit_cost'           => $unitCost,
            'purchase_invoice_id' => 'opening-' . substr($productId, 0, 8),
            'created_at'          => now()->subDay(), // oldest → consumed first in FIFO
            'updated_at'          => now()->subDay(),
        ]);

        // Book the inventory to GL 1100 via opening balance journal entry
        $accounting = app(AccountingService::class);
        $accounting->createEntry([
            'date'           => now()->subDay()->format('Y-m-d'),
            'reference_type' => 'opening_balance',
            'reference'      => 'opening-' . $productId,
            'description'    => "Opening stock: {$name}",
        ], [
            ['account_code' => '1100', 'debit'  => $qty * $unitCost, 'credit' => 0],
            ['account_code' => '7000', 'debit'  => 0, 'credit' => $qty * $unitCost],
        ]);

        return [$productId, $batchId];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HTTP HELPERS (use real V3 routes, real TenantMiddleware)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * POST to a V3 route through the full middleware stack.
     * Route: POST s/{store_slug}/v3/{path}
     */
    protected function v3Post(string $path, array $data = []): \Illuminate\Testing\TestResponse
    {
        $response = $this->actingAsTenantUser($this->tenant, 'owner')
            ->postJson($this->storeUrl($this->tenant, "v3/{$path}"), $data);

        if ($response->getStatusCode() === 302) {
            return new \Illuminate\Testing\TestResponse(
                response('Success Redirect', 200)
            );
        }

        return $response;
    }

    /**
     * GET a V3 route through the full middleware stack.
     */
    protected function v3Get(string $path, array $params = []): \Illuminate\Testing\TestResponse
    {
        $url = $this->storeUrl($this->tenant, "v3/{$path}");
        if ($params) $url .= '?' . http_build_query($params);
        return $this->actingAsTenantUser($this->tenant, 'owner')
            ->getJson($url);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // JOURNAL ASSERTION HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get all NON-reversed journal items for a given reference type.
     * Returns a Collection of rows with (code, name, debit, credit, entry_id).
     */
    protected function getJournalLines(string $referenceType, ?string $referenceId = null): \Illuminate\Support\Collection
    {
        $query = DB::table('journal_entries as je')
            ->join('journal_items as ji', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('je.tenant_id', $this->tenant->id)
            ->where('je.reference_type', $referenceType)
            ->where('je.is_reversed', false);

        if ($referenceId) {
            $query->where('je.reference', $referenceId);
        }

        return $query
            ->orderBy('je.created_at', 'desc')
            ->select('a.code', 'a.name', 'ji.debit', 'ji.credit', 'ji.party_id', 'je.id as entry_id', 'je.reference')
            ->get();
    }

    /**
     * Asserts that a given GL account code has a line with the given side and amount.
     */
    protected function assertJournalLine(
        \Illuminate\Support\Collection $lines,
        string $accountCode,
        string $side,           // 'debit' or 'credit'
        float  $expectedAmount,
        string $message = ''
    ): void {
        $matching = $lines->filter(fn($l) =>
            $l->code === $accountCode &&
            abs((float)$l->$side - $expectedAmount) <= $this->TOLERANCE
        );

        $label = $message ?: "GL {$accountCode} {$side} Rs." . number_format($expectedAmount, 2);
        $this->assertNotEmpty(
            $matching->toArray(),
            "{$label} — not found in journal lines:\n" .
            $lines->map(fn($l) => sprintf(
                '  GL %s (%s) DR=%.2f CR=%.2f',
                $l->code, $l->name ?? '?', (float)$l->debit, (float)$l->credit
            ))->join("\n")
        );
    }

    /**
     * Asserts that the journal entry is balanced (Σ DR = Σ CR).
     */
    protected function assertJournalBalanced(\Illuminate\Support\Collection $lines, string $context = ''): void
    {
        $dr = round($lines->sum(fn($l) => (float)$l->debit), 2);
        $cr = round($lines->sum(fn($l) => (float)$l->credit), 2);
        $this->assertEqualsWithDelta($dr, $cr, $this->TOLERANCE,
            "Journal not balanced{$context}: Σ DR={$dr} ≠ Σ CR={$cr}"
        );
    }

    /**
     * Asserts the 3 core ledger invariants still hold for this tenant.
     */
    protected function assertLedgerInvariantsHold(string $context = ''): void
    {
        // 1. Every journal entry must balance
        $unbalanced = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->where('ji.tenant_id', $this->tenant->id)
            ->groupBy('ji.journal_entry_id')
            ->havingRaw('ABS(SUM(ji.debit) - SUM(ji.credit)) > 0.01')
            ->select('ji.journal_entry_id')
            ->get()
            ->count();
        $this->assertEquals(0, $unbalanced,
            "Ledger invariant broken{$context}: {$unbalanced} unbalanced entries after event"
        );

        // 2. GL 1100 = FIFO inventory value
        $gl1100 = $this->glBalance('1100');
        $fifo   = $this->fifoInventoryValue();
        $this->assertEqualsWithDelta($gl1100, $fifo, $this->TOLERANCE,
            "Inventory three-way tie broken{$context}: GL 1100={$gl1100}, FIFO={$fifo}"
        );

        // 3. No journal item with both DR and CR > 0
        $dual = DB::table('journal_items')
            ->where('tenant_id', $this->tenant->id)
            ->whereRaw('debit > 0 AND credit > 0')
            ->count();
        $this->assertEquals(0, $dual,
            "Dual-sided journal item detected{$context}: {$dual} item(s) have both debit AND credit > 0"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FINANCIAL HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Current GL balance for this tenant's account code.
     * Respects the account's normal_balance ('debit' or 'credit').
     */
    protected function glBalance(string $code): float
    {
        $row = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.tenant_id', $this->tenant->id)
            ->where('a.code', $code)
            ->where('je.is_reversed', false)
            ->selectRaw('SUM(ji.debit) as dr, SUM(ji.credit) as cr')
            ->first();

        $normal = DB::table('accounts')
            ->where('tenant_id', $this->tenant->id)
            ->where('code', $code)
            ->value('normal_balance');

        $dr = (float)($row->dr ?? 0);
        $cr = (float)($row->cr ?? 0);
        return round($normal === 'credit' ? $cr - $dr : $dr - $cr, 2);
    }

    /**
     * Current FIFO inventory value = Σ(remaining_qty × unit_cost).
     */
    protected function fifoInventoryValue(): float
    {
        return round((float)(DB::table('inventory_batches')
            ->where('tenant_id', $this->tenant->id)
            ->whereNull('deleted_at')
            ->whereRaw('remaining_qty > 0')
            ->selectRaw('SUM(remaining_qty * unit_cost) as val')
            ->value('val') ?? 0), 2);
    }

    /**
     * Remaining qty for a specific batch.
     */
    protected function batchRemaining(string $batchId): float
    {
        return (float)(DB::table('inventory_batches')
            ->where('id', $batchId)
            ->value('remaining_qty') ?? 0);
    }

    /**
     * Count of journal entries for this tenant (optional filter by reference_type).
     */
    protected function journalEntryCount(?string $referenceType = null): int
    {
        $q = DB::table('journal_entries')->where('tenant_id', $this->tenant->id);
        if ($referenceType) $q->where('reference_type', $referenceType);
        return $q->count();
    }
}
