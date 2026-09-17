<?php

namespace App\Reckoner\Sources;

use App\Reckoner\CardRegistry;
use App\Reckoner\Engine\MeasureEngine;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerRequest;

/**
 * MeasureEngineSource — ReckonerSource adapter that bridges the ReckonerRegistry
 * source-contract (§L8) with cards dispatched through the MeasureEngine.
 *
 * All cards in CardRegistry that are NOT natively wired in ReckonerRegistry
 * with a dedicated Source class are handled here. This satisfies L8's requirement
 * that every non-derived reading has a source class with a supports() method.
 */
final class MeasureEngineSource implements ReckonerSource
{
    public function __construct(protected MeasureEngine $engine)
    {
    }

    /**
     * Returns all CardRegistry keys — MeasureEngine can dispatch any of them.
     */
    public function supports(): array
    {
        return array_keys(CardRegistry::all());
    }

    /**
     * Resolve a batch of readings through MeasureEngine.
     */
    public function resolveBatch(array $requests, ReckonerContext $ctx): array
    {
        $reckonerRequests = [];
        foreach ($requests as $req) {
            $r = new ReckonerRequest();
            $r->key    = $req['key'];
            $r->id     = $req['id'];
            $r->period = $req['period']->key ?? 'today';
            $r->custom = null;
            $reckonerRequests[] = $r;
        }

        $results = $this->engine->resolve($reckonerRequests, $ctx);

        $out = [];
        foreach ($results as $id => $result) {
            $out[$id] = $result->data['value'] ?? null;
        }

        return $out;
    }
}
