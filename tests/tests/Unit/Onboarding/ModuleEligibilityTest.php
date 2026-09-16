<?php

namespace Tests\Unit\Onboarding;

use App\Onboarding\ModuleEligibility;
use Tests\TestCase;

class ModuleEligibilityTest extends TestCase
{
    public function test_impossible_modules_are_not_offered_to_the_wrong_trade(): void
    {
        $eligibility = app(ModuleEligibility::class);

        $this->assertFalse($eligibility->evaluate('table_service', 'food_truck')['offered']);
        $this->assertTrue($eligibility->evaluate('table_service', 'restaurant')['offered']);
        $this->assertFalse($eligibility->evaluate('serials', 'restaurant')['offered']);
    }

    public function test_plan_has_five_or_fewer_owner_choice_rounds_and_silent_core(): void
    {
        $plan = app(ModuleEligibility::class)->plan('pharmacy');

        $this->assertSame(ModuleEligibility::ALWAYS_ON, $plan['alwaysOn']);
        $this->assertNotEmpty($plan['rounds']);
        $this->assertLessThanOrEqual(5, count($plan['rounds']));

        $offered = collect($plan['rounds'])->flatten(1)->pluck('key')->all();
        $this->assertNotContains('table_service', $offered);
        $this->assertNotContains('customers', $offered);
    }
}
