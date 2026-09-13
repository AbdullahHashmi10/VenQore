<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * GrowthMetricSnapshot — one row per tenant per day.
 *
 * The V1 engine had no history, so it could only ever compare a number against
 * a hardcoded constant ("alert if stock < demand"). Every business is
 * different, so constants produce either silence or noise.
 *
 * With a daily time-series the engine compares a tenant against ITS OWN
 * baseline: "your margin this week is 4.1 points below your 90-day median",
 * "Tuesdays normally do Rs 82k, today did Rs 31k". That is the difference
 * between a generic alert and an insight the owner actually trusts.
 */
class GrowthMetricSnapshot extends Model
{
    use HasUuids, HasTenant;

    protected $table = 'growth_metric_snapshots';

    protected $fillable = [
        'tenant_id', 'snapshot_date',
        'revenue', 'gross_margin', 'margin_pct', 'cogs', 'discount_given',
        'order_count', 'avg_order_value', 'avg_basket_size',
        'unique_customers', 'new_customers', 'returning_customers',
        'returns_value', 'receivables_outstanding', 'payables_outstanding',
        'cash_collected', 'inventory_value', 'stockout_count', 'extras',
    ];

    protected $casts = [
        'snapshot_date'           => 'date',
        'revenue'                 => 'decimal:4',
        'gross_margin'            => 'decimal:4',
        'margin_pct'              => 'float',
        'cogs'                    => 'decimal:4',
        'discount_given'          => 'decimal:4',
        'avg_order_value'         => 'decimal:4',
        'avg_basket_size'         => 'float',
        'returns_value'           => 'decimal:4',
        'receivables_outstanding' => 'decimal:4',
        'payables_outstanding'    => 'decimal:4',
        'cash_collected'          => 'decimal:4',
        'inventory_value'         => 'decimal:4',
        'extras'                  => 'array',
    ];
}
