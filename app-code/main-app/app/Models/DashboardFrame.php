<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class DashboardFrame extends Model
{
    use HasTenant, HasUuids;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'key',
        'name',
        'slots',
        'accent_slot',
    ];

    protected $casts = [
        'slots' => 'array',
        'accent_slot' => 'integer',
    ];
}
