<?php

namespace Tests\Feature\Module17;

use Tests\Feature\VenQoreTestCase;

/**
 * Module 17 — Settings
 *
 * The stop_sale_on_negative_stock toggle is fully covered by Module 4:
 *   "negative_stock_blocking_enforcement_based_on_system_settings"
 * in tests/Feature/Module04/PaymentProcessingTest.php
 *
 * That test seeds the setting with both true and false values, verifies the
 * sale is blocked / allowed respectively, and reads the live setting via
 * SettingsHelper. Running a duplicate here would add noise without safety value.
 *
 * Other settings that ARE unique to this module are stubbed below pending
 * dedicated controller/endpoint implementation.
 */
test('stop_sale_on_negative_stock_toggle_affects_sale_outcome', function () {
    // Covered in Module 4: PaymentProcessingTest
    // negative_stock_blocking_enforcement_based_on_system_settings
})->todo('Covered in Module 4 — negative_stock_blocking_enforcement_based_on_system_settings');

test('currency_symbol_setting_appears_in_sale_receipts', function () {
    // TODO: Settings — currency symbol propagation to receipts
})->todo();

test('tax_rate_setting_applies_to_new_sales', function () {
    // TODO: Settings — tax rate from settings applied to sale totals
})->todo();

test('store_name_update_reflects_on_dashboard', function () {
    // TODO: Settings — store name change propagation
})->todo();
