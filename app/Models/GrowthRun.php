<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * GrowthRun — one row per engine execution, per tenant.
 *
 * Two jobs:
 *
 *  1. OBSERVABILITY. V1 was a black box: if it produced nothing you could not
 *     tell whether it ran, crashed, or genuinely had nothing to say. Now every
 *     run logs duration, per-brain timings, counts and errors.
 *
 *  2. INCREMENTAL SCHEDULING. `data_watermark` stores the newest sale
 *     timestamp the run saw. The next run compares the tenant's current
 *     newest sale against it and SKIPS the tenant entirely if nothing has
 *     changed. This is what lets the engine run hourly and still cost less
 *     than the old once-a-night full scan.
 */
class GrowthRun extends Model
{
    use HasUuids, HasTenant;

    protected $table = 'growth_runs';

    protected $fillable = [
        'tenant_id', 'mode', 'status', 'started_at', 'finished_at', 'duration_ms',
        'signals_created', 'signals_updated', 'signals_resolved',
        'customers_analysed', 'products_analysed',
        'data_watermark', 'error', 'brain_timings',
    ];

    protected $casts = [
        'started_at'     => 'datetime',
        'finished_at'    => 'datetime',
        'data_watermark' => 'datetime',
        'brain_timings'  => 'array',
    ];
}
