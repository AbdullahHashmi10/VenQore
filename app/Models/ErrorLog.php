<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ErrorLog extends Model
{
    use \App\Traits\HasTenant;

    protected $fillable = [
        'type', 'message', 'url', 'method', 'stack_trace', 'file', 'line',
        'status_code', 'tenant_id', 'user_id', 'user_agent', 'ip_address',
        'is_resolved', 'resolution_note', 'occurrence_count', 'fingerprint',
        'last_seen_at',
    ];

    protected $casts = [
        'is_resolved'      => 'boolean',
        'last_seen_at'     => 'datetime',
        'occurrence_count' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Record or increment an error.
     * Uses fingerprinting to deduplicate repeated identical errors.
     */
    public static function record(array $data): self
    {
        $fingerprint = md5(($data['type'] ?? 'backend') . '|' . substr($data['message'] ?? '', 0, 200) . '|' . ($data['file'] ?? '') . '|' . ($data['line'] ?? ''));

        $existing = static::where('fingerprint', $fingerprint)
            ->where('is_resolved', false)
            ->first();

        if ($existing) {
            $existing->increment('occurrence_count');
            $existing->update(['last_seen_at' => now()]);
            return $existing;
        }

        return static::create(array_merge($data, [
            'fingerprint'  => $fingerprint,
            'last_seen_at' => now(),
        ]));
    }
}
