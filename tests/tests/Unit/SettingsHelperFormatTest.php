<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Helpers\SettingsHelper;
use Illuminate\Support\Facades\Cache;

class SettingsHelperFormatTest extends TestCase
{
    protected function tearDown(): void
    {
        Cache::flush();
        parent::tearDown();
    }

    public function test_format_quantity_preserves_whole_integer_magnitude(): void
    {
        // Whole integers: MUST never lose digits at decimal precision 0, 1, 2, 4
        foreach ([0, 1, 2, 4] as $decimals) {
            $this->assertSame('10', SettingsHelper::formatQuantity(10, $decimals));
            $this->assertSame('100', SettingsHelper::formatQuantity(100, $decimals));
            $this->assertSame('1000', SettingsHelper::formatQuantity(1000, $decimals));
            $this->assertSame('0', SettingsHelper::formatQuantity(0, $decimals));
        }
    }

    public function test_format_quantity_handles_fractional_quantities(): void
    {
        $this->assertSame('10.5', SettingsHelper::formatQuantity(10.5, 0));
        $this->assertSame('10.5', SettingsHelper::formatQuantity(10.5, 2));
        $this->assertSame('10.25', SettingsHelper::formatQuantity(10.25, 2));
        $this->assertSame('10.125', SettingsHelper::formatQuantity(10.125, 3));
    }

    public function test_invoice_number_enabled_defaults_to_true(): void
    {
        // When setting is null / not set, default must be TRUE
        Cache::flush();
        $this->assertTrue(SettingsHelper::isInvoiceNumberEnabled());
    }

    public function test_invoice_number_enabled_obeys_stored_values(): void
    {
        // Test explicit '0'
        Cache::put('settings:global', ['invoice_number_enabled' => '0'], 300);
        $this->assertFalse(SettingsHelper::isInvoiceNumberEnabled());

        // Test explicit '1'
        Cache::put('settings:global', ['invoice_number_enabled' => '1'], 300);
        $this->assertTrue(SettingsHelper::isInvoiceNumberEnabled());

        // Test explicit 'false' string
        Cache::put('settings:global', ['invoice_number_enabled' => 'false'], 300);
        $this->assertFalse(SettingsHelper::isInvoiceNumberEnabled());

        // Test explicit empty string (fallback to true)
        Cache::put('settings:global', ['invoice_number_enabled' => ''], 300);
        $this->assertTrue(SettingsHelper::isInvoiceNumberEnabled());
    }

    public function test_prefixes_and_helpers(): void
    {
        Cache::put('settings:global', [
            'sale_prefix' => 'SAL-',
            'purchase_prefix' => 'BUY-',
            'quotation_prefix' => 'EST-',
            'return_prefix' => 'RTN-',
            'multi_firm_enabled' => '1',
        ], 300);

        $this->assertSame('SAL-', SettingsHelper::getSalePrefix());
        $this->assertSame('BUY-', SettingsHelper::getPurchasePrefix());
        $this->assertSame('EST-', SettingsHelper::getQuotationPrefix());
        $this->assertSame('RTN-', SettingsHelper::getReturnPrefix());
        $this->assertTrue(SettingsHelper::isMultiFirmEnabled());
    }

    public function test_format_number_obeys_precision_override_and_settings(): void
    {
        $this->assertSame('150.00', SettingsHelper::formatNumber(150, 2));
        $this->assertSame('150', SettingsHelper::formatNumber(150, 0));
        $this->assertSame('150.5', SettingsHelper::formatNumber(150.5, 1));
        $this->assertSame('150.2500', SettingsHelper::formatNumber(150.25, 4));
    }

    public function test_get_print_decimals_obeys_print_amount_decimal_and_global_precision(): void
    {
        // When print_amount_decimal is disabled ('0'), returns 0
        Cache::put('settings:global', [
            'decimal_places' => '2',
            'print_amount_decimal' => '0',
        ], 300);
        $this->assertSame(0, SettingsHelper::getPrintDecimals());

        // When print_amount_decimal is enabled ('1'), returns decimal_places
        Cache::put('settings:global', [
            'decimal_places' => '3',
            'print_amount_decimal' => '1',
        ], 300);
        $this->assertSame(3, SettingsHelper::getPrintDecimals());

        // When print_amount_decimal is default/unset, returns decimal_places
        Cache::put('settings:global', [
            'decimal_places' => '1',
        ], 300);
        $this->assertSame(1, SettingsHelper::getPrintDecimals());
    }
}


