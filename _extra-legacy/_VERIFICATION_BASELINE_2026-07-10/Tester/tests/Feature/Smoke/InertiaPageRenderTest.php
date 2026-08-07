<?php

namespace Tests\Feature\Smoke;

use Tests\Feature\VenQoreTestCase;
use App\Models\Tenant;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

class InertiaPageRenderTest extends VenQoreTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Prevent Vite from failing tests because dynamic assets aren't built
        $this->withoutVite();
    }

    /** @test */
    public function owner_can_render_tenant_dashboard()
    {
        $tenant = $this->createTenant();
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $response = $this->get("/s/{$tenant->slug}/dashboard");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->has('store')
            ->has('performance')
        );
    }

    /** @test */
    public function cashier_can_render_cashier_dashboard()
    {
        $tenant = $this->createTenant();
        $this->actingAsCashier($tenant);
        $this->seedTenantDefaults($tenant);

        $response = $this->get("/s/{$tenant->slug}/dashboard");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboards/CashierDashboard')
        );
    }

    /** @test */
    public function owner_can_render_pos_storefront()
    {
        $tenant = $this->createTenant();
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $response = $this->get("/s/{$tenant->slug}/pos");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Pos')
        );
    }

    /** @test */
    public function owner_can_render_settings_panel()
    {
        $tenant = $this->createTenant();
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $response = $this->get("/s/{$tenant->slug}/settings");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Settings/SettingsPanel')
            ->has('settings')
            ->has('customCharges')
        );
    }

    /** @test */
    public function owner_can_render_reports_hub()
    {
        $tenant = $this->createTenant(plan: 'ltd_3');
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $response = $this->get("/s/{$tenant->slug}/reports");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Reports/ReportsHub'));
    }

    /** @test */
    public function owner_can_render_sales_report()
    {
        $tenant = $this->createTenant(plan: 'ltd_3');
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $response = $this->get("/s/{$tenant->slug}/reports/sales");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Reports/Sales'));
    }

    /** @test */
    public function owner_can_render_purchases_report()
    {
        $tenant = $this->createTenant(plan: 'ltd_3');
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $response = $this->get("/s/{$tenant->slug}/reports/purchases");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Reports/Purchases'));
    }

    /** @test */
    public function owner_can_render_profit_loss_report()
    {
        $tenant = $this->createTenant(plan: 'ltd_3');
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $response = $this->get("/s/{$tenant->slug}/reports/profit-loss");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Reports/ProfitLoss'));
    }

    /** @test */
    public function owner_can_render_stock_valuation_report()
    {
        $tenant = $this->createTenant(plan: 'ltd_3');
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $response = $this->get("/s/{$tenant->slug}/reports/stock-valuation");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Reports/StockValuation'));
    }

    /** @test */
    public function owner_can_render_tax_report()
    {
        $tenant = $this->createTenant(plan: 'ltd_3');
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $response = $this->get("/s/{$tenant->slug}/reports/tax");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Reports/Tax'));
    }

    /** @test */
    public function owner_can_render_trial_balance_report()
    {
        $tenant = $this->createTenant(plan: 'ltd_3');
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $response = $this->get("/s/{$tenant->slug}/reports/trial-balance");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Reports/TrialBalance'));
    }

    /** @test */
    public function owner_can_render_cash_flow_report()
    {
        $tenant = $this->createTenant(plan: 'ltd_3');
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $response = $this->get("/s/{$tenant->slug}/reports/cash-flow");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Reports/CashFlow'));
    }

    /** @test */
    public function owner_can_render_aged_receivables_report()
    {
        $tenant = $this->createTenant(plan: 'ltd_3');
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        // Path matches route registered in web.php
        $response = $this->get("/s/{$tenant->slug}/reports/sale-aging");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Reports/SaleAging'));
    }

    /** @test */
    public function owner_can_render_daily_sales_report()
    {
        $tenant = $this->createTenant(plan: 'ltd_3');
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        // Verify DailySales now maps correctly to GenericReport view
        $response = $this->get("/s/{$tenant->slug}/reports/daily-sales");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Reports/GenericReport'));
    }

    /** @test */
    public function owner_can_render_day_book_report()
    {
        $tenant = $this->createTenant(plan: 'ltd_3');
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $response = $this->get("/s/{$tenant->slug}/reports/day-book");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Reports/DayBook'));
    }
}
