<?php

namespace Tests\Feature\Golden\Verification\Engines;

use Illuminate\Support\Facades\File;

class SourceOfTruthEngine
{
    private array $claims;

    public function __construct(array $claims)
    {
        $this->claims = $claims;
    }

    public function run(): array
    {
        $results = [];

        // 1. Static Analysis Strategy
        // We scan known reporting controllers and services for forbidden transaction table accesses.
        $targets = [
            app_path('Http/Controllers/V3/DashboardController.php'),
            app_path('Http/Controllers/V3/ReportController.php'),
            app_path('Http/Controllers/V3/ReportExportController.php'),
            app_path('Services/V3/FinancialReportingService.php'),
        ];

        $forbiddenPatterns = [
            '/Sale::/i',
            '/Purchase::/i',
            '/DB::table\([\'"]sales[\'"]\)/i',
            '/DB::table\([\'"]purchases[\'"]\)/i',
            '/Transaction::/i'
        ];

        foreach ($targets as $target) {
            if (!File::exists($target)) continue;

            $content = File::get($target);
            $filename = basename($target);
            $violations = [];

            foreach ($forbiddenPatterns as $pattern) {
                if (preg_match_all($pattern, $content, $matches)) {
                    $violations = array_merge($violations, array_unique($matches[0]));
                }
            }

            if (count($violations) > 0) {
                $results[] = [
                    'surface' => $filename,
                    'status' => 'TRANSACTION-DERIVED',
                    'evidence' => 'Static Analysis found forbidden direct access: ' . implode(', ', array_unique($violations))
                ];
            } else {
                $results[] = [
                    'surface' => $filename,
                    'status' => 'LEDGER-DERIVED',
                    'evidence' => 'Static Analysis passed'
                ];
            }
        }

        // 2. Behavioral Divergence Strategy
        // If a claim has expected != actual, but we know the actual matches the transaction table (from Phase 0 knowledge)
        // the blueprint says "Where the Ledger Comparison Engine finds that a surface's value agrees with the raw transaction table but disagrees with the Ledger".
        // For Phase C MVP, if a surface fails Ledger Comparison, it is flagged as HYBRID or UNDETERMINED.
        
        $failedSurfaces = [];
        foreach ($this->claims as $claim) {
            if (str_starts_with($claim['metric'], '[Ledger Health]')) continue;
            
            $expected = $claim['expected_value'];
            $actual = $claim['actual_value'];
            
            $disagree = false;
            if (is_numeric($expected) && is_numeric($actual)) {
                if (abs((float)$expected - (float)$actual) > 0.02) $disagree = true;
            } else if ($expected !== $actual) {
                $disagree = true;
            }

            if ($disagree) {
                $failedSurfaces[$claim['surface']] = true;
            }
        }

        foreach ($failedSurfaces as $surface => $v) {
            $results[] = [
                'surface' => $surface,
                'status' => 'UNDETERMINED',
                'evidence' => 'Behavioral Divergence: Ledger Comparison failed'
            ];
        }

        return $results;
    }
}
