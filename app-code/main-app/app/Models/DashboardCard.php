<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DashboardCard extends Model
{
    use HasUuids, HasTenant;

    protected $fillable = [
        'tenant_id',
        'dashboard_id',
        'reading_key',
        'period',
        'period_custom',
        'granularity',
        'chart',
        'size',
        'x',
        'y',
        'w',
        'h',
        'title_override',
        'args',
        'style',
    ];

    protected $casts = [
        'period_custom' => 'array',
        'args' => 'array',
        'style' => 'array',
        'x' => 'integer',
        'y' => 'integer',
        'w' => 'integer',
        'h' => 'integer',
    ];

    /**
     * Dashboard this card belongs to.
     */
    public function dashboard(): BelongsTo
    {
        return $this->belongsTo(Dashboard::class);
    }
}
