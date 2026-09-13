<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * ProductAnalytics — pre-computed intelligence for every product.
 *
 * V1 had a `customer_analytics` cache but nothing equivalent for stock, which
 * is why its "Inventory Forecaster" could only guess demand from ONE customer's
 * ONE last invoice. This table holds real velocity, margin, cover and movement
 * classification for every product, refreshed by the nightly deep run.
 *
 * Because it is a cache, the brains read it with plain indexed lookups instead
 * of aggregating millions of sale_items rows on every pass.
 */
class ProductAnalytics extends Model
{
    use HasUuids, HasTenant;

    protected $table = 'product_analytics';

    protected $fillable = [
        'tenant_id', 'product_id',
        'velocity_7d', 'velocity_30d', 'velocity_90d', 'velocity_trend_pct',
        'qty_sold_30d', 'revenue_30d', 'margin_30d', 'margin_pct_30d', 'margin_pct_prev_30d',
        'current_stock', 'stock_value', 'days_of_cover', 'projected_stockout_date',
        'last_sold_date', 'last_purchased_date', 'days_since_last_sale',
        'distinct_buyers_90d', 'return_rate_90d', 'avg_discount_pct_30d',
        'movement_class', 'abc_class', 'last_computed_at',
    ];

    protected $casts = [
        'velocity_7d'             => 'float',
        'velocity_30d'            => 'float',
        'velocity_90d'            => 'float',
        'velocity_trend_pct'      => 'float',
        'qty_sold_30d'            => 'float',
        'revenue_30d'             => 'decimal:4',
        'margin_30d'              => 'decimal:4',
        'margin_pct_30d'          => 'float',
        'margin_pct_prev_30d'     => 'float',
        'current_stock'           => 'float',
        'stock_value'             => 'decimal:4',
        'days_of_cover'           => 'float',
        'projected_stockout_date' => 'date',
        'last_sold_date'          => 'date',
        'last_purchased_date'     => 'date',
        'return_rate_90d'         => 'float',
        'avg_discount_pct_30d'    => 'float',
        'last_computed_at'        => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
