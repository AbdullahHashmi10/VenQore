<?php

namespace Tests\Feature\Golden\Verification\Engines;

class ConfidenceEngine
{
    public function scoreRootCause(array $cause, array $sotResults): int
    {
        $baseConfidence = 50;

        // If it impacts many surfaces, we are more confident it is the true shared root cause.
        $affectedCount = count($cause['affected_surfaces']);
        if ($affectedCount >= 3) {
            $baseConfidence += 30;
        } elseif ($affectedCount == 2) {
            $baseConfidence += 15;
        }

        // If any of the affected surfaces are known to be TRANSACTION-DERIVED, 
        // the root cause in the service might just be a symptom of bypassing the ledger.
        $transactionDerivedCount = 0;
        foreach ($sotResults as $sot) {
            if (in_array($sot['surface'], $cause['affected_surfaces']) && $sot['status'] !== 'LEDGER-DERIVED') {
                $transactionDerivedCount++;
            }
        }

        if ($transactionDerivedCount > 0) {
            // High confidence it's an architectural Source of Truth violation rather than a math bug in the service
            $baseConfidence += 10;
        }

        return min(99, $baseConfidence);
    }
}
