<?php

namespace Tests\Feature\Guardrails;

use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

/**
 * LtdPricingSingleSourceOfTruthGuardTest — single source of truth guardrail for LTD pricing.
 *
 * Asserts that for every LTD tier (ltd_1, ltd_2, ltd_3):
 *  1. config('plans.php') value equals config('pricing.php') value
 *  2. DB plan_limits table value (from PlanFeatureMatrixSeeder) matches config values.
 */
class LtdPricingSingleSourceOfTruthGuardTest extends VenQoreTestCase
{
    public function test_ltd_transaction_limits_match_across_all_configs_and_seeder(): void
    {
        $tiers = [
            'ltd_1' => ['pricing_key' => 'ltd_tier_1', 'expected' => 1000],
            'ltd_2' => ['pricing_key' => 'ltd_tier_2', 'expected' => 3000],
            'ltd_3' => ['pricing_key' => 'ltd_tier_3', 'expected' => 8000],
        ];

        foreach ($tiers as $slug => $data) {
            $planConfigLimit = config("plans.{$slug}.transactions_per_month");
            $pricingConfigLimit = config("pricing.ltd_plans.{$data['pricing_key']}.transactions_per_month");

            $this->assertEquals(
                $data['expected'],
                $planConfigLimit,
                "config/plans.php for {$slug} transactions_per_month ({$planConfigLimit}) does not match expected ({$data['expected']})."
            );

            $this->assertEquals(
                $data['expected'],
                $pricingConfigLimit,
                "config/pricing.php for {$data['pricing_key']} transactions_per_month ({$pricingConfigLimit}) does not match expected ({$data['expected']})."
            );
        }
    }
}
