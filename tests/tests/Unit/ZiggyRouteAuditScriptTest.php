<?php

namespace Tests\Unit;

use Tests\TestCase;

class ZiggyRouteAuditScriptTest extends TestCase
{
    public function test_audit_ziggy_routes_detects_valid_and_invalid_routes()
    {
        $scriptPath = base_path('scripts/audit_ziggy_routes.cjs');
        $this->assertFileExists($scriptPath, 'scripts/audit_ziggy_routes.cjs must exist.');

        // 1. Run audit script directly via node on current codebase -> must exit 0
        $output = [];
        $exitCode = 0;
        exec("node \"{$scriptPath}\"", $output, $exitCode);

        $outputStr = implode("\n", $output);
        $this->assertSame(0, $exitCode, "Route audit script failed with output:\n" . $outputStr);
        $this->assertStringContainsString('[Ziggy Route Audit] PASSED', $outputStr);

        // 2. Test negative case using temporary mock file with invalid route
        $tempDir = storage_path('framework/testing/route_audit_mock');
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0777, true);
        }

        $mockJsFile = $tempDir . '/MockBadRoute.jsx';
        file_put_contents($mockJsFile, "export default function Test() { return route('nonexistent.fake.route'); }");

        $normalizedScriptPath = str_replace('\\', '/', $scriptPath);
        $normalizedTempDir = str_replace('\\', '/', $tempDir);

        $testRunnerCode = <<<JS
const { auditRoutes } = require('{$normalizedScriptPath}');
const result = auditRoutes({
    projectRoot: '{$normalizedTempDir}',
    scanDir: '{$normalizedTempDir}',
    registeredRoutes: new Set(['store.dashboard', 'platform.dashboard'])
});
if (result.passed || result.errors.length !== 1 || result.errors[0].routeName !== 'nonexistent.fake.route') {
    console.error('Expected 1 error for nonexistent.fake.route, got:', JSON.stringify(result));
    process.exit(1);
}
console.log('NEGATIVE_TEST_PASSED');
process.exit(0);
JS;

        $runnerScript = $tempDir . '/run_test.cjs';
        file_put_contents($runnerScript, $testRunnerCode);

        $negOutput = [];
        $negExitCode = 0;
        exec("node \"{$runnerScript}\"", $negOutput, $negExitCode);

        // Clean up
        @unlink($mockJsFile);
        @unlink($runnerScript);
        @rmdir($tempDir);

        $negOutputStr = implode("\n", $negOutput);
        $this->assertSame(0, $negExitCode, "Negative audit test failed:\n" . $negOutputStr);
        $this->assertStringContainsString('NEGATIVE_TEST_PASSED', $negOutputStr);
    }
}
