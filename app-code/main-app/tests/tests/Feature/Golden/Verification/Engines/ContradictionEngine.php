<?php

namespace Tests\Feature\Golden\Verification\Engines;

class ContradictionEngine
{
    private array $comparisonResults;
    private array $consistencyGroups;

    public function __construct(array $comparisonResults, array $consistencyGroups)
    {
        $this->comparisonResults = $comparisonResults;
        $this->consistencyGroups = $consistencyGroups;
    }

    public function run(): array
    {
        $contradictions = [];

        foreach ($this->consistencyGroups as $group) {
            if ($group['status'] === 'INCONSISTENT') {
                $resolutions = [];
                
                // For each claim in this inconsistent group, check its ledger comparison status
                foreach ($group['claims'] as $claim) {
                    $surface = $claim['surface'];
                    $claimId = $claim['id'] ?? null;
                    
                    // Find matching comparison result
                    $status = 'UNKNOWN';
                    foreach ($this->comparisonResults as $comp) {
                        if ($comp['claim_id'] === $claimId || ($comp['surface'] === $surface && $comp['metric'] === $claim['metric'])) {
                            $status = $comp['status'];
                            break;
                        }
                    }

                    $resolutions[] = [
                        'surface' => $surface,
                        'value' => $claim['expected_value'] ?? $claim['actual_value'], // Fallback depending on assertion direction
                        'matches_ledger' => ($status === 'AGREE' || $status === 'PARTIAL-AGREE')
                    ];
                }

                // Formulate explanation
                $correctSurfaces = array_filter($resolutions, fn($r) => $r['matches_ledger']);
                $wrongSurfaces = array_filter($resolutions, fn($r) => !$r['matches_ledger']);

                if (count($correctSurfaces) > 0 && count($wrongSurfaces) > 0) {
                    $correctNames = implode(', ', array_column($correctSurfaces, 'surface'));
                    $wrongNames = implode(', ', array_column($wrongSurfaces, 'surface'));
                    $explanation = "The Constitutional Authority (Ledger) agrees with [{$correctNames}]. Therefore, [{$wrongNames}] is contradicting the truth and must be fixed.";
                } elseif (count($correctSurfaces) === 0) {
                    $explanation = "Ledger Integrity Concern: All surfaces in this group contradict the Ledger. The Ledger itself may be corrupted or missing data.";
                } else {
                    $explanation = "Inconsistent, but could not definitively resolve against the ledger comparison.";
                }

                $contradictions[] = [
                    'group' => $group['name'],
                    'explanation' => $explanation,
                    'details' => $resolutions
                ];
            }
        }

        return $contradictions;
    }
}
