<?php

namespace Tests\Feature\Golden\Verification\Engines;

class ConsistencyEngine
{
    private array $claims = [];
    private const TOLERANCE = 0.02;

    public function __construct(array $claims)
    {
        $this->claims = $claims;
    }

    public function run(): array
    {
        $groups = [];

        // 1. Group claims by their metric prefix (e.g., "[I-A] cash")
        foreach ($this->claims as $claim) {
            if ($claim['surface'] === 'CrossSurfaceConsistencyTest') {
                $metric = $claim['metric'];
                
                // Extract group name like "[I-A] cash"
                if (preg_match('/^(\[[I]-[A-Z]+\]\s+[^:]+):/', $metric, $matches)) {
                    $groupName = trim($matches[1]);
                    
                    if (!isset($groups[$groupName])) {
                        $groups[$groupName] = [
                            'name' => $groupName,
                            'status' => 'CONSISTENT',
                            'claims' => []
                        ];
                    }
                    
                    $groups[$groupName]['claims'][] = $claim;
                }
            }
        }

        // 2. Evaluate consistency within each group
        foreach ($groups as $groupName => &$group) {
            foreach ($group['claims'] as $claim) {
                $expected = $claim['expected_value'];
                $actual = $claim['actual_value'];
                
                if (is_numeric($expected) && is_numeric($actual)) {
                    if (abs((float)$expected - (float)$actual) > self::TOLERANCE) {
                        $group['status'] = 'INCONSISTENT';
                        break;
                    }
                } else if ($expected !== $actual) {
                    $group['status'] = 'INCONSISTENT';
                    break;
                }
            }
        }

        return $groups;
    }
}
