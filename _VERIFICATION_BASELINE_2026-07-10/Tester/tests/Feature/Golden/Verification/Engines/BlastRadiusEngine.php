<?php

namespace Tests\Feature\Golden\Verification\Engines;

class BlastRadiusEngine
{
    private TraceabilityEngine $traceability;

    public function __construct(TraceabilityEngine $traceability)
    {
        $this->traceability = $traceability;
    }

    /**
     * Given a service name, return all controllers that depend on it.
     */
    public function calculateRadius(string $serviceName): array
    {
        $graph = $this->traceability->getGraph();
        $impactedControllers = [];

        foreach ($graph as $controller => $services) {
            if (in_array($serviceName, $services)) {
                $impactedControllers[] = $controller;
            }
        }

        return $impactedControllers;
    }
}
