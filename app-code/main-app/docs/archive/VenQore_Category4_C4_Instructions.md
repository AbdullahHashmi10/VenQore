# VenQore — Category 4 IDE Instruction
# C4 — Page & UI Health

**Read this file top-to-bottom before touching any code.**
**Standing rules (non-negotiable):**
- NEVER weaken a test to make it pass. A failing assertion is a real finding — report it and stop.
- COMMIT immediately after the test suite goes green.
- Run on MySQL `amd_pos_test` ONLY. SQLite is forbidden.

---

## GOAL

Verify and lock page-render health across all major store pages, dashboards, and reporting hubs, resolving any missing frontend views or parameter desyncs.

---

## STEP 1 — Fix the missing Daily Sales view mapping
The controller `ReportController@dailySales` currently attempts to render component `'Reports/DailySales'` which does not exist in the frontend (`resources/js/Pages/Reports/`). We will redirect it to use the dynamic `'Reports/GenericReport'` view.

**File to modify:** `app/Http/Controllers/ReportController.php`

**Find:**
```php
        return Inertia::render('Reports/DailySales', [
            'reports' => $sales,
            'filters' => [
                'range' => $range,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'stats' => [
                'total_revenue' => $sales->sum('revenue'),
                'total_count' => $sales->sum('count'),
                'total_tax' => $sales->sum('tax'),
                'total_discount' => $sales->sum('discount'),
            ]
        ]);
```

**Replace with:**
```php
        return Inertia::render('Reports/GenericReport', [
            'title' => 'Daily Sales Report',
            'columns' => [
                ['label' => 'Date', 'key' => 'date'],
                ['label' => 'Sales Count', 'key' => 'count'],
                ['label' => 'Discount Given', 'key' => 'discount', 'type' => 'currency'],
                ['label' => 'Tax Collected', 'key' => 'tax', 'type' => 'currency'],
                ['label' => 'Net Revenue', 'key' => 'revenue', 'type' => 'currency'],
            ],
            'data' => $sales,
            'filters' => [
                'range' => $range,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'stats' => [
                'total_revenue' => $sales->sum('revenue'),
                'total_count' => $sales->sum('count'),
                'total_tax' => $sales->sum('tax'),
                'total_discount' => $sales->sum('discount'),
            ]
        ]);
```

---

## STEP 2 — Create the Inertia Page Render Test Suite
Create a new test file: `Tester/tests/Feature/Smoke/InertiaPageRenderTest.php`

Use the exact content below:

```php
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
```

---

## STEP 3 — Run the newly created page render tests

Run:
```
E:\Software\Xampp\php\php.exe artisan test Tester/tests/Feature/Smoke/InertiaPageRenderTest.php
```

**Expected Result:** 15 tests passed.

---

## STEP 4 — Run the entire smoke suite

Run:
```
E:\Software\Xampp\php\php.exe artisan test Tester/tests/Feature/Smoke
```

**Expected Result:** 52 tests passed. All green.

---

## STEP 5 — Commit the changes

Once all tests pass, run:
```
git add -A
git commit -m "C4: Fix Daily Sales mapping and add InertiaPageRenderTest suite"
```

---

## ACCEPTANCE CRITERIA
- [ ] `ReportController@dailySales` updated to return component `'Reports/GenericReport'`.
- [ ] `Tester/tests/Feature/Smoke/InertiaPageRenderTest.php` created and contains 15 tests.
- [ ] All 15 page render tests pass on MySQL `amd_pos_test`.
- [ ] All 52 Smoke tests pass.
- [ ] Code committed successfully with a clean working tree.
