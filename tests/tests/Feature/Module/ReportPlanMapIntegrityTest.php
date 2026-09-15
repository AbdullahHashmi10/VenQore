<?php

namespace Tests\Feature\Module;

use App\Support\ReportPlanMap;
use Illuminate\Support\Facades\Route;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ReportPlanMapIntegrityTest extends TestCase
{
    #[Test]
    public function every_feature_key_in_report_plan_map_exists_in_all_plans_in_config(): void
    {
        $plans = config('plans', []);
        $this->assertNotEmpty($plans, 'config/plans.php must contain plan definitions.');

        $requiredKeys = array_unique(array_values(ReportPlanMap::REQUIRED_PLAN_FEATURES));

        foreach ($plans as $planSlug => $planConfig) {
            $this->assertIsArray($planConfig, "Plan '{$planSlug}' config must be an array.");

            foreach ($requiredKeys as $featureKey) {
                $this->assertArrayHasKey(
                    $featureKey,
                    $planConfig,
                    "Report plan feature key '{$featureKey}' is missing from plan '{$planSlug}' in config/plans.php."
                );
            }
        }
    }

    #[Test]
    public function every_suffix_in_report_plan_map_is_a_registered_route(): void
    {
        $allRouteNames = array_keys(Route::getRoutes()->getRoutesByName());

        foreach (array_keys(ReportPlanMap::REQUIRED_PLAN_FEATURES) as $suffix) {
            $legacyRoute = "store.reports.{$suffix}";
            $v3Route = "store.v3.reports.{$suffix}";

            $isRegistered = in_array($legacyRoute, $allRouteNames, true) || in_array($v3Route, $allRouteNames, true);

            $this->assertTrue(
                $isRegistered,
                "Report suffix '{$suffix}' in ReportPlanMap does not match any registered route ('{$legacyRoute}' or '{$v3Route}')."
            );
        }
    }
}
