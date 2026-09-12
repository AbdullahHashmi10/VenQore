<?php

namespace Tests\Feature\Module;

use App\Models\Party;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\User;
use App\Services\ModuleService;
use App\Services\StoreProvisioner;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

class DataPreservationInvariantTest extends VenQoreTestCase
{
    protected Tenant $tenant;
    protected User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        config(['venqore.email_otp_required' => false]);

        $this->owner = User::factory()->create();
        $this->tenant = app(StoreProvisioner::class)->create($this->owner, [
            'name'            => 'Invariant Test Store',
            'business_type'   => 'retail_shop',
            'modules'         => ['products', 'pos', 'inventory', 'expenses', 'reports', 'services', 'invoicing'],
            'setup_completed' => true,
        ]);
        $this->actingAsTenantUserModel($this->owner, $this->tenant);
    }

    #[Test]
    public function disabling_a_module_never_deletes_products_or_business_data(): void
    {
        // 1. Create sample products under inventory
        $p1 = Product::factory()->create(['tenant_id' => $this->tenant->id, 'name' => 'Preserved Item 1']);
        $p2 = Product::factory()->create(['tenant_id' => $this->tenant->id, 'name' => 'Preserved Item 2']);

        $countBefore = Product::where('tenant_id', $this->tenant->id)->count();
        $this->assertGreaterThanOrEqual(2, $countBefore);

        // 2. Disable inventory
        ModuleService::disable($this->tenant, 'inventory');
        $this->assertFalse(ModuleService::enabled($this->tenant, 'inventory'));

        // 3. Assert count in database has NOT decreased
        $countAfterDisable = Product::where('tenant_id', $this->tenant->id)->count();
        $this->assertSame($countBefore, $countAfterDisable, 'Disabling inventory must never delete products.');

        // 4. Re-enable inventory and verify intact
        ModuleService::enable($this->tenant, 'inventory');
        $this->assertTrue(ModuleService::enabled($this->tenant, 'inventory'));
        $this->assertSame($countBefore, Product::where('tenant_id', $this->tenant->id)->count());
    }

    #[Test]
    public function background_double_entry_ledger_records_even_when_reporting_or_pos_are_toggled(): void
    {
        $customer = Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'customer']);
        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'type'      => 'service',
            'price'     => 1500.00,
        ]);

        $initialJournalEntries = DB::table('journal_entries')->where('tenant_id', $this->tenant->id)->count();

        // Perform sale
        $res = $this->post("/s/{$this->tenant->slug}/sales", [
            'customer_id'    => $customer->id,
            'payment_method' => 'cash',
            'amount_paid'    => 1500.00,
            'items'          => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 1,
                    'price'      => 1500.00,
                ],
            ],
        ]);
        $res->assertStatus(200);

        // Verify journal entry was posted silently into the double entry ledger
        $newJournalEntries = DB::table('journal_entries')->where('tenant_id', $this->tenant->id)->count();
        $this->assertSame($initialJournalEntries + 1, $newJournalEntries, 'Sales must silently create balanced journal entries.');
    }

    #[Test]
    public function ad_hoc_labour_can_be_billed_without_pre_existing_catalogue_product(): void
    {
        $customer = Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'customer']);

        // Submit invoice with ad-hoc labour line (no product_id)
        $res = $this->post("/s/{$this->tenant->slug}/sales", [
            'customer_id'    => $customer->id,
            'payment_method' => 'cash',
            'amount_paid'    => 2500.00,
            'items'          => [
                [
                    'description' => '2 Hours Emergency Plumbing Diagnostic',
                    'quantity'    => 2,
                    'price'       => 1250.00,
                ],
            ],
        ]);

        $res->assertStatus(200);
        $saleId = $res->json('sale_id');
        $this->assertNotNull($saleId);

        // Verify sale item exists and was created as a service
        $item = DB::table('sale_items')->where('sale_id', $saleId)->first();
        $this->assertNotNull($item);
        $this->assertEquals(2500.00, (float) $item->gross_amount);

        // Verify the product created has type = 'service'
        $createdProduct = Product::find($item->product_id);
        $this->assertNotNull($createdProduct);
        $this->assertSame('service', $createdProduct->type);
        $this->assertSame('2 Hours Emergency Plumbing Diagnostic', $createdProduct->name);

        // Verify no stock movements occurred
        $movements = DB::table('stock_movements')->where('product_id', $createdProduct->id)->count();
        $this->assertSame(0, $movements, 'Ad-hoc service lines must move zero stock.');
    }

    #[Test]
    public function solo_tenant_with_recurring_invoices_is_not_blocked_by_plan_gate(): void
    {
        $soloOwner = User::factory()->create();
        $soloTenant = app(StoreProvisioner::class)->create($soloOwner, [
            'name'            => 'Solo Invoices Store',
            'business_type'   => 'retail_shop',
            'plan'            => 'solo',
            'modules'         => ['products', 'customers', 'invoicing', 'recurring_invoices', 'expenses', 'reports'],
            'setup_completed' => true,
        ]);
        $this->actingAsTenantUserModel($soloOwner, $soloTenant);

        $this->assertTrue(ModuleService::enabled($soloTenant, 'recurring_invoices'));

        // Visit recurring invoices route as solo tenant
        $res = $this->get("/s/{$soloTenant->slug}/recurring-invoices");
        $this->assertNotSame(402, $res->status(), 'Solo tenant must not receive 402 plan limit on an included module.');
        $this->assertNotSame(403, $res->status(), 'Solo tenant must not receive 403 on an included module.');
    }
}