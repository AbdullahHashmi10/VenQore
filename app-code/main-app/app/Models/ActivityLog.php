<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

use App\Traits\HasTenant;

class ActivityLog extends Model
{
    use HasFactory, HasUuids, HasTenant;

    protected $guarded = [];

    protected $casts = [
        'properties' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function subject()
    {
        return $this->morphTo();
    }

    /**
     * Helper to quickly write to activity log.
     */
    public static function log(string $name, string $description, ?\Illuminate\Database\Eloquent\Model $subject = null, ?array $properties = null): self
    {
        return self::create([
            'action' => $name,
            'description' => $description,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject ? $subject->id : null,
            'user_id' => auth()->id() ?? 1,
            'properties' => $properties,
        ]);
    }
}
