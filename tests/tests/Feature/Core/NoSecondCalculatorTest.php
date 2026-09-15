<?php

namespace Tests\Feature\Core;

use Tests\Feature\VenQoreTestCase;

class NoSecondCalculatorTest extends VenQoreTestCase
{
    public function test_no_controller_imports_v3_report_service(): void
    {
        $controllerDir = base_path('app/Http/Controllers');
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($controllerDir)
        );
        $violations = [];
        foreach ($files as $file) {
            if ($file->getExtension() !== 'php') continue;
            $contents = file_get_contents($file->getPathname());
            if (str_contains($contents, 'App\Services\V3\ReportService::class') || 
                str_contains($contents, 'use App\Services\V3\ReportService;')) {
                $violations[] = $file->getFilename();
            }
        }
        // V3/ReportController and V3/ReportExportController are exempt 
        // until their missing methods are ported — remove them from this 
        // list once ported in a later instruction.
        $allowList = [];
        $realViolations = array_diff($violations, $allowList);
        $this->assertEmpty(
            $realViolations,
            'These controllers still import V3\ReportService: ' . implode(', ', $realViolations)
        );
    }
}
