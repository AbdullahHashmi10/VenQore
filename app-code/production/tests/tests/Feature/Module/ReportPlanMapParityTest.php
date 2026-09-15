<?php

namespace Tests\Feature\Module;

use App\Support\ReportPlanMap;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ReportPlanMapParityTest extends TestCase
{
    /**
     * Parse the JS REPORT_PLAN_FEATURES dictionary from reportPlanMap.js.
     *
     * @return array<string, string> Map of route name -> feature key
     */
    private function getJsReportPlanFeatures(): array
    {
        $jsPath = resource_path('js/lib/reportPlanMap.js');
        $this->assertFileExists($jsPath, "JS report plan map file must exist at {$jsPath}");

        $content = (string) file_get_contents($jsPath);
        $matched = preg_match_all("/'([a-zA-Z0-9._-]+)'\s*:\s*'([a-zA-Z0-9_-]+)'/", $content, $matches, PREG_SET_ORDER);
        $this->assertNotEmpty($matches, 'Failed to extract any route -> feature pairs from reportPlanMap.js');

        $jsMap = [];
        foreach ($matches as $match) {
            $jsMap[$match[1]] = $match[2];
        }

        return $jsMap;
    }

    #[Test]
    public function every_suffix_in_php_report_plan_map_exists_in_js_map_with_same_key(): void
    {
        $jsMap = $this->getJsReportPlanFeatures();
        $phpMap = ReportPlanMap::REQUIRED_PLAN_FEATURES;

        foreach ($phpMap as $suffix => $expectedKey) {
            $legacyRoute = "store.reports.{$suffix}";
            $v3Route = "store.v3.reports.{$suffix}";

            $hasRoute = array_key_exists($legacyRoute, $jsMap) || array_key_exists($v3Route, $jsMap);
            $this->assertTrue(
                $hasRoute,
                "Report suffix '{$suffix}' in PHP ReportPlanMap has neither '{$legacyRoute}' nor '{$v3Route}' in JS REPORT_PLAN_FEATURES."
            );

            if (array_key_exists($legacyRoute, $jsMap)) {
                $actualKey = $jsMap[$legacyRoute];
                $this->assertSame(
                    $expectedKey,
                    $actualKey,
                    "Key mismatch for route '{$legacyRoute}': PHP map expects '{$expectedKey}', but JS map has '{$actualKey}'."
                );
            }

            if (array_key_exists($v3Route, $jsMap)) {
                $actualKey = $jsMap[$v3Route];
                $this->assertSame(
                    $expectedKey,
                    $actualKey,
                    "Key mismatch for route '{$v3Route}': PHP map expects '{$expectedKey}', but JS map has '{$actualKey}'."
                );
            }
        }
    }

    #[Test]
    public function every_feature_key_referenced_in_js_map_appears_in_php_map(): void
    {
        $jsMap = $this->getJsReportPlanFeatures();
        $phpKeys = array_unique(array_values(ReportPlanMap::REQUIRED_PLAN_FEATURES));

        foreach ($jsMap as $routeName => $featureKey) {
            $this->assertContains(
                $featureKey,
                $phpKeys,
                "Route '{$routeName}' in JS map references feature key '{$featureKey}', which does not exist in PHP ReportPlanMap."
            );
        }
    }
}
