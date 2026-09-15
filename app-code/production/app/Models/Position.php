<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class Position extends Model
{
    use HasTenant;

    protected $table = 'positions';

    protected $fillable = [
        'tenant_id',
        'zone',
        'code',
        'label',
        'capacity',
        'status',
        'sort_order',
        'source_type',
        'source_id',
    ];

    public function occupancies()
    {
        return $this->hasMany(Occupancy::class, 'position_id');
    }

    public function activeOccupancy()
    {
        return $this->hasOne(Occupancy::class, 'position_id')->whereNull('closed_at');
    }
}
