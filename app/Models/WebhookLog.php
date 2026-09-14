<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookLog extends Model
{
    protected $fillable = [
        'source', 'event_type', 'payload', 'status', 'error', 'store_name', 'plan',
    ];

    protected $casts = ['payload' => 'array'];

    /**
     * Boot hook: prune logs older than 500 entries to keep the table lean.
     * Called after every insert.
     */
    protected static function booted(): void
    {
        static::created(function () {
            $count = static::count();
            if ($count > 500) {
                static::orderBy('id')->limit($count - 500)->delete();
            }
        });
    }
}
