<?php

namespace Tests\Feature\Golden\Verification\Engines;

class RootCauseEngine
{
    private TraceabilityEngine $traceability;
    private array $failedClaims;

    public function __construct(TraceabilityEngine $traceability, array $failedClaims)
    {
        $this->traceability = $traceability;
        $this->failedClaims = $failedClaims;
    }

    public function run(): array
    {
        if (empty($this->failedClaims)) {
            return [];
        }

        $serviceFailures = [];

        foreach ($this->failedClaims as $claim) {
            $surface = $claim['surface'];
            // If the surface is a test class or generic name, try to map it to a controller.
            // For this phase, we assume the surface string contains the controller name, or we just map tests to their targets.
            $controllerName = $surface;
            
            // In a real run, tests might log 'OutputVerificationTestCase' which is generic.
            // But if the surface is 'DashboardController', we can trace it.
            $services = $this->traceability->getServicesForController($controllerName);

            if (empty($services)) {
                // If we can't trace it, we cluster by surface as a fallback.
                $services = [$surface . ' (Untraceable)'];
            }

            foreach ($services as $service) {
                if (!isset($serviceFailures[$service])) {
                    $serviceFailures[$service] = [
                        'candidate' => $service,
                        'symptoms' => 0,
                        'affected_surfaces' => []
                    ];
                }

                $serviceFailures[$service]['symptoms']++;
                if (!in_array($surface, $serviceFailures[$service]['affected_surfaces'])) {
                    $serviceFailures[$service]['affected_surfaces'][] = $surface;
                }
            }
        }

        // Rank by number of affected surfaces first, then symptoms
        usort($serviceFailures, function ($a, $b) {
            $surfaceDiff = count($b['affected_surfaces']) - count($a['affected_surfaces']);
            if ($surfaceDiff !== 0) return $surfaceDiff;
            return $b['symptoms'] - $a['symptoms'];
        });

        return $serviceFailures;
    }
}
