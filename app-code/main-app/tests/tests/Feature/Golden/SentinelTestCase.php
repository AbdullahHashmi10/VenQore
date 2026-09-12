<?php

namespace Tests\Feature\Golden;

use Tests\Feature\VenQoreTestCase;
use App\Models\Tenant;
use App\Models\Party;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

abstract class SentinelTestCase extends VenQoreTestCase
{
    protected const SENTINEL_TENANT_ID = '999991';
    protected const BYPASSED_AMOUNT = 9999.00;

    protected Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Find the Golden Company tenant
        $this->tenant = Tenant::find(self::SENTINEL_TENANT_ID);
        if (!$this->tenant) {
            // Fallback or create if seeder hasn't run
            $this->tenant = Tenant::first() ?? $this->createTenant('golden-company', 'ltd_3');
        }

        $this->bindTenantContext($this->tenant);
    }

    /**
     * Seed a bypassed transaction directly into raw tables.
     * We seed a Sale, a Purchase, and an Expense with the bypassed amount (9999.00),
     * but we do NOT write any journal entries.
     */
    protected function seedBypassedTransactions(): void
    {
        $warehouseId = DB::table('warehouses')
            ->where('tenant_id', $this->tenant->id)
            ->value('id');

        $customer = Party::where('tenant_id', $this->tenant->id)
            ->where('type', 'customer')
            ->first() ?? Party::factory()->customer()->create(['tenant_id' => $this->tenant->id]);

        $supplier = Party::where('tenant_id', $this->tenant->id)
            ->where('type', 'supplier')
            ->first() ?? Party::factory()->supplier()->create(['tenant_id' => $this->tenant->id]);

        // 1. Raw Bypassed Sale (Bypasses Ledger)
        $saleId = \Illuminate\Support\Str::uuid()->toString();
        DB::table('sales')->insert([
            'id' => $saleId,
            'tenant_id' => $this->tenant->id,
            'user_id' => 1,
            'reference_number' => 'SAL-BYPASS-9999',
            'party_id' => $customer->id,
            'warehouse_id' => $warehouseId,
            'subtotal' => self::BYPASSED_AMOUNT,
            'tax' => 0.00,
            'discount' => 0.00,
            'total' => self::BYPASSED_AMOUNT,
            'net_sales' => self::BYPASSED_AMOUNT,
            'status' => 'posted',
            'posted_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $productId = DB::table('products')
            ->where('tenant_id', $this->tenant->id)
            ->value('id');

        // Insert item to trigger raw sum joins if any controller uses them
        DB::table('sale_items')->insert([
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'sale_id' => $saleId,
            'product_id' => $productId,
            'quantity' => 1,
            'unit_price' => self::BYPASSED_AMOUNT,
            'subtotal' => self::BYPASSED_AMOUNT,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Raw Bypassed Purchase (Bypasses Ledger)
        $purchaseId = \Illuminate\Support\Str::uuid()->toString();
        DB::table('purchases')->insert([
            'id' => $purchaseId,
            'tenant_id' => $this->tenant->id,
            'user_id' => 1,
            'invoice_number' => 'PUR-BYPASS-9999',
            'party_id' => $supplier->id,
            'warehouse_id' => $warehouseId,
            'subtotal' => self::BYPASSED_AMOUNT,
            'tax' => 0.00,
            'total' => self::BYPASSED_AMOUNT,
            'purchase_date' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3. Raw Bypassed Expense (Bypasses Ledger)
        DB::table('expenses')->insert([
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $this->tenant->id,
            'category' => 'Rent',
            'amount' => self::BYPASSED_AMOUNT,
            'date' => now()->toDateString(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Resolve the route URL dynamically using parameters.
     */
    protected function resolveRouteUrl(string $routeName): ?string
    {
        if (!Route::has($routeName)) {
            return null;
        }

        $params = ['store_slug' => $this->tenant->slug];

        // Resolve common placeholders if any
        if (str_contains($routeName, 'party-ledger')) {
            $party = Party::where('tenant_id', $this->tenant->id)->first();
            if ($party) {
                $params['partyId'] = $party->id;
            }
        }

        if (str_contains($routeName, 'statement') || str_contains($routeName, 'customers.show') || str_contains($routeName, 'suppliers.show')) {
            $party = Party::where('tenant_id', $this->tenant->id)->first();
            if ($party) {
                $params['id'] = $party->id;
            }
        }

        if (str_contains($routeName, 'export')) {
            $params['type'] = 'pdf';
        }

        if (str_contains($routeName, 'sales.show') || $routeName === 'store.sales.show') {
            $sale = Sale::where('tenant_id', $this->tenant->id)->first();
            if ($sale) {
                $params['id'] = $sale->id;
            }
        }

        try {
            return route($routeName, $params);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Recursively scan an array or object payload for a target value.
     */
    protected function scanPayload(mixed $data, mixed $target): bool
    {
        if (is_numeric($data) && (float)$data === (float)$target) {
            return true;
        }

        if (is_string($data) && (str_contains($data, (string)$target) || str_contains($data, number_format((float)$target)))) {
            return true;
        }

        if (is_array($data) || is_object($data)) {
            foreach ($data as $value) {
                if ($this->scanPayload($value, $target)) {
                    return true;
                }
            }
        }

        return false;
    }
}
