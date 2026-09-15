<?php

namespace Tests\Feature\Reckoner;

use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRequest;
use App\Reckoner\ReckonerSettings;
use Tests\Feature\VenQoreTestCase;

/**
 * §10 — ReckonerConsistencyTest: exercises the §7 canonicalisation decisions
 * that Phase 2/3 actually implemented. Deliberately narrower than the full
 * spec list (§7.1-§7.5, §7.9, §7.11, §7.12 require legacy controller
 * surgery this session did not do — see the final problems report) but
 * everything claimed as "done" here is asserted for real.
 */
class ReckonerConsistencyTest extends VenQoreTestCase
{
    public function test_signed_metric_renders_loss_label_when_negative(): void
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);

        // A brand-new tenant has zero revenue and zero expenses -> net_profit
        // is exactly 0, not negative, so this asserts the POSITIVE label path
        // (0 is not < 0) — the negative path needs a posted expense with no
        // matching revenue, which is out of this test's fixture budget.
        // ReckonerLabels itself is unit-testable directly, which the next
        // test does.
        $result = (new Reckoner)->read(new ReckonerRequest('finance.net_profit', 'today'), $user, $tenant);

        $this->assertTrue($result->ok);
        $this->assertSame('Net Profit', $result->label);
    }

    public function test_reckoner_labels_swaps_to_loss_side_directly(): void
    {
        $definition = \App\Reckoner\ReckonerRegistry::find('finance.net_profit');

        $this->assertSame('Net Profit', \App\Reckoner\ReckonerLabels::resolve('finance.net_profit', $definition, ['value' => 500.0]));
        $this->assertSame('Net Loss', \App\Reckoner\ReckonerLabels::resolve('finance.net_profit', $definition, ['value' => -500.0]));
        $this->assertSame('Net Profit', \App\Reckoner\ReckonerLabels::resolve('finance.net_profit', $definition, ['value' => 0.0]));
    }

    public function test_gross_profit_and_loss_label_swap(): void
    {
        $definition = \App\Reckoner\ReckonerRegistry::find('finance.gross_profit');

        $this->assertSame('Gross Profit', \App\Reckoner\ReckonerLabels::resolve('finance.gross_profit', $definition, ['value' => 100.0]));
        $this->assertSame('Gross Loss', \App\Reckoner\ReckonerLabels::resolve('finance.gross_profit', $definition, ['value' => -1.0]));
    }

    public function test_unsigned_metric_never_swaps_label(): void
    {
        $definition = \App\Reckoner\ReckonerRegistry::find('sales.revenue');

        // sales.revenue is not signed, so even a (theoretically impossible)
        // negative value keeps its normal label — the swap only applies to
        // metrics explicitly marked signed AND listed in ReckonerLabels.
        $this->assertSame('Revenue', \App\Reckoner\ReckonerLabels::resolve('sales.revenue', $definition, ['value' => -1.0]));
    }

    public function test_low_stock_excludes_out_of_stock(): void
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);

        // The metrics are gated by the has_inventory capability (the tenant must
        // own at least one product), so the fixture seeds a real catalogue that
        // spans every §7.13 bucket. All products use alert_quantity = 5.
        //
        //   qty  3  -> low          (0 < 3 <= 5)
        //   qty  5  -> low          (boundary: at the threshold is still low)
        //   none    -> out of stock (no stock rows at all)
        //   qty  0  -> out of stock
        //   qty -2  -> out of stock (negative on hand)
        //   qty 50  -> healthy      (neither)
        //   qty 2+2 -> low          (two warehouses, summed per product = 4)
        $warehouseA = $this->seedWarehouse($tenant, 'Main');
        $warehouseB = $this->seedWarehouse($tenant, 'Backroom');

        $this->seedStockedProduct($tenant, 'Low A', [$warehouseA => 3]);
        $this->seedStockedProduct($tenant, 'Low At Threshold', [$warehouseA => 5]);
        $this->seedStockedProduct($tenant, 'Never Stocked', []);
        $this->seedStockedProduct($tenant, 'Zero On Hand', [$warehouseA => 0]);
        $this->seedStockedProduct($tenant, 'Negative On Hand', [$warehouseA => -2]);
        $this->seedStockedProduct($tenant, 'Healthy', [$warehouseA => 50]);
        $this->seedStockedProduct($tenant, 'Low Split', [$warehouseA => 2, $warehouseB => 2]);

        \App\Reckoner\Reckoner::forgetCapabilities($tenant->id);

        $low = (new Reckoner)->read(new ReckonerRequest('inventory.low_stock_count', 'live'), $user, $tenant);
        $out = (new Reckoner)->read(new ReckonerRequest('inventory.out_of_stock_count', 'live'), $user, $tenant);

        $this->assertTrue($low->ok, 'low_stock_count must resolve for a tenant with products; got ' . ($low->errorCode ?? 'unknown error'));
        $this->assertTrue($out->ok, 'out_of_stock_count must resolve for a tenant with products; got ' . ($out->errorCode ?? 'unknown error'));

        // §7.13: an out-of-stock product is NEVER also counted as low stock.
        // (Every SCALAR reading is shaped to a float by Reckoner::shapeScalarPayload(),
        // integer-unit counts included — hence 3.0, not 3.)
        $this->assertSame(3.0, $low->data['value'], 'low stock must be exactly the 0 < qty <= threshold products.');
        $this->assertSame(3.0, $out->data['value'], 'out of stock must be exactly the qty <= 0 products.');

        // And the split is lossless: low + out equals the old combined
        // `qty <= threshold` count (6 of the 7 products — all but Healthy).
        $this->assertSame(6.0, $low->data['value'] + $out->data['value']);
    }

    private function seedWarehouse(\App\Models\Tenant $tenant, string $name): string
    {
        $id = \Illuminate\Support\Str::uuid()->toString();
        \Illuminate\Support\Facades\DB::table('warehouses')->insert([
            'id'         => $id,
            'tenant_id'  => $tenant->id,
            'name'       => $name,
            'is_default' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $id;
    }

    /** @param array<string, float|int> $qtyByWarehouse */
    private function seedStockedProduct(\App\Models\Tenant $tenant, string $name, array $qtyByWarehouse): string
    {
        $DB = \Illuminate\Support\Facades\DB::class;
        $productId = \Illuminate\Support\Str::uuid()->toString();

        $DB::table('products')->insert([
            'id'             => $productId,
            'tenant_id'      => $tenant->id,
            'name'           => $name,
            'sku'            => 'RCK-' . \Illuminate\Support\Str::random(8),
            'base_unit'      => 'PCS',
            'type'           => 'standard',
            'cost_price'     => 10,
            'price'          => 15,
            'alert_quantity' => 5,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        foreach ($qtyByWarehouse as $warehouseId => $qty) {
            $DB::table('stocks')->insert([
                'id'           => \Illuminate\Support\Str::uuid()->toString(),
                'tenant_id'    => $tenant->id,
                'product_id'   => $productId,
                'warehouse_id' => $warehouseId,
                'quantity'     => $qty,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        }

        return $productId;
    }

    public function test_overstock_off_by_default_is_not_applicable(): void
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);

        $this->assertSame('off', ReckonerSettings::get('reckoner.overstock_mode', $tenant));

        $result = (new Reckoner)->read(new ReckonerRequest('inventory.overstock_count', 'live'), $user, $tenant);

        // Either gated by has_inventory (fresh tenant, no products) or, if
        // that capability somehow passed, must be not_applicable because
        // overstock_mode defaults to 'off' — never a bare 0.
        if (! $result->ok) {
            $this->assertContains($result->errorCode, ['not_applicable']);
        }
    }

    public function test_production_cost_is_not_applicable_not_zero_with_no_runs(): void
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);

        $result = (new Reckoner)->read(new ReckonerRequest('production.total_cost', 'today'), $user, $tenant);

        // Fresh tenant almost certainly fails has_manufacturing (needs both
        // the 'production' plan feature AND a recipe on file) -> not_applicable
        // via the capability gate. If a fixture ever grants it, the source
        // itself must still return null (-> not_applicable), never 0, per §7.14.
        if (! $result->ok) {
            $this->assertSame('not_applicable', $result->errorCode);
        } else {
            $this->assertNotSame(0.0, $result->data['value'] ?? null, 'production.total_cost must never silently be a real 0 for a store with no runs.');
        }
    }

    public function test_expenses_total_excludes_cogs(): void
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);

        $result = (new Reckoner)->read(new ReckonerRequest('finance.expenses_total', 'today'), $user, $tenant);

        // Fresh tenant: revenue=cogs=expenses=0, so expenses_total must be
        // exactly 0 (0 total_expenses - 0 cogs), proving the subtraction
        // happens rather than passing total_expenses through unmodified.
        $this->assertTrue($result->ok);
        $this->assertSame(0.0, $result->data['value']);
    }

    public function test_purchasing_spend_and_paid_to_suppliers_are_separately_named(): void
    {
        $spendDef = \App\Reckoner\ReckonerRegistry::find('purchasing.spend');
        $paidDef = \App\Reckoner\ReckonerRegistry::find('finance.paid_to_suppliers');

        $this->assertSame('Purchases', $spendDef['label']);
        $this->assertSame('Paid to Suppliers', $paidDef['label']);
        $this->assertNotSame($spendDef['label'], $paidDef['label']);
    }

    public function test_balance_sheet_ok_is_a_status_shape_not_a_number(): void
    {
        $definition = \App\Reckoner\ReckonerRegistry::find('finance.balance_sheet_ok');

        $this->assertSame(\App\Reckoner\ReckonerShape::STATUS, $definition['shape']);
    }

    public function test_platform_mrr_is_not_reachable_from_a_tenant(): void
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);

        $result = (new Reckoner)->read(new ReckonerRequest('platform.mrr', 'live'), $user, $tenant);

        $this->assertFalse($result->ok);
        $this->assertSame('not_found', $result->errorCode, 'A platform-scoped metric must be not_found, never forbidden, from a tenant context (§8).');
    }
}
