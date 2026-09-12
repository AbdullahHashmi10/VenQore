<?php

namespace Tests\Feature\Golden\Verification\Engines;

class LedgerHealthEngine
{
    private array $claims = [];
    private array $brokenInvariants = [];
    private bool $isHealthy = true;

    public function __construct(array $claims)
    {
        $this->claims = $claims;
    }

    public function run(): array
    {
        foreach ($this->claims as $claim) {
            if (str_starts_with($claim['metric'], '[Ledger Health]')) {
                // If expected value matches actual value, it's healthy.
                // In our tests, floating point equality uses delta, but health invariants are usually 0 vs 0 or exact amounts.
                $expected = $claim['expected_value'];
                $actual = $claim['actual_value'];
                
                $disagree = false;
                if (is_numeric($expected) && is_numeric($actual)) {
                    if (abs($expected - $actual) > 0.02) {
                        $disagree = true;
                    }
                } else if ($expected !== $actual) {
                    $disagree = true;
                }

                if ($disagree) {
                    $this->isHealthy = false;
                    $this->brokenInvariants[] = $claim;
                }
            }
        }

        return [
            'status' => $this->isHealthy ? 'HEALTHY' : 'UNHEALTHY',
            'broken_invariants' => $this->brokenInvariants,
        ];
    }
}
