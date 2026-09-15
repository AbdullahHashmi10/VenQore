<?php

namespace Tests\Unit\Reckoner;

use App\Reckoner\ReckonerSettings;
use Tests\TestCase;

/**
 * ReckonerSettings — pure logic tests. These only exercise the defaults and
 * the dormancy-by-business-type map. Anything that hits the DB (Cache,
 * Setting model) is not exercised here — those belong in Feature tests.
 *
 * @group reckoner
 */
class ReckonerSettingsTest extends TestCase
{
    /* ------------------------------------------------------------------ *
     * Dormancy defaults by business type
     * ------------------------------------------------------------------ */

    public function test_restaurant_gets_30_day_dormancy(): void
    {
        $this->assertSame(30, ReckonerSettings::defaultDormantDaysFor('restaurant'));
    }

    public function test_grocery_gets_21_day_dormancy(): void
    {
        $this->assertSame(21, ReckonerSettings::defaultDormantDaysFor('grocery'));
    }

    public function test_pharmacy_gets_60_day_dormancy(): void
    {
        $this->assertSame(60, ReckonerSettings::defaultDormantDaysFor('pharmacy'));
    }

    public function test_retail_gets_90_day_dormancy(): void
    {
        $this->assertSame(90, ReckonerSettings::defaultDormantDaysFor('retail'));
    }

    public function test_automotive_gets_180_day_dormancy(): void
    {
        $this->assertSame(180, ReckonerSettings::defaultDormantDaysFor('automotive'));
    }

    public function test_services_gets_120_day_dormancy(): void
    {
        $this->assertSame(120, ReckonerSettings::defaultDormantDaysFor('services'));
    }

    public function test_wholesale_gets_45_day_dormancy(): void
    {
        $this->assertSame(45, ReckonerSettings::defaultDormantDaysFor('wholesale'));
    }

    public function test_manufacturing_gets_90_day_dormancy(): void
    {
        $this->assertSame(90, ReckonerSettings::defaultDormantDaysFor('manufacturing'));
    }

    public function test_generic_gets_90_day_dormancy(): void
    {
        $this->assertSame(90, ReckonerSettings::defaultDormantDaysFor('generic'));
    }

    public function test_unknown_business_type_falls_back_to_generic(): void
    {
        $this->assertSame(
            ReckonerSettings::defaultDormantDaysFor('generic'),
            ReckonerSettings::defaultDormantDaysFor('totally_unknown_type')
        );
    }

    /* ------------------------------------------------------------------ *
     * get() with no tenant returns the default
     * ------------------------------------------------------------------ */

    public function test_get_overstock_mode_returns_default_off(): void
    {
        $this->assertSame('off', ReckonerSettings::get('reckoner.overstock_mode', null));
    }

    public function test_get_heavy_discount_pct_returns_default_20(): void
    {
        $this->assertSame(20, ReckonerSettings::get('reckoner.heavy_discount_pct', null));
    }

    public function test_get_unknown_key_returns_null(): void
    {
        $this->assertNull(ReckonerSettings::get('reckoner.does_not_exist', null));
    }

    /* ------------------------------------------------------------------ *
     * dormantDays() with no tenant uses generic default
     * ------------------------------------------------------------------ */

    public function test_dormant_days_with_null_tenant_returns_generic_default(): void
    {
        $this->assertSame(90, ReckonerSettings::dormantDays(null));
    }
}
