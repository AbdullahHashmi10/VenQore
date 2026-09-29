<?php

namespace Tests\Feature\Settings;

use Tests\TestCase;
use App\Models\Tenant;
use App\Models\Setting;
use App\Models\User;
use App\Helpers\SettingsHelper;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\View;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Carbon\Carbon;

class SettingsTenantLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Cache::flush();
        parent::tearDown();
    }

    /**
     * Helper to create a valid Tenant matching the definitive plan schema (numeric ID, unique slug).
     */
    protected function createValidTenant(string $name, string $slugPrefix): Tenant
    {
        $tenant = new Tenant();
        $tenant->name = $name;
        $tenant->slug = $slugPrefix . '-' . Str::lower(Str::random(8));
        $tenant->plan = 'business';
        $tenant->status = 'active';
        $tenant->currency_code = 'USD';
        $tenant->currency_symbol = '$';
        $tenant->save();

        return $tenant;
    }

    public function test_tenant_settings_database_lifecycle_and_multi_tenant_isolation(): void
    {
        // 1. Arrange two distinct schema-valid tenants
        $tenantA = $this->createValidTenant('Store Alpha', 'store-alpha');
        $tenantB = $this->createValidTenant('Store Beta', 'store-beta');

        $this->assertIsInt($tenantA->id, 'Tenant ID must be numeric auto-increment');
        $this->assertIsInt($tenantB->id, 'Tenant ID must be numeric auto-increment');

        // 2. Clear cache & assert default behavior when setting row does not exist in DB
        Cache::flush();
        app()->instance('current.tenant', $tenantA);
        $this->assertTrue(SettingsHelper::isInvoiceNumberEnabled(), 'Default for unset invoice_number_enabled in Tenant A must be true');

        app()->instance('current.tenant', $tenantB);
        $this->assertTrue(SettingsHelper::isInvoiceNumberEnabled(), 'Default for unset invoice_number_enabled in Tenant B must be true');

        // 3. Persist distinct setting values in DB for each tenant
        Setting::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $tenantA->id, 'key' => 'invoice_number_enabled'],
            ['value' => '0']
        );
        Setting::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $tenantA->id, 'key' => 'decimal_places'],
            ['value' => '0']
        );
        Setting::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $tenantA->id, 'key' => 'currency_symbol'],
            ['value' => '$']
        );

        Setting::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $tenantB->id, 'key' => 'invoice_number_enabled'],
            ['value' => '1']
        );
        Setting::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $tenantB->id, 'key' => 'decimal_places'],
            ['value' => '3']
        );
        Setting::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $tenantB->id, 'key' => 'currency_symbol'],
            ['value' => '€']
        );

        Cache::forget("settings:{$tenantA->id}");
        Cache::forget("settings:{$tenantB->id}");

        // 4. Assert Tenant A gets Tenant A settings
        app()->instance('current.tenant', $tenantA);
        $this->assertFalse(SettingsHelper::isInvoiceNumberEnabled(), 'Tenant A must read stored 0');
        $this->assertSame('0', SettingsHelper::get('decimal_places'), 'Tenant A must read decimal_places 0');
        $this->assertSame('$', SettingsHelper::get('currency_symbol'), 'Tenant A must read currency symbol $');

        // 5. Assert Tenant B gets Tenant B settings (Strict Tenant Isolation)
        app()->instance('current.tenant', $tenantB);
        $this->assertTrue(SettingsHelper::isInvoiceNumberEnabled(), 'Tenant B must read stored 1');
        $this->assertSame('3', SettingsHelper::get('decimal_places'), 'Tenant B must read decimal_places 3');
        $this->assertSame('€', SettingsHelper::get('currency_symbol'), 'Tenant B must read currency symbol €');

        // 6. Assert global scope is not polluted
        app()->forgetInstance('current.tenant');
        $this->assertTrue(SettingsHelper::isInvoiceNumberEnabled(), 'Global fallback must retain safe default');
    }

    public function test_print_amount_decimal_toggle_and_rendered_blade_precision(): void
    {
        $tenant = $this->createValidTenant('Print Store', 'print-store');
        app()->instance('current.tenant', $tenant);

        // Global decimals = 2, but print_amount_decimal = 0
        Setting::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'decimal_places'],
            ['value' => '2']
        );
        Setting::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'print_amount_decimal'],
            ['value' => '0']
        );
        Cache::forget("settings:{$tenant->id}");

        $this->assertSame(0, SettingsHelper::getPrintDecimals(), 'Print decimals must be 0 when print_amount_decimal=0');

        // When print_amount_decimal = 1, should use global decimal_places (2)
        Setting::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'print_amount_decimal'],
            ['value' => '1']
        );
        Cache::forget("settings:{$tenant->id}");

        $this->assertSame(2, SettingsHelper::getPrintDecimals(), 'Print decimals must use global decimal_places when print_amount_decimal=1');
    }

    public function test_receipt_blade_rendering_obeys_stored_invoice_number_across_tenants(): void
    {
        $tenantA = $this->createValidTenant('Store Alpha', 'store-alpha');
        $tenantB = $this->createValidTenant('Store Beta', 'store-beta');

        $invoiceNumber = 'INV-2026-7777';

        // Construct fixture matching invoices.receipt schema
        $invoice = (object) [
            'invoice_number' => $invoiceNumber,
            'date' => Carbon::now(),
            'party' => (object) ['name' => 'John Doe'],
            'user' => (object) ['name' => 'Cashier Jane'],
            'items' => collect([
                (object) [
                    'product' => (object) ['name' => 'Test Widget'],
                    'quantity' => 10,
                    'unit_price' => 100.00,
                    'total' => 1000.00,
                ]
            ]),
            'subtotal' => 1000.00,
            'discount_amount' => 0.00,
            'tax_amount' => 0.00,
            'total_amount' => 1000.00,
        ];

        // Store disabled in Tenant A
        Setting::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $tenantA->id, 'key' => 'invoice_number_enabled'],
            ['value' => '0']
        );
        // Store enabled in Tenant B
        Setting::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $tenantB->id, 'key' => 'invoice_number_enabled'],
            ['value' => '1']
        );

        Cache::forget("settings:{$tenantA->id}");
        Cache::forget("settings:{$tenantB->id}");

        // Render for Tenant A (Disabled)
        app()->instance('current.tenant', $tenantA);
        $renderedHtmlA = View::make('invoices.receipt', ['invoice' => $invoice])->render();
        $this->assertStringContainsString('<title>Invoice</title>', $renderedHtmlA);
        $this->assertStringNotContainsString('<title>Invoice ' . $invoiceNumber . '</title>', $renderedHtmlA);
        $this->assertStringNotContainsString('Invoice #:', $renderedHtmlA);
        $this->assertStringNotContainsString($invoiceNumber, $renderedHtmlA);

        // Render for Tenant B (Enabled)
        app()->instance('current.tenant', $tenantB);
        $renderedHtmlB = View::make('invoices.receipt', ['invoice' => $invoice])->render();
        $this->assertStringContainsString('<title>Invoice ' . $invoiceNumber . '</title>', $renderedHtmlB);
        $this->assertStringContainsString('Invoice #:', $renderedHtmlB);
        $this->assertStringContainsString($invoiceNumber, $renderedHtmlB);
    }
}
