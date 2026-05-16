<?php

namespace App\Helpers;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class SettingsHelper
{
    /**
     * Get the tenant-aware cache key.
     * CRITICAL: must be partitioned by tenant_id or settings will bleed between tenants.
     */
    private static function cacheKey(): string
    {
        // Use tenant_id if running inside a tenant request
        if (app()->bound('current.tenant')) {
            $tenantId = app('current.tenant')->id;
            return "settings:{$tenantId}";
        }
        // Global context (console commands, super-admin): use a global key
        return 'settings:global';
    }

    /**
     * Get all settings as key-value array (cached 5 min, per tenant)
     */
    public static function all(): array
    {
        return Cache::remember(static::cacheKey(), 300, function () {
            return Setting::all()->pluck('value', 'key')->toArray();
        });
    }

    /**
     * Get a single setting value
     */
    public static function get(string $key, $default = null)
    {
        $settings = self::all();
        return $settings[$key] ?? $default;
    }

    /**
     * Check if a boolean setting is enabled
     */
    public static function isEnabled(string $key): bool
    {
        $value = self::get($key);
        return $value === '1' || $value === true || $value === 1;
    }

    /**
     * Clear the settings cache for the CURRENT tenant only.
     * Clearing one tenant's cache does NOT affect any other tenant.
     */
    public static function clearCache(): void
    {
        Cache::forget(static::cacheKey());
    }

    /**
     * Clear settings cache for a specific tenant (used by super-admin actions).
     */
    public static function clearCacheForTenant(string $tenantId): void
    {
        Cache::forget("settings:{$tenantId}");
    }

    /**
     * Format a number according to decimal_places setting
     */
    public static function formatNumber($number, ?int $decimalOverride = null): string
    {
        $decimals = $decimalOverride ?? (int) self::get('decimal_places', 2);
        return number_format((float) $number, $decimals);
    }

    /**
     * Format currency with the configured currency symbol
     */
    public static function formatCurrency($amount, bool $includeSymbol = true): string
    {
        $decimals = (int) self::get('decimal_places', 2);
        $formatted = number_format((float) $amount, $decimals);

        if (!$includeSymbol) {
            return $formatted;
        }

        // Priority 1: Use direct currency_symbol if set
        $symbol = self::get('currency_symbol');
        if ($symbol) {
            return $symbol . ' ' . $formatted;
        }

        // Priority 2: Fallback to currency code mapping
        $currency = self::get('currency', self::get('currency_code', 'PKR'));
        $symbols = [
            'PKR' => 'Rs. ',
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£',
            'AED' => 'AED ',
            'SAR' => 'SAR ',
            'INR' => '₹',
        ];

        $symbol = $symbols[$currency] ?? $currency . ' ';
        return $symbol . $formatted;
    }

    /**
     * Format a date according to date_format setting
     */
    public static function formatDate($date): string
    {
        if (!$date)
            return '';

        $format = self::get('date_format', 'DD/MM/YYYY');

        // Convert to Carbon if string
        if (is_string($date)) {
            $date = \Carbon\Carbon::parse($date);
        }

        // Map setting format to PHP format
        $phpFormat = match ($format) {
            'DD/MM/YYYY' => 'd/m/Y',
            'MM/DD/YYYY' => 'm/d/Y',
            'YYYY-MM-DD' => 'Y-m-d',
            default => 'd/m/Y',
        };

        return $date->format($phpFormat);
    }

    /**
     * Get the auto-logout time in minutes
     */
    public static function getAutoLogoutMinutes(): int
    {
        return (int) self::get('auto_logout', 60);
    }

    /**
     * Get the low stock threshold
     */
    public static function getLowStockThreshold(): int
    {
        return (int) self::get('low_stock_threshold', 10);
    }

    /**
     * Get invoice prefix for sales
     */
    public static function getSalePrefix(): string
    {
        return self::get('sale_prefix', 'INV-');
    }

    /**
     * Get invoice prefix for purchases
     */
    public static function getPurchasePrefix(): string
    {
        return self::get('purchase_prefix', 'PUR-');
    }

    /**
     * Check if negative stock sales should be stopped
     */
    public static function shouldStopNegativeStock(): bool
    {
        return self::isEnabled('stop_sale_negative_stock');
    }

