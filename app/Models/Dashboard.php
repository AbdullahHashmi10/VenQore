<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Dashboard extends Model
{
    use HasUuids, HasTenant;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'name',
        'slug',
        'is_default',
        'for_role',
        'is_locked',
        'position',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_locked' => 'boolean',
        'position' => 'integer',
    ];

    /**
     * Cards belonging to this dashboard.
     */
    public function cards(): HasMany
    {
        return $this->hasMany(DashboardCard::class)->orderBy('y')->orderBy('x');
    }
}
