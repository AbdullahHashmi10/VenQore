<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PlatformAuditLog extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'action',
        'ip_address',
        'user_agent',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Helper to log a sensitive action.
     */
    public static function logAction(string $action, ?array $payload = null): self
    {
        return self::create([
            'user_id'    => auth()->id(),
            'action'     => $action,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'payload'    => $payload,
        ]);
    }
}