    /**
     * Check if totals should be rounded off
     */
    public static function shouldRoundOff(): bool
    {
        return self::isEnabled('round_off_total');
    }

    /**
     * Round off total if setting is enabled
     */
    public static function roundTotal($total): float
    {
        if (self::shouldRoundOff()) {
            return round((float) $total);
        }
        return (float) $total;
    }

    /**
     * Get business info for receipts
     */
    public static function getBusinessInfo(): array
    {
        return [
            'name' => self::get('store_name', self::get('business_name', 'VenQore POS')),
            'address' => self::get('store_address', self::get('business_address', '')),
            'phone' => self::get('store_phone', self::get('business_phone', '')),
            'email' => self::get('business_email', ''),
            'tax_number' => self::get('tax_number', ''),
            'currency' => self::get('currency', 'PKR'),
        ];
    }

    /**
     * Get print settings (comprehensive)
     */
    public static function getPrintSettings(): array
    {
        return [
            // Theme Settings
            'print_theme' => self::get('print_theme', 'modern'),
            'print_theme_color' => self::get('print_theme_color', '#4f46e5'),
            'default_print_type' => self::get('default_print_type', 'regular'),

            // Regular Printer Settings
            'paper_size' => self::get('paper_size', 'A4'),
            'paper_orientation' => self::get('paper_orientation', 'Portrait'),
            'custom_paper_width' => (int) self::get('custom_paper_width', 210),
            'custom_paper_height' => (int) self::get('custom_paper_height', 297),
            'print_company_text_size' => self::get('print_company_text_size', '4'),
            'print_invoice_text_size' => self::get('print_invoice_text_size', '3'),
            'print_header_all_pages' => self::isEnabled('print_header_all_pages'),
            'print_original_copy' => self::isEnabled('print_original_copy'),
            'print_extra_space_top' => (int) self::get('print_extra_space_top', 0),
            'print_min_item_rows' => (int) self::get('print_min_item_rows', 5),
            
            // Margins
            'margin_top' => (int) self::get('margin_top', 20),
            'margin_bottom' => (int) self::get('margin_bottom', 20),
            'margin_left' => (int) self::get('margin_left', 20),
            'margin_right' => (int) self::get('margin_right', 20),
            
            // Branding
            'print_logo' => self::isEnabled('print_logo'),
            'print_logo_path' => self::get('print_logo_path', null),
            'print_signature_text' => self::get('print_signature_text', 'Authorized Signatory'),
            
            // Column Toggles (Regular)
            'print_show_sno' => self::get('print_show_sno', '1') !== '0',
            'print_show_units' => self::get('print_show_units', '1') !== '0',
            'print_show_mrp' => self::isEnabled('print_show_mrp'),
            'print_show_description' => self::get('print_show_description', '1') !== '0',
            'print_show_hsn' => self::isEnabled('print_show_hsn'),
            'print_show_discount' => self::isEnabled('print_show_discount'),
            
            // Totals & Amounts
            'print_total_quantity' => self::get('print_total_quantity', '1') !== '0',
            'print_amount_decimal' => self::get('print_amount_decimal', '1') !== '0',
            'print_received_amount' => self::get('print_received_amount', '1') !== '0',
            'print_balance_amount' => self::get('print_balance_amount', '1') !== '0',
            'print_party_balance' => self::isEnabled('print_party_balance'),
            'print_tax_details' => self::get('print_tax_details', '1') !== '0',
            'print_you_saved' => self::isEnabled('print_you_saved'),
            'print_amount_grouping' => self::get('print_amount_grouping', '1') !== '0',
            'print_amount_words' => self::get('print_amount_words', '0'),
            
            // Footer Options
            'print_description' => self::get('print_description', '1') !== '0',
            'print_terms' => self::get('print_terms', ''),
            'print_received_by' => self::isEnabled('print_received_by'),
            'print_delivered_by' => self::isEnabled('print_delivered_by'),
            'print_payment_mode' => self::get('print_payment_mode', '1') !== '0',
            'print_acknowledgement' => self::isEnabled('print_acknowledgement'),
            'print_feed_lines' => (int) self::get('print_feed_lines', 0),
            
            // Thermal Printer Settings
            'thermal_page_size' => self::get('thermal_page_size', '3inch'),
            'thermal_font_size' => (int) self::get('thermal_font_size', 12),
            'thermal_custom_chars' => (int) self::get('thermal_custom_chars', 48),
            'thermal_use_bold' => self::get('thermal_use_bold', '1') !== '0',
            'thermal_auto_cut' => self::get('thermal_auto_cut', '1') !== '0',
            'thermal_open_drawer' => self::isEnabled('thermal_open_drawer'),
            'thermal_extra_lines' => (int) self::get('thermal_extra_lines', 3),
            'thermal_copies' => (int) self::get('thermal_copies', 1),
            'thermal_custom_footer' => self::get('thermal_custom_footer', ''),
            
            // Column Toggles (Thermal)
            'thermal_show_headers' => self::isEnabled('thermal_show_headers'),
            'thermal_show_sno' => self::isEnabled('thermal_show_sno'),
            'thermal_show_units' => self::isEnabled('thermal_show_units'),
            'thermal_show_mrp' => self::isEnabled('thermal_show_mrp'),
            'thermal_show_description' => self::isEnabled('thermal_show_description'),
            'thermal_show_batch' => self::isEnabled('thermal_show_batch'),
            'thermal_show_expiry' => self::isEnabled('thermal_show_expiry'),
            'thermal_show_mfg_date' => self::isEnabled('thermal_show_mfg_date'),
            'thermal_show_size' => self::isEnabled('thermal_show_size'),
            'thermal_show_model' => self::isEnabled('thermal_show_model'),
            'thermal_show_serial' => self::isEnabled('thermal_show_serial'),
            'thermal_show_barcode' => self::get('thermal_show_barcode', '1') !== '0',
        ];
    }

