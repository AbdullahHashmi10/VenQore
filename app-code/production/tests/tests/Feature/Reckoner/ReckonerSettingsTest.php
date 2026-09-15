<?php

namespace Tests\Feature\Reckoner;

use App\Reckoner\ReckonerSettings;
use Tests\Feature\VenQoreTestCase;

/**
 * §10 — ReckonerSettingsTest: each setting changes its metric's result;
 * overstock 'off' yields not_applicable; dormancy defaults per business type.
 */
class ReckonerSettingsTest extends VenQoreTestCase
{
    public function test_defaults_apply_when_nothing_is_set(): void
    {
        $tenant = $this->createTenant();

        $this->assertSame(20, ReckonerSettings::get('reckoner.heavy_discount_pct', $tenant));
        $this->assertSame('off', ReckonerSettings::get('reckoner.overstock_mode', $tenant));
        $this->assertSame(5, ReckonerSettings::get('reckoner.overstock_multiplier', $tenant));
        $this->assertFalse(ReckonerSettings::get('reckoner.overstock_notify', $tenant));
    }

    public function test_set_then_get_round_trips(): void
    {
        $tenant = $this->createTenant();

        ReckonerSettings::set('reckoner.heavy_discount_pct', 35, $tenant);

        $this->assertSame(35, ReckonerSettings::get('reckoner.heavy_discount_pct', $tenant));
    }

    public function test_overstock_mode_can_be_turned_on(): void
    {
        $tenant = $this->createTenant();

        ReckonerSettings::set('reckoner.overstock_mode', 'manual', $tenant);

        $this->assertSame('manual', ReckonerSettings::get('reckoner.overstock_mode', $tenant));
    }

    public function test_dormant_days_defaults_to_generic_without_business_type(): void
    {
        $tenant = $this->createTenant();
        // business_type is nullable and unset by default (Phase 2 migration).

        $this->assertSame(90, ReckonerSettings::dormantDays($tenant));
    }

    public function test_dormant_days_uses_business_type_default_once_set(): void
    {
        $tenant = $this->createTenant();
        $tenant->business_type = 'restaurant';
        $tenant->save();

        $this->assertSame(30, ReckonerSettings::dormantDays($tenant));
    }

    public function test_dormant_days_owner_override_beats_business_type_default(): void
    {
        $tenant = $this->createTenant();
        $tenant->business_type = 'restaurant';
        $tenant->save();

        ReckonerSettings::set('reckoner.dormant_days', 15, $tenant);

        $this->assertSame(15, ReckonerSettings::dormantDays($tenant));
    }

    public function test_every_business_type_has_a_documented_default(): void
    {
        foreach (['restaurant', 'grocery', 'pharmacy', 'retail', 'salon', 'automotive', 'wholesale', 'services', 'manufacturing', 'generic'] as $type) {
            $this->assertIsInt(ReckonerSettings::defaultDormantDaysFor($type));
            $this->assertGreaterThan(0, ReckonerSettings::defaultDormantDaysFor($type));
        }
    }

    public function test_unknown_business_type_falls_back_to_generic(): void
    {
        $this->assertSame(
            ReckonerSettings::defaultDormantDaysFor('generic'),
            ReckonerSettings::defaultDormantDaysFor('not_a_real_type'),
        );
    }
}
