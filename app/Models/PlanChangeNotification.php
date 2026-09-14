<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlanChangeNotification extends Model
{
    use HasTenant;
    protected $fillable = [
        'tenant_id', 'type', 'title', 'message',
        'details', 'is_read', 'sent_by', 'admin_user_id',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'details' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }
}
