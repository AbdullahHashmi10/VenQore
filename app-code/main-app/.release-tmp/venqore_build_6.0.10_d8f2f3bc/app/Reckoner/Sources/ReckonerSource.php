<?php

namespace App\Reckoner\Sources;

use App\Reckoner\ReckonerContext;

/**
 * A Source is the only kind of class allowed to run a query for a reading.
 * See §4.2 of the build spec — batching exists so that metrics sharing one
 * underlying read (e.g. seven P&L-derived figures) are resolved from a
 * single query, not seven.
 */
interface ReckonerSource
{
    /** Metric keys this source can answer. */
    public function supports(): array;

    /**
     * Resolve a batch of requests for keys this source supports.
     *
     * @param  array<int, array{id: string, key: string, period: \App\Reckoner\ReckonerPeriod, args: array}>  $requests
     * @return array<string, mixed> keyed by request id => raw value/payload (pre-envelope)
     */
    public function resolveBatch(array $requests, ReckonerContext $ctx): array;
}
