<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StoreActivityLog extends Model
{
    use HasTenant, HasUuids;

    protected $table = 'activity_logs';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'action',
        'description',
        'subject_type',
        'subject_id',
        'payload',
        'ip_address',
        'user_agent',
        'is_impersonated',
    ];

    protected $casts = [
        'payload' => 'array',
        'is_impersonated' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
