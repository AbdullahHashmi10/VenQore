<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use App\Traits\HasTenant;

class Activity extends Model
{
    use HasUuids, HasTenant;

    protected $guarded = [];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'reference_id');
    }

    // Scope for recent activities
    public function scopeRecent($query, $limit = 50)
    {
        return $query->orderBy('created_at', 'desc')->limit($limit);
    }

    // Scope by type
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }
}
