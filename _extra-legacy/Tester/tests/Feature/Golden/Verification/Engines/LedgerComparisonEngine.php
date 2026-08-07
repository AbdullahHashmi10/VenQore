<?php

namespace Tests\Feature\Golden\Verification\Engines;

class LedgerComparisonEngine
{
    private array $claims = [];
    private const TOLERANCE = 0.02;

    public function __construct(array $claims)
    {
        $this->claims = $claims;
    }

    public function run(): array
    {
        $results = [];

        foreach ($this->claims as $claim) {
            // Skip Ledger Health claims, they are handled by the LedgerHealthEngine
            if (str_starts_with($claim['metric'], '[Ledger Health]')) {
                continue;
            }

            $expected = $claim['expected_value'];
            $actual = $claim['actual_value'];
            $ledger = $claim['ledger_value']; // May be null if not explicitly queried yet

            $result = [
                'claim_id' => $claim['id'],
                'metric' => $claim['metric'],
                'surface' => $claim['surface'],
                'clock_position' => $claim['clock_position'],
                'expected' => $expected,
                'actual' => $actual,
                'ledger' => $ledger,
                'status' => 'UNKNOWN'
            ];

            if ($expected === null && $actual === null) {
                $result['status'] = 'AGREE';
            } elseif (is_numeric($expected) && is_numeric($actual)) {
                $diff = abs((float)$expected - (float)$actual);
                if ($diff == 0) {
                    $result['status'] = 'AGREE';
                } elseif ($diff <= self::TOLERANCE) {
                    $result['status'] = 'PARTIAL-AGREE';
                } else {
                    $result['status'] = 'DISAGREE';
                }
            } else {
                if ($expected === $actual) {
                    $result['status'] = 'AGREE';
                } else {
                    $result['status'] = 'DISAGREE';
                }
            }

            // In the future: if expected/actual matches, but ledger does not, this would be DISAGREE or NO-LEDGER-BASIS depending on the metric.
            // For Phase B, since ledger_value is often null (implicitly equal to expected in the current testing paradigm), we focus on expected vs actual.

            $results[] = $result;
        }

        return $results;
    }
}
