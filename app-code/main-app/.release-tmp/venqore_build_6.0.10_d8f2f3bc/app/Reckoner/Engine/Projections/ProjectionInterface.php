<?php

namespace App\Reckoner\Engine\Projections;

use App\Reckoner\ReckonerPeriod;

/**
 * Interface for canonical Reckoner card projections.
 */
interface ProjectionInterface
{
    /**
     * Projects measure values into the target card shape payload.
     *
     * @param array $measureData Keyed by measure name or dim: value / rows / points
     * @param array $card Card contract definition from CardRegistry
     * @param ReckonerPeriod $period Time window
     * @param array $options Additional options (e.g. comparison values, server grain)
     * @return array{data: mixed, meta: array, checks: array}
     */
    public function project(
        array $measureData,
        array $card,
        ReckonerPeriod $period,
        array $options = []
    ): array;
}
