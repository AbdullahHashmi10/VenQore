<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Terminal extends Model
{
    use HasFactory, HasUuids, HasTenant;

    protected $fillable = [
        'name',
        'ip_address',
        'last_heartbeat_at',
        'status',
        'last_status_reason',
        'is_active',
    ];

    protected $casts = [
        'last_heartbeat_at' => 'datetime',
        'is_active' => 'boolean',
    ];
}
