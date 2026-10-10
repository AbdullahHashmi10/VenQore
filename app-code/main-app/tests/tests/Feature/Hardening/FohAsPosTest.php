<?php

namespace Tests\Feature\Hardening;

use App\Helpers\SettingsHelper;
use App\Models\Tenant;
use App\Models\User;
use App\Services\ModuleService;
use App\Support\ModuleNavBuilder;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * A restaurant or cafe runs the shop from Front of House, and FOH is its "POS".
 *
 *  - the menu shows "POS" pointing at FOH, and the old till is hidden
 *  - opening /pos lands on FOH (except ?recall=)
 *  - a store WITHOUT the restaurant module keeps the ordinary POS and never sees FOH
 *  - a store with no module configuration at all is left alone (the safety rail)
 */
class FohAsPosTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = $this->createTenant('fohpos-' . Str::lower(Str::random(6)), 'ltd_3', 'active');
        $this->seedTenantDefaults($this->tenant);
        $this->owner = $this->createTenantUser($this->tenant, 'owner');
        $this->actingAsTenantUserModel($this->owner, $this->tenant);
        SettingsHelper::clearCache();
    }

    private function configure(array $modules): void
    {
        app(\App\Services\AiBuilder\ApplyConfigurationService::class)->apply(
            $this->tenant,
            ['modules' => $modules],
            'test'
        );
        ModuleService::invalidate((int) $this->tenant->id);
    }

    private function navRoutes(): array
    {
        return array_column(ModuleNavBuilder::build($this->tenant, $this->owner), 'route');
    }

    /** @test */
    public function a_restaurant_gets_foh_as_its_pos_and_loses_the_old_till(): void
    {
        $this->configure(['products', 'pos', 'park_recall', 'table_service']);

        $items = ModuleNavBuilder::build($this->tenant, $this->owner);
        $foh = collect($items)->firstWhere('route', 'store.foh');

        $this->assertNotNull($foh);
        $this->assertSame('POS', $foh['label']);
        $this->assertNotContains('store.pos', array_column($items, 'route'));
    }

    /** @test */
    public function opening_the_old_pos_address_lands_a_restaurant_in_foh(): void
    {
        $this->configure(['products', 'pos', 'park_recall', 'table_service']);

        $this->get($this->storeUrl($this->tenant, 'pos'))
            ->assertRedirect(route('store.foh', ['store_slug' => $this->tenant->slug]));
    }

    /** @test */
    public function recalling_a_finished_bill_still_opens_the_till(): void
    {
        $this->configure(['products', 'pos', 'park_recall', 'table_service']);

        $this->get($this->storeUrl($this->tenant, 'pos') . '?recall=1')->assertSuccessful();
    }

    /** @test */
    public function a_shop_without_the_restaurant_module_keeps_its_pos_and_never_sees_foh(): void
    {
        $this->configure(['products', 'pos']);

        $routes = $this->navRoutes();
        $this->assertContains('store.pos', $routes);
        $this->assertNotContains('store.foh', $routes);
        $this->assertNotContains('store.restaurant.kitchen', $routes);

        $this->get($this->storeUrl($this->tenant, 'pos'))->assertSuccessful();
        $this->assertNotSame(200, $this->get($this->storeUrl($this->tenant, 'foh'))->getStatusCode());
    }

    /** @test */
    public function a_store_with_no_module_setup_is_not_redirected_away_from_its_pos(): void
    {
        $this->assertFalse(ModuleService::runsFrontOfHouse($this->tenant));
        $this->get($this->storeUrl($this->tenant, 'pos'))->assertSuccessful();
    }
}
