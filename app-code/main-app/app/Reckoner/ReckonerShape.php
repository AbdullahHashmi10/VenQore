<?php

namespace App\Reckoner;

/**
 * What kind of answer a reading gives.
 *
 * This is part of the metric's public contract (§3.3 of the build spec): it
 * determines the JSON payload shape returned inside `data`, and — in Part 2 —
 * which chart types are legal against a given metric. Phase 1 only wires
 * SCALAR (every metric in the initial ~20-key catalogue is a scalar), but the
 * full enum is declared now so registry entries never have to guess a string.
 */
enum ReckonerShape: string
{
    case SCALAR = 'scalar';
    case SERIES = 'series';
    case MULTI_SERIES = 'multi_series';
    case BREAKDOWN = 'breakdown';
    case TABLE = 'table';
    case RANKING = 'ranking';
    case FUNNEL = 'funnel';
    case GAUGE = 'gauge';
    case STATUS = 'status';
    case FEED = 'feed';
    case GEO = 'geo';
}
