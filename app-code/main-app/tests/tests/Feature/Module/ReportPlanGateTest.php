<?php

namespace Tests\Feature\Module;

use App\Models\Sale;
use App\Models\JournalEntry;
use App\Services\ModuleService;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

class ReportPlanGateTest extends VenQoreTestCase
{
    #[Test]
    public function analytical_reports_require_plan_upgrade_on_solo_even_with_reports_module_enabled(): void
    {
        $tenant = $this->createTenant(plan: 'solo', status: 'active');
        $this->actingAsTenantUser($tenant, 'owner');

        // Explicitly enable reports & accounting workspace module
        ModuleService::enable($tenant, 'reports');
        ModuleService::enable($tenant, 'accounting_workspace');

        $response = $this->getJson("/s/{$tenant->slug}/reports/profit-loss");

        $response->assertStatus(403);
        $response->assertJsonPath('code', 'plan_upgrade_required');
        $response->assertJsonPath('action', 'upgrade');
        $response->assertJsonPath('upgrade', true);

        // REGRESSION GUARD: Must NEVER be 'add_module' (which sends user to builder dead end)
        $this->assertNotSame('add_module', $response->json('action'));
    }

    #[Test]
    public function operational_reports_remain_free_and_accessible_on_solo(): void
    {
        $tenant = $this->createTenant(plan: 'solo', status: 'active');
        $this->actingAsTenantUser($tenant, 'owner');

        ModuleService::enable($tenant, 'reports');
        ModuleService::enable($tenant, 'inventory');
        ModuleService::enable($tenant, 'khata_credit');

        // Operational reports return 200
        $this->get("/s/{$tenant->slug}/reports/day-book")->assertStatus(200);
        $this->get("/s/{$tenant->slug}/reports/low-stock")->assertStatus(200);
        $this->get("/s/{$tenant->slug}/reports/party-statement")->assertStatus(200);
        $this->get("/s/{$tenant->slug}/v3/reports/aged-receivables")->assertStatus(200);
    }

    #[Test]
    public function core_plan_tenant_can_access_analytical_reports(): void
    {
        $tenant = $this->createTenant(plan: 'core', status: 'active');
        $this->actingAsTenantUser($tenant, 'owner');

        ModuleService::enable($tenant, 'reports');
        ModuleService::enable($tenant, 'accounting_workspace');

        $response = $this->get("/s/{$tenant->slug}/reports/profit-loss");
        $response->assertStatus(200);
    }

    #[Test]
    public function double_entry_ledger_records_on_solo_even_when_profit_loss_report_is_blocked(): void
    {
        $tenant = $this->createTenant(plan: 'solo', status: 'active');
        $user = $this->actingAsTenantUser($tenant, 'owner');

        ModuleService::enable($tenant, 'pos');
        ModuleService::enable($tenant, 'reports');

        // Confirm profit-loss is plan-blocked
        $this->getJson("/s/{$tenant->slug}/reports/profit-loss")->assertStatus(403);

        \App\Models\Warehouse::firstOrCreate(
            ['id' => 1],
            ['tenant_id' => $tenant->id, 'name' => 'Main Warehouse', 'is_default' => true, 'is_active' => true]
        );

        $customer = \App\Models\Party::factory()->create(['tenant_id' => $tenant->id, 'type' => 'customer']);
        $product = \App\Models\Product::factory()->create(['tenant_id' => $tenant->id, 'type' => 'service', 'price' => 150.00]);

        $initialJournalEntries = JournalEntry::where('tenant_id', $tenant->id)->count();

        // Perform a sale
        $payload = [
            'customer_id'    => $customer->id,
            'payment_method' => 'cash',
            'amount_paid'    => 150.00,
            'items'          => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 1,
                    'price'      => 150.00,
                ],
            ],
        ];

        $saleResponse = $this->post("/s/{$tenant->slug}/sales", $payload);
        $saleResponse->assertSuccessful();

        // Verify ledger recorded in the background
        $newJournalEntries = JournalEntry::where('tenant_id', $tenant->id)->count();
        $this->assertGreaterThan($initialJournalEntries, $newJournalEntries);
    }
}
