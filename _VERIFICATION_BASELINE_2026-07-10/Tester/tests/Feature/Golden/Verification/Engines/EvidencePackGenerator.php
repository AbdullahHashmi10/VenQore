<?php

namespace Tests\Feature\Golden\Verification\Engines;

class EvidencePackGenerator
{
    private array $rootCauses;
    private array $sotResults;
    private BlastRadiusEngine $blastRadius;
    private ConfidenceEngine $confidence;

    public function __construct(array $rootCauses, array $sotResults, BlastRadiusEngine $blastRadius, ConfidenceEngine $confidence)
    {
        $this->rootCauses = $rootCauses;
        $this->sotResults = $sotResults;
        $this->blastRadius = $blastRadius;
        $this->confidence = $confidence;
    }

    public function generate(array $claim): array
    {
        $surface = $claim['surface'];

        // 1. Find Root Cause for this claim
        $myRootCause = null;
        $score = 0;
        foreach ($this->rootCauses as $cause) {
            if (in_array($surface, $cause['affected_surfaces'])) {
                $myRootCause = $cause['candidate'];
                $score = $this->confidence->scoreRootCause($cause, $this->sotResults);
                break;
            }
        }

        // 2. Find Source of Truth verdict
        $sotVerdict = 'UNKNOWN';
        foreach ($this->sotResults as $sot) {
            if ($sot['surface'] === $surface) {
                $sotVerdict = $sot['status'];
                break;
            }
        }

        // 3. Find Blast Radius of the root cause
        $radius = [];
        if ($myRootCause) {
            $radius = $this->blastRadius->calculateRadius($myRootCause);
        }

        return [
            'claim_id' => $claim['claim_id'] ?? 'unknown',
            'metric' => $claim['metric'],
            'surface' => $surface,
            'expected_value' => $claim['expected'] ?? null,
            'actual_value' => $claim['actual'] ?? null,
            'source_of_truth_verdict' => $sotVerdict,
            'root_cause_candidate' => $myRootCause ?? 'Unknown',
            'confidence_score' => $score,
            'blast_radius' => $radius,
            'human_explanation' => "The metric '{$claim['metric']}' failed on {$surface}. We are {$score}% confident the root cause is in {$myRootCause}. Fixing this will also impact " . count($radius) . " other surfaces."
        ];
    }
}