    /**
     * Check if wholesale pricing is enabled
     */
    public static function isWholesalePricingEnabled(): bool
    {
        return self::isEnabled('wholesale_price_enabled');
    }

    /**
     * Check if batch tracking is enabled
     */
    public static function isBatchTrackingEnabled(): bool
    {
        return self::isEnabled('batch_tracking_enabled');
    }

    /**
     * Check if barcode scanning is enabled
     */
    public static function isBarcodeScanningEnabled(): bool
    {
        return self::isEnabled('barcode_scan_enabled');
    }

    /**
     * Check if loyalty/rewards is enabled
     */
    public static function isLoyaltyEnabled(): bool
    {
        return self::isEnabled('loyalty_enabled');
    }

    /**
     * Get payment reminder days
     */
    public static function getPaymentReminderDays(): int
    {
        return (int) self::get('payment_reminder_days', 7);
    }

    /**
     * Get the appropriate price for a product based on quantity and customer type
     * Uses wholesale price if enabled and quantity meets threshold
     */
    public static function getProductPrice($product, int $quantity = 1, bool $isWholesaleCustomer = false): float
    {
        // If wholesale pricing is enabled and conditions are met
        if (self::isWholesalePricingEnabled()) {
            $wholesalePrice = $product->wholesale_price ?? null;
            $minQty = $product->wholesale_min_quantity ?? 1;

            if ($wholesalePrice && ($quantity >= $minQty || $isWholesaleCustomer)) {
                return (float) $wholesalePrice;
            }
        }

        // Return regular price
        return (float) ($product->price ?? $product->selling_price ?? 0);
    }

    /**
     * Check if email notifications are enabled
     */
    public static function isEmailNotificationsEnabled(): bool
    {
        return self::isEnabled('email_notifications');
    }

    /**
     * Check if two-factor authentication is enabled
     */
    public static function isTwoFactorEnabled(): bool
    {
        return self::isEnabled('two_factor_auth');
    }

    /**
     * Check if auto backup is enabled
     */
    public static function isAutoBackupEnabled(): bool
    {
        return self::isEnabled('auto_backup');
    }

    /**
     * Get default tax rate
     */
    public static function getDefaultTaxRate(): float
    {
        return (float) self::get('default_tax_rate', 0);
    }

    /**
     * Check if stock maintenance is enabled (defaults to TRUE if not set)
     */
    public static function isStockMaintenanceEnabled(): bool
    {
        $value = self::get('stock_maintenance');
        // Default to TRUE if not set (stock tracking is important!)
        if ($value === null) {
            return true;
        }
        return $value === '1' || $value === true || $value === 1;
    }

    /**
     * Get language setting
     */
    public static function getLanguage(): string
    {
        return self::get('language', 'en');
    }
}

