<?php

namespace Tests\Unit\Reckoner;

use App\Reckoner\ReckonerCharts;
use Tests\TestCase;

/**
 * ChartRegistryParityTest — verifies parity between the backend chart authority
 * and the frontend React chart registry.
 *
 * @group reckoner
 */
class ChartRegistryParityTest extends TestCase
{
    public function test_backend_and_frontend_registries_have_parity(): void
    {
        // 1. Gather backend chart types
        $backendCharts = [];
        foreach (ReckonerCharts::MAP as $shape => $charts) {
            foreach ($charts as $chart) {
                $backendCharts[] = $chart;
            }
        }
        $backendCharts = array_unique($backendCharts);
        sort($backendCharts);

        // 2. Read frontend chartRegistry keys
        $jsFile = base_path('resources/js/Dashboard/chartRegistry.js');
        $this->assertFileExists($jsFile);

        $jsContent = file_get_contents($jsFile);

        // Match all lines inside chartRegistry: e.g. "stat: StatChart," or "line: (props) => ..."
        // Regular expression extracts keys
        preg_match_all('/^\s+([a-z_0-9]+):\s/m', $jsContent, $matches);
        $frontendCharts = array_unique($matches[1]);
        sort($frontendCharts);

        // Assert they are identical
        $this->assertEquals(
            $backendCharts,
            $frontendCharts,
            'Chart types list in ReckonerCharts.php and chartRegistry.js do not match!'
        );
    }
}
